import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config';
import Sidebar from '../components/Sidebar';
import NoteCard from '../components/NoteCard';
import UploadModal from '../components/UploadModal';
import PdfPreviewModal from '../components/PdfPreviewModal';

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

const Dashboard = () => {
  const { token } = useAuth();
  
  const [notes, setNotes] = useState([]);
  const [error, setError] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [sortBy, setSortBy] = useState('recent'); // Default

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  const [showUploadForm, setShowUploadForm] = useState(false);
  const [activeNote, setActiveNote] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearchQuery, filterBranch, filterSemester, sortBy]);

  const fetchNotes = useCallback(async (isLoadMore = false) => {
    if (!token) return;
    try {
      if (!isLoadMore) setError(null);
      const params = new URLSearchParams();
      if (debouncedSearchQuery) params.append('query', debouncedSearchQuery);
      if (filterBranch) params.append('branch', filterBranch);
      if (filterSemester) params.append('semester', filterSemester);
      if (sortBy) params.append('sortBy', sortBy);
      params.append('page', page);
      params.append('limit', 10);

      const response = await fetch(`${API_URL}/api/search?${params.toString()}`);
      const data = await response.json();
      
      if (data.notes && Array.isArray(data.notes)) {
        if (isLoadMore) {
          setNotes(prev => [...prev, ...data.notes]);
        } else {
          setNotes(data.notes);
        }
        setHasMore(data.currentPage < data.totalPages);
      } else {
        if (!isLoadMore) setNotes([]);
        setError(data.error || "Failed to retrieve notes from server.");
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching notes:", error);
      if (!isLoadMore) setNotes([]);
      setError("Unable to connect to the backend server.");
      setHasMore(false);
    }
  }, [debouncedSearchQuery, filterBranch, filterSemester, sortBy, page, token]);

  useEffect(() => {
    fetchNotes(page > 1);
  }, [fetchNotes, page]);

  const handleUpdateNote = useCallback((updatedNote) => {
    setNotes(prev => prev.map(n => n._id === updatedNote._id ? updatedNote : n));
  }, []);

  const handleViewNotes = useCallback(async (note) => {
    setActiveNote(note);

    try {
      await fetch(`${API_URL}/api/notes/${note._id}/visit`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.error("Failed to register visit", err);
    }
  }, [token]);

  return (
    <div className="dashboard-layout">
      <Sidebar onOpenUpload={() => setShowUploadForm(true)} />

      <main className="main-content-area">
        
        <div className="feed-header">
          <h2 className="section-title">Explore Notes</h2>
          
          <div className="top-filter-bar glass-panel">
            <input 
              type="text" 
              className="input-field filter-search" 
              placeholder="Search title, subject..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select className="input-field filter-select" value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)}>
              <option value="">All Branches</option>
              {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <select className="input-field filter-select" value={filterSemester} onChange={(e) => setFilterSemester(e.target.value)}>
              <option value="">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => <option key={sem} value={sem}>Sem {sem}</option>)}
            </select>
            <select className="input-field filter-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="recent">Newest</option>
              <option value="popular">Most Upvoted</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="glass-panel" style={{ backgroundColor: 'rgba(255, 77, 79, 0.1)', color: 'var(--danger-color)', borderLeft: '4px solid var(--danger-color)', marginBottom: '20px' }}>
            <strong>Connection Error:</strong> {error}
          </div>
        )}

        <div className="notes-grid">
          {notes.length > 0 ? (
            notes.map((note) => (
              <NoteCard 
                key={note._id} 
                note={note} 
                onUpdateNote={handleUpdateNote} 
                onViewPdf={handleViewNotes}
              />
            ))
          ) : (
            !error && (
              <div className="glass-panel empty-state">
                <h3>No notes found</h3>
                <p>Try adjusting your filters or be the first to upload one!</p>
              </div>
            )
          )}
        </div>

        {hasMore && !error && (
          <div className="load-more-container">
            <button className="btn btn-secondary btn-load-more" onClick={() => setPage(prev => prev + 1)}>
              Load More
            </button>
          </div>
        )}
      </main>

      {showUploadForm && (
        <UploadModal 
          onClose={() => setShowUploadForm(false)} 
          onUploadSuccess={(newNote) => {
            setNotes(prev => [newNote, ...prev]);
            alert('Upload successful!');
          }} 
        />
      )}

      {activeNote && (
        <PdfPreviewModal 
          note={activeNote} 
          onClose={() => {
            setActiveNote(null);
          }} 
        />
      )}
    </div>
  );
};

export default Dashboard;
