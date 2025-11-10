"""Course data models."""
from pydantic import BaseModel
from typing import List, Optional, Dict, Any


class Course(BaseModel):
    """Course model."""
    course_code: str
    name: str
    credits: str
    description: Optional[str] = None
    prerequisites: List[str] = []
    postrequisites: List[str] = []


class Recommendation(BaseModel):
    """Course recommendation model."""
    course_code: str
    name: str
    credits: str
    reason: str
    prerequisites_met: bool
    missing_prerequisites: List[str] = []
    sequence_aligned: bool = False
    semester: Optional[str] = None


class Progress(BaseModel):
    """Degree progress model."""
    completed: int
    total: int
    percentage: float


class SemesterPlan(BaseModel):
    """Semester plan model."""
    courses: List[Recommendation]
    total_credits: float


class RecommendationResponse(BaseModel):
    """Response model for recommendations."""
    recommendations: List[Recommendation]
    progress: Progress
    semester_plan: Optional[Dict[str, Any]] = None
    student_year: Optional[str] = None

