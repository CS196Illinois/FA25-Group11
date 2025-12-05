import React from 'react';

// Usage: <CourseDropdown courses={courses} onSelect={fn} />
export default function CourseDropdown({ courses = [], onSelect }) {
  return (
    <div className="course-dropdown">
      <label htmlFor="course-select" style={{ marginRight: 8 }}>Select a course:</label>
      <select
        id="course-select"
        onChange={e => onSelect && onSelect(e.target.value)}
        style={{ padding: '6px 12px', borderRadius: 6, minWidth: 180 }}
      >
        <option value="">-- Choose --</option>
        {courses.map(course => (
          <option key={course.course_code} value={course.course_code}>
            {course.course_code} {course.name ? `- ${course.name}` : ''}
          </option>
        ))}
      </select>
    </div>
  );
}
