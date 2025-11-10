import React from 'react';
import './SemesterPlan.css';

const SemesterPlan = ({ semesterPlan, studentYear }) => {
  if (!semesterPlan || Object.keys(semesterPlan).length === 0) {
    return null;
  }

  const formatYear = (year) => {
    const mapping = {
      'first_year': 'First Year',
      'second_year': 'Second Year',
      'third_year': 'Third Year',
      'fourth_year': 'Fourth Year'
    };
    return mapping[year] || year;
  };

  return (
    <div className="semester-plan">
      <h3 className="semester-plan-title">
        Semester Plan - {formatYear(studentYear || semesterPlan.student_year)}
      </h3>
      
      <div className="semester-grid">
        {semesterPlan.fall && semesterPlan.fall.courses.length > 0 && (
          <div className="semester-card fall-semester">
            <div className="semester-header">
              <h4>Fall Semester</h4>
              <span className="credit-badge">
                {semesterPlan.fall.total_credits.toFixed(1)} credits
              </span>
            </div>
            <div className="semester-courses">
              {semesterPlan.fall.courses.map((course, idx) => (
                <div key={idx} className="semester-course">
                  <span className="course-code">{course.course_code}</span>
                  <span className="course-name">{course.name}</span>
                  <span className="course-credits">{course.credits} cr</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {semesterPlan.spring && semesterPlan.spring.courses.length > 0 && (
          <div className="semester-card spring-semester">
            <div className="semester-header">
              <h4>Spring Semester</h4>
              <span className="credit-badge">
                {semesterPlan.spring.total_credits.toFixed(1)} credits
              </span>
            </div>
            <div className="semester-courses">
              {semesterPlan.spring.courses.map((course, idx) => (
                <div key={idx} className="semester-course">
                  <span className="course-code">{course.course_code}</span>
                  <span className="course-name">{course.name}</span>
                  <span className="course-credits">{course.credits} cr</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {semesterPlan.other && semesterPlan.other.courses.length > 0 && (
        <div className="other-courses">
          <h4>Other Recommended Courses</h4>
          <div className="other-courses-list">
            {semesterPlan.other.courses.map((course, idx) => (
              <span key={idx} className="other-course-tag">
                {course.course_code}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SemesterPlan;

