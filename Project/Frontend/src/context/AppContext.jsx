import { createContext, useContext, useState } from 'react';

const AppContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppContextProvider');
  }
  return context;
};

export const AppContextProvider = ({ children }) => {
  const [formData, setFormData] = useState({
    major: '',
    completedCourses: [],
    interests: [],
    year: '',
  });

  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateFormData = (updates) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const resetFormData = () => {
    setFormData({
      major: '',
      completedCourses: [],
      interests: [],
      year: '',
    });
    setRecommendations(null);
    setError(null);
  };

  const value = {
    formData,
    updateFormData,
    resetFormData,
    recommendations,
    setRecommendations,
    loading,
    setLoading,
    error,
    setError,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

