import React, { useState, useEffect } from 'react';
import { getCourseDetails } from '../services/api';
import './CourseDetails.css';

const CourseDetails = ({ courseCode, onClose }) => {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (courseCode) {
      loadCourseDetails();
    }
  }, [courseCode]);

  const loadCourseDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCourseDetails(courseCode);
      setCourse(data);
    } catch (err) {
      const errorMessage = err.message || 'Failed to load course details';
      setError(errorMessage);
      console.error('Course details error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!courseCode) {
    return null;
  }

  return (
    <div className="course-details-overlay" onClick={onClose}>
      <div className="course-details-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>×</button>
        
        {loading && (
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Loading course details...</p>
          </div>
        )}
        {error && (
          <div className="error">
            <strong>Error:</strong> {error}
            <button className="retry-button" onClick={loadCourseDetails}>
              Retry
            </button>
          </div>
        )}
        
        {course && (
          <div className="course-details-content">
            <h2 className="course-details-code">{course.course_code}</h2>
            <h3 className="course-details-name">{course.name}</h3>
            
            <div className="course-details-meta">
              <div className="meta-item">
                <span className="meta-label">Credits</span>
                <span className="meta-value">{course.credits || 'N/A'}</span>
              </div>
              {course.course_code && (
                <div className="meta-item">
                  <span className="meta-label">Level</span>
                  <span className="meta-value">
                    {(() => {
                      const match = course.course_code.match(/\d+/);
                      if (match && match[0]) {
                        return match[0][0] + '00-level';
                      }
                      return 'N/A';
                    })()}
                  </span>
                </div>
              )}
            </div>
            
            {course.description && (
              <div className="course-details-section">
                <span className="section-label">Description:</span>
                <p className="section-value">{course.description}</p>
              </div>
            )}
            
            {course.prerequisites && course.prerequisites.length > 0 && (
              <div className="course-details-section">
                <span className="section-label">Prerequisites:</span>
                <div className="prerequisites-list">
                  {course.prerequisites.map((prereq, idx) => (
                    <span key={idx} className="prerequisite-tag">{prereq}</span>
                  ))}
                </div>
              </div>
            )}
            
            {course.postrequisites && course.postrequisites.length > 0 && (
              <div className="course-details-section">
                <span className="section-label">Unlocks:</span>
                <div className="postrequisites-list">
                  {course.postrequisites.slice(0, 10).map((postreq, idx) => (
                    <span key={idx} className="postrequisite-tag">{postreq}</span>
                  ))}
                  {course.postrequisites.length > 10 && (
                    <span className="more-courses">+{course.postrequisites.length - 10} more</span>
                  )}
                </div>
              </div>
            )}
            
            {course.link && (
              <div className="course-details-section">
                <a href={course.link} target="_blank" rel="noopener noreferrer" className="course-link">
                  View on UIUC Course Catalog →
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDetails;

