"""API routes for course recommendations."""

from fastapi import APIRouter, HTTPException, UploadFile, File
from typing import List, Optional
from pydantic import BaseModel, field_validator
import sys
from pathlib import Path

# Add the pdf_to_dars directory to the path
pdf_to_dars_path = Path(__file__).parent.parent.parent.parent / "pdf_to_dars"
sys.path.insert(0, str(pdf_to_dars_path))

from ..services.data_loader import get_data_loader
from ..services.recommender import get_recommender
from ..services.club_recommender import get_club_recommender
from ..services.gened_recommender import get_gened_recommender
from ..services.technical_recommender import get_technical_recommender
from ..models.course import RecommendationResponse, Course
from ..utils.validation import validate_course_codes

# Import DARS parser
try:
    # Add project root to path
    project_root = Path(__file__).parent.parent.parent.parent
    pdf_to_dars_file = project_root / "pdf_to_dars" / "pdf_to_dars.py"

    if pdf_to_dars_file.exists():
        import importlib.util

        spec = importlib.util.spec_from_file_location("pdf_to_dars", pdf_to_dars_file)
        pdf_to_dars_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(pdf_to_dars_module)
        parse_courses = pdf_to_dars_module.parse_courses
    else:
        raise ImportError(f"DARS parser file not found at {pdf_to_dars_file}")
except Exception as e:
    # Fallback if import fails
    import logging

    logger = logging.getLogger(__name__)
    logger.error(f"Could not import DARS parser: {e}")

    def parse_courses(pdf_path: str) -> List[str]:
        raise HTTPException(
            status_code=500, detail=f"DARS parsing not available: {str(e)}"
        )


router = APIRouter()


class RecommendationRequest(BaseModel):
    """Request model for recommendations."""

    major_name: str
    completed_courses: List[str]
    num_recommendations: int = 5

    @field_validator("completed_courses")
    @classmethod
    def validate_courses(cls, v):
        """Validate and normalize course codes."""
        if not v:
            raise ValueError("At least one completed course is required")
        validated = validate_course_codes(v)
        if not validated:
            raise ValueError("Invalid course code format")
        return validated

    @field_validator("num_recommendations")
    @classmethod
    def validate_num_recommendations(cls, v):
        """Validate number of recommendations."""
        if v < 1 or v > 20:
            raise ValueError("num_recommendations must be between 1 and 20")
        return v

    class Config:
        """Pydantic config."""

        json_schema_extra = {
            "example": {
                "major_name": "Computer Science, BS",
                "completed_courses": ["CS 124", "MATH 221"],
                "num_recommendations": 5,
            }
        }


@router.get("/majors")
async def get_majors():
    """Get list of all available majors."""
    data_loader = get_data_loader()
    majors = data_loader.get_all_majors()
    return {"majors": majors}


@router.get("/majors/{major_name}/courses")
async def get_major_courses(major_name: str):
    """Get all courses for a specific major."""
    recommender = get_recommender()
    courses = recommender.get_major_courses(major_name)

    if not courses["required"] and not courses["electives"]:
        raise HTTPException(status_code=404, detail=f"Major '{major_name}' not found")

    return courses


@router.post("/recommend", response_model=RecommendationResponse)
async def get_recommendations(request: RecommendationRequest):
    """Get course recommendations for a student.

    Validates input and returns personalized course recommendations based on
    completed courses and major requirements.
    """
    recommender = get_recommender()

    try:
        # Validate major exists
        from ..services.data_loader import get_data_loader

        data_loader = get_data_loader()
        major = data_loader.get_major(request.major_name)

        if not major:
            raise HTTPException(
                status_code=404, detail=f"Major '{request.major_name}' not found"
            )

        result = recommender.recommend_courses(
            major_name=request.major_name,
            completed_courses=request.completed_courses,
            num_recommendations=request.num_recommendations,
        )

        return RecommendationResponse(**result)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error generating recommendations: {str(e)}"
        )


@router.get("/courses/{course_code}")
async def get_course_details(course_code: str):
    """Get detailed information about a specific course."""
    data_loader = get_data_loader()
    course = data_loader.get_course(course_code)

    if not course:
        raise HTTPException(status_code=404, detail=f"Course '{course_code}' not found")

    return course


@router.get("/courses/{course_code}/prerequisites")
async def get_course_prerequisites(course_code: str):
    """Get prerequisite chain for a course."""
    data_loader = get_data_loader()
    course = data_loader.get_course(course_code)

    if not course:
        raise HTTPException(status_code=404, detail=f"Course '{course_code}' not found")

    prerequisites = course.get("prerequisites", [])

    return {
        "course_code": course_code,
        "prerequisites": prerequisites,
        "can_take": len(prerequisites)
        == 0,  # Simplified - would need completed courses to check
        "missing": prerequisites,
    }


class ClubRecommendationRequest(BaseModel):
    """Request model for club recommendations."""

    interests: str = ""
    preferred_tags: List[str] = []
    avoid_tags: List[str] = []
    topk: int = 20

    @field_validator("topk")
    @classmethod
    def validate_topk(cls, v):
        """Validate number of recommendations."""
        if v < 1 or v > 50:
            raise ValueError("topk must be between 1 and 50")
        return v

    class Config:
        """Pydantic config."""

        json_schema_extra = {
            "example": {
                "interests": "sports fitness",
                "preferred_tags": ["Athletic & Recreation"],
                "avoid_tags": [],
                "topk": 15,
            }
        }


@router.post("/clubs/recommend")
async def get_club_recommendations(request: ClubRecommendationRequest):
    """Get club recommendations based on student interests."""
    try:
        club_recommender = get_club_recommender()
        recommendations = club_recommender.recommend_clubs(
            interests=request.interests,
            preferred_tags=request.preferred_tags,
            avoid_tags=request.avoid_tags,
            topk=request.topk,
        )
        return {"recommendations": recommendations}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error generating club recommendations: {str(e)}"
        )


class GenedRecommendationRequest(BaseModel):
    """Request model for GenEd course recommendations."""

    interests: str = ""
    gened_preferences: List[str] = []
    min_gpa: float = 3.0
    avoid_subjects: List[str] = []
    topk: int = 20

    @field_validator("topk")
    @classmethod
    def validate_topk(cls, v):
        """Validate number of recommendations."""
        if v < 1 or v > 50:
            raise ValueError("topk must be between 1 and 50")
        return v

    @field_validator("min_gpa")
    @classmethod
    def validate_gpa(cls, v):
        """Validate GPA threshold."""
        if v < 0 or v > 4.0:
            raise ValueError("min_gpa must be between 0 and 4.0")
        return v

    class Config:
        """Pydantic config."""

        json_schema_extra = {
            "example": {
                "interests": "psychology society culture",
                "gened_preferences": ["HUM", "CS"],
                "min_gpa": 3.3,
                "avoid_subjects": ["BTW"],
                "topk": 20,
            }
        }


@router.post("/gened/recommend")
async def get_gened_recommendations(request: GenedRecommendationRequest):
    """Get GenEd course recommendations based on student interests."""
    try:
        gened_recommender = get_gened_recommender()
        recommendations = gened_recommender.recommend_courses(
            interests=request.interests,
            gened_preferences=request.gened_preferences,
            min_gpa=request.min_gpa,
            avoid_subjects=request.avoid_subjects,
            topk=request.topk,
        )
        return {"recommendations": recommendations}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error generating GenEd recommendations: {str(e)}"
        )


@router.post("/dars/upload")
async def upload_dars(file: UploadFile = File(...)):
    """Upload and parse a DARS PDF file."""
    if not file.filename or not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="File must be a PDF")

    import tempfile
    import os
    import traceback

    tmp_path = None
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
            content = await file.read()
            if not content:
                raise HTTPException(status_code=400, detail="Uploaded file is empty")
            tmp_file.write(content)
            tmp_path = tmp_file.name

        # Parse courses from PDF
        try:
            courses = parse_courses(tmp_path)
            if not isinstance(courses, list):
                raise ValueError(
                    f"parse_courses returned unexpected type: {type(courses)}"
                )
            return {"courses": courses, "count": len(courses)}
        except Exception as parse_error:
            error_msg = (
                str(parse_error)
                if str(parse_error)
                else f"Unknown error: {type(parse_error).__name__}"
            )
            import logging

            logger = logging.getLogger(__name__)
            logger.error(f"DARS parsing error: {error_msg}\n{traceback.format_exc()}")
            raise HTTPException(
                status_code=500, detail=f"Error parsing DARS PDF: {error_msg}"
            )
        finally:
            # Clean up temporary file
            if tmp_path and os.path.exists(tmp_path):
                try:
                    os.unlink(tmp_path)
                except:
                    pass
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e) if str(e) else f"Unknown error: {type(e).__name__}"
        import logging

        logger = logging.getLogger(__name__)
        logger.error(f"DARS upload error: {error_msg}\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=500, detail=f"Error processing DARS PDF: {error_msg}"
        )


class TechnicalRecommendationRequest(BaseModel):
    """Request model for technical course recommendations."""

    major_name: str
    completed_courses: List[str]
    interests: str = ""
    courses_in_progress: List[str] = []
    prefer_foundational: bool = False
    prefer_advanced: bool = False
    topk: int = 20

    @field_validator("completed_courses")
    @classmethod
    def validate_courses(cls, v):
        """Validate and normalize course codes."""
        if not v:
            raise ValueError("At least one completed course is required")
        validated = validate_course_codes(v)
        if not validated:
            raise ValueError("Invalid course code format")
        return validated

    @field_validator("topk")
    @classmethod
    def validate_topk(cls, v):
        """Validate number of recommendations."""
        if v < 1 or v > 50:
            raise ValueError("topk must be between 1 and 50")
        return v

    class Config:
        """Pydantic config."""

        json_schema_extra = {
            "example": {
                "major_name": "Computer Science, BS",
                "completed_courses": ["CS 124", "MATH 221"],
                "interests": "machine learning artificial intelligence",
                "courses_in_progress": ["CS 173"],
                "prefer_foundational": True,
                "prefer_advanced": False,
                "topk": 20,
            }
        }


@router.post("/technical/recommend")
async def get_technical_recommendations(request: TechnicalRecommendationRequest):
    """Get technical course recommendations based on major, completed courses, and interests."""
    try:
        technical_recommender = get_technical_recommender()
        recommendations = technical_recommender.recommend_courses(
            major_name=request.major_name,
            completed_courses=request.completed_courses,
            interests=request.interests,
            courses_in_progress=request.courses_in_progress,
            prefer_foundational=request.prefer_foundational,
            prefer_advanced=request.prefer_advanced,
            topk=request.topk,
        )
        return {"recommendations": recommendations}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error generating technical recommendations: {str(e)}"
        )


class CombinedRecommendationRequest(BaseModel):
    """Request model for combined recommendations (courses, gened, clubs)."""

    completed_courses: List[str]
    major_name: Optional[str] = None
    technical_interests: str = ""
    technical_prefer_foundational: bool = False
    technical_prefer_advanced: bool = False
    gened_interests: str = ""
    gened_preferences: List[str] = []
    gened_min_gpa: float = 3.0
    gened_avoid_subjects: List[str] = []
    club_interests: str = ""
    club_preferred_tags: List[str] = []
    club_avoid_tags: List[str] = []
    course_num_recommendations: int = 10
    technical_topk: int = 20
    gened_topk: int = 20
    club_topk: int = 20


@router.post("/recommend/combined")
async def get_combined_recommendations(request: CombinedRecommendationRequest):
    """Get combined recommendations for courses, GenEd, and clubs."""
    import asyncio
    import logging
    
    logger = logging.getLogger(__name__)
    logger.info(f"Starting combined recommendations request for major: {request.major_name}")
    
    try:
        results = {}
        
        # Run GenEd and Club recommendations in parallel (they don't depend on each other)
        def get_gened():
            try:
                gened_recommender = get_gened_recommender()
                return gened_recommender.recommend_courses(
                    interests=request.gened_interests,
                    gened_preferences=request.gened_preferences,
                    min_gpa=request.gened_min_gpa,
                    avoid_subjects=request.gened_avoid_subjects,
                    topk=request.gened_topk,
                )
            except Exception as e:
                logger.error(f"Error in GenEd recommendations: {str(e)}")
                return []

        def get_clubs():
            try:
                club_recommender = get_club_recommender()
                return club_recommender.recommend_clubs(
                    interests=request.club_interests,
                    preferred_tags=request.club_preferred_tags,
                    avoid_tags=request.club_avoid_tags,
                    topk=request.club_topk,
                )
            except Exception as e:
                logger.error(f"Error in club recommendations: {str(e)}")
                return []

        # Get technical course recommendations if major is provided
        if request.major_name:
            try:
                logger.info(f"Getting technical recommendations for major: {request.major_name}")
                technical_recommender = get_technical_recommender()
                technical_recommendations = technical_recommender.recommend_courses(
                    major_name=request.major_name,
                    completed_courses=request.completed_courses,
                    interests=request.technical_interests,
                    prefer_foundational=request.technical_prefer_foundational,
                    prefer_advanced=request.technical_prefer_advanced,
                    topk=request.technical_topk,
                )
                results["technical_courses"] = technical_recommendations
                logger.info(f"Got {len(technical_recommendations)} technical recommendations")
            except Exception as e:
                logger.warning(f"Technical recommender failed: {str(e)}, falling back to old recommender")
                # Fallback to old recommender if technical fails
                try:
                    recommender = get_recommender()
                    data_loader = get_data_loader()
                    major = data_loader.get_major(request.major_name)

                    if major:
                        course_result = recommender.recommend_courses(
                            major_name=request.major_name,
                            completed_courses=request.completed_courses,
                            num_recommendations=request.course_num_recommendations,
                        )
                        results["courses"] = course_result.get("recommendations", [])
                        results["progress"] = course_result.get("progress", {})
                        results["semester_plan"] = course_result.get("semester_plan")
                        results["student_year"] = course_result.get("student_year")
                except Exception as fallback_error:
                    logger.error(f"Fallback recommender also failed: {str(fallback_error)}")
                    results["courses"] = []

        # Run GenEd and Club recommendations in parallel
        logger.info("Getting GenEd and Club recommendations in parallel")
        gened_recommendations, club_recommendations = await asyncio.gather(
            asyncio.to_thread(get_gened),
            asyncio.to_thread(get_clubs),
            return_exceptions=True
        )
        
        # Handle results
        if isinstance(gened_recommendations, Exception):
            logger.error(f"GenEd recommendations failed: {str(gened_recommendations)}")
            results["gened"] = []
        else:
            results["gened"] = gened_recommendations
        
        if isinstance(club_recommendations, Exception):
            logger.error(f"Club recommendations failed: {str(club_recommendations)}")
            results["clubs"] = []
        else:
            results["clubs"] = club_recommendations

        logger.info("Combined recommendations completed successfully")
        return results
    except Exception as e:
        logger.error(f"Error generating combined recommendations: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error generating combined recommendations: {str(e)}",
        )
