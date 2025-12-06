import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import DarsUpload from '../components/DarsUpload';

const OnboardingDars = () => {
  const navigate = useNavigate();
  const { setCompletedCourses, setCurrentStep } = useContext(AppContext);

  const handleUploadComplete = (courses) => {
    setCompletedCourses(courses || []);
    setCurrentStep('gened');
    navigate('/onboarding/gened');
  };

  const handleSkip = () => {
    setCompletedCourses([]);
    setCurrentStep('gened');
    navigate('/onboarding/gened');
  };

  return (
    <div className="screen-container">
      <DarsUpload 
        onUploadComplete={handleUploadComplete}
        onSkip={handleSkip}
      />
    </div>
  );
};

export default OnboardingDars;

