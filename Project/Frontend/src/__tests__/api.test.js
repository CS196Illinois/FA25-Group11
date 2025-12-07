import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock axios before importing the API module
vi.mock('axios', () => {
  const mockAxiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: {
      response: {
        use: vi.fn(),
      },
    },
  };

  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
    },
  };
});

describe('API Service', () => {
  let mockAxiosInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Import after mocking
    const axiosModule = await import('axios');
    mockAxiosInstance = axiosModule.default.create();
  });

  describe('getMajors', () => {
    it('should fetch and return majors list', async () => {
      const mockMajors = [
        { name: 'Computer Science, BS', url: '/cs' },
        { name: 'Mathematics, BS', url: '/math' },
      ];
      
      mockAxiosInstance.get.mockResolvedValue({
        data: { majors: mockMajors },
      });

      const { getMajors } = await import('../services/api');
      const result = await getMajors();
      
      expect(result).toEqual(mockMajors);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/majors');
    });
  });

  describe('getMajorCourses', () => {
    it('should fetch courses for a major', async () => {
      const mockCourses = {
        required: ['CS 124', 'CS 128'],
        electives: ['CS 225', 'CS 233'],
      };

      mockAxiosInstance.get.mockResolvedValue({
        data: mockCourses,
      });

      const { getMajorCourses } = await import('../services/api');
      const result = await getMajorCourses('Computer Science, BS');
      
      expect(result).toEqual(mockCourses);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/api/majors/Computer%20Science%2C%20BS/courses'
      );
    });
  });

  describe('getRecommendations', () => {
    it('should fetch course recommendations', async () => {
      const mockResponse = {
        recommendations: [
          { course_code: 'CS 128', course_name: 'Intro to CS II' },
        ],
        progress: { percentage_complete: 10 },
      };

      mockAxiosInstance.post.mockResolvedValue({
        data: mockResponse,
      });

      const { getRecommendations } = await import('../services/api');
      const result = await getRecommendations(
        'Computer Science, BS',
        ['CS 124'],
        10
      );
      
      expect(result).toEqual(mockResponse);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/recommend', {
        major_name: 'Computer Science, BS',
        completed_courses: ['CS 124'],
        num_recommendations: 10,
      });
    });
  });

  describe('getCombinedRecommendations', () => {
    it('should fetch combined recommendations', async () => {
      const mockResponse = {
        technical_courses: [{ course_code: 'CS 128' }],
        gened: [{ course_code: 'HIST 100' }],
        clubs: [{ name: 'CS Club' }],
      };

      mockAxiosInstance.post.mockResolvedValue({
        data: mockResponse,
      });

      const { getCombinedRecommendations } = await import('../services/api');
      const result = await getCombinedRecommendations({
        completedCourses: ['CS 124'],
        majorName: 'Computer Science, BS',
      });
      
      expect(result).toEqual(mockResponse);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/api/recommend/combined',
        expect.objectContaining({
          completed_courses: ['CS 124'],
          major_name: 'Computer Science, BS',
        })
      );
    });
  });

  describe('getCourseDetails', () => {
    it('should fetch course details', async () => {
      const mockCourse = {
        course_code: 'CS 124',
        course_name: 'Introduction to Computer Science',
        credits: 3,
      };

      mockAxiosInstance.get.mockResolvedValue({
        data: mockCourse,
      });

      const { getCourseDetails } = await import('../services/api');
      const result = await getCourseDetails('CS 124');
      
      expect(result).toEqual(mockCourse);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/courses/CS%20124');
    });
  });
});

