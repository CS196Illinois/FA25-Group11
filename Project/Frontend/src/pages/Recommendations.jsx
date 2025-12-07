import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import Tinder from '../TinderSwipe/Tinder';

const Recommendations = () => {
  const navigate = useNavigate();
  const { recommendations, error, loading, resetState } = useContext(AppContext);

  const handleComplete = (results) => {
    // Results are already saved to context in Tinder component
    navigate('/results');
  };

  if (loading) {
    return (
      <div className="screen-container" style={{ minHeight: '100vh', width: '100%' }}>
        <div className="loading-overlay">
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Getting recommendations...</p>
          </div>
        </div>
      </div>
    );
  }

  const handleStartOver = () => {
    resetState();
    navigate('/');
  };

  if (error) {
    return (
      <div className="screen-container" style={{ minHeight: '100vh', width: '100%' }}>
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
      </div>
    );
  }

  return (
    <div className="screen-container" style={{ minHeight: '100vh', width: '100%' }}>
      <Tinder 
        recommendations={recommendations}
        onComplete={handleComplete}
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
    </div>
  );
};

export default Recommendations;

