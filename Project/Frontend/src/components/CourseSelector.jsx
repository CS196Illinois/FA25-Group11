import React, { useState, useMemo } from 'react';
import './CourseSelector.css';

const CourseSelector = ({ courses, selectedCourses, onSelectionChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('');

  // Extract unique departments
  const departments = useMemo(() => {
    const depts = new Set();
    courses.forEach(course => {
      const match = course.course_code?.match(/^([A-Z]{2,4})/);
      if (match) {
        depts.add(match[1]);
      }
    });
    return Array.from(depts).sort();
  }, [courses]);

  // Filter courses
  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      const code = course.course_code || '';
      const name = course.name || '';
      const matchesSearch = 
        code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = !filterDept || code.startsWith(filterDept);
      return matchesSearch && matchesDept;
    });
  }, [courses, searchTerm, filterDept]);

  const handleToggle = (courseCode) => {
    const newSelection = selectedCourses.includes(courseCode)
      ? selectedCourses.filter(c => c !== courseCode)
      : [...selectedCourses, courseCode];
    onSelectionChange(newSelection);
  };

  return (
    <div className="course-selector">
      <div className="course-selector-controls">
        <input
          type="text"
          placeholder="Search courses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="course-search"
        />
        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="dept-filter"
        >
          <option value="">All Departments</option>
          {departments.map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
      </div>

      <div className="selected-count">
        <strong>{selectedCourses.length}</strong> course{selectedCourses.length !== 1 ? 's' : ''} selected
        {selectedCourses.length > 0 && (
          <button 
            className="clear-selection"
            onClick={() => onSelectionChange([])}
            title="Clear all selections"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="courses-list">
        {filteredCourses.length === 0 ? (
          <div className="no-courses">No courses found</div>
        ) : (
          filteredCourses.map(course => {
            const courseCode = course.course_code || '';
            const isSelected = selectedCourses.includes(courseCode);
            return (
              <div
                key={courseCode}
                className={`course-item ${isSelected ? 'selected' : ''}`}
                onClick={() => handleToggle(courseCode)}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleToggle(courseCode)}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="course-info">
                  <span className="course-code">{courseCode}</span>
                  <span className="course-name">{course.name || 'Unknown Course'}</span>
                  <span className="course-credits">{course.credits || '?'} credits</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CourseSelector;

