import React, { useState } from 'react';
import './Tinder.css';

function Tinder({ courses = [], onComplete }) {
  const defaultCourses = [
    { code: 'CS 225', name: 'Math', credits: 4, description: 'abc' },
    { code: 'CS 233', name: 'English', credits: 4, description: 'xyz' },
    { code: 'CS 241', name: 'History', credits: 4, description: 'xyz' },
    { code: 'CS 374', name: 'Calculus', credits: 4, description: 'xyz' },
    { code: 'CS 357', name: 'Writing', credits: 3, description: 'xyz' },
  ];

  const coursesToShow = courses.length > 0 ? courses : defaultCourses;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedCourses, setLikedCourses] = useState([]);
  const [dislikedCourses, setDislikedCourses] = useState([]);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const currentCourse = coursesToShow[currentIndex];

  const handleSwipe = (direction) => {
    if (!currentCourse) return;

    setSwipeDirection(direction);
    
    setTimeout(() => {
      const newLiked = direction === 'right' ? [...likedCourses, currentCourse] : likedCourses;
      const newDisliked = direction === 'left' ? [...dislikedCourses, currentCourse] : dislikedCourses;
      
      setLikedCourses(newLiked);
      setDislikedCourses(newDisliked);
      
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setSwipeDirection(null);
      setDragOffset(0);

      if (newIndex >= coursesToShow.length && onComplete) {
        onComplete({ liked: newLiked, disliked: newDisliked });
      }
    }, 300);
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setDragOffset(e.movementX + dragOffset);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    
    if (Math.abs(dragOffset) > 100) {
      handleSwipe(dragOffset > 0 ? 'right' : 'left');
    } else {
      setDragOffset(0);
    }
  };

  const handleTouchStart = (e) => {
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const offset = touch.clientX - rect.left - rect.width / 2;
    setDragOffset(offset);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    
    if (Math.abs(dragOffset) > 100) {
      handleSwipe(dragOffset > 0 ? 'right' : 'left');
    } else {
      setDragOffset(0);
    }
  };

  const resetSwipe = () => {
    setCurrentIndex(0);
    setLikedCourses([]);
    setDislikedCourses([]);
    setSwipeDirection(null);
    setDragOffset(0);
  };

  // Render results screen
  if (currentIndex >= coursesToShow.length) {
    return (
      <div className="swipe-container">
        <h1>All Done!</h1>
        <div className="results">
          <div className="result-section liked">
            <h2>Interested Courses ({likedCourses.length})</h2>
            {likedCourses.length > 0 ? (
              likedCourses.map((course) => (
                <div key={course.code} className="result-item">
                  <strong>{course.code}</strong> - {course.name}
                </div>
              ))
            ) : (
              <p>No courses selected</p>
            )}
          </div>
          <div className="result-section disliked">
            <h2>Not Interested ({dislikedCourses.length})</h2>
            {dislikedCourses.length > 0 ? (
              dislikedCourses.map((course) => (
                <div key={course.code} className="result-item">
                  <strong>{course.code}</strong> - {course.name}
                </div>
              ))
            ) : (
              <p>No courses passed</p>
            )}
          </div>
        </div>
        <button className="reset-button" onClick={resetSwipe}>
          Try Again
        </button>
      </div>
    );
  }

  // Render swipe screen
  return (
    <div className="swipe-container">
      <h1>Swipe Your Courses</h1>
      <p className="instructions">
        Swipe right for courses you want | Swipe left for courses you don't
      </p>
      
      <div className="card-stack">
        {currentCourse && (
          <div
            className={`course-card ${swipeDirection ? `swiping-${swipeDirection}` : ''}`}
            style={{
              transform: `translateX(${dragOffset}px) rotate(${dragOffset * 0.1}deg)`,
              transition: isDragging ? 'none' : 'transform 0.3s ease'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="card-content">
              <h2 className="course-code">{currentCourse.code}</h2>
              <h3 className="course-name">{currentCourse.name}</h3>
              {currentCourse.credits && (
                <p className="course-credits">{currentCourse.credits} Credit Hours</p>
              )}
              {currentCourse.description && (
                <p className="course-description">{currentCourse.description}</p>
              )}
            </div>
            
            {dragOffset > 50 && (
              <div className="swipe-indicator like">LIKE</div>
            )}
            {dragOffset < -50 && (
              <div className="swipe-indicator nope">PASS</div>
            )}
          </div>
        )}
        
        {/* Show next card behind */}
        {coursesToShow[currentIndex + 1] && (
          <div className="course-card next-card">
            <div className="card-content">
              <h2 className="course-code">{coursesToShow[currentIndex + 1].code}</h2>
              <h3 className="course-name">{coursesToShow[currentIndex + 1].name}</h3>
            </div>
          </div>
        )}
      </div>

      <div className="button-controls">
        <button className="swipe-button dislike" onClick={() => handleSwipe('left')}>
          Pass
        </button>
        <button className="swipe-button like" onClick={() => handleSwipe('right')}>
          Like
        </button>
      </div>

      <div className="progress">
        {currentIndex + 1} / {coursesToShow.length}
      </div>
    </div>
  );
}

export default Tinder;