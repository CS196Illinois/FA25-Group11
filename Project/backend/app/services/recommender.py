"""Rule-based course recommendation engine."""
import re
from typing import List, Set, Dict, Any, Optional
from .data_loader import get_data_loader
from .prereq_checker import can_take_course, normalize_course_code
from .year_detector import detect_student_year, is_in_sample_sequence, get_semester_from_course


class Recommender:
    """Course recommendation engine."""
    
    def __init__(self):
        """Initialize recommender with data loader."""
        self.data_loader = get_data_loader()
        self.data_loader.load_course_graph()
        self.data_loader.load_major_requirements()
    
    def get_major_courses(self, major_name: str) -> Dict[str, Any]:
        """Get all courses for a major.
        
        Returns:
            Dictionary with 'required', 'electives', and 'focus_areas' lists
        """
        major_data = self.data_loader.get_major(major_name)
        if not major_data:
            return {'required': [], 'electives': [], 'focus_areas': []}
        
        required_courses = []
        elective_courses = []
        focus_areas = []
        
        # Extract courses from requirement groups
        for group in major_data.get('requirement_groups', []):
            group_name = group.get('group_name', '').lower()
            
            # Check if this is a focus area
            if any(keyword in group_name for keyword in ['focus', 'concentration', 'track', 'specialization']):
                focus_areas.append({
                    'name': group.get('group_name', ''),
                    'courses': group.get('courses', [])
                })
            else:
                # Regular requirement group
                for course in group.get('courses', []):
                    course_code = course.get('course_code', '')
                    if course_code:
                        # Check if it's marked as required or elective
                        # For now, assume all courses in requirement groups are required
                        required_courses.append(course)
        
        return {
            'required': required_courses,
            'electives': elective_courses,
            'focus_areas': focus_areas
        }
    
    def recommend_courses(
        self,
        major_name: str,
        completed_courses: List[str],
        num_recommendations: int = 5,
        include_semester_planning: bool = True
    ) -> Dict[str, Any]:
        """Generate course recommendations.
        
        Args:
            major_name: Name of the major
            completed_courses: List of completed course codes
            num_recommendations: Number of recommendations to return
            include_semester_planning: Whether to group by semester
        
        Returns:
            Dictionary with recommendations and progress
        """
        # Normalize completed courses
        completed_set = {normalize_course_code(c) for c in completed_courses}
        
        # Get major data
        major_data = self.data_loader.get_major(major_name)
        if not major_data:
            return {
                'recommendations': [],
                'progress': {'completed': 0, 'total': 0, 'percentage': 0.0},
                'semester_plan': {}
            }
        
        # Detect student year and load sample sequence
        student_year = detect_student_year(completed_courses)
        sample_sequence = self.data_loader.get_sample_sequence(major_name) if include_semester_planning else None
        
        # Collect all courses from major requirements
        all_major_courses = []
        all_major_course_codes = set()  # Track all courses in major (including completed)
        required_course_codes = set()
        
        for group in major_data.get('requirement_groups', []):
            group_name = group.get('group_name', '').lower()
            is_required_group = any(keyword in group_name for keyword in [
                'core', 'required', 'foundational', 'technical', 'mathematics', 'science'
            ])
            
            for course in group.get('courses', []):
                course_code = course.get('course_code', '')
                if course_code:
                    normalized_code = normalize_course_code(course_code)
                    all_major_course_codes.add(normalized_code)  # Track all courses
                    
                    if normalized_code not in completed_set:
                        all_major_courses.append(course)
                        # Mark as required if in core requirement groups
                        if is_required_group:
                            required_course_codes.add(normalized_code)
        
        # Filter courses that can be taken (prerequisites met)
        eligible_courses = []
        
        for course in all_major_courses:
            course_code = course.get('course_code', '')
            if not course_code:
                continue
            
            # Check if prerequisites are met
            can_take, missing = can_take_course(
                course_code,
                completed_set,
                course
            )
            
            if can_take:
                normalized_course_code = normalize_course_code(course_code)
                
                # Check sequence alignment
                sequence_aligned = False
                sequence_semester = None
                if sample_sequence:
                    sequence_aligned = is_in_sample_sequence(
                        course_code, student_year, sample_sequence
                    )
                    sequence_semester = get_semester_from_course(
                        course_code, student_year, sample_sequence
                    )
                
                eligible_courses.append({
                    'course': course,
                    'is_required': normalized_course_code in required_course_codes,
                    'missing_prereqs': [],
                    'postrequisite_count': len(course.get('postrequisites', [])),
                    'sequence_aligned': sequence_aligned,
                    'sequence_semester': sequence_semester
                })
        
        # Rank courses by priority
        # 1. Required courses first
        # 2. Lower course level (100/200) before higher (300/400)
        # 3. Then by postrequisite count (courses that unlock more courses)
        def get_course_level(course_code):
            """Extract course level from code (e.g., CS 124 -> 1, CS 374 -> 3)."""
            if not course_code or not isinstance(course_code, str):
                return 5  # Default to high if can't parse
            match = re.match(r'[A-Z]{2,4}\s*(\d)(\d{2})', course_code.upper())
            if match:
                return int(match.group(1))
            return 5  # Default to high if can't parse
        
        # Filter out courses that are clearly too advanced (400-level capstone/senior courses)
        # unless prerequisites are clearly met
        def is_appropriate_level(course_item):
            course_code = course_item['course'].get('course_code', '')
            if not course_code or not isinstance(course_code, str):
                return True  # Allow if we can't determine level
            level = get_course_level(course_code)
            # Filter out 400-level courses unless they're clearly next steps
            # (This is a heuristic - could be improved)
            if level == 4:
                # Allow if it has many postrequisites (unlocks many courses) or is clearly required
                return course_item['is_required'] or course_item['postrequisite_count'] > 5
            return True
        
        eligible_courses = [c for c in eligible_courses if is_appropriate_level(c)]
        
        # Rank courses by priority
        # 1. Sequence alignment (courses in sample sequence first)
        # 2. Required courses
        # 3. Course level (lower first)
        # 4. Postrequisite count (higher first)
        eligible_courses.sort(
            key=lambda x: (
                not x.get('sequence_aligned', False),  # Sequence-aligned first
                not x['is_required'],  # Required courses first
                get_course_level(x['course'].get('course_code', '')),  # Lower level first
                -x['postrequisite_count']  # Higher postrequisite count first
            )
        )
        
        # Build recommendations
        recommendations = []
        for item in eligible_courses[:num_recommendations]:
            course = item['course']
            course_code = course.get('course_code', '')
            
            # Determine reason
            if item.get('sequence_aligned', False):
                semester = item.get('sequence_semester', '')
                if semester:
                    reason = f"Recommended for {semester.capitalize()} semester (sample sequence)"
                else:
                    reason = "Recommended in sample sequence"
            elif item['is_required']:
                reason = "Required for Computer Science major"
            elif item['postrequisite_count'] > 0:
                reason = f"Prerequisite for {item['postrequisite_count']} advanced course(s)"
            else:
                reason = "Elective course"
            
            recommendations.append({
                'course_code': course_code,
                'name': course.get('name', ''),
                'credits': course.get('credits', ''),
                'reason': reason,
                'prerequisites_met': True,
                'missing_prerequisites': [],
                'sequence_aligned': item.get('sequence_aligned', False),
                'semester': item.get('sequence_semester')
            })
        
        # Calculate progress
        # Count completed courses that are in major requirements
        completed_in_major = completed_set.intersection(all_major_course_codes)
        total_required = len(required_course_codes) if required_course_codes else len(all_major_course_codes)
        completed_count = len(completed_in_major)
        
        progress = {
            'completed': completed_count,
            'total': total_required,
            'percentage': (completed_count / total_required * 100) if total_required > 0 else 0.0
        }
        
        # Group recommendations by semester if sample sequence is available
        semester_plan = {}
        if sample_sequence and include_semester_planning:
            fall_courses = [r for r in recommendations if r.get('semester') == 'fall']
            spring_courses = [r for r in recommendations if r.get('semester') == 'spring']
            other_courses = [r for r in recommendations if not r.get('semester')]
            
            # Calculate credit hours per semester
            def calculate_credits(courses):
                total = 0
                for course in courses:
                    try:
                        credits = float(course.get('credits', '0').split('-')[0])
                        total += credits
                    except (ValueError, AttributeError):
                        pass
                return total
            
            semester_plan = {
                'fall': {
                    'courses': fall_courses[:5],  # Limit to 5 per semester
                    'total_credits': calculate_credits(fall_courses[:5])
                },
                'spring': {
                    'courses': spring_courses[:5],
                    'total_credits': calculate_credits(spring_courses[:5])
                },
                'other': {
                    'courses': other_courses[:5],
                    'total_credits': calculate_credits(other_courses[:5])
                },
                'student_year': student_year
            }
        
        return {
            'recommendations': recommendations,
            'progress': progress,
            'semester_plan': semester_plan,
            'student_year': student_year
        }


# Global instance
_recommender: Optional[Recommender] = None


def get_recommender() -> Recommender:
    """Get or create global recommender instance."""
    global _recommender
    if _recommender is None:
        _recommender = Recommender()
    return _recommender

