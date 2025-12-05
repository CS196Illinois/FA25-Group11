import React, { useState } from 'react';
import './PreferenceScreen.css';

const PreferenceScreen = ({ 
  title, 
  subtitle, 
  type, // 'gened', 'clubs', or 'courses'
  onContinue,
  onBack,
  onSkip,
  majors = []
}) => {
  // GenEd state
  const [genedInterests, setGenedInterests] = useState('');
  const [genedPreferences, setGenedPreferences] = useState([]);
  const [minGpa, setMinGpa] = useState(3.0);
  const [avoidSubjects, setAvoidSubjects] = useState([]);
  const [subjectInput, setSubjectInput] = useState('');
  const [genedErrors, setGenedErrors] = useState({});

  // Club state
  const [clubInterests, setClubInterests] = useState('');
  const [preferredTags, setPreferredTags] = useState([]);
  const [avoidTags, setAvoidTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [avoidInput, setAvoidInput] = useState('');
  const [clubErrors, setClubErrors] = useState({});

  // Course state
  const [selectedMajor, setSelectedMajor] = useState('');
  const [courseErrors, setCourseErrors] = useState({});

  const availableGenedCategories = [
    'ACP', 'CS', 'COMP1', 'HUM', 'NAT', 'QR', 'SBS', 'US', 'WCC', 'NW'
  ];

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

  // GenEd handlers
  const handleToggleGened = (category) => {
    if (genedPreferences.includes(category)) {
      setGenedPreferences(genedPreferences.filter(c => c !== category));
    } else {
      setGenedPreferences([...genedPreferences, category]);
    }
  };

  const handleAddAvoidSubject = () => {
    const subject = subjectInput.trim().toUpperCase();
    if (!subject) {
      setGenedErrors({ ...genedErrors, subjectInput: 'Please enter a subject code' });
      return;
    }
    if (subject.length < 2 || subject.length > 4) {
      setGenedErrors({ ...genedErrors, subjectInput: 'Subject code must be 2-4 characters' });
      return;
    }
    if (!/^[A-Z]+$/.test(subject)) {
      setGenedErrors({ ...genedErrors, subjectInput: 'Subject code must contain only letters' });
      return;
    }
    if (avoidSubjects.includes(subject)) {
      setGenedErrors({ ...genedErrors, subjectInput: 'Subject already added' });
      return;
    }
    setAvoidSubjects([...avoidSubjects, subject]);
    setSubjectInput('');
    setGenedErrors({ ...genedErrors, subjectInput: '' });
  };

  const handleRemoveAvoidSubject = (subject) => {
    setAvoidSubjects(avoidSubjects.filter(s => s !== subject));
  };

  // Club handlers
  const handleAddPreferredTag = () => {
    const tag = tagInput.trim();
    if (!tag) {
      setClubErrors({ ...clubErrors, tagInput: 'Please enter a category' });
      return;
    }
    if (preferredTags.includes(tag)) {
      setClubErrors({ ...clubErrors, tagInput: 'Category already added' });
      return;
    }
    setPreferredTags([...preferredTags, tag]);
    setTagInput('');
    setClubErrors({ ...clubErrors, tagInput: '' });
  };

  const handleRemovePreferredTag = (tag) => {
    setPreferredTags(preferredTags.filter(t => t !== tag));
  };

  const handleAddAvoidTag = () => {
    const tag = avoidInput.trim();
    if (!tag) {
      setClubErrors({ ...clubErrors, avoidInput: 'Please enter a category' });
      return;
    }
    if (avoidTags.includes(tag)) {
      setClubErrors({ ...clubErrors, avoidInput: 'Category already added' });
      return;
    }
    setAvoidTags([...avoidTags, tag]);
    setAvoidInput('');
    setClubErrors({ ...clubErrors, avoidInput: '' });
  };

  const handleRemoveAvoidTag = (tag) => {
    setAvoidTags(avoidTags.filter(t => t !== tag));
  };

  const validateInputs = () => {
    const errors = {};
    
    if (type === 'gened') {
      if (minGpa < 0 || minGpa > 4.0) {
        errors.minGpa = 'GPA must be between 0 and 4.0';
      }
    } else if (type === 'courses') {
      // Major is optional, no validation needed
    }
    
    return errors;
  };

  const handleContinue = () => {
    const errors = validateInputs();
    
    if (Object.keys(errors).length > 0) {
      if (type === 'gened') {
        setGenedErrors({ ...genedErrors, ...errors });
      } else if (type === 'courses') {
        setCourseErrors({ ...courseErrors, ...errors });
      }
      return;
    }
    
    let data = {};
    
    if (type === 'gened') {
      data = {
        genedInterests: genedInterests.trim(),
        genedPreferences,
        minGpa: Math.max(0, Math.min(4.0, minGpa)),
        avoidSubjects
      };
    } else if (type === 'clubs') {
      data = {
        clubInterests: clubInterests.trim(),
        preferredTags,
        avoidTags
      };
    } else if (type === 'courses') {
      data = {
        selectedMajor: selectedMajor.trim()
      };
    }
    
    onContinue(data);
  };

  const handleSkip = () => {
    if (onSkip) {
      let defaultData = {};
      if (type === 'gened') {
        defaultData = { genedInterests: '', genedPreferences: [], minGpa: 3.0, avoidSubjects: [] };
      } else if (type === 'clubs') {
        defaultData = { clubInterests: '', preferredTags: [], avoidTags: [] };
      } else if (type === 'courses') {
        defaultData = { selectedMajor: '' };
      }
      onSkip(defaultData);
    }
  };

  const renderGenedForm = () => (
    <div className="preference-form">
      <div className="form-group">
        <label htmlFor="interests">Your Interests</label>
        <textarea
          id="interests"
          value={genedInterests}
          onChange={(e) => setGenedInterests(e.target.value)}
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
          onChange={(e) => {
            const value = parseFloat(e.target.value) || 0;
            setMinGpa(value);
            if (genedErrors.minGpa) {
              setGenedErrors({ ...genedErrors, minGpa: '' });
            }
          }}
          aria-invalid={!!genedErrors.minGpa}
          aria-describedby={genedErrors.minGpa ? "minGpa-error" : undefined}
        />
        {genedErrors.minGpa && (
          <span id="minGpa-error" className="field-error" role="alert">
            {genedErrors.minGpa}
          </span>
        )}
        <small>Only show courses with average GPA above this threshold (0.0 - 4.0)</small>
      </div>

      <div className="form-group">
        <label>Avoid Subjects (Optional)</label>
        <div className="subject-input-group">
          <input
            type="text"
            value={subjectInput}
            onChange={(e) => {
              setSubjectInput(e.target.value.toUpperCase());
              if (genedErrors.subjectInput) {
                setGenedErrors({ ...genedErrors, subjectInput: '' });
              }
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleAddAvoidSubject()}
            placeholder="e.g., BTW, CEE (press Enter to add)"
            maxLength={4}
            aria-invalid={!!genedErrors.subjectInput}
            aria-describedby={genedErrors.subjectInput ? "subjectInput-error" : undefined}
          />
          {genedErrors.subjectInput && (
            <span id="subjectInput-error" className="field-error" role="alert">
              {genedErrors.subjectInput}
            </span>
          )}
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
    </div>
  );

  const renderClubForm = () => (
    <div className="preference-form">
      <div className="form-group">
        <label htmlFor="interests">Your Interests</label>
        <textarea
          id="interests"
          value={clubInterests}
          onChange={(e) => setClubInterests(e.target.value)}
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
            onChange={(e) => {
              setTagInput(e.target.value);
              if (clubErrors.tagInput) {
                setClubErrors({ ...clubErrors, tagInput: '' });
              }
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleAddPreferredTag()}
            placeholder="Type a category and press Enter"
            list="available-tags"
            aria-invalid={!!clubErrors.tagInput}
            aria-describedby={clubErrors.tagInput ? "tagInput-error" : undefined}
          />
          {clubErrors.tagInput && (
            <span id="tagInput-error" className="field-error" role="alert">
              {clubErrors.tagInput}
            </span>
          )}
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
            onChange={(e) => {
              setAvoidInput(e.target.value);
              if (clubErrors.avoidInput) {
                setClubErrors({ ...clubErrors, avoidInput: '' });
              }
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleAddAvoidTag()}
            placeholder="Type a category to avoid"
            aria-invalid={!!clubErrors.avoidInput}
            aria-describedby={clubErrors.avoidInput ? "avoidInput-error" : undefined}
          />
          {clubErrors.avoidInput && (
            <span id="avoidInput-error" className="field-error" role="alert">
              {clubErrors.avoidInput}
            </span>
          )}
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
    </div>
  );

  const renderCourseForm = () => (
    <div className="preference-form">
      <div className="form-group">
        <label htmlFor="major">Select Your Major (Optional)</label>
        <select
          id="major"
          value={selectedMajor}
          onChange={(e) => setSelectedMajor(e.target.value)}
        >
          <option value="">-- Select Major (Optional) --</option>
          {majors.map(major => (
            <option key={major} value={major}>{major}</option>
          ))}
        </select>
        <small>Select your major to get course recommendations tailored to your degree requirements</small>
      </div>
    </div>
  );

  return (
    <div className="preference-screen">
      <h1 className="screen-title">{title}</h1>
      <p className="screen-subtitle">{subtitle}</p>

      {type === 'gened' && renderGenedForm()}
      {type === 'clubs' && renderClubForm()}
      {type === 'courses' && renderCourseForm()}

      <div className="action-buttons">
        {onBack && (
          <button className="back-button" onClick={onBack} aria-label="Go back to previous screen">
            Back
          </button>
        )}
        {onSkip && (
          <button className="skip-button" onClick={handleSkip} aria-label="Skip this step">
            Skip
          </button>
        )}
        <button className="continue-button" onClick={handleContinue} aria-label="Continue to next screen">
          Continue
        </button>
      </div>
    </div>
  );
};

export default PreferenceScreen;

