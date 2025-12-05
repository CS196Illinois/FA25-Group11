import React, { useState, useEffect } from 'react';
import './Tinder.css';

function Tinder({ recommendations = {}, onComplete }) {
  // Combine all recommendations into a single array
  const [allItems, setAllItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const items = [];
    
    console.log('Tinder received recommendations:', recommendations);
    
    // Add course recommendations
    if (recommendations.courses && Array.isArray(recommendations.courses) && recommendations.courses.length > 0) {
      recommendations.courses.forEach(course => {
        items.push({
          type: 'course',
          code: course.course_code || course.code || 'N/A',
          name: course.title || course.name || 'Untitled Course',
          credits: course.credits || 3,
          description: course.description || course.reasoning || '',
          data: course
        });
      });
    }
    
    // Add GenEd recommendations
    if (recommendations.gened && Array.isArray(recommendations.gened) && recommendations.gened.length > 0) {
      recommendations.gened.forEach(gened => {
        items.push({
          type: 'gened',
          code: gened.course_code || gened.code || 'N/A',
          name: gened.title || gened.name || 'Untitled GenEd',
          credits: gened.credits || 3,
          description: `${gened.gened || ''} | GPA: ${gened.gpa?.toFixed(2) || 'N/A'}`,
          data: gened
        });
      });
    }
    
    // Add club recommendations
    if (recommendations.clubs && Array.isArray(recommendations.clubs) && recommendations.clubs.length > 0) {
      recommendations.clubs.forEach(club => {
        items.push({
          type: 'club',
          code: club.title || club.name || 'N/A',
          name: club.title || club.name || 'Untitled Club',
          credits: null,
          description: club.mission || club.description || '',
          data: club
        });
      });
    }
    
    console.log('Combined items:', items);
    setAllItems(items);
    setIsLoading(false);
  }, [recommendations]);

  const coursesToShow = allItems;

  // Show loading state
  if (isLoading) {
    return (
      <div className="swipe-container">
        <h1>Loading Recommendations...</h1>
        <p className="instructions">Please wait while we prepare your personalized recommendations</p>
        <div style={{ marginTop: '20px', fontSize: '16px', color: '#666' }}>
          This may take a few moments...
        </div>
      </div>
    );
  }

  // Show empty state if no recommendations
  if (coursesToShow.length === 0) {
    return (
      <div className="swipe-container">
        <h1>No Recommendations Available</h1>
        <p className="instructions">
          We couldn't generate recommendations based on your preferences. 
          Please try adjusting your selections or adding more information.
        </p>
        <div style={{ 
          marginTop: '30px', 
          maxWidth: '500px',
          background: '#f8f9fa',
          padding: '24px',
          borderRadius: '12px',
          textAlign: 'left'
        }}>
          <p style={{ color: '#1a1a1a', fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
            You may want to:
          </p>
          <ul style={{ color: '#4a4a4a', fontSize: '16px', lineHeight: '1.8', paddingLeft: '20px' }}>
            <li>Upload a DARS report or enter completed courses</li>
            <li>Select a major for course recommendations</li>
            <li>Add interests for GenEd or club recommendations</li>
          </ul>
        </div>
      </div>
    );
  }

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
  const getTypeLabel = (type) => {
    if (type === 'course') return 'Course';
    if (type === 'gened') return 'GenEd';
    if (type === 'club') return 'Club';
    return 'Item';
  };

  return (
    <div className="swipe-container">
      <h1>Swipe Your Recommendations</h1>
      <p className="instructions">
        Swipe right for items you're interested in | Swipe left to pass
      </p>
      
      <div className="card-stack">
        {currentCourse && (
          <div
            className={`course-card ${swipeDirection ? `swiping-${swipeDirection}` : ''} ${currentCourse.type || 'course'}`}
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
              <div className="card-type-badge">{getTypeLabel(currentCourse.type || 'course')}</div>
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
              <div className="card-type-badge">{getTypeLabel(coursesToShow[currentIndex + 1].type || 'course')}</div>
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