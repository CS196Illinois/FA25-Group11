import React, { useState, useEffect } from 'react';
import './App.css';
import CollegeMajorScreen from './components/CollegeMajorScreen';
import CourseSelector from './components/CourseSelector';
import Recommendations from './components/Recommendations';
import ProgressBar from './components/ProgressBar';
import CourseDetails from './components/CourseDetails';
import SemesterPlan from './components/SemesterPlan';
import ClubRecommender from './components/ClubRecommender';
import GenedRecommender from './components/GenedRecommender';
import { getMajorCourses, getRecommendations } from './services/api';
import majorsByCollegeData from './majors_by_college.json';

function App() {
  const [screen, setScreen] = useState('college-major-selection');
  const [selectedCollege, setSelectedCollege] = useState('');
  const [selectedMajor, setSelectedMajor] = useState('');
  const [courses, setCourses] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [progress, setProgress] = useState({ completed: 0, total: 0, percentage: 0 });
  const [semesterPlan, setSemesterPlan] = useState(null);
  const [studentYear, setStudentYear] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCourseDetails, setSelectedCourseDetails] = useState(null);
  const [majorsByCollege, setMajorsByCollege] = useState({});

  const colleges = [
    { value: '', label: '-- Select College --' },
    { value: 'grainger', label: 'Grainger College of Engineering' },
    { value: 'las', label: 'College of Liberal Arts & Sciences' },
    { value: 'business', label: 'Gies College of Business' },
    { value: 'education', label: 'College of Education' },
    { value: 'faa', label: 'College of Fine & Applied Arts' },
    { value: 'aces', label: 'College of Agricultural, Consumer & Environmental Sciences' },
    { value: 'media', label: 'College of Media' },
    { value: 'ischool', label: 'School of Information Sciences' }
  ];


  const collegeKeyMap = {
    'engineering': 'grainger',
    'las': 'las',
    'bus': 'business',
    'education': 'education',
    'faa': 'faa',
    'aces': 'aces',
    'media': 'media',
    'ischool': 'ischool'
  };

  useEffect(() => {
    const processedMajors = {};
    
    Object.keys(majorsByCollegeData).forEach(jsonKey => {
      const frontendKey = collegeKeyMap[jsonKey];
      if (frontendKey && majorsByCollegeData[jsonKey].majors) {
        const uniqueMajors = new Map();
        majorsByCollegeData[jsonKey].majors.forEach(major => {
          if (!uniqueMajors.has(major.major_name)) {
            uniqueMajors.set(major.major_name, major);
          }
        });
        
        const majorsList = [
          { value: '', label: '-- Select Major --' },
          ...Array.from(uniqueMajors.values()).map(major => ({
            value: major.major_name,
            label: major.major_name
          }))
        ];
        
        processedMajors[frontendKey] = majorsList;
      }
    });
    
    colleges.forEach(college => {
      if (college.value && !processedMajors[college.value]) {
        processedMajors[college.value] = [{ value: '', label: '-- Select Major --' }];
      }
    });
    
    setMajorsByCollege(processedMajors);
  }, []);

  const majors = selectedCollege ? (majorsByCollege[selectedCollege] || [{ value: '', label: '-- Select Major --' }]) : [{ value: '', label: '-- Select College First --' }];

  useEffect(() => {
    if (selectedCollege) {
      setSelectedMajor('');
    }
  }, [selectedCollege]);

  const loadMajorCourses = async () => {
    if (!selectedMajor) {
      setError('Please select a major first.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getMajorCourses(selectedMajor);
      
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
      
      const { validateAndNormalizeCourses } = await import('./utils/validation.js');
      const normalizedCourses = validateAndNormalizeCourses(selectedCourses);
      
      if (normalizedCourses.length === 0) {
        setError('Please select valid course codes.');
        setLoading(false);
        return;
      }
      
      const response = await getRecommendations(selectedMajor, normalizedCourses, 10);
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

  const handleContinueFromCollegeMajor = async () => {
    await loadMajorCourses();
    if (courses.length > 0 || selectedMajor) {
      setScreen('welcome');
    }
  };

  return (
    <div className="app">
      {screen === 'college-major-selection' && (
        <CollegeMajorScreen
          colleges={colleges}
          majors={majors}
          selectedCollege={selectedCollege}
          setSelectedCollege={setSelectedCollege}
          selectedMajor={selectedMajor}
          setSelectedMajor={setSelectedMajor}
          onContinue={handleContinueFromCollegeMajor}
        />
      )}

      {screen === 'welcome' && (
        <div className="screen-container">
          <div className="welcome-screen">
            <h1 className="welcome-title">UIUC Recommendation System</h1>
            <p className="welcome-subtitle">Get personalized recommendations for courses, clubs, and GenEd courses</p>
            {selectedMajor && (
              <p className="selected-major-display">Selected Major: <strong>{selectedMajor}</strong></p>
            )}
            <div className="welcome-options">
              <button
                className="option-button course-button"
                onClick={() => setScreen('course-selection')}
              >
                <span className="option-icon">📚</span>
                <span className="option-title">Course Recommendations</span>
                <span className="option-desc">Based on your major and completed courses</span>
              </button>
              <button
                className="option-button club-button"
                onClick={() => setScreen('club-recommender')}
              >
                <span className="option-icon">🎯</span>
                <span className="option-title">Club Recommendations</span>
                <span className="option-desc">Find student organizations that match your interests</span>
              </button>
              <button
                className="option-button gened-button"
                onClick={() => setScreen('gened-recommender')}
              >
                <span className="option-icon">🎓</span>
                <span className="option-title">GenEd Recommendations</span>
                <span className="option-desc">Discover General Education courses for you</span>
              </button>
            </div>
            <button
              className="back-button"
              onClick={() => setScreen('college-major-selection')}
              style={{ marginTop: '20px' }}
            >
              Change College/Major
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

      {screen === 'club-recommender' && (
        <div className="screen-container">
          <div className="course-selection-screen">
            <ClubRecommender onBack={() => setScreen('welcome')} />
          </div>
        </div>
      )}

      {screen === 'gened-recommender' && (
        <div className="screen-container">
          <div className="course-selection-screen">
            <GenedRecommender onBack={() => setScreen('welcome')} />
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
