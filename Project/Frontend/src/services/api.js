import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Log API configuration on initialization
console.log('[API] Initializing API client with base URL:', API_BASE_URL);
console.log('[API] Environment variable VITE_API_URL:', import.meta.env.VITE_API_URL || 'not set (using default)');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Add request interceptor for logging outgoing requests
api.interceptors.request.use(
  (config) => {
    const timestamp = new Date().toISOString();
    console.log(`[API Request] ${timestamp}`);
    console.log(`[API Request] Method: ${config.method?.toUpperCase()}`);
    console.log(`[API Request] URL: ${config.baseURL}${config.url}`);
    console.log(`[API Request] Full URL: ${config.url ? new URL(config.url, config.baseURL).href : config.baseURL}`);
    if (config.params) {
      console.log(`[API Request] Query params:`, config.params);
    }
    if (config.data) {
      console.log(`[API Request] Request data:`, config.data);
    }
    console.log(`[API Request] Headers:`, config.headers);
    console.log(`[API Request] Timeout: ${config.timeout}ms`);
    return config;
  },
  (error) => {
    console.error('[API Request Error] Failed to create request:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for logging and error handling
api.interceptors.response.use(
  (response) => {
    const timestamp = new Date().toISOString();
    console.log(`[API Response] ${timestamp}`);
    console.log(`[API Response] Status: ${response.status} ${response.statusText}`);
    console.log(`[API Response] URL: ${response.config.url}`);
    console.log(`[API Response] Response data:`, response.data);
    return response;
  },
  (error) => {
    const timestamp = new Date().toISOString();
    console.error(`[API Error] ${timestamp}`);
    console.error(`[API Error] Error code:`, error.code);
    console.error(`[API Error] Error message:`, error.message);
    console.error(`[API Error] Request URL:`, error.config?.url);
    console.error(`[API Error] Request method:`, error.config?.method?.toUpperCase());
    console.error(`[API Error] Base URL:`, error.config?.baseURL);
    console.error(`[API Error] Full request URL:`, error.config?.url ? new URL(error.config.url, error.config.baseURL).href : error.config?.baseURL);
    
    if (error.code === 'ECONNABORTED') {
      console.error(`[API Error] Request timed out after ${error.config?.timeout || 30000}ms`);
      console.error(`[API Error] This usually means the backend is not responding or is too slow`);
      error.message = 'Request timeout. Please try again.';
    } else if (error.response) {
      // Server responded with error
      console.error(`[API Error] Server responded with error status: ${error.response.status}`);
      console.error(`[API Error] Response headers:`, error.response.headers);
      console.error(`[API Error] Response data:`, error.response.data);
      const message = error.response.data?.detail || error.response.data?.message || error.message;
      error.message = message;
    } else if (error.request) {
      // Request made but no response
      console.error(`[API Error] Request was made but no response received`);
      console.error(`[API Error] Request object:`, error.request);
      console.error(`[API Error] This usually means:`);
      console.error(`[API Error]   1. Backend server is not running`);
      console.error(`[API Error]   2. Backend URL is incorrect (current: ${error.config?.baseURL})`);
      console.error(`[API Error]   3. CORS is blocking the request`);
      console.error(`[API Error]   4. Network connectivity issue`);
      error.message = 'Unable to connect to server. Please check if the backend is running.';
    } else {
      // Something else happened
      console.error(`[API Error] Unknown error occurred:`, error);
    }
    
    console.error(`[API Error] Full error object:`, error);
    return Promise.reject(error);
  }
);

/**
 * Check if backend is reachable
 */
export const checkBackendHealth = async () => {
  try {
    console.log('[checkBackendHealth] Checking backend connectivity...');
    const response = await api.get('/health');
    console.log('[checkBackendHealth] Backend is healthy:', response.data);
    return { healthy: true, data: response.data };
  } catch (error) {
    console.error('[checkBackendHealth] Backend health check failed:', error);
    console.error('[checkBackendHealth] This indicates the backend is not reachable at:', API_BASE_URL);
    return { healthy: false, error: error.message, code: error.code };
  }
};

/**
 * Get list of all available majors
 */
export const getMajors = async () => {
  try {
    console.log('[getMajors] Fetching list of majors...');
    const response = await api.get('/api/majors');
    console.log('[getMajors] Successfully fetched', response.data.majors?.length || 0, 'majors');
    return response.data.majors;
  } catch (error) {
    console.error('[getMajors] Failed to fetch majors:', error);
    console.error('[getMajors] Error details:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
};

/**
 * Get all courses for a specific major
 */
export const getMajorCourses = async (majorName) => {
  try {
    console.log('[getMajorCourses] Fetching courses for major:', majorName);
    const response = await api.get(`/api/majors/${encodeURIComponent(majorName)}/courses`);
    console.log('[getMajorCourses] Successfully fetched courses for', majorName);
    return response.data;
  } catch (error) {
    console.error('[getMajorCourses] Failed to fetch courses for major:', majorName, error);
    console.error('[getMajorCourses] Error details:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
    });
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
    console.log('[getRecommendations] Requesting recommendations:', {
      majorName,
      completedCoursesCount: completedCourses?.length || 0,
      numRecommendations,
    });
    const response = await api.post('/api/recommend', {
      major_name: majorName,
      completed_courses: completedCourses,
      num_recommendations: numRecommendations,
    });
    console.log('[getRecommendations] Successfully received recommendations');
    return response.data;
  } catch (error) {
    console.error('[getRecommendations] Failed to fetch recommendations:', error);
    console.error('[getRecommendations] Error details:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      requestData: {
        majorName,
        completedCoursesCount: completedCourses?.length || 0,
        numRecommendations,
      },
    });
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
    console.log('[getCombinedRecommendations] Requesting combined recommendations:', {
      majorName: params.major_name,
      completedCoursesCount: params.completed_courses?.length || 0,
      technicalInterests: params.technical_interests,
      genedInterests: params.gened_interests,
      clubInterests: params.club_interests,
    });
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
    }, {
      timeout: 60000, // 60 second timeout for combined recommendations (longer processing time)
    });
    console.log('[getCombinedRecommendations] Successfully received combined recommendations');
    return response.data;
  } catch (error) {
    console.error('[getCombinedRecommendations] Failed to fetch combined recommendations:', error);
    console.error('[getCombinedRecommendations] Error details:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      requestParams: params,
    });
    throw error;
  }
};

export default api;

