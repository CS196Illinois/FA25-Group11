import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Add request interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      error.message = 'Request timeout. Please try again.';
    } else if (error.response) {
      // Server responded with error
      const message = error.response.data?.detail || error.response.data?.message || error.message;
      error.message = message;
    } else if (error.request) {
      // Request made but no response
      error.message = 'Unable to connect to server. Please check if the backend is running.';
    }
    return Promise.reject(error);
  }
);

/**
 * Get list of all available majors
 */
export const getMajors = async () => {
  try {
    const response = await api.get('/api/majors');
    return response.data.majors;
  } catch (error) {
    console.error('Error fetching majors:', error);
    throw error;
  }
};

/**
 * Get all courses for a specific major
 */
export const getMajorCourses = async (majorName) => {
  try {
    const response = await api.get(`/api/majors/${encodeURIComponent(majorName)}/courses`);
    return response.data;
  } catch (error) {
    console.error('Error fetching major courses:', error);
    throw error;
  }
};

/**
 * Get course recommendations
 * @param {string} majorName - Name of the major
 * @param {string[]} completedCourses - Array of completed course codes
 * @param {number} numRecommendations - Number of recommendations (default: 5)
 */
export const getRecommendations = async (majorName, completedCourses, numRecommendations = 5) => {
  try {
    const response = await api.post('/api/recommend', {
      major_name: majorName,
      completed_courses: completedCourses,
      num_recommendations: numRecommendations,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    throw error;
  }
};

/**
 * Get detailed information about a specific course
 */
export const getCourseDetails = async (courseCode) => {
  try {
    const response = await api.get(`/api/courses/${encodeURIComponent(courseCode)}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching course details:', error);
    throw error;
  }
};

/**
 * Get prerequisite chain for a course
 */
export const getCoursePrerequisites = async (courseCode) => {
  try {
    const response = await api.get(`/api/courses/${encodeURIComponent(courseCode)}/prerequisites`);
    return response.data;
  } catch (error) {
    console.error('Error fetching prerequisites:', error);
    throw error;
  }
};

/**
 * Get club recommendations
 * @param {Object} params - Recommendation parameters
 * @param {string} params.interests - Free-form text describing interests
 * @param {string[]} params.preferred_tags - List of preferred club categories
 * @param {string[]} params.avoid_tags - List of categories to avoid
 * @param {number} params.topk - Number of recommendations (default: 20)
 */
export const getClubRecommendations = async (params) => {
  try {
    const response = await api.post('/api/clubs/recommend', {
      interests: params.interests || '',
      preferred_tags: params.preferred_tags || [],
      avoid_tags: params.avoid_tags || [],
      topk: params.topk || 20,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching club recommendations:', error);
    throw error;
  }
};

/**
 * Get GenEd course recommendations
 * @param {Object} params - Recommendation parameters
 * @param {string} params.interests - Free-form text describing interests
 * @param {string[]} params.gened_preferences - List of preferred GenEd categories (e.g., ['HUM', 'CS'])
 * @param {number} params.min_gpa - Minimum GPA threshold (default: 3.0)
 * @param {string[]} params.avoid_subjects - List of subject codes to avoid
 * @param {number} params.topk - Number of recommendations (default: 20)
 */
export const getGenedRecommendations = async (params) => {
  try {
    const response = await api.post('/api/gened/recommend', {
      interests: params.interests || '',
      gened_preferences: params.gened_preferences || [],
      min_gpa: params.min_gpa || 3.0,
      avoid_subjects: params.avoid_subjects || [],
      topk: params.topk || 20,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching GenEd recommendations:', error);
    throw error;
  }
};

/**
 * Upload DARS PDF file
 * @param {File} file - PDF file to upload
 */
export const uploadDars = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/api/dars/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading DARS:', error);
    throw error;
  }
};

/**
 * Get technical course recommendations
 * @param {Object} params - Technical recommendation parameters
 * @param {string} params.major_name - Name of the major
 * @param {string[]} params.completed_courses - Array of completed course codes
 * @param {string} params.interests - Free-form text describing interests
 * @param {string[]} params.courses_in_progress - Array of courses in progress
 * @param {boolean} params.prefer_foundational - Prefer courses that unlock many others
 * @param {boolean} params.prefer_advanced - Prefer advanced (400-level) courses
 * @param {number} params.topk - Number of recommendations (default: 20)
 */
export const getTechnicalRecommendations = async (params) => {
  try {
    const response = await api.post('/api/technical/recommend', {
      major_name: params.major_name,
      completed_courses: params.completed_courses || [],
      interests: params.interests || '',
      courses_in_progress: params.courses_in_progress || [],
      prefer_foundational: params.prefer_foundational || false,
      prefer_advanced: params.prefer_advanced || false,
      topk: params.topk || 20,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching technical recommendations:', error);
    throw error;
  }
};

/**
 * Get combined recommendations (courses, gened, clubs)
 * @param {Object} params - Combined recommendation parameters
 */
export const getCombinedRecommendations = async (params) => {
  try {
    const response = await api.post('/api/recommend/combined', {
      completed_courses: params.completed_courses || [],
      major_name: params.major_name || null,
      technical_interests: params.technical_interests || '',
      technical_prefer_foundational: params.technical_prefer_foundational || false,
      technical_prefer_advanced: params.technical_prefer_advanced || false,
      gened_interests: params.gened_interests || '',
      gened_preferences: params.gened_preferences || [],
      gened_min_gpa: params.gened_min_gpa || 3.0,
      gened_avoid_subjects: params.gened_avoid_subjects || [],
      club_interests: params.club_interests || '',
      club_preferred_tags: params.club_preferred_tags || [],
      club_avoid_tags: params.club_avoid_tags || [],
      course_num_recommendations: params.course_num_recommendations || 10,
      technical_topk: params.technical_topk || 20,
      gened_topk: params.gened_topk || 20,
      club_topk: params.club_topk || 20,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching combined recommendations:', error);
    throw error;
  }
};

export default api;

