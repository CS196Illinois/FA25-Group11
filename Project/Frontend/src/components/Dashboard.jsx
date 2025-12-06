import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const context = useContext(AppContext);
  
  if (!context) {
    return <div>Loading...</div>;
  }
  
  const { savedPlans, resetState } = context;

  const handleGetStarted = () => {
    resetState();
    navigate('/onboarding/dars');
  };

  const handleContinue = () => {
    navigate('/onboarding/dars');
  };

  const handleViewPlan = (planId) => {
    navigate(`/plans/${planId}`);
  };

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        <h1 className="dashboard-title">UIUC Course Recommender</h1>
        <p className="dashboard-subtitle">
          Get personalized course, GenEd, and club recommendations based on your interests and completed courses
        </p>

        <div className="dashboard-actions">
          <button className="primary-button" onClick={handleGetStarted}>
            Get Started
          </button>
          <button className="secondary-button" onClick={handleContinue}>
            Continue Setup
          </button>
        </div>

        {savedPlans.length > 0 && (
          <div className="dashboard-saved-plans">
            <h2>Your Saved Plans</h2>
            <div className="plans-grid">
              {savedPlans.slice(0, 3).map(plan => (
                <div key={plan.id} className="plan-card" onClick={() => handleViewPlan(plan.id)}>
                  <h3>{plan.name || 'Untitled Plan'}</h3>
                  <p className="plan-date">
                    {new Date(plan.createdAt).toLocaleDateString()}
                  </p>
                  <p className="plan-stats">
                    {plan.likedItems?.length || 0} items saved
                  </p>
                </div>
              ))}
            </div>
            {savedPlans.length > 3 && (
              <button className="view-all-button" onClick={() => navigate('/plans')}>
                View All Plans ({savedPlans.length})
              </button>
            )}
          </div>
        )}

        <div className="dashboard-features">
          <h2>Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📚</div>
              <h3>Course Recommendations</h3>
              <p>Get personalized course suggestions based on your major and completed courses</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎓</div>
              <h3>GenEd Suggestions</h3>
              <p>Find General Education courses that match your interests and GPA preferences</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>Club Matching</h3>
              <p>Discover student organizations and clubs that align with your interests</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💾</div>
              <h3>Save & Compare</h3>
              <p>Save your favorite recommendations and compare different options</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

