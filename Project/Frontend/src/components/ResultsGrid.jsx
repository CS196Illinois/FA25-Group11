import React from 'react';
import CourseDetails from './CourseDetails';
import './ResultsGrid.css';

const ResultsGrid = ({ items, selectedForComparison, onToggleComparison }) => {
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
      <div className="results-grid-empty">
        <p>No items in this category</p>
      </div>
    );
  }

  return (
    <div className="results-grid">
      {items.map((item, idx) => {
        const isSelected = selectedForComparison.find(i => i.code === item.code);
        return (
          <div
            key={`${item.code}-${idx}`}
            className={`result-card ${isSelected ? 'selected' : ''}`}
          >
            <div className="card-header">
              <div className="card-type-badge">{getTypeLabel(item.type || 'course')}</div>
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
            <div className="card-body">
              <h3 className="card-code">{item.code}</h3>
              <h4 className="card-name">{item.name}</h4>
              {item.credits && (
                <p className="card-credits">{item.credits} Credit Hours</p>
              )}
              {item.description && (
                <p className="card-description">{item.description}</p>
              )}
            </div>
            <div className="card-footer">
              {(item.type === 'technical' || item.type === 'course' || item.type === 'gened') && (
                <button
                  className="view-details-btn"
                  onClick={() => setSelectedCourseCode(item.code)}
                >
                  View Details
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

export default ResultsGrid;

