import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import PreferenceScreen from '../components/PreferenceScreen';
import ProgressIndicator from '../components/ProgressIndicator';
import { getCombinedRecommendations } from '../services/api';

const OnboardingCourses = () => {
  const navigate = useNavigate();
  const { 
    completedCourses, 
    genedPreferences, 
    clubPreferences,
    coursePreferences,
    setCoursePreferences, 
    setRecommendations,
    loading,
    setLoading,
    error,
    setError,
    majors 
  } = useContext(AppContext);

  const handleContinue = async (prefs) => {
    setCoursePreferences(prefs);
    
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
      navigate('/recommendations');
    } catch (err) {
      setError(err.message || 'Failed to get recommendations. Please try again.');
      console.error('Recommendations error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setCoursePreferences({ selectedMajor: '', courseInterests: '', preferFoundational: false, preferAdvanced: false });
    
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
      navigate('/recommendations');
    } catch (err) {
      setError(err.message || 'Failed to get recommendations. Please try again.');
      console.error('Recommendations error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/onboarding/clubs');
  };

  return (
    <div className="screen-container">
      <ProgressIndicator currentStep="courses" />
      <PreferenceScreen
        title="Course Preferences"
        subtitle="Select your major to get personalized course recommendations (optional)"
        type="courses"
        onContinue={handleContinue}
        onSkip={handleSkip}
        onBack={handleBack}
        majors={majors}
        initialValues={coursePreferences}
      />
      {loading && (
        <div className="loading-overlay">
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Getting recommendations...</p>
          </div>
        </div>
      )}
      {error && (
        <div className="error-message" style={{ marginTop: '20px', maxWidth: '800px', marginLeft: 'auto', marginRight: 'auto' }}>
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
};

export default OnboardingCourses;

