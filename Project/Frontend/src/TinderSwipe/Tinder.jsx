import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import './Tinder.css';
import SwipeFilters from '../components/SwipeFilters';
import CourseDetails from '../components/CourseDetails';
import { AppContext } from '../context/AppContext';

function Tinder({ recommendations = {}, onComplete }) {
  const navigate = useNavigate();
  const { setLikedItems, setDislikedItems } = useContext(AppContext);
  
  // Combine all recommendations into a single array
  const [allItems, setAllItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter state
  const [activeFilters, setActiveFilters] = useState({
    technical: true,
    gened: true,
    club: true
  });
  
  // Swipe state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedCourses, setLikedCourses] = useState([]);
  const [dislikedCourses, setDislikedCourses] = useState([]);
  const [swipeHistory, setSwipeHistory] = useState([]); // For undo
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  // Course details modal
  const [selectedCourseCode, setSelectedCourseCode] = useState(null);

  useEffect(() => {
    const items = [];
    
    if (!recommendations || typeof recommendations !== 'object') {
      setAllItems([]);
      setIsLoading(false);
      return;
    }
    
    // Add course recommendations (legacy)
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
    
    // Add technical course recommendations
    if (recommendations.technical_courses && Array.isArray(recommendations.technical_courses) && recommendations.technical_courses.length > 0) {
      recommendations.technical_courses.forEach(course => {
        const scoreInfo = course.final_score ? ` | Score: ${course.final_score.toFixed(3)}` : '';
        const postreqInfo = course.postreq_count > 0 ? ` | Unlocks ${course.postreq_count} courses` : '';
        items.push({
          type: 'technical',
          code: course.course_code || course.code || 'N/A',
          name: course.title || course.name || 'Untitled Course',
          credits: 3,
          description: `${course.description || ''}${scoreInfo}${postreqInfo}`.trim(),
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
        // Clean description to handle encoding issues
        let description = club.mission || club.description || '';
        if (description) {
          // Fix common encoding issues
          description = description
            .replace(/â€™/g, "'")
            .replace(/â€œ/g, '"')
            .replace(/â€/g, '"')
            .replace(/â€"/g, '—')
            .replace(/â€"/g, '–')
            .replace(/â€™/g, "'");
        }
        items.push({
          type: 'club',
          code: club.title || club.name || 'N/A',
          name: club.title || club.name || 'Untitled Club',
          credits: null,
          description: description,
          data: club
        });
      });
    }
    
    setAllItems(items);
    setIsLoading(false);
    
    // Reset swipe state when recommendations change
    setCurrentIndex(0);
    setLikedCourses([]);
    setDislikedCourses([]);
    setSwipeHistory([]);
    setSwipeDirection(null);
    setDragOffset(0);
    setIsDragging(false);
  }, [recommendations]);

  // Filter items based on active filters
  const getFilteredItems = () => {
    return allItems.filter(item => {
      if (item.type === 'technical' || item.type === 'course') return activeFilters.technical;
      if (item.type === 'gened') return activeFilters.gened;
      if (item.type === 'club') return activeFilters.club;
      return true;
    });
  };

  const coursesToShow = getFilteredItems();
  
  // Calculate statistics
  const stats = {
    technical: allItems.filter(item => item.type === 'technical' || item.type === 'course').length,
    gened: allItems.filter(item => item.type === 'gened').length,
    club: allItems.filter(item => item.type === 'club').length
  };

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
  if (allItems.length === 0) {
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

  // Show message if filters exclude all items
  if (coursesToShow.length === 0) {
    return (
      <div className="swipe-container">
        <SwipeFilters 
          activeFilters={activeFilters} 
          onFilterChange={setActiveFilters}
          stats={stats}
        />
        <h1>No Items Match Your Filters</h1>
        <p className="instructions">Try adjusting your filters to see more recommendations</p>
      </div>
    );
  }

  const currentCourse = coursesToShow[currentIndex];

  const handleSwipe = (direction) => {
    if (!currentCourse) return;

    // Save to history for undo
    setSwipeHistory(prev => [...prev, {
      index: currentIndex,
      item: currentCourse,
      direction,
      liked: [...likedCourses],
      disliked: [...dislikedCourses]
    }]);

    setSwipeDirection(direction);
    
    setTimeout(() => {
      const newLiked = direction === 'right' ? [...likedCourses, currentCourse] : likedCourses;
      const newDisliked = direction === 'left' ? [...dislikedCourses, currentCourse] : dislikedCourses;
      
      setLikedCourses(newLiked);
      setDislikedCourses(newDisliked);
      setLikedItems(newLiked);
      setDislikedItems(newDisliked);
      
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setSwipeDirection(null);
      setDragOffset(0);

      if (newIndex >= coursesToShow.length && onComplete) {
        onComplete({ liked: newLiked, disliked: newDisliked });
      }
    }, 300);
  };

  const handleUndo = () => {
    if (swipeHistory.length === 0) return;
    
    const lastAction = swipeHistory[swipeHistory.length - 1];
    setSwipeHistory(prev => prev.slice(0, -1));
    setCurrentIndex(lastAction.index);
    setLikedCourses(lastAction.liked);
    setDislikedCourses(lastAction.disliked);
    setLikedItems(lastAction.liked);
    setDislikedItems(lastAction.disliked);
  };

  const handleBatchAction = (action) => {
    const remainingItems = coursesToShow.slice(currentIndex);
    if (action === 'like-all') {
      const newLiked = [...likedCourses, ...remainingItems];
      setLikedCourses(newLiked);
      setLikedItems(newLiked);
      setCurrentIndex(coursesToShow.length);
      if (onComplete) {
        onComplete({ liked: newLiked, disliked: dislikedCourses });
      }
    } else if (action === 'pass-all') {
      const newDisliked = [...dislikedCourses, ...remainingItems];
      setDislikedCourses(newDisliked);
      setDislikedItems(newDisliked);
      setCurrentIndex(coursesToShow.length);
      if (onComplete) {
        onComplete({ liked: likedCourses, disliked: newDisliked });
      }
    }
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

  const handleCardClick = () => {
    if (currentCourse && (currentCourse.type === 'technical' || currentCourse.type === 'course' || currentCourse.type === 'gened')) {
      setSelectedCourseCode(currentCourse.code);
    }
  };

  const resetSwipe = () => {
    setCurrentIndex(0);
    setLikedCourses([]);
    setDislikedCourses([]);
    setSwipeHistory([]);
    setSwipeDirection(null);
    setDragOffset(0);
  };

  // Render results screen
  if (currentIndex >= coursesToShow.length) {
    return (
      <div className="swipe-container">
        <h1>All Done!</h1>
        <div className="swipe-stats">
          <div className="stat-item">
            <span className="stat-label">Liked:</span>
            <span className="stat-value liked">{likedCourses.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Passed:</span>
            <span className="stat-value disliked">{dislikedCourses.length}</span>
          </div>
        </div>
        <div className="results">
          <div className="result-section liked">
            <h2>Interested Items ({likedCourses.length})</h2>
            {likedCourses.length > 0 ? (
              <div className="results-list">
                {likedCourses.map((item, idx) => (
                  <div key={`${item.code}-${idx}`} className="result-item">
                    <div className="result-item-header">
                      <strong>{item.code}</strong>
                      <span className="result-type-badge">{item.type}</span>
                    </div>
                    <div className="result-item-name">{item.name}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No items selected</p>
            )}
          </div>
        </div>
        <div className="results-actions">
          <button className="action-button primary" onClick={() => navigate('/results')}>
            View Full Results
          </button>
          <button className="action-button secondary" onClick={resetSwipe}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Render swipe screen
  const getTypeLabel = (type) => {
    if (type === 'course') return 'Course';
    if (type === 'technical') return 'Technical';
    if (type === 'gened') return 'GenEd';
    if (type === 'club') return 'Club';
    return 'Item';
  };

  const remainingCount = coursesToShow.length - currentIndex;

  return (
    <div className="swipe-container">
      <SwipeFilters 
        activeFilters={activeFilters} 
        onFilterChange={setActiveFilters}
        stats={stats}
      />
      
      <div className="swipe-header">
        <h1>Swipe Your Recommendations</h1>
        <p className="instructions">
          Swipe right for items you're interested in | Swipe left to pass
        </p>
        <div className="swipe-stats-inline">
          <span>Liked: <strong>{likedCourses.length}</strong></span>
          <span>Remaining: <strong>{remainingCount}</strong></span>
        </div>
      </div>
      
      <div className="batch-actions">
        <button 
          className="batch-button like-all" 
          onClick={() => handleBatchAction('like-all')}
          disabled={remainingCount === 0}
        >
          Like All Remaining
        </button>
        <button 
          className="batch-button pass-all" 
          onClick={() => handleBatchAction('pass-all')}
          disabled={remainingCount === 0}
        >
          Pass All Remaining
        </button>
        {swipeHistory.length > 0 && (
          <button className="batch-button undo" onClick={handleUndo}>
            Undo Last
          </button>
        )}
      </div>
      
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
            onClick={handleCardClick}
          >
            <div className="card-content">
              <div className="card-type-badge">{getTypeLabel(currentCourse.type || 'course')}</div>
              {currentCourse.type === 'club' ? (
                <>
                  <h2 className="club-name">{currentCourse.name}</h2>
                  {currentCourse.description && (
                    <p className="club-description">{currentCourse.description}</p>
                  )}
                </>
              ) : (
                <>
                  <h2 className="course-code">{currentCourse.code}</h2>
                  <h3 className="course-name">{currentCourse.name}</h3>
                  {currentCourse.credits && (
                    <p className="course-credits">{currentCourse.credits} Credit Hours</p>
                  )}
                  {currentCourse.description && (
                    <p className="course-description">{currentCourse.description}</p>
                  )}
                  {(currentCourse.type === 'technical' || currentCourse.type === 'course' || currentCourse.type === 'gened') && (
                    <button className="view-details-button" onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCourseCode(currentCourse.code);
                    }}>
                      View Details
                    </button>
                  )}
                </>
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
              {coursesToShow[currentIndex + 1].type === 'club' ? (
                <h2 className="club-name">{coursesToShow[currentIndex + 1].name}</h2>
              ) : (
                <>
                  <h2 className="course-code">{coursesToShow[currentIndex + 1].code}</h2>
                  <h3 className="course-name">{coursesToShow[currentIndex + 1].name}</h3>
                </>
              )}
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

      {selectedCourseCode && (
        <CourseDetails 
          courseCode={selectedCourseCode} 
          onClose={() => setSelectedCourseCode(null)} 
        />
      )}
    </div>
  );
}

export default Tinder;
