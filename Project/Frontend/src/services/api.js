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

export default api;

