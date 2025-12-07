// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { getMajors, getCourseDetails, uploadDars } from '../services/api';
import './OnboardingPage.css';

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

const stepVariants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
};

function OnboardingPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Welcome!',
      subtitle: 'Let\'s get to know you better',
      content: (
        <WelcomeStep
          onNext={() => setCurrentStep(1)}
        />
      ),
    },
    {
      title: 'Select Your Major',
      subtitle: 'Choose your academic program',
      content: (
        <MajorStep
          onNext={() => setCurrentStep(2)}
          onBack={() => setCurrentStep(0)}
        />
      ),
    },
    {
      title: 'Academic Year',
      subtitle: 'What year are you?',
      content: (
        <YearStep
          onNext={() => setCurrentStep(3)}
          onBack={() => setCurrentStep(1)}
        />
      ),
    },
    {
      title: 'Completed Courses',
      subtitle: 'Tell us what you\'ve already taken',
      content: (
        <CoursesStep
          onNext={() => setCurrentStep(4)}
          onBack={() => setCurrentStep(2)}
        />
      ),
    },
    {
      title: 'Interests (Optional)',
      subtitle: 'Help us personalize your recommendations',
      content: (
        <InterestsStep
          onNext={() => setCurrentStep(5)}
          onBack={() => setCurrentStep(3)}
        />
      ),
    },
    {
      title: 'Almost Done!',
      subtitle: 'Review and get your recommendations',
      content: (
        <ReviewStep
          onNext={() => {
            console.log('ReviewStep onNext called - navigating to /recommendations');
            navigate('/recommendations');
          }}
          onBack={() => setCurrentStep(4)}
        />
      ),
    },
  ];

  return (
    <motion.div
      className="onboarding-page"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.4 }}
    >
      <div className="onboarding-container">
        {/* Progress Bar */}
        <div className="progress-container">
          <div className="progress-bar">
            <motion.div
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>
          <div className="progress-steps">
            {steps.map((_, index) => (
              <motion.div
                key={index}
                className={`progress-step ${index <= currentStep ? 'active' : ''}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                {index + 1}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="step-container">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="step-content"
            >
              <motion.h1
                className="step-title"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {steps[currentStep].title}
              </motion.h1>
              <motion.p
                className="step-subtitle"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {steps[currentStep].subtitle}
              </motion.p>
              {steps[currentStep].content}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function WelcomeStep({ onNext }) {
  return (
    <motion.div
      className="welcome-step"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      <div className="welcome-content">
        <motion.div
          className="welcome-icon"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.4 }}
        >
          🎓
        </motion.div>
        <motion.p
          className="welcome-text"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          We're excited to help you plan your academic journey at the University of Illinois!
        </motion.p>
        <motion.button
          className="btn btn-primary btn-large"
          onClick={onNext}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          Let's Get Started
        </motion.button>
      </div>
    </motion.div>
  );
}

function MajorStep({ onNext, onBack }) {
  const { formData, updateFormData } = useAppContext();
  const [majors, setMajors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMajors = async () => {
      try {
        setLoading(true);
        setError(null);
        const majorsList = await getMajors();
        setMajors(majorsList);
      } catch (err) {
        setError(err.message || 'Failed to load majors');
        console.error('Error fetching majors:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMajors();
  }, []);

  const handleMajorSelect = (majorName) => {
    updateFormData({ major: majorName });
  };

  return (
    <motion.div
      className="major-step"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      <div className="input-group">
        <label>Select Your Major</label>
        {loading && <div className="loading-text">Loading majors...</div>}
        {error && <div className="error-text">{error}</div>}
        {!loading && !error && (
          <div className="major-grid">
            {majors.length > 0 ? (
              majors.map((major, index) => (
                <motion.button
                  key={major.name}
                  className={`major-card ${formData.major === major.name ? 'selected' : ''}`}
                  onClick={() => handleMajorSelect(major.name)}
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {major.name}
                </motion.button>
              ))
            ) : (
              <div className="empty-state">No majors available</div>
            )}
          </div>
        )}
      </div>
      <div className="step-actions">
        <motion.button
          className="btn btn-secondary"
          onClick={onBack}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Back
        </motion.button>
        <motion.button
          className="btn btn-primary"
          onClick={onNext}
          disabled={!formData.major || loading}
          whileHover={{ scale: formData.major && !loading ? 1.05 : 1 }}
          whileTap={{ scale: formData.major && !loading ? 0.95 : 1 }}
        >
          Next
        </motion.button>
      </div>
    </motion.div>
  );
}

function YearStep({ onNext, onBack }) {
  const { formData, updateFormData } = useAppContext();
  
  const years = [
    { value: 'freshman', label: 'Freshman' },
    { value: 'sophomore', label: 'Sophomore' },
    { value: 'junior', label: 'Junior' },
    { value: 'senior', label: 'Senior' },
  ];

  return (
    <motion.div
      className="year-step"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      <div className="input-group">
        <label>Select Your Academic Year</label>
        <div className="year-grid">
          {years.map((year, index) => (
            <motion.button
              key={year.value}
              className={`year-card ${formData.year === year.value ? 'selected' : ''}`}
              onClick={() => updateFormData({ year: year.value })}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              {year.label}
            </motion.button>
          ))}
        </div>
      </div>
      <div className="step-actions">
        <motion.button
          className="btn btn-secondary"
          onClick={onBack}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Back
        </motion.button>
        <motion.button
          className="btn btn-primary"
          onClick={onNext}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Next
        </motion.button>
      </div>
    </motion.div>
  );
}

function CoursesStep({ onNext, onBack }) {
  const { formData, updateFormData } = useAppContext();
  const [courseInput, setCourseInput] = useState('');
  const [validating, setValidating] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [uploadMode, setUploadMode] = useState('manual'); // 'manual' or 'dars'
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const validateCourse = async (courseCode) => {
    try {
      setValidating(true);
      setValidationError(null);
      // Try to fetch course details - if it exists, it's valid
      await getCourseDetails(courseCode.trim());
      return true;
    } catch {
      setValidationError(`Course "${courseCode}" not found. Please check the course code.`);
      return false;
    } finally {
      setValidating(false);
    }
  };

  const addCourse = async () => {
    const trimmedCourse = courseInput.trim().toUpperCase();
    
    if (!trimmedCourse) return;
    
    if (formData.completedCourses.includes(trimmedCourse)) {
      setValidationError(`Course "${trimmedCourse}" is already added.`);
      return;
    }

    // Validate course exists
    const isValid = await validateCourse(trimmedCourse);
    
    if (isValid) {
      updateFormData({
        completedCourses: [...formData.completedCourses, trimmedCourse],
      });
      setCourseInput('');
      setValidationError(null);
    }
  };

  const removeCourse = (course) => {
    updateFormData({
      completedCourses: formData.completedCourses.filter((c) => c !== course),
    });
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.pdf')) {
      setUploadError('Please upload a PDF file.');
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);
      setUploadSuccess(false);

      const result = await uploadDars(file);
      
      if (result.courses && Array.isArray(result.courses)) {
        // Merge with existing courses, avoiding duplicates
        const newCourses = result.courses.filter(
          (course) => !formData.completedCourses.includes(course.toUpperCase())
        );
        const normalizedCourses = newCourses.map((c) => c.toUpperCase());
        
        updateFormData({
          completedCourses: [...formData.completedCourses, ...normalizedCourses],
        });
        
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      } else {
        setUploadError('No courses found in the DARS file.');
      }
    } catch (error) {
      setUploadError(error.message || 'Failed to upload DARS file. Please try again.');
      console.error('DARS upload error:', error);
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  return (
    <motion.div
      className="courses-step"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      <div className="input-group">
        <label>Add Completed Courses</label>
        
        {/* Mode Toggle */}
        <div className="upload-mode-toggle">
          <motion.button
            className={`mode-btn ${uploadMode === 'manual' ? 'active' : ''}`}
            onClick={() => {
              setUploadMode('manual');
              setUploadError(null);
              setValidationError(null);
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Manual Entry
          </motion.button>
          <motion.button
            className={`mode-btn ${uploadMode === 'dars' ? 'active' : ''}`}
            onClick={() => {
              setUploadMode('dars');
              setUploadError(null);
              setValidationError(null);
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Upload DARS PDF
          </motion.button>
        </div>

        {/* Manual Entry Mode */}
        {uploadMode === 'manual' && (
          <>
            <div className="course-input-group">
              <input
                type="text"
                placeholder="e.g., CS 124, MATH 220"
                value={courseInput}
                onChange={(e) => {
                  setCourseInput(e.target.value);
                  setValidationError(null);
                }}
                onKeyPress={(e) => e.key === 'Enter' && !validating && addCourse()}
                className="course-input"
                disabled={validating}
              />
              <motion.button
                className="btn btn-primary"
                onClick={addCourse}
                disabled={validating || !courseInput.trim()}
                whileHover={{ scale: validating ? 1 : 1.05 }}
                whileTap={{ scale: validating ? 1 : 0.95 }}
              >
                {validating ? 'Validating...' : 'Add'}
              </motion.button>
            </div>
            {validationError && (
              <div className="error-text" style={{ marginTop: '0.5rem' }}>
                {validationError}
              </div>
            )}
          </>
        )}

        {/* DARS Upload Mode */}
        {uploadMode === 'dars' && (
          <div className="dars-upload-container">
            <div className="dars-upload-box">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                id="dars-file-input"
                className="dars-file-input"
                disabled={uploading}
              />
              <label htmlFor="dars-file-input" className="dars-upload-label">
                {uploading ? (
                  <>
                    <motion.div
                      className="upload-spinner"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <span>Uploading and parsing DARS...</span>
                  </>
                ) : (
                  <>
                    <span className="upload-icon">📄</span>
                    <span>Click to upload your DARS PDF</span>
                    <span className="upload-hint">or drag and drop</span>
                  </>
                )}
              </label>
            </div>
            {uploadError && (
              <div className="error-text" style={{ marginTop: '0.5rem' }}>
                {uploadError}
              </div>
            )}
            {uploadSuccess && (
              <motion.div
                className="success-text"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                ✓ Courses successfully imported from DARS!
              </motion.div>
            )}
            <p className="help-text" style={{ marginTop: '0.5rem' }}>
              Upload your DARS PDF to automatically import all completed courses. You can also manually add courses after uploading.
            </p>
          </div>
        )}

        {/* Course List (shown in both modes) */}
        <div className="course-list-section">
          <label style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>
            Completed Courses ({formData.completedCourses.length})
          </label>
          <div className="course-list">
            <AnimatePresence>
              {formData.completedCourses.length > 0 ? (
                formData.completedCourses.map((course, index) => (
                  <motion.div
                    key={course}
                    className="course-tag"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    {course}
                    <button
                      onClick={() => removeCourse(course)}
                      className="remove-btn"
                    >
                      ×
                    </button>
                  </motion.div>
                ))
              ) : (
                <div className="empty-course-list">No courses added yet</div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      <div className="step-actions">
        <motion.button
          className="btn btn-secondary"
          onClick={onBack}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Back
        </motion.button>
        <motion.button
          className="btn btn-primary"
          onClick={onNext}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Next
        </motion.button>
      </div>
    </motion.div>
  );
}

function InterestsStep({ onNext, onBack }) {
  const { formData, updateFormData } = useAppContext();
  
  const interestOptions = [
    'Machine Learning',
    'Web Development',
    'Mobile Development',
    'Cybersecurity',
    'Data Science',
    'Software Engineering',
    'Computer Graphics',
    'Game Development',
    'Networks',
    'Systems',
    'Theory',
    'Other',
  ];

  const toggleInterest = (interest) => {
    const currentInterests = formData.interests || [];
    if (currentInterests.includes(interest)) {
      updateFormData({
        interests: currentInterests.filter((i) => i !== interest),
      });
    } else {
      updateFormData({
        interests: [...currentInterests, interest],
      });
    }
  };

  return (
    <motion.div
      className="interests-step"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      <div className="input-group">
        <label>Select Your Interests (Optional)</label>
        <p className="help-text">This helps us personalize your recommendations</p>
        <div className="interests-grid">
          {interestOptions.map((interest, index) => (
            <motion.button
              key={interest}
              className={`interest-card ${(formData.interests || []).includes(interest) ? 'selected' : ''}`}
              onClick={() => toggleInterest(interest)}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              {interest}
            </motion.button>
          ))}
        </div>
      </div>
      <div className="step-actions">
        <motion.button
          className="btn btn-secondary"
          onClick={onBack}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Back
        </motion.button>
        <motion.button
          className="btn btn-primary"
          onClick={onNext}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Next
        </motion.button>
      </div>
    </motion.div>
  );
}

function ReviewStep({ onNext, onBack }) {
  const { formData } = useAppContext();
  
  const yearLabels = {
    freshman: 'Freshman',
    sophomore: 'Sophomore',
    junior: 'Junior',
    senior: 'Senior',
  };

  return (
    <motion.div
      className="review-step"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      <div className="review-content">
        <div className="review-item">
          <span className="review-label">Major:</span>
          <span className="review-value">{formData.major || 'Not selected'}</span>
        </div>
        <div className="review-item">
          <span className="review-label">Academic Year:</span>
          <span className="review-value">{yearLabels[formData.year] || 'Not selected'}</span>
        </div>
        <div className="review-item">
          <span className="review-label">Completed Courses:</span>
          <div className="review-courses">
            {formData.completedCourses.length > 0 ? (
              formData.completedCourses.map((course) => (
                <span key={course} className="review-course-tag">
                  {course}
                </span>
              ))
            ) : (
              <span className="review-empty">No courses added</span>
            )}
          </div>
        </div>
        {formData.interests && formData.interests.length > 0 && (
          <div className="review-item">
            <span className="review-label">Interests:</span>
            <div className="review-interests">
              {formData.interests.map((interest) => (
                <span key={interest} className="review-interest-tag">
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="step-actions">
        <motion.button
          className="btn btn-secondary"
          onClick={onBack}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Back
        </motion.button>
        <motion.button
          className="btn btn-primary btn-large"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('Get Recommendations button clicked');
            console.log('Form data:', formData);
            console.log('Major:', formData.major);
            console.log('Completed courses:', formData.completedCourses);
            console.log('Button disabled?', !formData.major || formData.completedCourses.length === 0);
            
            const isDisabled = !formData.major || formData.completedCourses.length === 0;
            if (isDisabled) {
              console.warn('Button is disabled - missing required data');
              alert(`Please complete all required fields:\n- Major: ${formData.major ? '✓' : '✗'}\n- Completed Courses: ${formData.completedCourses.length > 0 ? '✓' : '✗'}`);
              return;
            }
            
            console.log('Calling onNext to navigate to recommendations');
            try {
              onNext();
            } catch (error) {
              console.error('Error navigating to recommendations:', error);
              alert('Error navigating to recommendations page. Please try again.');
            }
          }}
          disabled={!formData.major || formData.completedCourses.length === 0}
          style={{ 
            cursor: (!formData.major || formData.completedCourses.length === 0) ? 'not-allowed' : 'pointer',
            opacity: (!formData.major || formData.completedCourses.length === 0) ? 0.6 : 1
          }}
          whileHover={{ 
            scale: (formData.major && formData.completedCourses.length > 0) ? 1.05 : 1,
            boxShadow: (formData.major && formData.completedCourses.length > 0) ? '0 20px 40px rgba(255, 107, 53, 0.3)' : 'none'
          }}
          whileTap={{ scale: 0.95 }}
        >
          Get Recommendations
        </motion.button>
      </div>
    </motion.div>
  );
}

export default OnboardingPage;
