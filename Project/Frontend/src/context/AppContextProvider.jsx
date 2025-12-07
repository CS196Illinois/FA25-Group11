import React, { useState, useEffect, useRef } from 'react';
import { AppContext } from './AppContext';
import { getMajors } from '../services/api';

export const AppContextProvider = ({ children }) => {
  // Flow state
  const [currentStep, setCurrentStep] = useState('dars');
  
  // DARS data
  const [completedCourses, setCompletedCourses] = useState([]);
  
  // Preferences
  const [genedPreferences, setGenedPreferences] = useState({
    genedInterests: '',
    genedPreferences: [],
    minGpa: 3.0,
    avoidSubjects: []
  });
  const [clubPreferences, setClubPreferences] = useState({
    clubInterests: '',
    preferredTags: [],
    avoidTags: []
  });
  const [coursePreferences, setCoursePreferences] = useState({
    selectedMajor: '',
    courseInterests: '',
    preferFoundational: false,
    preferAdvanced: false
  });
  
  // Recommendations
  const [recommendations, setRecommendations] = useState({});
  const [likedItems, setLikedItems] = useState([]);
  const [dislikedItems, setDislikedItems] = useState([]);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Majors list
  const [majors, setMajors] = useState([]);
  
  // Saved plans
  const [savedPlans, setSavedPlans] = useState([]);

  // Load majors on mount
  useEffect(() => {
    const loadMajors = async () => {
      try {
        const majorsList = await getMajors();
        const majorNames = majorsList.map(major => 
          typeof major === 'string' ? major : major.name
        );
        majorNames.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
        setMajors(majorNames);
      } catch (err) {
        console.error('Failed to load majors:', err);
      }
    };
    loadMajors();
  }, []);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('uiuc-recommender-state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.completedCourses) setCompletedCourses(parsed.completedCourses);
        if (parsed.genedPreferences) setGenedPreferences(parsed.genedPreferences);
        if (parsed.clubPreferences) setClubPreferences(parsed.clubPreferences);
        if (parsed.coursePreferences) setCoursePreferences(parsed.coursePreferences);
        if (parsed.savedPlans) setSavedPlans(parsed.savedPlans);
      }
    } catch (err) {
      console.error('Failed to load from localStorage:', err);
    }
  }, []);

  // Save to localStorage whenever state changes (skip initial render)
  const isInitialMount = useRef(true);
  
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    try {
      const stateToSave = {
        completedCourses,
        genedPreferences,
        clubPreferences,
        coursePreferences,
        savedPlans
      };
      localStorage.setItem('uiuc-recommender-state', JSON.stringify(stateToSave));
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
    }
  }, [completedCourses, genedPreferences, clubPreferences, coursePreferences, savedPlans]);

  // Save plan
  const savePlan = (planData) => {
    const newPlan = {
      id: Date.now().toString(),
      ...planData,
      createdAt: new Date().toISOString()
    };
    setSavedPlans(prev => [...prev, newPlan]);
    return newPlan;
  };

  // Delete plan
  const deletePlan = (planId) => {
    setSavedPlans(prev => prev.filter(plan => plan.id !== planId));
  };

  // Reset all state
  const resetState = () => {
    setCompletedCourses([]);
    setGenedPreferences({
      genedInterests: '',
      genedPreferences: [],
      minGpa: 3.0,
      avoidSubjects: []
    });
    setClubPreferences({
      clubInterests: '',
      preferredTags: [],
      avoidTags: []
    });
    setCoursePreferences({
      selectedMajor: '',
      courseInterests: '',
      preferFoundational: false,
      preferAdvanced: false
    });
    setRecommendations({});
    setLikedItems([]);
    setDislikedItems([]);
    setError(null);
    setCurrentStep('dars');
  };

  const value = {
    // State
    currentStep,
    completedCourses,
    genedPreferences,
    clubPreferences,
    coursePreferences,
    recommendations,
    likedItems,
    dislikedItems,
    loading,
    error,
    majors,
    savedPlans,
    
    // Setters
    setCurrentStep,
    setCompletedCourses,
    setGenedPreferences,
    setClubPreferences,
    setCoursePreferences,
    setRecommendations,
    setLikedItems,
    setDislikedItems,
    setLoading,
    setError,
    
    // Actions
    savePlan,
    deletePlan,
    resetState
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

