import React from 'react';
import './Recommendations.css';

const Recommendations = ({ recommendations, onCourseClick }) => {
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="recommendations-empty">
        <p>No recommendations available. Try selecting some completed courses!</p>
        <p className="empty-hint">You may have completed all required courses, or need to complete more prerequisites.</p>
      </div>
    );
  }

  return (
    <div className="recommendations">
      <h2 className="recommendations-title">Recommended Courses</h2>
      <p className="recommendations-subtitle">Click any course to see more details</p>
      <div className="recommendations-grid">
        {recommendations.map((rec, index) => (
          <div
            key={rec.course_code}
            className="recommendation-card"
            onClick={() => onCourseClick && onCourseClick(rec.course_code)}
          >
            <div className="recommendation-header">
              <span className="recommendation-number">#{index + 1}</span>
              <span className="recommendation-code">{rec.course_code}</span>
            </div>
            <h3 className="recommendation-name">{rec.name}</h3>
            <div className="recommendation-details">
              <span className="recommendation-credits">{rec.credits} credits</span>
            </div>
            <div className="recommendation-reason">
              <span className="reason-label">Why:</span>
              <span className="reason-text">{rec.reason}</span>
            </div>
            {rec.prerequisites_met && (
              <div className="prereq-status">
                ✓ Prerequisites satisfied
              </div>
            )}
            {rec.missing_prerequisites && rec.missing_prerequisites.length > 0 && (
              <div className="missing-prereq-status">
                ⚠ Missing: {rec.missing_prerequisites.join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Recommendations;

