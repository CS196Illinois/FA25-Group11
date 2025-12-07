import React from 'react';
import CourseDetails from './CourseDetails';
import './ResultsList.css';

const ResultsList = ({ items, selectedForComparison, onToggleComparison }) => {
  const [selectedCourseCode, setSelectedCourseCode] = React.useState(null);

  const getTypeLabel = (type) => {
    if (type === 'course') return 'Course';
    if (type === 'technical') return 'Technical';
    if (type === 'gened') return 'GenEd';
    if (type === 'club') return 'Club';
    return 'Item';
  };

  if (items.length === 0) {
    return (
      <div className="results-list-empty">
        <p>No items in this category</p>
      </div>
    );
  }

  return (
    <div className="results-list">
      {items.map((item, idx) => {
        const isSelected = selectedForComparison.find(i => i.code === item.code);
        return (
          <div
            key={`${item.code}-${idx}`}
            className={`result-list-item ${isSelected ? 'selected' : ''}`}
          >
            <div className="list-item-checkbox">
              {(item.type === 'technical' || item.type === 'course' || item.type === 'gened') && (
                <button
                  className="compare-checkbox"
                  onClick={() => onToggleComparison(item)}
                  title="Add to comparison"
                >
                  {isSelected ? '✓' : '+'}
                </button>
              )}
            </div>
            <div className="list-item-content">
              <div className="list-item-header">
                <h3 className="list-item-code">{item.code}</h3>
                <span className="list-item-type">{getTypeLabel(item.type || 'course')}</span>
              </div>
              <h4 className="list-item-name">{item.name}</h4>
              {item.credits && (
                <p className="list-item-credits">{item.credits} Credit Hours</p>
              )}
              {item.description && (
                <p className="list-item-description">{item.description}</p>
              )}
            </div>
            <div className="list-item-actions">
              {(item.type === 'technical' || item.type === 'course' || item.type === 'gened') && (
                <button
                  className="view-details-btn"
                  onClick={() => setSelectedCourseCode(item.code)}
                >
                  Details
                </button>
              )}
            </div>
          </div>
        );
      })}
      {selectedCourseCode && (
        <CourseDetails
          courseCode={selectedCourseCode}
          onClose={() => setSelectedCourseCode(null)}
        />
      )}
    </div>
  );
};

export default ResultsList;

