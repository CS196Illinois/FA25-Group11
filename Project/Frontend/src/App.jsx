import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Dashboard from './components/Dashboard';
import ResultsScreen from './components/ResultsScreen';
import OnboardingDars from './pages/OnboardingDars';
import OnboardingGened from './pages/OnboardingGened';
import OnboardingClubs from './pages/OnboardingClubs';
import OnboardingCourses from './pages/OnboardingCourses';
import Recommendations from './pages/Recommendations';

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/onboarding/dars" element={<OnboardingDars />} />
        <Route path="/onboarding/gened" element={<OnboardingGened />} />
        <Route path="/onboarding/clubs" element={<OnboardingClubs />} />
        <Route path="/onboarding/courses" element={<OnboardingCourses />} />
        <Route path="/recommendations" element={<Recommendations />} />
        <Route path="/results" element={<ResultsScreen />} />
        <Route path="/plans" element={<div>Plans Screen (Coming Soon)</div>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
