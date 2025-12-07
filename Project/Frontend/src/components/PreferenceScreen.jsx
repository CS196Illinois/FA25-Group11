import React, { useState, useEffect } from 'react';
import './PreferenceScreen.css';

const PreferenceScreen = ({ 
  title, 
  subtitle, 
  type, // 'gened', 'clubs', or 'courses'
  onContinue,
  onBack,
  onSkip,
  majors = [],
  initialValues = {}
}) => {
  // GenEd state
  const [genedInterests, setGenedInterests] = useState(initialValues.genedInterests || '');
  const [genedPreferences, setGenedPreferences] = useState(initialValues.genedPreferences || []);
  const [minGpa, setMinGpa] = useState(initialValues.minGpa || 3.0);
  const [avoidSubjects, setAvoidSubjects] = useState(initialValues.avoidSubjects || []);
  const [subjectInput, setSubjectInput] = useState('');
  const [genedErrors, setGenedErrors] = useState({});

  // Club state
  const [clubInterests, setClubInterests] = useState(initialValues.clubInterests || '');
  const [preferredTags, setPreferredTags] = useState(initialValues.preferredTags || []);
  const [avoidTags, setAvoidTags] = useState(initialValues.avoidTags || []);
  const [tagInput, setTagInput] = useState('');
  const [avoidInput, setAvoidInput] = useState('');
  const [clubErrors, setClubErrors] = useState({});

  // Course state
  const [selectedMajor, setSelectedMajor] = useState(initialValues.selectedMajor || '');
  const [courseInterests, setCourseInterests] = useState(initialValues.courseInterests || '');
  const [preferFoundational, setPreferFoundational] = useState(initialValues.preferFoundational || false);
  const [preferAdvanced, setPreferAdvanced] = useState(initialValues.preferAdvanced || false);
  const [courseErrors, setCourseErrors] = useState({});

  // Update state when initialValues change
  useEffect(() => {
    if (type === 'gened' && initialValues) {
      if (initialValues.genedInterests !== undefined) setGenedInterests(initialValues.genedInterests);
      if (initialValues.genedPreferences !== undefined) setGenedPreferences(initialValues.genedPreferences);
      if (initialValues.minGpa !== undefined) setMinGpa(initialValues.minGpa);
      if (initialValues.avoidSubjects !== undefined) setAvoidSubjects(initialValues.avoidSubjects);
    } else if (type === 'clubs' && initialValues) {
      if (initialValues.clubInterests !== undefined) setClubInterests(initialValues.clubInterests);
      if (initialValues.preferredTags !== undefined) setPreferredTags(initialValues.preferredTags);
      if (initialValues.avoidTags !== undefined) setAvoidTags(initialValues.avoidTags);
    } else if (type === 'courses' && initialValues) {
      if (initialValues.selectedMajor !== undefined) setSelectedMajor(initialValues.selectedMajor);
      if (initialValues.courseInterests !== undefined) setCourseInterests(initialValues.courseInterests);
      if (initialValues.preferFoundational !== undefined) setPreferFoundational(initialValues.preferFoundational);
      if (initialValues.preferAdvanced !== undefined) setPreferAdvanced(initialValues.preferAdvanced);
    }
  }, [initialValues, type]);

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
    if (avoidSubjects.length >= 20) {
      setGenedErrors({ ...genedErrors, subjectInput: 'Maximum 20 subjects allowed' });
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
    if (tag.length < 2) {
      setClubErrors({ ...clubErrors, tagInput: 'Category name must be at least 2 characters' });
      return;
    }
    if (tag.length > 50) {
      setClubErrors({ ...clubErrors, tagInput: 'Category name must be 50 characters or less' });
      return;
    }
    if (preferredTags.includes(tag)) {
      setClubErrors({ ...clubErrors, tagInput: 'Category already added' });
      return;
    }
    if (preferredTags.length >= 15) {
      setClubErrors({ ...clubErrors, tagInput: 'Maximum 15 preferred categories allowed' });
      return;
    }
    // Allow any valid category name (format validation only)
    if (!/^[a-zA-Z0-9\s&'-]+$/.test(tag)) {
      setClubErrors({ ...clubErrors, tagInput: 'Category name can only contain letters, numbers, spaces, and special characters (&, -, \')' });
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
    if (tag.length < 2) {
      setClubErrors({ ...clubErrors, avoidInput: 'Category name must be at least 2 characters' });
      return;
    }
    if (tag.length > 50) {
      setClubErrors({ ...clubErrors, avoidInput: 'Category name must be 50 characters or less' });
      return;
    }
    if (avoidTags.includes(tag)) {
      setClubErrors({ ...clubErrors, avoidInput: 'Category already added' });
      return;
    }
    if (avoidTags.length >= 15) {
      setClubErrors({ ...clubErrors, avoidInput: 'Maximum 15 avoid categories allowed' });
      return;
    }
    // Allow any valid category name (format validation only)
    if (!/^[a-zA-Z0-9\s&'-]+$/.test(tag)) {
      setClubErrors({ ...clubErrors, avoidInput: 'Category name can only contain letters, numbers, spaces, and special characters (&, -, \')' });
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
      // Validate GPA
      if (isNaN(minGpa) || minGpa === null || minGpa === undefined || minGpa === '') {
        errors.minGpa = 'GPA is required';
      } else if (minGpa < 0 || minGpa > 4.0) {
        errors.minGpa = 'GPA must be between 0.0 and 4.0';
      } else if (minGpa % 0.01 !== 0 && minGpa % 0.1 !== 0) {
        // Allow up to 2 decimal places
        const rounded = Math.round(minGpa * 100) / 100;
        if (Math.abs(minGpa - rounded) > 0.001) {
          errors.minGpa = 'GPA can have up to 2 decimal places';
        }
      }
      
      // Validate interests length
      if (genedInterests.length > 500) {
        errors.genedInterests = 'Interests must be 500 characters or less';
      }
      
      // Validate avoid subjects count
      if (avoidSubjects.length > 20) {
        errors.avoidSubjects = 'Maximum 20 subjects allowed';
      }
    } else if (type === 'clubs') {
      // Validate interests length
      if (clubInterests.length > 500) {
        errors.clubInterests = 'Interests must be 500 characters or less';
      }
      
      // Validate preferred tags count
      if (preferredTags.length > 15) {
        errors.preferredTags = 'Maximum 15 preferred categories allowed';
      }
      
      // Validate avoid tags count
      if (avoidTags.length > 15) {
        errors.avoidTags = 'Maximum 15 avoid categories allowed';
      }
    } else if (type === 'courses') {
      // Validate course interests length
      if (courseInterests.length > 500) {
        errors.courseInterests = 'Interests must be 500 characters or less';
      }
    }
    
    return errors;
  };

  const handleContinue = () => {
    const errors = validateInputs();
    
    if (Object.keys(errors).length > 0) {
      if (type === 'gened') {
        setGenedErrors({ ...genedErrors, ...errors });
      } else if (type === 'clubs') {
        setClubErrors({ ...clubErrors, ...errors });
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
        selectedMajor: selectedMajor.trim(),
        courseInterests: courseInterests.trim(),
        preferFoundational,
        preferAdvanced
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
        defaultData = { selectedMajor: '', courseInterests: '', preferFoundational: false, preferAdvanced: false };
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
          onChange={(e) => {
            const value = e.target.value;
            if (value.length <= 500) {
              setGenedInterests(value);
              if (genedErrors.genedInterests) {
                setGenedErrors({ ...genedErrors, genedInterests: '' });
              }
            }
          }}
          placeholder="e.g., psychology, society, culture, politics, economics..."
          rows={3}
          maxLength={500}
          aria-invalid={!!genedErrors.genedInterests}
          aria-describedby={genedErrors.genedInterests ? "genedInterests-error" : undefined}
        />
        {genedErrors.genedInterests && (
          <span id="genedInterests-error" className="field-error" role="alert">
            {genedErrors.genedInterests}
          </span>
        )}
        <small>Describe what you're interested in learning about ({genedInterests.length}/500 characters)</small>
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
          step="0.01"
          value={minGpa}
          onChange={(e) => {
            const inputValue = e.target.value;
            // Allow empty input while typing
            if (inputValue === '') {
              setMinGpa('');
              if (genedErrors.minGpa) {
                setGenedErrors({ ...genedErrors, minGpa: '' });
              }
              return;
            }
            const value = parseFloat(inputValue);
            // Only update if it's a valid number
            if (!isNaN(value)) {
              // Clamp value between 0 and 4.0
              const clampedValue = Math.max(0, Math.min(4.0, value));
              setMinGpa(clampedValue);
              // Real-time validation
              if (clampedValue < 0 || clampedValue > 4.0) {
                setGenedErrors({ ...genedErrors, minGpa: 'GPA must be between 0.0 and 4.0' });
              } else if (genedErrors.minGpa) {
                setGenedErrors({ ...genedErrors, minGpa: '' });
              }
            }
          }}
          onBlur={(e) => {
            // Validate on blur if empty
            if (e.target.value === '' || isNaN(parseFloat(e.target.value))) {
              setMinGpa(3.0); // Reset to default
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
        <small>Only show courses with average GPA above this threshold (0.0 - 4.0, up to 2 decimal places)</small>
      </div>

      <div className="form-group">
        <label>Avoid Subjects (Optional)</label>
        <div className="subject-input-group">
          <input
            type="text"
            value={subjectInput}
            onChange={(e) => {
              // Only allow letters, auto-uppercase
              const value = e.target.value.replace(/[^A-Za-z]/g, '').toUpperCase();
              setSubjectInput(value);
              if (genedErrors.subjectInput) {
                setGenedErrors({ ...genedErrors, subjectInput: '' });
              }
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleAddAvoidSubject()}
            placeholder="e.g., BTW, CEE (press Enter to add)"
            maxLength={4}
            pattern="[A-Z]{2,4}"
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
        {genedErrors.avoidSubjects && (
          <span className="field-error" role="alert">
            {genedErrors.avoidSubjects}
          </span>
        )}
        <small>{avoidSubjects.length}/20 subjects added</small>
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
          onChange={(e) => {
            const value = e.target.value;
            if (value.length <= 500) {
              setClubInterests(value);
              if (clubErrors.clubInterests) {
                setClubErrors({ ...clubErrors, clubInterests: '' });
              }
            }
          }}
          placeholder="e.g., sports, technology, music, volunteering..."
          rows={3}
          maxLength={500}
          aria-invalid={!!clubErrors.clubInterests}
          aria-describedby={clubErrors.clubInterests ? "clubInterests-error" : undefined}
        />
        {clubErrors.clubInterests && (
          <span id="clubInterests-error" className="field-error" role="alert">
            {clubErrors.clubInterests}
          </span>
        )}
        <small>Describe what you're interested in (sports, tech, arts, etc.) ({clubInterests.length}/500 characters)</small>
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
        {clubErrors.preferredTags && (
          <span className="field-error" role="alert">
            {clubErrors.preferredTags}
          </span>
        )}
        <small>{preferredTags.length}/15 categories added</small>
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
        {clubErrors.avoidTags && (
          <span className="field-error" role="alert">
            {clubErrors.avoidTags}
          </span>
        )}
        <small>{avoidTags.length}/15 categories added</small>
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

      {selectedMajor && (
        <>
          <div className="form-group">
            <label htmlFor="courseInterests">Your Technical Interests</label>
            <textarea
              id="courseInterests"
              value={courseInterests}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= 500) {
                  setCourseInterests(value);
                  if (courseErrors.courseInterests) {
                    setCourseErrors({ ...courseErrors, courseInterests: '' });
                  }
                }
              }}
              placeholder="e.g., machine learning, artificial intelligence, algorithms, data structures..."
              rows={3}
              maxLength={500}
              aria-invalid={!!courseErrors.courseInterests}
              aria-describedby={courseErrors.courseInterests ? "courseInterests-error" : undefined}
            />
            {courseErrors.courseInterests && (
              <span id="courseInterests-error" className="field-error" role="alert">
                {courseErrors.courseInterests}
              </span>
            )}
            <small>Describe what technical topics you're interested in learning about ({courseInterests.length}/500 characters)</small>
          </div>

          <div className="form-group">
            <label>Course Preferences</label>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={preferFoundational}
                  onChange={(e) => setPreferFoundational(e.target.checked)}
                />
                <span>Prefer foundational courses (courses that unlock many others)</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={preferAdvanced}
                  onChange={(e) => setPreferAdvanced(e.target.checked)}
                />
                <span>Prefer advanced courses (400-level)</span>
              </label>
            </div>
            <small>Select your preferences for course recommendations (optional)</small>
          </div>
        </>
      )}
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

