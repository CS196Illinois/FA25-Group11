/**
 * Validation utilities for course codes and inputs
 */

/**
 * Validate course code format (e.g., "CS 124", "MATH 221")
 */
export const validateCourseCode = (code) => {
  if (!code || typeof code !== 'string') {
    return false;
  }
  
  // Match pattern: 2-4 letters, space, 3 digits, optional letter
  const pattern = /^[A-Z]{2,4}\s+\d{3}[A-Z]?$/i;
  return pattern.test(code.trim());
};

/**
 * Normalize course code to standard format
 */
export const normalizeCourseCode = (code) => {
  if (!code) return '';
  
  // Remove extra spaces and convert to uppercase
  const normalized = code.trim().toUpperCase();
  
  // Ensure format is "DEPT 123" not "DEPT123"
  const match = normalized.match(/^([A-Z]{2,4})\s*(\d{3}[A-Z]?)$/);
  if (match) {
    return `${match.group(1)} ${match.group(2)}`;
  }
  
  return normalized;
};

/**
 * Validate and normalize array of course codes
 */
export const validateAndNormalizeCourses = (courses) => {
  if (!Array.isArray(courses)) {
    return [];
  }
  
  return courses
    .map(code => normalizeCourseCode(code))
    .filter(code => code && validateCourseCode(code));
};

