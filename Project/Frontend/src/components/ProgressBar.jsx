import React from 'react';
import './ProgressBar.css';

const ProgressBar = ({ progress }) => {
  const percentage = progress?.percentage || 0;
  const completed = progress?.completed || 0;
  const total = progress?.total || 0;

  return (
    <div className="progress-container">
      <div className="progress-header">
        <h3>Degree Progress</h3>
        <span className="progress-text">
          {completed} / {total} courses ({percentage.toFixed(1)}%)
        </span>
      </div>
      <div className="progress-bar-wrapper">
        <div 
          className="progress-bar-fill"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        >
          <span className="progress-percentage">{percentage.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;

