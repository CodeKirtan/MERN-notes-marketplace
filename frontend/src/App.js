import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import ProfilePage from './pages/ProfilePage';
import TrendingPage from './pages/TrendingPage';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { token, user } = useAuth();
  if (!token || !user) {
    return <Navigate to="/auth" />;
  }
  return children;
};

const AppRoutes = () => {
  const { token, user } = useAuth();

  return (
    <div className="app-container">
      {token && user && (
        <header className="app-header">
          <h1 className="app-title">📚 Notes Hub</h1>
          <p className="app-subtitle">Access student-uploaded exam notes, lecture digests, and study guides instantly.</p>
        </header>
      )}

      <Routes>
        <Route path="/auth" element={token && user ? <Navigate to="/" /> : <AuthPage />} />
        
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/trending" 
          element={
            <ProtectedRoute>
              <TrendingPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;