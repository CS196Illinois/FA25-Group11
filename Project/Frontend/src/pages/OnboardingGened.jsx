import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import PreferenceScreen from '../components/PreferenceScreen';
import ProgressIndicator from '../components/ProgressIndicator';

const OnboardingGened = () => {
  const navigate = useNavigate();
  const { genedPreferences, setGenedPreferences, setCurrentStep } = useContext(AppContext);

  const handleContinue = (prefs) => {
    setGenedPreferences(prefs || {});
    setCurrentStep('clubs');
    navigate('/onboarding/clubs');
  };

  const handleSkip = () => {
    setGenedPreferences({ genedInterests: '', genedPreferences: [], minGpa: 3.0, avoidSubjects: [] });
    setCurrentStep('clubs');
    navigate('/onboarding/clubs');
  };

  const handleBack = () => {
    navigate('/onboarding/dars');
  };

  return (
    <div className="screen-container">
      <ProgressIndicator currentStep="gened" />
      <PreferenceScreen
        title="GenEd Preferences"
        subtitle="Tell us about your General Education course interests (optional)"
        type="gened"
        onContinue={handleContinue}
        onSkip={handleSkip}
        onBack={handleBack}
        initialValues={genedPreferences}
      />
    </div>
  );
};

export default OnboardingGened;

