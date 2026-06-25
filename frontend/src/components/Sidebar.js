import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ onOpenUpload }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navLinks = [
    { name: '📖 Home Feed', path: '/' },
    { name: '🔥 Trending Notes', path: '/trending' },
    { name: '👤 My Profile', path: '/profile' }
  ];

  return (
    <aside className="sidebar-panel glass-panel">
      {/* USER CONTEXT PROFILE CARD */}
      <div className="user-info-card">
        <p className="user-display-name">{user?.name}</p>
        <p className="user-display-email">{user?.email}</p>
        
        <button 
          className="btn btn-secondary btn-signout" 
          onClick={logout}
        >
          Sign Out
        </button>
      </div>

      <nav className="sidebar-nav">
        {navLinks.map((link) => (
          <Link 
            key={link.path} 
            to={link.path} 
            className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
          >
            {link.name}
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button 
          className="btn btn-primary btn-upload-nav" 
          onClick={onOpenUpload}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', verticalAlign: 'text-bottom' }}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          Share Document
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
