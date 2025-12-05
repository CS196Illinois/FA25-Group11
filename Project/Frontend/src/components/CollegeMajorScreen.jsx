import React from 'react';
import './CollegeMajorScreen.css';

export default function CollegeMajorScreen({
  colleges = [],
  majors = [],
  selectedCollege,
  setSelectedCollege,
  selectedMajor,
  setSelectedMajor,
  onContinue
}) {
  return (
    <div className="college-major-screen-container">
      <div className="college-major-screen">
        <h1 className="screen-title">Select Your College & Major</h1>
        <div className="dropdown-group">
          <label htmlFor="college-select" className="dropdown-label">College</label>
          <select
            id="college-select"
            value={selectedCollege}
            onChange={e => setSelectedCollege(e.target.value)}
            className="dropdown-select"
          >
            {colleges.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="dropdown-group">
          <label htmlFor="major-select" className="dropdown-label">Major</label>
          <select
            id="major-select"
            value={selectedMajor}
            onChange={e => setSelectedMajor(e.target.value)}
            className="dropdown-select"
          >
            {majors.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <button
          className="continue-button"
          onClick={onContinue}
          disabled={!selectedCollege || !selectedMajor}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
