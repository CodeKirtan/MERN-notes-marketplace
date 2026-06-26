import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import UploadModal from '../components/UploadModal';
import PdfPreviewModal from '../components/PdfPreviewModal';
import API_URL from '../config';

const ProfilePage = () => {
  const { token } = useAuth();
  
  const [profileNotes, setProfileNotes] = useState([]);
  const [recentlyVisited, setRecentlyVisited] = useState([]);
  const [activeTab, setActiveTab] = useState('uploads');
  
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [activeNote, setActiveNote] = useState(null);

  const fetchUserProfile = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/api/auth/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProfileNotes(data.uploadedNotes || []);
        setRecentlyVisited(data.user.recentlyVisited || []);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  }, [token]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const handleViewNotes = async (note) => {
    setActiveNote(note);

    try {
      await fetch(`${API_URL}/api/notes/${note._id}/visit`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      // Refresh profile to update recently visited
      fetchUserProfile();
    } catch (err) {
      console.error("Failed to register visit", err);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm("Are you sure you want to delete this note? This cannot be undone.")) return;
    try {
      const response = await fetch(`${API_URL}/api/notes/${noteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setProfileNotes(prev => prev.filter(n => n._id !== noteId));
      } else {
        const errorData = await response.json();
        alert(`Failed to delete note: ${errorData.error}`);
      }
    } catch (err) {
      console.error("Error deleting note", err);
      alert("Error deleting note.");
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar 
        onOpenUpload={() => setShowUploadForm(true)}
      />

      <main className="main-content-area">
        <h2 className="section-title">Your Profile & Activity</h2>
        
        <div className="profile-tabs-container">
          <div className="profile-tabs">
            <button 
              className={`tab-btn ${activeTab === 'uploads' ? 'active' : ''}`}
              onClick={() => setActiveTab('uploads')}
            >
              My Uploaded Notes
            </button>
            <button 
              className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              Recently Visited
            </button>
          </div>
        </div>
        
        <div className="tab-content">
          {activeTab === 'uploads' && (
            <div className="profile-section fade-in">
              {profileNotes.length === 0 ? (
                <div className="glass-panel" style={{ textAlign: 'center', padding: '40px' }}>
                  <p style={{ color: 'var(--text-secondary)', margin: 0 }}>You haven't uploaded any notes yet.</p>
                </div>
              ) : (
                <div className="list-simple">
                  {profileNotes.map((note) => (
                    <div key={note._id} className="list-simple-item profile-card">
                      <div className="list-item-info">
                        <span className="list-item-title">{note.title}</span>
                        <span className="list-item-subtitle">{note.subject}</span>
                        <div className="list-item-meta">
                          <span className="badge badge-branch">{note.branch}</span>
                          <span className="badge badge-semester">Sem {note.semester}</span>
                          <span style={{ color: 'var(--text-muted)' }}>👍 {note.upvotes || 0} Upvotes</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="btn btn-secondary"
                          onClick={() => handleViewNotes(note)}
                        >
                          View Document
                        </button>
                        <button 
                          className="btn-delete-note"
                          onClick={() => handleDeleteNote(note._id)}
                          title="Delete Note"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="profile-section fade-in">
              {recentlyVisited.length === 0 ? (
                <div className="glass-panel" style={{ textAlign: 'center', padding: '40px' }}>
                  <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No browsing history recorded yet.</p>
                </div>
              ) : (
                <div className="list-simple">
                  {recentlyVisited.map((note) => {
                    if (!note) return null;
                    return (
                      <div key={note._id} className="list-simple-item profile-card">
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
          )}
        </div>
      </main>

      {showUploadForm && (
        <UploadModal 
          onClose={() => setShowUploadForm(false)} 
          onUploadSuccess={(newNote) => {
            fetchUserProfile();
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

export default ProfilePage;
