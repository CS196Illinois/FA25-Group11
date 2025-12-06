import React from 'react';
import './SwipeFilters.css';

const SwipeFilters = ({ activeFilters, onFilterChange, stats }) => {
  const filterTypes = [
    { id: 'technical', label: 'Courses', icon: '📚' },
    { id: 'gened', label: 'GenEds', icon: '🎓' },
    { id: 'club', label: 'Clubs', icon: '👥' }
  ];

  const toggleFilter = (filterId) => {
    const newFilters = { ...activeFilters };
    newFilters[filterId] = !newFilters[filterId];
    onFilterChange(newFilters);
  };

  return (
    <div className="swipe-filters">
      <div className="filters-title">Filter by Type:</div>
      <div className="filters-buttons">
        {filterTypes.map(filter => (
          <button
            key={filter.id}
            className={`filter-button ${activeFilters[filter.id] ? 'active' : ''}`}
            onClick={() => toggleFilter(filter.id)}
          >
            <span className="filter-icon">{filter.icon}</span>
            <span className="filter-label">{filter.label}</span>
            {stats && stats[filter.id] !== undefined && (
              <span className="filter-count">({stats[filter.id]})</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SwipeFilters;

