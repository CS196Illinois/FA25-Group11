// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { getCombinedRecommendations, getCourseDetails, getCoursePrerequisites } from '../services/api';
import './RecommendationsPage.css';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.6, -0.05, 0.01, 0.99],
    },
  },
};

function RecommendationsPage() {
  const navigate = useNavigate();
  const { formData, setRecommendations, recommendations, setLoading, loading, error, setError } = useAppContext();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSection, setSelectedSection] = useState('technical'); // technical, gened, clubs
  const [localError, setLocalError] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseDetails, setCourseDetails] = useState(null);
  const [prerequisiteChain, setPrerequisiteChain] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Convert interests array to string for API
  const interestsString = Array.isArray(formData.interests) 
    ? formData.interests.join(' ') 
    : '';

  useEffect(() => {
    // Fetch recommendations when component mounts
    const fetchRecommendations = async () => {
      // Check if we have required data
      if (!formData.completedCourses || formData.completedCourses.length === 0) {
        setLocalError('Missing required information. Please complete the onboarding first.');
        return;
      }

      // Check if we already have recommendations
      if (recommendations) {
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setLocalError(null);
        
        console.log('Fetching recommendations with:', {
          completedCourses: formData.completedCourses,
          majorName: formData.major,
          technicalInterests: interestsString,
        });
        
        const response = await getCombinedRecommendations({
          completedCourses: formData.completedCourses,
          majorName: formData.major || null,
          technicalInterests: interestsString,
          genedInterests: interestsString,
          clubInterests: interestsString,
          courseNumRecommendations: 20,
          technicalTopk: 20,
          genedTopk: 20,
          clubTopk: 20,
        });
        
        console.log('Recommendations response:', response);
        console.log('Recommendations response keys:', Object.keys(response || {}));
        console.log('Technical courses in response:', response?.technical_courses);
        console.log('Courses in response:', response?.courses);
        console.log('Gened in response:', response?.gened);
        console.log('Clubs in response:', response?.clubs);
        
        // Ensure we have a valid response structure
        if (!response || (typeof response !== 'object')) {
          throw new Error('Invalid response format from API');
        }
        
        setRecommendations(response);
      } catch (err) {
        const errorMessage = err.message || 'Failed to load recommendations. Please try again.';
        setError(errorMessage);
        setLocalError(errorMessage);
        console.error('Error fetching recommendations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [formData.major, formData.completedCourses, formData.interests, recommendations, setRecommendations, setLoading, setError, interestsString]);

  const handleRetry = async () => {
    setRecommendations(null);
    setError(null);
    setLocalError(null);
    
    try {
      setLoading(true);
      const response = await getCombinedRecommendations({
        completedCourses: formData.completedCourses,
        majorName: formData.major || null,
        technicalInterests: interestsString,
        genedInterests: interestsString,
        clubInterests: interestsString,
        courseNumRecommendations: 20,
        technicalTopk: 20,
        genedTopk: 20,
        clubTopk: 20,
      });
      setRecommendations(response);
    } catch (err) {
      const errorMessage = err.message || 'Failed to load recommendations. Please try again.';
      setError(errorMessage);
      setLocalError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (courseCode) => {
    if (!courseCode) return;
    
    setSelectedCourse(courseCode);
    setLoadingDetails(true);
    setCourseDetails(null);
    setPrerequisiteChain(null);

    try {
      // Fetch course details and prerequisites in parallel
      const [details, prereqs] = await Promise.all([
        getCourseDetails(courseCode),
        getCoursePrerequisites(courseCode).catch(() => null), // Prerequisites are optional
      ]);
      
      setCourseDetails(details);
      if (prereqs) {
        setPrerequisiteChain(prereqs);
      }
    } catch (err) {
      console.error('Error fetching course details:', err);
      setLocalError(err.message || 'Failed to load course details.');
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeModal = () => {
    setSelectedCourse(null);
    setCourseDetails(null);
    setPrerequisiteChain(null);
  };

  // Transform technical courses to display format
  const transformTechnicalCourses = () => {
    console.log('transformTechnicalCourses - recommendations:', recommendations);
    console.log('transformTechnicalCourses - technical_courses:', recommendations?.technical_courses);
    console.log('transformTechnicalCourses - courses:', recommendations?.courses);
    
    // Handle both technical_courses (new format) and courses (fallback format)
    const courses = recommendations?.technical_courses || recommendations?.courses || [];
    
    console.log('transformTechnicalCourses - final courses array:', courses);
    console.log('transformTechnicalCourses - courses length:', courses.length);
    
    if (courses.length === 0) {
      console.warn('No courses found in recommendations response');
      return [];
    }

    return courses.map((rec, index) => {
      console.log(`Processing course ${index}:`, rec);
      
      // Handle different response formats
      // Technical recommender returns: course_code, title
      // Old recommender returns: code, name, course (nested)
      const courseCode = rec.course_code || rec.code || rec.course?.code || '';
      const courseName = rec.title || rec.course_name || rec.name || rec.course?.name || 'Course Name Not Available';
      const isRequired = rec.is_required !== undefined ? rec.is_required : (rec.course?.is_required || false);
      
      // If we still don't have a course code, log a warning
      if (!courseCode) {
        console.warn(`Course at index ${index} has no course code:`, rec);
      }
      
      const category = isRequired ? 'required' : 'elective';
      const priority = isRequired ? 'high' : 'medium';
      
      const transformed = {
        id: `tech-${index + 1}`,
        code: courseCode,
        name: courseName,
        credits: rec.credits || rec.course?.credits || 3,
        category,
        priority,
        reason: rec.reason || rec.reasoning || `Recommended (score: ${rec.final_score?.toFixed(2) || 'N/A'})`,
        prerequisites: rec.prerequisites || rec.course?.prerequisites || [],
        description: rec.description || rec.course?.description || '',
      };
      
      console.log(`Transformed course ${index}:`, transformed);
      return transformed;
    });
  };

  // Transform GenEd courses to display format
  const transformGenedCourses = () => {
    if (!recommendations?.gened) {
      return [];
    }

    return recommendations.gened.map((rec, index) => ({
      id: `gened-${index + 1}`,
      code: rec.course_code || rec.code || 'N/A',
      name: rec.course_name || rec.name || 'Course Name Not Available',
      credits: rec.credits || 3,
      category: 'gened',
      priority: 'medium',
      reason: rec.reason || rec.reasoning || 'Recommended GenEd course',
      gpa: rec.gpa || rec.avg_gpa || 'N/A',
      gened_categories: rec.gened_categories || [],
      description: rec.description || '',
    }));
  };

  // Transform clubs to display format
  const transformClubs = () => {
    if (!recommendations?.clubs) {
      return [];
    }

    return recommendations.clubs.map((rec, index) => ({
      id: `club-${index + 1}`,
      name: rec.name || rec.club_name || 'Club Name Not Available',
      description: rec.description || rec.desc || '',
      tags: rec.tags || [],
      category: 'club',
      priority: 'medium',
      reason: rec.reason || rec.reasoning || 'Recommended club based on your interests',
    }));
  };

  const technicalCourses = transformTechnicalCourses();
  const genedCourses = transformGenedCourses();
  const clubs = transformClubs();
  
  console.log('Rendered courses - technical:', technicalCourses.length, 'gened:', genedCourses.length, 'clubs:', clubs.length);
  
  const filteredTechnicalCourses = selectedCategory === 'all'
    ? technicalCourses
    : technicalCourses.filter(r => r.category === selectedCategory);

  // Show loading state
  if (loading) {
    return (
      <motion.div
        className="recommendations-page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="loading-container">
          <motion.div
            className="loading-spinner"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <h2>Loading Recommendations...</h2>
          <p>Analyzing your profile and generating personalized course suggestions</p>
        </div>
      </motion.div>
    );
  }

  // Show error state
  if (error || localError) {
    return (
      <motion.div
        className="recommendations-page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.header
          className="recommendations-header"
          variants={itemVariants}
        >
          <div className="header-content">
            <motion.button
              className="back-button"
              onClick={() => navigate('/onboarding')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ← Back
            </motion.button>
            <div className="header-text">
              <h1 className="page-title">Error Loading Recommendations</h1>
            </div>
          </div>
        </motion.header>
        
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>Something went wrong</h2>
          <p>{error || localError}</p>
          <motion.button
            className="btn btn-primary"
            onClick={handleRetry}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Try Again
          </motion.button>
          <motion.button
            className="btn btn-secondary"
            onClick={() => navigate('/onboarding')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{ marginTop: '1rem' }}
          >
            Update Profile
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="recommendations-page"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, transition: { duration: 0.3 } }}
    >
      {/* Header */}
      <motion.header
        className="recommendations-header"
        variants={itemVariants}
      >
        <div className="header-content">
          <motion.button
            className="back-button"
            onClick={() => navigate('/onboarding')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ← Back
          </motion.button>
          <div className="header-text">
            <h1 className="page-title">Your Recommendations</h1>
            <p className="page-subtitle">
              Personalized suggestions based on your profile
            </p>
          </div>
        </div>
      </motion.header>

      {/* Section Tabs */}
      <motion.div
        className="section-tabs"
        variants={itemVariants}
      >
        <div className="tab-buttons">
          {[
            { id: 'technical', label: 'Technical Courses', count: technicalCourses.length },
            { id: 'gened', label: 'GenEd Courses', count: genedCourses.length },
            { id: 'clubs', label: 'Clubs', count: clubs.length },
          ].map((tab) => (
            <motion.button
              key={tab.id}
              className={`tab-btn ${selectedSection === tab.id ? 'active' : ''}`}
              onClick={() => setSelectedSection(tab.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {tab.label} {tab.count > 0 && `(${tab.count})`}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Technical Courses Section */}
      {selectedSection === 'technical' && (
        <>
          {/* Filters for Technical Courses */}
          {technicalCourses.length > 0 && (
            <motion.div
              className="filters-container"
              variants={itemVariants}
            >
              <div className="filter-buttons">
                {[
                  { id: 'all', label: 'All Courses' },
                  { id: 'required', label: 'Required' },
                  { id: 'elective', label: 'Electives' },
                ].map((filter) => (
                  <motion.button
                    key={filter.id}
                    className={`filter-btn ${selectedCategory === filter.id ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(filter.id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {filter.label}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Technical Courses Grid */}
          <motion.div
            className="recommendations-container"
            variants={containerVariants}
          >
            <div className="recommendations-grid">
              {filteredTechnicalCourses.map((course, index) => (
            <motion.div
              key={course.id}
              className="recommendation-card"
              variants={itemVariants}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)' }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="card-header">
                <div className="course-code-badge">{course.code}</div>
                <div className={`priority-badge priority-${course.priority}`}>
                  {course.priority === 'high' ? 'High Priority' : 'Medium Priority'}
                </div>
              </div>
              <h3 className="course-name">{course.name}</h3>
              <div className="course-meta">
                <span className="credits">{course.credits} Credits</span>
                <span className={`category category-${course.category}`}>
                  {course.category === 'required' ? 'Required' : 'Elective'}
                </span>
              </div>
              <p className="course-reason">{course.reason}</p>
              {course.prerequisites && course.prerequisites.length > 0 && (
                <div className="prerequisites">
                  <span className="prereq-label">Prerequisites:</span>
                  <div className="prereq-tags">
                    {course.prerequisites.map((prereq) => (
                      <span key={prereq} className="prereq-tag">{prereq}</span>
                    ))}
                  </div>
                </div>
              )}
              <motion.button
                className="card-action-btn"
                onClick={() => handleViewDetails(course.code)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                View Details
              </motion.button>
            </motion.div>
          ))}
          
          {/* Empty State for Technical Courses */}
          {filteredTechnicalCourses.length === 0 && !loading && (
            <motion.div
              className="empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="empty-icon">📚</div>
              <h3>No technical course recommendations found</h3>
              <p>Try selecting a different category or update your profile</p>
              <motion.button
                className="btn btn-primary"
                onClick={() => navigate('/onboarding')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{ marginTop: '1rem' }}
              >
                Update Profile
              </motion.button>
            </motion.div>
          )}
        </div>
      </motion.div>
        </>
      )}

      {/* GenEd Courses Section */}
      {selectedSection === 'gened' && (
        <motion.div
          className="recommendations-container"
          variants={containerVariants}
        >
          <div className="recommendations-grid">
            {genedCourses.map((course, index) => (
              <motion.div
                key={course.id}
                className="recommendation-card"
                variants={itemVariants}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)' }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="card-header">
                  <div className="course-code-badge">{course.code}</div>
                  <div className="priority-badge priority-medium">GenEd</div>
                </div>
                <h3 className="course-name">{course.name}</h3>
                <div className="course-meta">
                  <span className="credits">{course.credits} Credits</span>
                  {course.gpa !== 'N/A' && (
                    <span className="gpa-badge">GPA: {course.gpa}</span>
                  )}
                </div>
                {course.gened_categories && course.gened_categories.length > 0 && (
                  <div className="gened-categories">
                    <span className="gened-label">Categories:</span>
                    <div className="gened-tags">
                      {course.gened_categories.map((cat) => (
                        <span key={cat} className="gened-tag">{cat}</span>
                      ))}
                    </div>
                  </div>
                )}
                <p className="course-reason">{course.reason}</p>
                <motion.button
                  className="card-action-btn"
                  onClick={() => handleViewDetails(course.code)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  View Details
                </motion.button>
              </motion.div>
            ))}
            {genedCourses.length === 0 && !loading && (
              <motion.div
                className="empty-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="empty-icon">📖</div>
                <h3>No GenEd recommendations found</h3>
                <p>Update your interests to get personalized GenEd suggestions</p>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}

      {/* Clubs Section */}
      {selectedSection === 'clubs' && (
        <motion.div
          className="recommendations-container"
          variants={containerVariants}
        >
          <div className="recommendations-grid">
            {clubs.map((club, index) => (
              <motion.div
                key={club.id}
                className="recommendation-card"
                variants={itemVariants}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)' }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="card-header">
                  <div className="course-code-badge">Club</div>
                  <div className="priority-badge priority-medium">Recommended</div>
                </div>
                <h3 className="course-name">{club.name}</h3>
                {club.tags && club.tags.length > 0 && (
                  <div className="club-tags">
                    {club.tags.map((tag) => (
                      <span key={tag} className="club-tag">{tag}</span>
                    ))}
                  </div>
                )}
                {club.description && (
                  <p className="course-reason">{club.description}</p>
                )}
                <motion.button
                  className="card-action-btn"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Learn More
                </motion.button>
              </motion.div>
            ))}
            {clubs.length === 0 && !loading && (
              <motion.div
                className="empty-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="empty-icon">🎯</div>
                <h3>No club recommendations found</h3>
                <p>Update your interests to get personalized club suggestions</p>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}

      {/* CTA Section */}
      <motion.section
        className="recommendations-cta"
        variants={itemVariants}
      >
        <div className="cta-content">
          <h2>Need More Help?</h2>
          <p>Contact your academic advisor or explore more options</p>
          <div className="cta-buttons">
            <motion.button
              className="btn btn-secondary"
              onClick={() => navigate('/onboarding')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Update Profile
            </motion.button>
            <motion.button
              className="btn btn-primary"
              onClick={() => navigate('/')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Back to Home
            </motion.button>
          </div>
        </div>
      </motion.section>

      {/* Course Details Modal */}
      <AnimatePresence>
        {selectedCourse && (
          <CourseDetailsModal
            courseCode={selectedCourse}
            courseDetails={courseDetails}
            prerequisiteChain={prerequisiteChain}
            loading={loadingDetails}
            onClose={closeModal}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function CourseDetailsModal({ courseCode, courseDetails, prerequisiteChain, loading, onClose }) {
  const modalVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.2 },
    },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  };

  const contentVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.3, ease: [0.6, -0.05, 0.01, 0.99] },
    },
    exit: { opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.2 } },
  };

  return (
    <motion.div
      className="modal-overlay"
      variants={modalVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onClick={onClose}
    >
      <motion.div
        className="modal-content"
        variants={contentVariants}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close-btn" onClick={onClose}>
          ×
        </button>

        {loading ? (
          <div className="modal-loading">
            <motion.div
              className="loading-spinner"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <p>Loading course details...</p>
          </div>
        ) : courseDetails ? (
          <>
            <div className="modal-header">
              <h2 className="modal-title">{courseCode}</h2>
              {courseDetails.name && (
                <h3 className="modal-subtitle">{courseDetails.name}</h3>
              )}
            </div>

            <div className="modal-body">
              {courseDetails.description && (
                <div className="modal-section">
                  <h4 className="modal-section-title">Description</h4>
                  <p className="modal-text">{courseDetails.description}</p>
                </div>
              )}

              <div className="modal-meta">
                {courseDetails.credits && (
                  <div className="meta-item">
                    <span className="meta-label">Credits:</span>
                    <span className="meta-value">{courseDetails.credits}</span>
                  </div>
                )}
                {courseDetails.gened_categories && courseDetails.gened_categories.length > 0 && (
                  <div className="meta-item">
                    <span className="meta-label">GenEd Categories:</span>
                    <div className="gened-tags">
                      {courseDetails.gened_categories.map((cat) => (
                        <span key={cat} className="gened-tag">{cat}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {courseDetails.prerequisites && courseDetails.prerequisites.length > 0 && (
                <div className="modal-section">
                  <h4 className="modal-section-title">Prerequisites</h4>
                  <div className="prereq-list">
                    {courseDetails.prerequisites.map((prereq, index) => (
                      <span key={index} className="prereq-tag">{prereq}</span>
                    ))}
                  </div>
                </div>
              )}

              {prerequisiteChain && prerequisiteChain.chain && prerequisiteChain.chain.length > 0 && (
                <div className="modal-section">
                  <h4 className="modal-section-title">Prerequisite Chain</h4>
                  <div className="prereq-chain">
                    {prerequisiteChain.chain.map((level, levelIndex) => (
                      <div key={levelIndex} className="prereq-level">
                        <span className="level-label">Level {levelIndex + 1}:</span>
                        <div className="level-courses">
                          {level.map((course, courseIndex) => (
                            <span key={courseIndex} className="chain-course">{course}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {courseDetails.postrequisites && courseDetails.postrequisites.length > 0 && (
                <div className="modal-section">
                  <h4 className="modal-section-title">Postrequisites (Unlocks)</h4>
                  <div className="prereq-list">
                    {courseDetails.postrequisites.map((postreq, index) => (
                      <span key={index} className="prereq-tag postreq">{postreq}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="modal-error">
            <p>Failed to load course details.</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default RecommendationsPage;
