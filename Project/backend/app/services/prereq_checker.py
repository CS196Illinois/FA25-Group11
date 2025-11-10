"""Check if prerequisites are satisfied."""
import re
from typing import List, Set, Tuple


def normalize_course_code(code: str) -> str:
    """Normalize course code format."""
    # Remove extra spaces and convert to uppercase
    code = code.strip().upper()
    # Ensure format is "DEPT 123" not "DEPT123"
    match = re.match(r'^([A-Z]{2,4})\s*(\d{3}[A-Z]?)$', code)
    if match:
        return f"{match.group(1)} {match.group(2)}"
    return code


def parse_prerequisite_string(prereq_str: str) -> List[List[str]]:
    """Parse prerequisite string into list of OR groups.
    
    Example: "CS 124 or CS 125" -> [["CS 124", "CS 125"]]
    Example: "CS 124 and MATH 221" -> [["CS 124"], ["MATH 221"]]
    Example: "(CS 124 or CS 125) and MATH 221" -> [["CS 124", "CS 125"], ["MATH 221"]]
    
    Returns list of OR groups (each group is a list of course codes).
    All groups must be satisfied (AND logic between groups).
    """
    if not prereq_str or not prereq_str.strip():
        return []
    
    prereq_str = prereq_str.strip()
    
    # Handle simple cases first
    # Check for "or" (case insensitive)
    if ' or ' in prereq_str.lower():
        # Split by "or" and normalize each
        or_parts = re.split(r'\s+or\s+', prereq_str, flags=re.IGNORECASE)
        return [[normalize_course_code(part.strip())] for part in or_parts]
    
    # Check for "and"
    if ' and ' in prereq_str.lower():
        and_parts = re.split(r'\s+and\s+', prereq_str, flags=re.IGNORECASE)
        return [[normalize_course_code(part.strip())] for part in and_parts]
    
    # Single course
    normalized = normalize_course_code(prereq_str)
    if normalized:
        return [[normalized]]
    
    return []


def check_prerequisites_met(
    prerequisites: List[str],
    completed_courses: Set[str]
) -> Tuple[bool, List[str]]:
    """Check if prerequisites are satisfied.
    
    Prerequisites are treated as OR - if any prerequisite in the list is satisfied,
    the course can be taken. This handles cases like "CS 124 or CS 125".
    
    Args:
        prerequisites: List of prerequisite course codes (each is an OR option)
        completed_courses: Set of completed course codes (normalized)
    
    Returns:
        Tuple of (all_met: bool, missing: List[str])
    """
    if not prerequisites:
        return True, []
    
    # Normalize completed courses
    completed_normalized = {normalize_course_code(c) for c in completed_courses}
    
    # Check if ANY prerequisite is satisfied (OR logic)
    # This handles cases where prerequisites are listed as alternatives
    satisfied = False
    missing = []
    
    for prereq in prerequisites:
        if isinstance(prereq, str):
            # Try to parse as OR groups first
            or_groups = parse_prerequisite_string(prereq)
            
            if or_groups:
                # Check if any course in any OR group is completed
                for or_group in or_groups:
                    if any(normalize_course_code(c) in completed_normalized for c in or_group):
                        satisfied = True
                        break
                if satisfied:
                    break
                # If not satisfied, add first option to missing
                if or_groups and or_groups[0]:
                    missing.extend(or_groups[0])
            else:
                # Direct course code
                normalized_prereq = normalize_course_code(prereq)
                if normalized_prereq in completed_normalized:
                    satisfied = True
                    break
                else:
                    missing.append(normalized_prereq)
        else:
            # Direct course code (non-string)
            normalized_prereq = normalize_course_code(str(prereq))
            if normalized_prereq in completed_normalized:
                satisfied = True
                break
            else:
                missing.append(normalized_prereq)
    
    return satisfied, missing


def can_take_course(
    course_code: str,
    completed_courses: Set[str],
    course_data: dict
) -> Tuple[bool, List[str]]:
    """Check if a course can be taken given completed courses.
    
    Args:
        course_code: Course code to check
        completed_courses: Set of completed course codes
        course_data: Course data dictionary with prerequisites
    
    Returns:
        Tuple of (can_take: bool, missing_prerequisites: List[str])
    """
    prerequisites = course_data.get('prerequisites', [])
    return check_prerequisites_met(prerequisites, completed_courses)

