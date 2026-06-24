import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config';
import Sidebar from '../components/Sidebar';
import NoteCard from '../components/NoteCard';
import UploadModal from '../components/UploadModal';
import PdfPreviewModal from '../components/PdfPreviewModal';

const Dashboard = () => {
  const { token } = useAuth();
  
  const [notes, setNotes] = useState([]);
  const [error, setError] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  const [showUploadForm, setShowUploadForm] = useState(false);
  const [activePdfUrl, setActivePdfUrl] = useState(null);
  const [activePdfTitle, setActivePdfTitle] = useState(null);

  const fetchNotes = useCallback(async () => {
    if (!token) return;
    try {
      setError(null);
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (filterBranch) params.append('branch', filterBranch);
      if (filterSemester) params.append('semester', filterSemester);
      if (sortBy) params.append('sortBy', sortBy);

      const response = await fetch(`${API_URL}/api/search?${params.toString()}`);
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
      setError("Unable to connect to the backend server.");
    }
  }, [searchQuery, filterBranch, filterSemester, sortBy, token]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleUpdateNote = (updatedNote) => {
    setNotes(prev => prev.map(n => n._id === updatedNote._id ? updatedNote : n));
  };

  const handleViewNotes = async (note) => {
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
  };

  return (
    <div className="dashboard-layout">
      <Sidebar 
        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        filterBranch={filterBranch} setFilterBranch={setFilterBranch}
        filterSemester={filterSemester} setFilterSemester={setFilterSemester}
        sortBy={sortBy} setSortBy={setSortBy}
        onOpenUpload={() => setShowUploadForm(true)}
      />

      <main className="main-content-area">
        <h2 className="section-title">Explore Notes</h2>
        {error && (
          <div className="glass-panel" style={{ backgroundColor: 'rgba(255, 77, 79, 0.1)', color: 'var(--danger-color)', borderLeft: '4px solid var(--danger-color)' }}>
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
              <div className="glass-panel" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
                <h3 style={{ marginBottom: '10px' }}>No notes found</h3>
                <p style={{ color: 'var(--text-secondary)' }}>Try adjusting your filters or be the first to upload one!</p>
              </div>
            )
          )}
        </div>
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

export default Dashboard;
