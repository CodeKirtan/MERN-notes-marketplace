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
  
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [activePdfUrl, setActivePdfUrl] = useState(null);
  const [activePdfTitle, setActivePdfTitle] = useState(null);

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
      // Refresh profile to update recently visited
      fetchUserProfile();
    } catch (err) {
      console.error("Failed to register visit", err);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar 
        onOpenUpload={() => setShowUploadForm(true)}
      />

      <main className="main-content-area">
        <h2 className="section-title">Your Profile & Activity</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          
          <div className="profile-section">
            <h3 className="profile-section-heading">My Uploaded Notes</h3>
            {profileNotes.length === 0 ? (
              <div className="glass-panel" style={{ textAlign: 'center', padding: '30px' }}>
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>You haven't uploaded any notes yet.</p>
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

export default ProfilePage;
