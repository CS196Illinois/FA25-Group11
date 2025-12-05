import React, { useState } from 'react';
import { getClubRecommendations } from '../services/api';
import './ClubRecommender.css';

const ClubRecommender = ({ onBack }) => {
  const [interests, setInterests] = useState('');
  const [preferredTags, setPreferredTags] = useState([]);
  const [avoidTags, setAvoidTags] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tagInput, setTagInput] = useState('');
  const [avoidInput, setAvoidInput] = useState('');

  const availableTags = [
    'Athletic & Recreation', 'Club Sports', 'Business', 'Engineering & Mathematics',
    'Media Arts', 'Performance Arts', 'Community Service & Philanthropy',
    'Social & Leisure', 'Technology', 'Information & Data Sciences',
    'Life & Physical Sciences', 'Social & Behavioral Sciences',
    'Identity & Culture', 'International', 'Health & Wellness',
    'Advocacy & Activism', 'Education', 'Faith', 'Religion & Spirituality',
    'Social Fraternities & Sororities', 'Environmental & Sustainability',
    'Ideology & Politics', 'Law'
  ];

  const handleAddPreferredTag = () => {
    if (tagInput.trim() && !preferredTags.includes(tagInput.trim())) {
      setPreferredTags([...preferredTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemovePreferredTag = (tag) => {
    setPreferredTags(preferredTags.filter(t => t !== tag));
  };

  const handleAddAvoidTag = () => {
    if (avoidInput.trim() && !avoidTags.includes(avoidInput.trim())) {
      setAvoidTags([...avoidTags, avoidInput.trim()]);
      setAvoidInput('');
    }
  };

  const handleRemoveAvoidTag = (tag) => {
    setAvoidTags(avoidTags.filter(t => t !== tag));
  };

  const handleGetRecommendations = async () => {
    if (!interests.trim() && preferredTags.length === 0) {
      setError('Please enter interests or select preferred tags.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await getClubRecommendations({
        interests: interests,
        preferred_tags: preferredTags,
        avoid_tags: avoidTags,
        topk: 20
      });
      
      setRecommendations(response.recommendations || []);
    } catch (err) {
      setError(err.message || 'Failed to get club recommendations. Please try again.');
      console.error('Club recommendations error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="club-recommender">
      <h1 className="screen-title">Club Recommendations</h1>
      <p className="screen-subtitle">
        Discover student organizations that match your interests!
      </p>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="club-form">
        <div className="form-group">
          <label htmlFor="interests">Your Interests</label>
          <textarea
            id="interests"
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            placeholder="e.g., sports, technology, music, volunteering..."
            rows={3}
          />
          <small>Describe what you're interested in (sports, tech, arts, etc.)</small>
        </div>

        <div className="form-group">
          <label>Preferred Categories (Optional)</label>
          <div className="tag-input-group">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddPreferredTag()}
              placeholder="Type a category and press Enter"
              list="available-tags"
            />
            <datalist id="available-tags">
              {availableTags.map(tag => (
                <option key={tag} value={tag} />
              ))}
            </datalist>
            <button
              type="button"
              onClick={handleAddPreferredTag}
              className="add-tag-button"
            >
              Add
            </button>
          </div>
          <div className="tag-list">
            {preferredTags.map(tag => (
              <span key={tag} className="tag">
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemovePreferredTag(tag)}
                  className="remove-tag"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Avoid Categories (Optional)</label>
          <div className="tag-input-group">
            <input
              type="text"
              value={avoidInput}
              onChange={(e) => setAvoidInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddAvoidTag()}
              placeholder="Type a category to avoid"
              list="available-tags"
            />
            <button
              type="button"
              onClick={handleAddAvoidTag}
              className="add-tag-button"
            >
              Add
            </button>
          </div>
          <div className="tag-list">
            {avoidTags.map(tag => (
              <span key={tag} className="tag avoid-tag">
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveAvoidTag(tag)}
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
        <div className="club-recommendations">
          <h2>Recommended Clubs</h2>
          <div className="club-grid">
            {recommendations.map((club, index) => (
              <div key={index} className="club-card">
                <div className="club-header">
                  <span className="club-number">#{index + 1}</span>
                  <span className="club-score">Score: {club.score.toFixed(3)}</span>
                </div>
                <h3 className="club-title">{club.title}</h3>
                {club.mission && (
                  <p className="club-mission">{club.mission.substring(0, 150)}...</p>
                )}
                {club.tags && (
                  <div className="club-tags">
                    <strong>Categories:</strong> {club.tags}
                  </div>
                )}
                {club.website && (
                  <a
                    href={club.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="club-website"
                  >
                    Visit Website →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubRecommender;

