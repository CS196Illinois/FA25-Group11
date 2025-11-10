"""Detect student's academic year based on completed courses."""
from typing import List, Set
from .prereq_checker import normalize_course_code


# Core CS courses that indicate progression
CORE_CS_COURSES = {
    'first_year': ['CS 124', 'CS 128', 'CS 173'],
    'second_year': ['CS 222', 'CS 225', 'CS 233'],
    'third_year': ['CS 341', 'CS 357', 'CS 374'],
    'fourth_year': ['CS 421']
}

# Core Math courses
CORE_MATH_COURSES = {
    'first_year': ['MATH 221', 'MATH 231'],
    'second_year': ['MATH 241', 'MATH 257'],
}

# Core Physics courses
CORE_PHYSICS_COURSES = {
    'second_year': ['PHYS 211', 'PHYS 212']
}


def detect_student_year(completed_courses: List[str]) -> str:
    """Detect student's academic year based on completed courses.
    
    Uses a more nuanced approach: checks for specific milestone courses
    that indicate progression through the curriculum.
    
    Args:
        completed_courses: List of completed course codes
    
    Returns:
        One of: 'first_year', 'second_year', 'third_year', 'fourth_year'
    """
    completed_set = {normalize_course_code(c) for c in completed_courses}
    
    # Check for fourth year milestone (CS 421)
    if normalize_course_code('CS 421') in completed_set:
        return 'fourth_year'
    
    # Check for third year milestones (CS 341, CS 357, CS 374)
    third_year_milestones = ['CS 341', 'CS 357', 'CS 374']
    third_year_completed = sum(1 for course in third_year_milestones
                              if normalize_course_code(course) in completed_set)
    
    if third_year_completed >= 2:
        return 'fourth_year'
    elif third_year_completed >= 1:
        return 'third_year'
    
    # Check for second year milestones (CS 225, CS 233, CS 361)
    second_year_milestones = ['CS 225', 'CS 233', 'CS 361']
    second_year_completed = sum(1 for course in second_year_milestones
                               if normalize_course_code(course) in completed_set)
    
    # Also check for MATH 241, MATH 257, PHYS 211, PHYS 212 (typically second year)
    math_physics_second = sum(1 for course in ['MATH 241', 'MATH 257', 'PHYS 211', 'PHYS 212']
                              if normalize_course_code(course) in completed_set)
    
    if second_year_completed >= 2 or (second_year_completed >= 1 and math_physics_second >= 2):
        return 'third_year'
    elif second_year_completed >= 1 or math_physics_second >= 1:
        return 'second_year'
    
    # Check for first year courses (CS 124, CS 128, CS 173)
    first_year_cs = sum(1 for course in CORE_CS_COURSES['first_year']
                       if normalize_course_code(course) in completed_set)
    first_year_math = sum(1 for course in CORE_MATH_COURSES['first_year']
                         if normalize_course_code(course) in completed_set)
    
    # Be conservative: need at least 2 first-year courses to move to second year
    # Or one CS course + one Math course from first year
    if first_year_cs >= 2 and first_year_math >= 1:
        return 'second_year'
    elif first_year_cs >= 1 or first_year_math >= 1:
        return 'first_year'
    
    # Default to first year if no clear indicators
    return 'first_year'


def get_semester_from_course(course_code: str, student_year: str, 
                             sample_sequence: dict) -> str:
    """Get which semester a course should be taken in.
    
    Args:
        course_code: Course code to check
        student_year: Student's academic year
        sample_sequence: Sample sequence data
    
    Returns:
        'fall', 'spring', or None if not found
    """
    if student_year not in sample_sequence:
        return None
    
    year_data = sample_sequence[student_year]
    normalized_code = normalize_course_code(course_code)
    
    # Check fall semester
    if 'fall' in year_data:
        fall_courses = year_data['fall'].get('courses', [])
        for course in fall_courses:
            if normalize_course_code(course.get('code', '')) == normalized_code:
                return 'fall'
    
    # Check spring semester
    if 'spring' in year_data:
        spring_courses = year_data['spring'].get('courses', [])
        for course in spring_courses:
            if normalize_course_code(course.get('code', '')) == normalized_code:
                return 'spring'
    
    return None


def is_in_sample_sequence(course_code: str, student_year: str,
                          sample_sequence: dict, semester: str = None) -> bool:
    """Check if a course is in the sample sequence for the student's year.
    
    Args:
        course_code: Course code to check
        student_year: Student's academic year
        sample_sequence: Sample sequence data
        semester: Optional semester to check ('fall' or 'spring')
    
    Returns:
        True if course is in sample sequence
    """
    if student_year not in sample_sequence:
        return False
    
    year_data = sample_sequence[student_year]
    normalized_code = normalize_course_code(course_code)
    
    semesters_to_check = [semester] if semester else ['fall', 'spring']
    
    for sem in semesters_to_check:
        if sem in year_data:
            courses = year_data[sem].get('courses', [])
            for course in courses:
                if normalize_course_code(course.get('code', '')) == normalized_code:
                    return True
    
    return False

