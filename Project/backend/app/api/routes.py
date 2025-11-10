"""API routes for course recommendations."""
from fastapi import APIRouter, HTTPException
from typing import List
from pydantic import BaseModel, field_validator

from ..services.data_loader import get_data_loader
from ..services.recommender import get_recommender
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

