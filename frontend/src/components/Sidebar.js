import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';

const BRANCHES = [
  "Computer Science",
  "Information Technology",
  "Electronics & Comm",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Chemical Engineering",
  "Other"
];

const Sidebar = ({ 
  searchQuery, setSearchQuery, 
  filterBranch, setFilterBranch, 
  filterSemester, setFilterSemester, 
  sortBy, setSortBy, 
  onOpenUpload 
}) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isProfile = location.pathname === '/profile';

  return (
    <aside className="sidebar-panel glass-panel">
      {/* USER CONTEXT PROFILE CARD */}
      <div className="user-info-card">
        <p className="user-display-name">👤 {user?.name}</p>
        <p className="user-display-email">{user?.email}</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px' }}>
          <Link to={isProfile ? '/' : '/profile'} style={{ textDecoration: 'none' }}>
            <button 
              className={`btn ${isProfile ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px', fontSize: '0.8rem', width: '100%' }}
            >
              {isProfile ? '📖 Feed' : '⚙️ Profile'}
            </button>
          </Link>
          <button 
            className="btn btn-secondary" 
            style={{ padding: '8px', fontSize: '0.8rem', color: 'var(--danger-color)' }}
            onClick={logout}
          >
            Sign Out
          </button>
        </div>
      </div>

      <h2 className="panel-title" style={{ marginTop: '10px' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
        </svg>
        Filters
      </h2>

      {/* Search Field */}
      <div className="form-group">
        <label className="form-label">Search query</label>
        <input 
          type="text" 
          className="input-field" 
          placeholder="Search title, subject..." 
          value={searchQuery || ''}
          onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
          disabled={isProfile}
        />
      </div>

      {/* Branch Selector */}
      <div className="form-group">
        <label className="form-label">Branch / Course</label>
        <select 
          className="input-field" 
          value={filterBranch || ''} 
          onChange={(e) => setFilterBranch && setFilterBranch(e.target.value)}
          disabled={isProfile}
        >
          <option value="">All Branches</option>
          {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      {/* Semester Selector */}
      <div className="form-group">
        <label className="form-label">Semester</label>
        <select 
          className="input-field" 
          value={filterSemester || ''} 
          onChange={(e) => setFilterSemester && setFilterSemester(e.target.value)}
          disabled={isProfile}
        >
          <option value="">All Semesters</option>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
            <option key={sem} value={sem}>Semester {sem}</option>
          ))}
        </select>
      </div>

      {/* Sort Option */}
      <div className="form-group">
        <label className="form-label">Sort By</label>
        <select 
          className="input-field" 
          value={sortBy || 'recent'} 
          onChange={(e) => setSortBy && setSortBy(e.target.value)}
          disabled={isProfile}
        >
          <option value="recent">Newest Uploads</option>
          <option value="popular">Most Upvoted</option>
          <option value="oldest">Oldest</option>
        </select>
      </div>

      {/* Collapsible Upload Form Button */}
      <button 
        className="btn btn-primary" 
        style={{ marginTop: '10px' }}
        onClick={onOpenUpload}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', verticalAlign: 'text-bottom' }}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="17 8 12 3 7 8"></polyline>
          <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
        Share Note Document
      </button>
    </aside>
  );
};

export default Sidebar;
