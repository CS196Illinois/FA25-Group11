import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ProgressIndicator.css';

const ProgressIndicator = ({ currentStep }) => {
  const navigate = useNavigate();

  const steps = [
    { id: 'dars', label: 'DARS Upload', path: '/onboarding/dars' },
    { id: 'gened', label: 'GenEd', path: '/onboarding/gened' },
    { id: 'clubs', label: 'Clubs', path: '/onboarding/clubs' },
    { id: 'courses', label: 'Courses', path: '/onboarding/courses' }
  ];

  const currentIndex = steps.findIndex(step => step.id === currentStep);

  const handleStepClick = (step) => {
    navigate(step.path);
  };

  return (
    <div className="progress-indicator">
      <div className="progress-steps">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = index < currentIndex;
          const isClickable = index <= currentIndex;

          return (
            <div
              key={step.id}
              className={`progress-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isClickable ? 'clickable' : ''}`}
              onClick={isClickable ? () => handleStepClick(step) : undefined}
            >
              <div className="step-circle">
                {isCompleted ? '✓' : index + 1}
              </div>
              <div className="step-label">{step.label}</div>
              {index < steps.length - 1 && (
                <div className={`step-connector ${isCompleted ? 'completed' : ''}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressIndicator;

