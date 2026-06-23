import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

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

function App() {
  // --- Authentication States ---
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState(null);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  // --- Profile States ---
  const [showProfile, setShowProfile] = useState(false);
  const [profileNotes, setProfileNotes] = useState([]);
  const [recentlyVisited, setRecentlyVisited] = useState([]);

  // --- Notes Feed State ---
  const [notes, setNotes] = useState([]);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  // --- Upload Form State ---
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [branch, setBranch] = useState('');
  const [semester, setSemester] = useState('');
  const [tags, setTags] = useState('');
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);

  // --- Interaction States ---
  const [votedNotes, setVotedNotes] = useState(() => {
    try {
      const stored = localStorage.getItem('votedNotes');
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  });

  const [activePdfUrl, setActivePdfUrl] = useState(null);
  const [activePdfTitle, setActivePdfTitle] = useState(null);
  
  const [visibleComments, setVisibleComments] = useState({});
  const [newCommentText, setNewCommentText] = useState({});
  const [newCommentAuthor, setNewCommentAuthor] = useState({});

  // --- Fetch Data (Notes Feed) ---
  const fetchNotes = useCallback(async () => {
    if (!token) return;
    try {
      setError(null);
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (filterBranch) params.append('branch', filterBranch);
      if (filterSemester) params.append('semester', filterSemester);
      if (sortBy) params.append('sortBy', sortBy);

      const response = await fetch(`http://localhost:8000/api/search?${params.toString()}`);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setNotes(data);
      } else {
        setNotes([]);
        setError(data.error || "Failed to retrieve notes from server.");
      }
    } catch (error) {
      console.error("Error fetching notes:", error);
      setNotes([]);
      setError("Unable to connect to the backend server. Make sure the server is running on port 8000.");
    }
  }, [searchQuery, filterBranch, filterSemester, sortBy, token]);

  // --- Fetch User Profile & History ---
  const fetchUserProfile = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch('http://localhost:8000/api/auth/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProfileNotes(data.uploadedNotes || []);
        setRecentlyVisited(data.user.recentlyVisited || []);
      } else if (response.status === 401) {
        handleLogout();
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchNotes();
      fetchUserProfile();
    }
  }, [fetchNotes, fetchUserProfile, token]);

  // --- Authentication Handler ---
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setIsSubmittingAuth(true);

    const payload = { email: authEmail, password: authPassword };
    if (authMode === 'register') {
      payload.name = authName;
    }

    const endpoint = authMode === 'register' ? 'register' : 'login';

    try {
      const response = await fetch(`http://localhost:8000/api/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (response.ok) {
        // Save token and user details
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        setToken(data.token);
        setUser(data.user);
        
        // Reset fields
        setAuthName('');
        setAuthEmail('');
        setAuthPassword('');
      } else {
        setAuthError(data.error || 'Authentication failed. Please check your credentials.');
      }
    } catch (err) {
      console.error("Auth error:", err);
      setAuthError('Unable to connect to the authentication server.');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
    setShowProfile(false);
  };

  // --- Handle Upload ---
  const handleUpload = async (e) => {
    e.preventDefault();

    if (!title || !subject || !branch || !semester || !file) {
      alert("Please fill out Title, Subject, Branch, Semester, and attach a PDF.");
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('subject', subject);
    formData.append('branch', branch);
    formData.append('semester', semester);
    formData.append('tags', tags);
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        alert("✅ Note uploaded successfully!");
        setTitle('');
        setSubject('');
        setBranch('');
        setSemester('');
        setTags('');
        setFile(null);
        setShowUploadForm(false);
        fetchNotes();
        fetchUserProfile();
      } else {
        const errorData = await response.json();
        alert(`❌ Failed to upload note: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("❌ Server error during upload.");
    } finally {
      setIsUploading(false);
    }
  };

  // --- Upvoting Action ---
  const handleUpvote = async (noteId) => {
    const hasVoted = votedNotes[noteId];
    const action = hasVoted ? 'downvote' : 'upvote';

    try {
      const response = await fetch(`http://localhost:8000/api/notes/${noteId}/upvote`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        const updatedNote = await response.json();
        setNotes(prev => prev.map(n => n._id === noteId ? updatedNote : n));

        const nextVoted = { ...votedNotes, [noteId]: !hasVoted };
        setVotedNotes(nextVoted);
        localStorage.setItem('votedNotes', JSON.stringify(nextVoted));
      }
    } catch (err) {
      console.error("Upvote error:", err);
    }
  };

  // --- Comment Submission ---
  const handleAddComment = async (e, noteId) => {
    e.preventDefault();
    const text = newCommentText[noteId] || '';
    const author = newCommentAuthor[noteId] || user?.name || 'Anonymous';

    if (!text.trim()) return;

    try {
      const response = await fetch(`http://localhost:8000/api/notes/${noteId}/comments`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text, author })
      });

      if (response.ok) {
        const updatedNote = await response.json();
        setNotes(prev => prev.map(n => n._id === noteId ? updatedNote : n));
        setNewCommentText(prev => ({ ...prev, [noteId]: '' }));
        setNewCommentAuthor(prev => ({ ...prev, [noteId]: '' }));
      }
    } catch (err) {
      console.error("Comment submit error:", err);
    }
  };

  // --- Trigger Preview & Register History Log ---
  const handleViewNotes = async (note) => {
    setActivePdfUrl(`http://localhost:8000${note.filePath}`);
    setActivePdfTitle(note.title);

    try {
      const response = await fetch(`http://localhost:8000/api/notes/${note._id}/visit`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        fetchUserProfile(); // Reload history list dynamically
      }
    } catch (err) {
      console.error("Error logging note visit:", err);
    }
  };

  // --- Toggle Comments Expansion ---
  const toggleComments = (noteId) => {
    setVisibleComments(prev => ({ ...prev, [noteId]: !prev[noteId] }));
  };

  // --- 1. RENDER AUTHENTICATION VIEW IF NOT SIGNED IN ---
  if (!token || !user) {
    return (
      <div className="auth-page-container">
        <div className="glass-panel auth-card">
          <header style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h1 className="app-title" style={{ fontSize: '2rem', marginBottom: '8px' }}>📚 Academic Hub</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
              Verify student email to access note marketplace
            </p>
          </header>

          <div className="auth-tabs">
            <button 
              className={`auth-tab-btn ${authMode === 'login' ? 'active' : ''}`}
              onClick={() => { setAuthMode('login'); setAuthError(null); }}
            >
              Sign In
            </button>
            <button 
              className={`auth-tab-btn ${authMode === 'register' ? 'active' : ''}`}
              onClick={() => { setAuthMode('register'); setAuthError(null); }}
            >
              Create Account
            </button>
          </div>

          {authError && (
            <div className="auth-error-box">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {authMode === 'register' && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. John Doe"
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Student Email (.edu)</label>
              <input 
                type="email" 
                className="input-field" 
                placeholder="e.g. name@university.edu"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input 
                type="password" 
                className="input-field" 
                placeholder="••••••••"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '8px' }}
              disabled={isSubmittingAuth}
            >
              {isSubmittingAuth ? 'Verifying...' : authMode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- 2. RENDER MAIN WEB APPLICATION FOR SIGNED IN STUDENTS ---
  return (
    <div className="app-container">
      {/* HEADER */}
      <header className="app-header">
        <h1 className="app-title">📚 Notes Marketplace</h1>
        <p className="app-subtitle">Access student-uploaded exam notes, lecture digests, and study guides instantly.</p>
      </header>

      {/* DASHBOARD LAYOUT */}
      <div className="dashboard-layout">
        
        {/* SIDEBAR: USER ACCOUNT + SEARCH & FILTERS */}
        <aside className="sidebar-panel glass-panel">
          {/* USER CONTEXT PROFILE CARD */}
          <div className="user-info-card">
            <p className="user-display-name">👤 {user.name}</p>
            <p className="user-display-email">{user.email}</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px' }}>
              <button 
                className={`btn ${showProfile ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '8px', fontSize: '0.8rem' }}
                onClick={() => setShowProfile(!showProfile)}
              >
                {showProfile ? '📖 Feed' : '⚙️ Profile'}
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '8px', fontSize: '0.8rem', color: 'var(--danger-color)' }}
                onClick={handleLogout}
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={showProfile}
            />
          </div>

          {/* Branch Selector */}
          <div className="form-group">
            <label className="form-label">Branch / Course</label>
            <select 
              className="input-field" 
              value={filterBranch} 
              onChange={(e) => setFilterBranch(e.target.value)}
              disabled={showProfile}
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
              value={filterSemester} 
              onChange={(e) => setFilterSemester(e.target.value)}
              disabled={showProfile}
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
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              disabled={showProfile}
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
            onClick={() => {
              setShowUploadForm(!showUploadForm);
              setShowProfile(false); // Back to feed when uploading
            }}
          >
            {showUploadForm ? 'Cancel Upload' : '✨ Share Your Notes'}
          </button>
        </aside>

        {/* MAIN DISPLAY AREA */}
        <main className="notes-column">
          
          {/* PROFILE VIEW MODE */}
          {showProfile ? (
            <div className="profile-view-container">
              <div className="glass-panel" style={{ borderLeft: '4px solid var(--primary-accent)' }}>
                <h2 className="profile-section-heading" style={{ border: 'none', padding: 0, marginBottom: '20px' }}>
                  Student Dashboard
                </h2>
                
                <div className="profile-meta-panel">
                  <div className="profile-stat-box">
                    <div className="profile-stat-val">{profileNotes.length}</div>
                    <div className="profile-stat-lbl">My Uploaded Notes</div>
                  </div>
                  <div className="profile-stat-box">
                    <div className="profile-stat-val">{recentlyVisited.length}</div>
                    <div className="profile-stat-lbl">Recent Visits</div>
                  </div>
                </div>

                <button 
                  className="btn btn-secondary" 
                  style={{ marginTop: '15px' }}
                  onClick={() => setShowProfile(false)}
                >
                  ← Back to Feed
                </button>
              </div>

              {/* Section: My Uploaded Notes */}
              <div className="profile-section">
                <h3 className="profile-section-heading">My Uploaded Notes</h3>
                {profileNotes.length === 0 ? (
                  <div className="glass-panel" style={{ textAlign: 'center', padding: '30px' }}>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>You haven't uploaded any study notes yet.</p>
                  </div>
                ) : (
                  <div className="list-simple">
                    {profileNotes.map((note) => (
                      <div key={note._id} className="list-simple-item">
                        <div className="list-item-info">
                          <span className="list-item-title">{note.title}</span>
                          <span className="list-item-subtitle">{note.subject}</span>
                          <div className="list-item-meta">
                            <span className="badge badge-branch">{note.branch}</span>
                            <span className="badge badge-semester">Sem {note.semester}</span>
                            <span style={{ color: 'var(--text-muted)' }}>👍 {note.upvotes || 0} Upvotes</span>
                          </div>
                        </div>
                        <button 
                          className="btn btn-secondary"
                          onClick={() => handleViewNotes(note)}
                        >
                          View Document
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section: Recently Visited Notes */}
              <div className="profile-section">
                <h3 className="profile-section-heading">Recently Visited History</h3>
                {recentlyVisited.length === 0 ? (
                  <div className="glass-panel" style={{ textAlign: 'center', padding: '30px' }}>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No browsing history recorded yet.</p>
                  </div>
                ) : (
                  <div className="list-simple">
                    {recentlyVisited.map((note) => {
                      if (!note) return null;
                      return (
                        <div key={note._id} className="list-simple-item">
                          <div className="list-item-info">
                            <span className="list-item-title">{note.title}</span>
                            <span className="list-item-subtitle">{note.subject}</span>
                            <div className="list-item-meta">
                              <span className="badge badge-branch">{note.branch}</span>
                              <span className="badge badge-semester">Sem {note.semester}</span>
                            </div>
                          </div>
                          <button 
                            className="btn btn-secondary"
                            onClick={() => handleViewNotes(note)}
                          >
                            View Document
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            // FEED VIEW MODE
            <>
              {/* UPLOAD FORM (GLASS COLLAPSIBLE PANEL) */}
              {showUploadForm && (
                <div className="glass-panel" style={{ borderLeft: '4px solid var(--primary-accent)' }}>
                  <h2 className="panel-title" style={{ marginBottom: '20px' }}>Upload Study Notes</h2>
                  <form onSubmit={handleUpload} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">Document Title</label>
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="e.g. Intro to Neural Networks" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Subject</label>
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="e.g. Deep Learning" 
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Branch</label>
                      <select 
                        className="input-field" 
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        required
                      >
                        <option value="">Select Branch</option>
                        {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Semester</label>
                      <select 
                        className="input-field" 
                        value={semester}
                        onChange={(e) => setSemester(e.target.value)}
                        required
                      >
                        <option value="">Select Semester</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                          <option key={sem} value={sem}>Semester {sem}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Tags (comma-separated)</label>
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="e.g. exam, midsem, formula-sheet" 
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                      />
                    </div>

                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">PDF File</label>
                      <div className="file-upload-wrapper">
                        <input 
                          type="file" 
                          className="file-upload-input" 
                          accept=".pdf" 
                          onChange={(e) => setFile(e.target.files[0])}
                          required
                        />
                        <div className="file-upload-text">
                          {file ? (
                            <span className="file-selected-name">📄 {file.name}</span>
                          ) : (
                            <span>Drag & drop or click to upload PDF notes</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                      <button 
                        type="button" 
                        className="btn btn-secondary" 
                        onClick={() => setShowUploadForm(false)}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="btn btn-primary" 
                        disabled={isUploading}
                      >
                        {isUploading ? 'Uploading...' : 'Publish Notes'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* SERVICE ALERT */}
              {error && (
                <div className="glass-panel" style={{ borderLeft: '4px solid var(--danger-color)', marginBottom: '20px' }}>
                  <h3 style={{ color: 'var(--danger-color)', margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: 600 }}>⚠️ Service Alert</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>{error}</p>
                </div>
              )}

              {/* NOTES FEED LIST */}
              <div className="notes-grid">
                {!error && Array.isArray(notes) && notes.length === 0 ? (
                  <div className="glass-panel" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', margin: 0 }}>
                      No study notes found matching your filters.
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '10px' }}>
                      Be the first to upload and help out your classmates!
                    </p>
                  </div>
                ) : (
                  Array.isArray(notes) && notes.map((note) => {
                    const commentCount = note.comments ? note.comments.length : 0;
                    const hasVoted = votedNotes[note._id];
                    const isCommentsExpanded = visibleComments[note._id];

                    return (
                      <div key={note._id} className="glass-panel note-card">
                        
                        {/* Card Content Header */}
                        <div className="note-card-header">
                          <h3 className="note-title">{note.title}</h3>
                          <div className="note-subject">{note.subject}</div>
                          
                          <div className="badge-container">
                            <span className="badge badge-branch">{note.branch}</span>
                            <span className="badge badge-semester">Sem {note.semester}</span>
                            {note.tags && note.tags.map((t, idx) => (
                              <span key={idx} className="badge badge-tag">#{t}</span>
                            ))}
                          </div>
                        </div>

                        {/* Interaction Buttons & Link */}
                        <div className="card-actions">
                          <div className="action-left">
                            {/* Upvote Button */}
                            <button 
                              className={`btn-upvote ${hasVoted ? 'voted' : ''}`}
                              onClick={() => handleUpvote(note._id)}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                              </svg>
                              <span>{note.upvotes || 0}</span>
                            </button>

                            {/* Comments Toggle */}
                            <button 
                              className="btn-comments-toggle"
                              onClick={() => toggleComments(note._id)}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                              </svg>
                              <span>{commentCount}</span>
                            </button>
                          </div>

                          {/* PDF Viewer Button */}
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                            onClick={() => handleViewNotes(note)}
                          >
                            View Notes
                          </button>
                        </div>

                        {/* EXPANDABLE COMMENTS DRAWER */}
                        {isCommentsExpanded && (
                          <div className="comments-section">
                            <div className="comments-list">
                              {commentCount === 0 ? (
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '10px 0', textAlign: 'center' }}>
                                  No comments yet. Have a question or feedback?
                                </p>
                              ) : (
                                note.comments.map((comment, index) => (
                                  <div key={index} className="comment-item">
                                    <div className="comment-header">
                                      <span className="comment-author">{comment.author}</span>
                                      <span className="comment-date">
                                        {new Date(comment.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                      </span>
                                    </div>
                                    <div className="comment-body">{comment.text}</div>
                                  </div>
                                ))
                              )}
                            </div>

                            {/* Comment Input Form */}
                            <form onSubmit={(e) => handleAddComment(e, note._id)} className="comment-form">
                              <div className="comment-inputs-row">
                                <input 
                                  type="text" 
                                  className="comment-input" 
                                  placeholder="Name" 
                                  value={newCommentAuthor[note._id] || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setNewCommentAuthor(prev => ({ ...prev, [note._id]: val }));
                                  }}
                                />
                                <input 
                                  type="text" 
                                  className="comment-input" 
                                  placeholder="Add a helpful comment..." 
                                  value={newCommentText[note._id] || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setNewCommentText(prev => ({ ...prev, [note._id]: val }));
                                  }}
                                  required
                                />
                                <button type="submit" className="btn btn-primary btn-comment-submit">
                                  Post
                                </button>
                              </div>
                            </form>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {/* PDF MODAL PREVIEW OVERLAY */}
      {activePdfUrl && (
        <div className="modal-overlay" onClick={() => { setActivePdfUrl(null); setActivePdfTitle(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" title={activePdfTitle}>📄 Preview: {activePdfTitle}</h3>
              <button className="btn-close-modal" onClick={() => { setActivePdfUrl(null); setActivePdfTitle(null); }}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <iframe 
                src={`${activePdfUrl}#toolbar=0`} 
                title="Notes PDF Preview" 
                className="pdf-iframe"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;