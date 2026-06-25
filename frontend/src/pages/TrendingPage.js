import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config';
import Sidebar from '../components/Sidebar';
import NoteCard from '../components/NoteCard';
import UploadModal from '../components/UploadModal';
import PdfPreviewModal from '../components/PdfPreviewModal';

const TrendingPage = () => {
  const { token } = useAuth();
  
  const [notes, setNotes] = useState([]);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [showUploadForm, setShowUploadForm] = useState(false);
  const [activePdfUrl, setActivePdfUrl] = useState(null);
  const [activePdfTitle, setActivePdfTitle] = useState(null);

  const fetchTrendingNotes = useCallback(async (isLoadMore = false) => {
    if (!token) return;
    try {
      if (!isLoadMore) setError(null);
      
      // Specifically query for trending notes
      const params = new URLSearchParams();
      params.append('sortBy', 'trending');
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
        setError(data.error || "Failed to retrieve trending notes.");
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching trending notes:", error);
      if (!isLoadMore) setNotes([]);
      setError("Unable to connect to the backend server.");
      setHasMore(false);
    }
  }, [page, token]);

  useEffect(() => {
    fetchTrendingNotes(page > 1);
  }, [fetchTrendingNotes, page]);

  const handleUpdateNote = useCallback((updatedNote) => {
    setNotes(prev => prev.map(n => n._id === updatedNote._id ? updatedNote : n));
  }, []);

  const handleViewNotes = useCallback(async (note) => {
    if (note.filePath.startsWith('http')) {
      setActivePdfUrl(note.filePath);
    } else {
      setActivePdfUrl(`${API_URL}${note.filePath}`);
    }
    setActivePdfTitle(note.title);

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
          <h2 className="section-title">
            <span style={{ marginRight: '10px' }}>🔥</span> 
            Trending in the last 24 hours
          </h2>
          <p className="section-subtitle">Discover the most viral and helpful notes right now.</p>
        </div>

        {error && (
          <div className="glass-panel error-panel">
            <strong>Connection Error:</strong> {error}
          </div>
        )}

        <div className="notes-grid">
          {notes.length > 0 ? (
            notes.map((note, index) => (
              <div key={note._id} className="trending-card-wrapper">
                <div className="trending-rank">#{index + 1 + ((page - 1) * 10)}</div>
                <NoteCard 
                  note={note} 
                  onUpdateNote={handleUpdateNote} 
                  onViewPdf={handleViewNotes}
                />
              </div>
            ))
          ) : (
            !error && (
              <div className="glass-panel empty-state">
                <h3>No trending notes yet</h3>
                <p>Be the first to upload and share an amazing note!</p>
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
            alert('Upload successful!');
          }} 
        />
      )}

      {activePdfUrl && (
        <PdfPreviewModal 
          url={activePdfUrl} 
          title={activePdfTitle} 
          onClose={() => {
            setActivePdfUrl(null);
            setActivePdfTitle(null);
          }} 
        />
      )}
    </div>
  );
};

export default TrendingPage;
