import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import PreferenceScreen from '../components/PreferenceScreen';
import ProgressIndicator from '../components/ProgressIndicator';

const OnboardingClubs = () => {
  const navigate = useNavigate();
  const { clubPreferences, setClubPreferences, setCurrentStep } = useContext(AppContext);

  const handleContinue = (prefs) => {
    setClubPreferences(prefs || {});
    setCurrentStep('courses');
    navigate('/onboarding/courses');
  };

  const handleSkip = () => {
    setClubPreferences({ clubInterests: '', preferredTags: [], avoidTags: [] });
    setCurrentStep('courses');
    navigate('/onboarding/courses');
  };

  const handleBack = () => {
    navigate('/onboarding/gened');
  };

  return (
    <div className="screen-container">
      <ProgressIndicator currentStep="clubs" />
      <PreferenceScreen
        title="Club & RSO Preferences"
        subtitle="What clubs and student organizations interest you? (optional)"
        type="clubs"
        onContinue={handleContinue}
        onSkip={handleSkip}
        onBack={handleBack}
        initialValues={clubPreferences}
      />
    </div>
  );
};

export default OnboardingClubs;

