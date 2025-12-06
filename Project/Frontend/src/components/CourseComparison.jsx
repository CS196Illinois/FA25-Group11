import React, { useState, useEffect } from 'react';
import { getCourseDetails } from '../services/api';
import './CourseComparison.css';

const CourseComparison = ({ items, onClose }) => {
  const [courseDetails, setCourseDetails] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDetails = async () => {
      setLoading(true);
      const details = {};
      for (const item of items) {
        if (item.type === 'technical' || item.type === 'course' || item.type === 'gened') {
          try {
            const data = await getCourseDetails(item.code);
            details[item.code] = data;
          } catch (err) {
            console.error(`Failed to load details for ${item.code}:`, err);
            details[item.code] = null;
          }
        }
      }
      setCourseDetails(details);
      setLoading(false);
    };

    if (items.length > 0) {
      loadDetails();
    }
  }, [items]);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="comparison-overlay" onClick={onClose}>
      <div className="comparison-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>×</button>
        <h2>Course Comparison</h2>
        
        {loading ? (
          <div className="comparison-loading">Loading course details...</div>
        ) : (
          <div className="comparison-table">
            <div className="comparison-header">
              <div className="comparison-cell header">Property</div>
              {items.map(item => (
                <div key={item.code} className="comparison-cell header">
                  <div className="course-code-header">{item.code}</div>
                  <div className="course-name-header">{item.name}</div>
                </div>
              ))}
            </div>
            
            <div className="comparison-row">
              <div className="comparison-cell label">Type</div>
              {items.map(item => (
                <div key={item.code} className="comparison-cell">
                  {item.type}
                </div>
              ))}
            </div>

            {items.some(item => courseDetails[item.code]?.credits) && (
              <div className="comparison-row">
                <div className="comparison-cell label">Credits</div>
                {items.map(item => (
                  <div key={item.code} className="comparison-cell">
                    {courseDetails[item.code]?.credits || 'N/A'}
                  </div>
                ))}
              </div>
            )}

            {items.some(item => courseDetails[item.code]?.prerequisites?.length > 0) && (
              <div className="comparison-row">
                <div className="comparison-cell label">Prerequisites</div>
                {items.map(item => (
                  <div key={item.code} className="comparison-cell">
                    {courseDetails[item.code]?.prerequisites?.length > 0 ? (
                      <div className="prereq-list">
                        {courseDetails[item.code].prerequisites.map((prereq, idx) => (
                          <span key={idx} className="prereq-tag">{prereq}</span>
                        ))}
                      </div>
                    ) : (
                      'None'
                    )}
                  </div>
                ))}
              </div>
            )}

            {items.some(item => courseDetails[item.code]?.postrequisites?.length > 0) && (
              <div className="comparison-row">
                <div className="comparison-cell label">Unlocks</div>
                {items.map(item => (
                  <div key={item.code} className="comparison-cell">
                    {courseDetails[item.code]?.postrequisites?.length > 0 ? (
                      <div className="postreq-count">
                        {courseDetails[item.code].postrequisites.length} courses
                      </div>
                    ) : (
                      'None'
                    )}
                  </div>
                ))}
              </div>
            )}

            {items.some(item => courseDetails[item.code]?.description) && (
              <div className="comparison-row">
                <div className="comparison-cell label">Description</div>
                {items.map(item => (
                  <div key={item.code} className="comparison-cell">
                    <div className="description-text">
                      {courseDetails[item.code]?.description || 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseComparison;

