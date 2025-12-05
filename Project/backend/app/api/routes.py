"""API routes for course recommendations."""
from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel, field_validator

from ..services.data_loader import get_data_loader
from ..services.recommender import get_recommender
from ..services.club_recommender import get_club_recommender
from ..services.gened_recommender import get_gened_recommender
from ..models.course import RecommendationResponse, Course
from ..utils.validation import validate_course_codes

router = APIRouter()


class RecommendationRequest(BaseModel):
    """Request model for recommendations."""
    major_name: str
    completed_courses: List[str]
    num_recommendations: int = 5
    
    @field_validator('completed_courses')
    @classmethod
    def validate_courses(cls, v):
        """Validate and normalize course codes."""
        if not v:
            raise ValueError('At least one completed course is required')
        validated = validate_course_codes(v)
        if not validated:
            raise ValueError('Invalid course code format')
        return validated
    
    @field_validator('num_recommendations')
    @classmethod
    def validate_num_recommendations(cls, v):
        """Validate number of recommendations."""
        if v < 1 or v > 20:
            raise ValueError('num_recommendations must be between 1 and 20')
        return v
    
    class Config:
        """Pydantic config."""
        json_schema_extra = {
            "example": {
                "major_name": "Computer Science, BS",
                "completed_courses": ["CS 124", "MATH 221"],
                "num_recommendations": 5
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
    
    if not courses['required'] and not courses['electives']:
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
                status_code=404, 
                detail=f"Major '{request.major_name}' not found"
            )
        
        result = recommender.recommend_courses(
            major_name=request.major_name,
            completed_courses=request.completed_courses,
            num_recommendations=request.num_recommendations
        )
        
        return RecommendationResponse(**result)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating recommendations: {str(e)}")


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
    
    prerequisites = course.get('prerequisites', [])
    
    return {
        'course_code': course_code,
        'prerequisites': prerequisites,
        'can_take': len(prerequisites) == 0,  # Simplified - would need completed courses to check
        'missing': prerequisites
    }


class ClubRecommendationRequest(BaseModel):
    """Request model for club recommendations."""
    interests: str = ""
    preferred_tags: List[str] = []
    avoid_tags: List[str] = []
    topk: int = 20
    
    @field_validator('topk')
    @classmethod
    def validate_topk(cls, v):
        """Validate number of recommendations."""
        if v < 1 or v > 50:
            raise ValueError('topk must be between 1 and 50')
        return v
    
    class Config:
        """Pydantic config."""
        json_schema_extra = {
            "example": {
                "interests": "sports fitness",
                "preferred_tags": ["Athletic & Recreation"],
                "avoid_tags": [],
                "topk": 15
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
            topk=request.topk
        )
        return {"recommendations": recommendations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating club recommendations: {str(e)}")


class GenedRecommendationRequest(BaseModel):
    """Request model for GenEd course recommendations."""
    interests: str = ""
    gened_preferences: List[str] = []
    min_gpa: float = 3.0
    avoid_subjects: List[str] = []
    topk: int = 20
    
    @field_validator('topk')
    @classmethod
    def validate_topk(cls, v):
        """Validate number of recommendations."""
        if v < 1 or v > 50:
            raise ValueError('topk must be between 1 and 50')
        return v
    
    @field_validator('min_gpa')
    @classmethod
    def validate_gpa(cls, v):
        """Validate GPA threshold."""
        if v < 0 or v > 4.0:
            raise ValueError('min_gpa must be between 0 and 4.0')
        return v
    
    class Config:
        """Pydantic config."""
        json_schema_extra = {
            "example": {
                "interests": "psychology society culture",
                "gened_preferences": ["HUM", "CS"],
                "min_gpa": 3.3,
                "avoid_subjects": ["BTW"],
                "topk": 20
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
            topk=request.topk
        )
        return {"recommendations": recommendations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating GenEd recommendations: {str(e)}")

