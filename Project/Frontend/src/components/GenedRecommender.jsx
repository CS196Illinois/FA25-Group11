import React, { useState } from 'react';
import { getGenedRecommendations } from '../services/api';
import './GenedRecommender.css';

const GenedRecommender = ({ onBack }) => {
  const [interests, setInterests] = useState('');
  const [genedPreferences, setGenedPreferences] = useState([]);
  const [minGpa, setMinGpa] = useState(3.0);
  const [avoidSubjects, setAvoidSubjects] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [subjectInput, setSubjectInput] = useState('');

  const availableGenedCategories = [
    'ACP', 'CS', 'COMP1', 'HUM', 'NAT', 'QR', 'SBS', 'US', 'WCC', 'NW'
  ];

  const handleToggleGened = (category) => {
    if (genedPreferences.includes(category)) {
      setGenedPreferences(genedPreferences.filter(c => c !== category));
    } else {
      setGenedPreferences([...genedPreferences, category]);
    }
  };

  const handleAddAvoidSubject = () => {
    if (subjectInput.trim() && !avoidSubjects.includes(subjectInput.trim().toUpperCase())) {
      setAvoidSubjects([...avoidSubjects, subjectInput.trim().toUpperCase()]);
      setSubjectInput('');
    }
  };

  const handleRemoveAvoidSubject = (subject) => {
    setAvoidSubjects(avoidSubjects.filter(s => s !== subject));
  };

  const handleGetRecommendations = async () => {
    if (!interests.trim() && genedPreferences.length === 0) {
      setError('Please enter interests or select GenEd preferences.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await getGenedRecommendations({
        interests: interests,
        gened_preferences: genedPreferences,
        min_gpa: minGpa,
        avoid_subjects: avoidSubjects,
        topk: 20
      });
      
      setRecommendations(response.recommendations || []);
    } catch (err) {
      setError(err.message || 'Failed to get GenEd recommendations. Please try again.');
      console.error('GenEd recommendations error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gened-recommender">
      <h1 className="screen-title">GenEd Course Recommendations</h1>
      <p className="screen-subtitle">
        Find General Education courses that match your interests and preferences!
      </p>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="gened-form">
        <div className="form-group">
          <label htmlFor="interests">Your Interests</label>
          <textarea
            id="interests"
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            placeholder="e.g., psychology, society, culture, politics, economics..."
            rows={3}
          />
          <small>Describe what you're interested in learning about</small>
        </div>

        <div className="form-group">
          <label>Preferred GenEd Categories</label>
          <div className="gened-category-grid">
            {availableGenedCategories.map(category => (
              <button
                key={category}
                type="button"
                className={`gened-category-button ${genedPreferences.includes(category) ? 'active' : ''}`}
                onClick={() => handleToggleGened(category)}
              >
                {category}
              </button>
            ))}
          </div>
          <small>Select categories you'd like to fulfill (optional)</small>
        </div>

        <div className="form-group">
          <label htmlFor="minGpa">Minimum GPA</label>
          <input
            id="minGpa"
            type="number"
            min="0"
            max="4.0"
            step="0.1"
            value={minGpa}
            onChange={(e) => setMinGpa(parseFloat(e.target.value) || 0)}
          />
          <small>Only show courses with average GPA above this threshold</small>
        </div>

        <div className="form-group">
          <label>Avoid Subjects (Optional)</label>
          <div className="subject-input-group">
            <input
              type="text"
              value={subjectInput}
              onChange={(e) => setSubjectInput(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && handleAddAvoidSubject()}
              placeholder="e.g., BTW, CEE (press Enter to add)"
              maxLength={4}
            />
            <button
              type="button"
              onClick={handleAddAvoidSubject}
              className="add-subject-button"
            >
              Add
            </button>
          </div>
          <div className="subject-list">
            {avoidSubjects.map(subject => (
              <span key={subject} className="subject-tag">
                {subject}
                <button
                  type="button"
                  onClick={() => handleRemoveAvoidSubject(subject)}
                  className="remove-tag"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="action-buttons">
          <button
            className="back-button"
            onClick={onBack}
          >
            Back
          </button>
          <button
            className="recommend-button"
            onClick={handleGetRecommendations}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Get Recommendations'}
          </button>
        </div>
      </div>

      {recommendations.length > 0 && (
        <div className="gened-recommendations">
          <h2>Recommended GenEd Courses</h2>
          <div className="gened-grid">
            {recommendations.map((course, index) => (
              <div key={index} className="gened-card">
                <div className="gened-header">
                  <span className="gened-number">#{index + 1}</span>
                  <span className="gened-score">Score: {course.score.toFixed(3)}</span>
                </div>
                <div className="gened-code-title">
                  <span className="gened-code">{course.course_code}</span>
                  <h3 className="gened-title">{course.title}</h3>
                </div>
                <div className="gened-details">
                  {course.gened && (
                    <div className="gened-categories">
                      <strong>GenEd:</strong> {course.gened}
                    </div>
                  )}
                  {course.gpa > 0 && (
                    <div className="gened-gpa">
                      <strong>Avg GPA:</strong> {course.gpa.toFixed(2)}
                    </div>
                  )}
                  {course.tags && (
                    <div className="gened-tags">
                      <strong>Tags:</strong> {course.tags}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GenedRecommender;

