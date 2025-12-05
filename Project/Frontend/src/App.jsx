import React, { useState, useEffect } from 'react';
import './App.css';
import DarsUpload from './components/DarsUpload';
import PreferenceScreen from './components/PreferenceScreen';
import Tinder from './TinderSwipe/Tinder';
import { uploadDars, getCombinedRecommendations, getMajors } from './services/api';

function App() {
  // Flow state
  const [screen, setScreen] = useState('dars-upload');
  
  // DARS data
  const [completedCourses, setCompletedCourses] = useState([]);
  
  // Preferences
  const [genedPreferences, setGenedPreferences] = useState({});
  const [clubPreferences, setClubPreferences] = useState({});
  const [coursePreferences, setCoursePreferences] = useState({});
  
  // Recommendations
  const [recommendations, setRecommendations] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Majors list
  const [majors, setMajors] = useState([]);

  // Load majors on mount
  useEffect(() => {
    const loadMajors = async () => {
      try {
        const majorsList = await getMajors();
        // Extract just the names if majors are objects with {name, url}
        const majorNames = majorsList.map(major => 
          typeof major === 'string' ? major : major.name
        );
        // Sort alphabetically
        majorNames.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
        setMajors(majorNames);
      } catch (err) {
        console.error('Failed to load majors:', err);
      }
    };
    loadMajors();
  }, []);

  const handleDarsUpload = (courses) => {
    setCompletedCourses(courses || []);
    setScreen('gened-preferences');
  };

  const handleDarsSkip = () => {
    setCompletedCourses([]);
    setScreen('gened-preferences');
  };

  const handleGenedPreferences = (prefs) => {
    setGenedPreferences(prefs || {});
    setScreen('club-preferences');
  };

  const handleGenedSkip = () => {
    setGenedPreferences({ genedInterests: '', genedPreferences: [], minGpa: 3.0, avoidSubjects: [] });
    setScreen('club-preferences');
  };

  const handleClubPreferences = (prefs) => {
    setClubPreferences(prefs || {});
    setScreen('course-preferences');
  };

  const handleClubSkip = () => {
    setClubPreferences({ clubInterests: '', preferredTags: [], avoidTags: [] });
    setScreen('course-preferences');
  };

  const handleCourseSkip = async () => {
    setCoursePreferences({ selectedMajor: '', courseInterests: '', preferFoundational: false, preferAdvanced: false });
    
    // Get combined recommendations with empty preferences
    try {
      setLoading(true);
      setError(null);
      
      const response = await getCombinedRecommendations({
        completed_courses: completedCourses,
        major_name: null,
        technical_interests: '',
        technical_prefer_foundational: false,
        technical_prefer_advanced: false,
        gened_interests: genedPreferences.genedInterests || '',
        gened_preferences: genedPreferences.genedPreferences || [],
        gened_min_gpa: genedPreferences.minGpa || 3.0,
        gened_avoid_subjects: genedPreferences.avoidSubjects || [],
        club_interests: clubPreferences.clubInterests || '',
        club_preferred_tags: clubPreferences.preferredTags || [],
        club_avoid_tags: clubPreferences.avoidTags || [],
        course_num_recommendations: 10,
        technical_topk: 20,
        gened_topk: 20,
        club_topk: 20,
      });
      
      setRecommendations(response);
      setScreen('tinder-swipe');
    } catch (err) {
      setError(err.message || 'Failed to get recommendations. Please try again.');
      console.error('Recommendations error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCoursePreferences = async (prefs) => {
    setCoursePreferences(prefs);
    
    // Get combined recommendations
    try {
      setLoading(true);
      setError(null);
      
      const response = await getCombinedRecommendations({
        completed_courses: completedCourses,
        major_name: prefs.selectedMajor || null,
        technical_interests: prefs.courseInterests || '',
        technical_prefer_foundational: prefs.preferFoundational || false,
        technical_prefer_advanced: prefs.preferAdvanced || false,
        gened_interests: genedPreferences.genedInterests || '',
        gened_preferences: genedPreferences.genedPreferences || [],
        gened_min_gpa: genedPreferences.minGpa || 3.0,
        gened_avoid_subjects: genedPreferences.avoidSubjects || [],
        club_interests: clubPreferences.clubInterests || '',
        club_preferred_tags: clubPreferences.preferredTags || [],
        club_avoid_tags: clubPreferences.avoidTags || [],
        course_num_recommendations: 10,
        technical_topk: 20,
        gened_topk: 20,
        club_topk: 20,
      });
      
      setRecommendations(response);
      setScreen('tinder-swipe');
    } catch (err) {
      setError(err.message || 'Failed to get recommendations. Please try again.');
      console.error('Recommendations error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTinderComplete = (results) => {
    // Handle completion - could show results or allow restart
    console.log('Tinder swipe completed:', results);
    // Optionally navigate to a results screen
  };

  const handleStartOver = () => {
    setScreen('dars-upload');
    setCompletedCourses([]);
    setGenedPreferences({});
    setClubPreferences({});
    setCoursePreferences({});
    setRecommendations({});
    setError(null);
  };

  return (
    <div className="app">
      {screen === 'dars-upload' && (
        <div className="screen-container">
          <DarsUpload 
            onUploadComplete={handleDarsUpload}
            onSkip={handleDarsSkip}
          />
        </div>
      )}

      {screen === 'gened-preferences' && (
        <div className="screen-container">
          <PreferenceScreen
            title="GenEd Preferences"
            subtitle="Tell us about your General Education course interests (optional)"
            type="gened"
            onContinue={handleGenedPreferences}
            onSkip={handleGenedSkip}
            onBack={() => setScreen('dars-upload')}
          />
        </div>
      )}

      {screen === 'club-preferences' && (
        <div className="screen-container">
          <PreferenceScreen
            title="Club & RSO Preferences"
            subtitle="What clubs and student organizations interest you? (optional)"
            type="clubs"
            onContinue={handleClubPreferences}
            onSkip={handleClubSkip}
            onBack={() => setScreen('gened-preferences')}
          />
        </div>
      )}

      {screen === 'course-preferences' && (
        <div className="screen-container">
          <PreferenceScreen
            title="Course Preferences"
            subtitle="Select your major to get personalized course recommendations (optional)"
            type="courses"
            onContinue={handleCoursePreferences}
            onSkip={handleCourseSkip}
            onBack={() => setScreen('club-preferences')}
            majors={majors}
          />
          {loading && (
            <div className="loading-overlay">
              <div className="loading">Getting recommendations...</div>
            </div>
          )}
          {error && (
            <div className="error-message" style={{ marginTop: '20px' }}>
              {error}
            </div>
          )}
        </div>
      )}

      {screen === 'tinder-swipe' && (
        <div className="screen-container" style={{ minHeight: '100vh', width: '100%' }}>
          {error && (
            <div className="error-message" style={{ margin: '20px auto', maxWidth: '600px' }}>
              <strong>Error:</strong> {error}
              <button
                onClick={handleStartOver}
                style={{
                  marginTop: '15px',
                  padding: '10px 20px',
                  backgroundColor: '#4a90e2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600'
                }}
              >
                Start Over
              </button>
            </div>
          )}
          {!error && (
            <>
              <Tinder 
                recommendations={recommendations}
                onComplete={handleTinderComplete}
              />
              <button
                className="start-over-button"
                onClick={handleStartOver}
                style={{
                  position: 'fixed',
                  bottom: '20px',
                  right: '20px',
                  padding: '12px 24px',
                  backgroundColor: '#4a90e2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                  zIndex: 1000,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                }}
              >
                Start Over
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
