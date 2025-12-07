import axios from 'axios';

// Get API base URL from environment variable, default to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Log API configuration (in both dev and production for debugging)
console.log('API Base URL:', API_BASE_URL);
if (!import.meta.env.VITE_API_URL && import.meta.env.PROD) {
  console.warn('⚠️ VITE_API_URL not set in production! Using default localhost. Set this in Vercel environment variables.');
}

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      error.message = 'Request timeout. Please try again.';
    } else if (error.response) {
      // Server responded with error
      const message = error.response.data?.detail || 
                     error.response.data?.message || 
                     error.message;
      error.message = message;
    } else if (error.request) {
      // Request made but no response
      const apiUrl = API_BASE_URL;
      const endpoint = error.config?.url || 'unknown';
      const fullUrl = endpoint !== 'unknown' ? `${apiUrl}${endpoint}` : apiUrl;
      
      // More helpful error message
      if (import.meta.env.PROD) {
        error.message = `Unable to connect to backend server. Please check if the backend is running at ${apiUrl}`;
      } else {
        error.message = `Unable to connect to server at ${apiUrl}. Please check if the backend is running on port 8000.`;
      }
      
      console.error('API Connection Error:', {
        url: apiUrl,
        endpoint: endpoint,
        fullUrl: fullUrl,
        error: error.message,
        code: error.code,
        env: import.meta.env.MODE
      });
    }
    return Promise.reject(error);
  }
);

/**
 * Get list of all available majors
 * @returns {Promise<Array>} Array of major objects with name and url
 */
export const getMajors = async () => {
  const response = await api.get('/api/majors');
  return response.data.majors;
};

/**
 * Get all courses for a specific major
 * @param {string} majorName - Name of the major
 * @returns {Promise<Object>} Object with required, electives, and focus_areas arrays
 */
export const getMajorCourses = async (majorName) => {
  const encodedMajor = encodeURIComponent(majorName);
  const response = await api.get(`/api/majors/${encodedMajor}/courses`);
  return response.data;
};

/**
 * Get course recommendations
 * @param {string} majorName - Name of the major
 * @param {Array<string>} completedCourses - Array of completed course codes
 * @param {number} numRecommendations - Number of recommendations to return (default: 10)
 * @returns {Promise<Object>} Recommendation response with recommendations, progress, etc.
 */
export const getRecommendations = async (majorName, completedCourses, numRecommendations = 10) => {
  const response = await api.post('/api/recommend', {
    major_name: majorName,
    completed_courses: completedCourses,
    num_recommendations: numRecommendations,
  });
  return response.data;
};

/**
 * Get detailed information about a specific course
 * @param {string} courseCode - Course code (e.g., "CS 124")
 * @returns {Promise<Object>} Course details object
 */
export const getCourseDetails = async (courseCode) => {
  const encodedCode = encodeURIComponent(courseCode);
  const response = await api.get(`/api/courses/${encodedCode}`);
  return response.data;
};

/**
 * Get prerequisite chain for a course
 * @param {string} courseCode - Course code (e.g., "CS 124")
 * @returns {Promise<Object>} Prerequisite information
 */
export const getCoursePrerequisites = async (courseCode) => {
  const encodedCode = encodeURIComponent(courseCode);
  const response = await api.get(`/api/courses/${encodedCode}/prerequisites`);
  return response.data;
};

/**
 * Upload and parse DARS PDF file
 * @param {File} file - PDF file to upload
 * @returns {Promise<Object>} Object with courses array and count
 */
export const uploadDars = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/api/dars/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 60000, // 60 seconds for file upload
  });
  return response.data;
};

/**
 * Get combined recommendations (technical courses, GenEd courses, and clubs)
 * @param {Object} params - Parameters object
 * @param {Array<string>} params.completedCourses - Array of completed course codes
 * @param {string} params.majorName - Name of the major (optional)
 * @param {string} params.technicalInterests - Technical interests string (optional)
 * @param {boolean} params.technicalPreferFoundational - Prefer foundational courses (optional)
 * @param {boolean} params.technicalPreferAdvanced - Prefer advanced courses (optional)
 * @param {string} params.genedInterests - GenEd interests string (optional)
 * @param {Array<string>} params.genedPreferences - GenEd category preferences (optional)
 * @param {number} params.genedMinGpa - Minimum GPA threshold (optional, default: 3.0)
 * @param {Array<string>} params.genedAvoidSubjects - Subjects to avoid (optional)
 * @param {string} params.clubInterests - Club interests string (optional)
 * @param {Array<string>} params.clubPreferredTags - Preferred club tags (optional)
 * @param {Array<string>} params.clubAvoidTags - Club tags to avoid (optional)
 * @param {number} params.courseNumRecommendations - Number of course recommendations (optional, default: 10)
 * @param {number} params.technicalTopk - Number of technical recommendations (optional, default: 20)
 * @param {number} params.genedTopk - Number of GenEd recommendations (optional, default: 20)
 * @param {number} params.clubTopk - Number of club recommendations (optional, default: 20)
 * @returns {Promise<Object>} Object with technical_courses, gened, and clubs arrays
 */
export const getCombinedRecommendations = async (params) => {
  const {
    completedCourses,
    majorName,
    technicalInterests = '',
    technicalPreferFoundational = false,
    technicalPreferAdvanced = false,
    genedInterests = '',
    genedPreferences = [],
    genedMinGpa = 3.0,
    genedAvoidSubjects = [],
    clubInterests = '',
    clubPreferredTags = [],
    clubAvoidTags = [],
    courseNumRecommendations = 10,
    technicalTopk = 20,
    genedTopk = 20,
    clubTopk = 20,
  } = params;

  const response = await api.post('/api/recommend/combined', {
    completed_courses: completedCourses,
    major_name: majorName || null,
    technical_interests: technicalInterests,
    technical_prefer_foundational: technicalPreferFoundational,
    technical_prefer_advanced: technicalPreferAdvanced,
    gened_interests: genedInterests,
    gened_preferences: genedPreferences,
    gened_min_gpa: genedMinGpa,
    gened_avoid_subjects: genedAvoidSubjects,
    club_interests: clubInterests,
    club_preferred_tags: clubPreferredTags,
    club_avoid_tags: clubAvoidTags,
    course_num_recommendations: courseNumRecommendations,
    technical_topk: technicalTopk,
    gened_topk: genedTopk,
    club_topk: clubTopk,
  });
  return response.data;
};

export default api;

