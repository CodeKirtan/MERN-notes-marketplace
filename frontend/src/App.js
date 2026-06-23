import React, { useState, useEffect } from 'react';

function App() {
  // --- State Variables ---
  const [notes, setNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // --- 1. Fetch Data from MongoDB ---
  const fetchNotes = async (query = '') => {
    try {
      const response = await fetch(`http://localhost:8000/api/search?query=${query}`);
      const data = await response.json();
      setNotes(data);
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  };

  // Load notes the moment the page opens
  useEffect(() => {
    fetchNotes();
  }, []);

  // --- 2. Handle Search Typing ---
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    fetchNotes(e.target.value);
  };

  // --- 3. Handle File Upload ---
  const handleUpload = async (e) => {
    e.preventDefault(); 
    
    if (!title || !subject || !file) {
      alert("Please fill out the Title, Subject, and attach a PDF.");
      return;
    }

    setIsUploading(true);

    // FormData is required to send physical files over HTTP
    const formData = new FormData();
    formData.append('title', title);
    formData.append('subject', subject);
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/api/upload', {
        method: 'POST',
        body: formData, 
      });

      if (response.ok) {
        alert("✅ Note uploaded to MongoDB successfully!");
        // Clear the form inputs
        setTitle('');
        setSubject('');
        setFile(null);
        // Refresh the list to show the new note
        fetchNotes();
      } else {
        alert("❌ Failed to upload note.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("❌ Server error during upload.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', color: '#2c3e50', marginBottom: '40px' }}>📚 Lecture Notes Marketplace</h1>
      
      {/* --- UPLOAD FORM --- */}
      <div style={{ backgroundColor: '#f8f9fa', padding: '25px', borderRadius: '8px', marginBottom: '40px', border: '1px solid #e9ecef' }}>
        <h2 style={{ marginTop: 0, color: '#333' }}>Upload a New Note</h2>
        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input 
            type="text" 
            placeholder="Note Title (e.g., Intro to Arrays)" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ padding: '12px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <input 
            type="text" 
            placeholder="Subject (e.g., Data Structures)" 
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            style={{ padding: '12px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <input 
            type="file" 
            accept=".pdf"
            onChange={(e) => setFile(e.target.files[0])}
            style={{ padding: '12px', fontSize: '16px', backgroundColor: '#fff', border: '1px dashed #ccc', cursor: 'pointer' }}
          />
          <button 
            type="submit" 
            disabled={isUploading}
            style={{ 
              padding: '12px', 
              fontSize: '16px', 
              backgroundColor: isUploading ? '#95a5a6' : '#27ae60', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: isUploading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            {isUploading ? 'Uploading...' : 'Upload Note'}
          </button>
        </form>
      </div>

      {/* --- SEARCH BAR --- */}
      <input 
        type="text" 
        placeholder="🔍 Search for subjects or titles..." 
        value={searchQuery}
        onChange={handleSearch}
        style={{ width: '100%', padding: '15px', fontSize: '18px', marginBottom: '30px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }}
      />

      {/* --- NOTES LIST --- */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {notes.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#7f8c8d', fontSize: '18px' }}>No notes found. Be the first to upload one!</p>
        ) : (
          notes.map((note) => (
            <div key={note._id} style={{ border: '1px solid #eee', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>{note.title}</h3>
                <span style={{ backgroundColor: '#e0f7fa', color: '#006064', padding: '5px 10px', borderRadius: '15px', fontSize: '14px', fontWeight: 'bold' }}>
                  {note.subject}
                </span>
              </div>
              <a 
                href={`http://localhost:8000${note.filePath}`} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ backgroundColor: '#3498db', color: 'white', padding: '10px 15px', textDecoration: 'none', borderRadius: '4px', fontWeight: 'bold' }}
              >
                View PDF
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;