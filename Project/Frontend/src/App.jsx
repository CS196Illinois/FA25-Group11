import React, { useState, useEffect } from 'react';
import './App.css';
import CourseSelector from './components/CourseSelector';
import Recommendations from './components/Recommendations';
import ProgressBar from './components/ProgressBar';
import CourseDetails from './components/CourseDetails';
import SemesterPlan from './components/SemesterPlan';
import { getMajorCourses, getRecommendations } from './services/api';

const MAJOR_NAME = 'Computer Science, BS';

function App() {
  const [screen, setScreen] = useState('welcome');
  const [courses, setCourses] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [progress, setProgress] = useState({ completed: 0, total: 0, percentage: 0 });
  const [semesterPlan, setSemesterPlan] = useState(null);
  const [studentYear, setStudentYear] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCourseDetails, setSelectedCourseDetails] = useState(null);

  // Load courses when component mounts
  useEffect(() => {
    loadMajorCourses();
  }, []);

  const loadMajorCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMajorCourses(MAJOR_NAME);
      
      // Combine required and elective courses
      const allCourses = [
        ...(data.required || []),
        ...(data.electives || [])
      ];
      
      if (allCourses.length === 0) {
        setError('No courses found for this major.');
      } else {
        setCourses(allCourses);
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to load courses. Please check if the backend server is running.';
      setError(errorMessage);
      console.error('Load courses error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGetRecommendations = async () => {
    if (selectedCourses.length === 0) {
      setError('Please select at least one completed course.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Validate course codes before sending
      const { validateAndNormalizeCourses } = await import('./utils/validation.js');
      const normalizedCourses = validateAndNormalizeCourses(selectedCourses);
      
      if (normalizedCourses.length === 0) {
        setError('Please select valid course codes.');
        setLoading(false);
        return;
      }
      
      const response = await getRecommendations(MAJOR_NAME, normalizedCourses, 10);
      setRecommendations(response.recommendations || []);
      setProgress(response.progress || { completed: 0, total: 0, percentage: 0 });
      setSemesterPlan(response.semester_plan || null);
      setStudentYear(response.student_year || null);
      setScreen('recommendations');
    } catch (err) {
      const errorMessage = err.message || 'Failed to get recommendations. Please try again.';
      setError(errorMessage);
      console.error('Recommendations error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseClick = (courseCode) => {
    setSelectedCourseDetails(courseCode);
  };

  const handleCloseDetails = () => {
    setSelectedCourseDetails(null);
  };

  return (
    <div className="app">
      {screen === 'welcome' && (
        <div className="screen-container">
          <div className="welcome-screen">
            <h1 className="welcome-title">UIUC Course Recommendation System</h1>
            <p className="welcome-subtitle">Get personalized course recommendations for Computer Science</p>
            <button 
              className="start-button"
              onClick={() => setScreen('course-selection')}
            >
              Get Started
            </button>
          </div>
        </div>
      )}

      {screen === 'course-selection' && (
        <div className="screen-container">
          <div className="course-selection-screen">
            <h1 className="screen-title">Select Completed Courses</h1>
            <p className="screen-subtitle">
              Select all courses you have already completed. We'll recommend what to take next!
            </p>
            
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {loading && courses.length === 0 ? (
              <div className="loading">Loading courses...</div>
            ) : (
              <>
                {courses.length > 0 ? (
                  <>
                    <CourseSelector
                      courses={courses}
                      selectedCourses={selectedCourses}
                      onSelectionChange={setSelectedCourses}
                    />
                    
                    <div className="action-buttons">
                      <button
                        className="back-button"
                        onClick={() => setScreen('welcome')}
                      >
                        Back
                      </button>
                      <button
                        className="recommend-button"
                        onClick={handleGetRecommendations}
                        disabled={loading || selectedCourses.length === 0}
                      >
                        {loading ? 'Loading...' : `Get Recommendations (${selectedCourses.length} selected)`}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="no-courses">
                    <p>No courses found for this major.</p>
                    <button
                      className="back-button"
                      onClick={() => setScreen('welcome')}
                    >
                      Back
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {screen === 'recommendations' && (
        <div className="screen-container">
          <div className="recommendations-screen">
            <h1 className="screen-title">Your Recommendations</h1>
            
            {studentYear && (
              <div className="year-indicator">
                Detected: {studentYear.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Student
              </div>
            )}
            
            <ProgressBar progress={progress} />
            
            {semesterPlan && (
              <SemesterPlan 
                semesterPlan={semesterPlan}
                studentYear={studentYear}
              />
            )}
            
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <Recommendations
              recommendations={recommendations}
              onCourseClick={handleCourseClick}
            />

            <div className="action-buttons">
              <button
                className="back-button"
                onClick={() => setScreen('course-selection')}
              >
                Change Selection
              </button>
              <button
                className="new-search-button"
                onClick={() => {
                  setSelectedCourses([]);
                  setRecommendations([]);
                  setProgress({ completed: 0, total: 0, percentage: 0 });
                  setSemesterPlan(null);
                  setStudentYear(null);
                  setScreen('course-selection');
                }}
              >
                Start Over
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedCourseDetails && (
        <CourseDetails
          courseCode={selectedCourseDetails}
          onClose={handleCloseDetails}
        />
      )}
    </div>
  );
}

export default App;
