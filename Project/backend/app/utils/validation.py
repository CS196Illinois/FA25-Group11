"""Input validation utilities."""
import re
from typing import List


def validate_course_code(code: str) -> bool:
    """Validate course code format (e.g., 'CS 124', 'MATH 221')."""
    if not code or not isinstance(code, str):
        return False
    
    # Match pattern: 2-4 letters, space, 3 digits, optional letter
    pattern = r'^[A-Z]{2,4}\s+\d{3}[A-Z]?$'
    return bool(re.match(pattern, code.strip(), re.IGNORECASE))


def normalize_course_code(code: str) -> str:
    """Normalize course code to standard format."""
    if not code:
        return ''
    
    # Remove extra spaces and convert to uppercase
    normalized = code.strip().upper()
    
    # Ensure format is "DEPT 123" not "DEPT123"
    match = re.match(r'^([A-Z]{2,4})\s*(\d{3}[A-Z]?)$', normalized)
    if match:
        return f"{match.group(1)} {match.group(2)}"
    
    return normalized


def validate_course_codes(codes: List[str]) -> List[str]:
    """Validate and normalize list of course codes."""
    if not isinstance(codes, list):
        return []
    
    normalized = []
    for code in codes:
        if isinstance(code, str):
            norm_code = normalize_course_code(code)
            if norm_code and validate_course_code(norm_code):
                normalized.append(norm_code)
    
    return normalized

