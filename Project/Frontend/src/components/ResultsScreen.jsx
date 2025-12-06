import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import ResultsGrid from './ResultsGrid';
import ResultsList from './ResultsList';
import CourseComparison from './CourseComparison';
import ExportOptions from './ExportOptions';
import './ResultsScreen.css';

const ResultsScreen = () => {
  const navigate = useNavigate();
  const { likedItems, savePlan } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedForComparison, setSelectedForComparison] = useState([]);
  const [showExport, setShowExport] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  // Group items by type
  const groupedItems = {
    all: likedItems,
    technical: likedItems.filter(item => item.type === 'technical' || item.type === 'course'),
    gened: likedItems.filter(item => item.type === 'gened'),
    club: likedItems.filter(item => item.type === 'club')
  };

  const currentItems = groupedItems[activeTab] || [];

  const handleSavePlan = () => {
    const planName = prompt('Enter a name for this plan:');
    if (planName) {
      savePlan({
        name: planName,
        likedItems: likedItems,
        createdAt: new Date().toISOString()
      });
      alert('Plan saved successfully!');
    }
  };

  const toggleComparison = (item) => {
    setSelectedForComparison(prev => {
      if (prev.find(i => i.code === item.code)) {
        return prev.filter(i => i.code !== item.code);
      } else if (prev.length < 3) {
        return [...prev, item];
      } else {
        return [item];
      }
    });
  };

  if (likedItems.length === 0) {
    return (
      <div className="results-screen">
        <div className="results-empty">
          <h1>No Saved Items</h1>
          <p>You haven't liked any recommendations yet. Start swiping to build your list!</p>
          <button className="primary-button" onClick={() => navigate('/recommendations')}>
            Go to Recommendations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="results-screen">
      <div className="results-header">
        <h1>Your Recommendations</h1>
        <p className="results-subtitle">
          {likedItems.length} {likedItems.length === 1 ? 'item' : 'items'} saved
        </p>
      </div>

      <div className="results-toolbar">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All ({likedItems.length})
          </button>
          <button
            className={`tab ${activeTab === 'technical' ? 'active' : ''}`}
            onClick={() => setActiveTab('technical')}
          >
            Courses ({groupedItems.technical.length})
          </button>
          <button
            className={`tab ${activeTab === 'gened' ? 'active' : ''}`}
            onClick={() => setActiveTab('gened')}
          >
            GenEds ({groupedItems.gened.length})
          </button>
          <button
            className={`tab ${activeTab === 'club' ? 'active' : ''}`}
            onClick={() => setActiveTab('club')}
          >
            Clubs ({groupedItems.club.length})
          </button>
        </div>

        <div className="toolbar-actions">
          <div className="view-toggle">
            <button
              className={`view-button ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              ⊞
            </button>
            <button
              className={`view-button ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              ☰
            </button>
          </div>
          <button className="action-button" onClick={() => setShowComparison(true)}>
            Compare ({selectedForComparison.length})
          </button>
          <button className="action-button" onClick={() => setShowExport(true)}>
            Export
          </button>
          <button className="action-button primary" onClick={handleSavePlan}>
            Save Plan
          </button>
        </div>
      </div>

      <div className="results-content">
        {viewMode === 'grid' ? (
          <ResultsGrid 
            items={currentItems}
            selectedForComparison={selectedForComparison}
            onToggleComparison={toggleComparison}
          />
        ) : (
          <ResultsList 
            items={currentItems}
            selectedForComparison={selectedForComparison}
            onToggleComparison={toggleComparison}
          />
        )}
      </div>

      {showExport && (
        <ExportOptions
          items={likedItems}
          onClose={() => setShowExport(false)}
        />
      )}

      {showComparison && selectedForComparison.length > 0 && (
        <CourseComparison
          items={selectedForComparison}
          onClose={() => {
            setShowComparison(false);
            setSelectedForComparison([]);
          }}
        />
      )}
    </div>
  );
};

export default ResultsScreen;

