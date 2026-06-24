import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config';

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

const UploadModal = ({ onClose, onUploadSuccess }) => {
  const { token } = useAuth();
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [branch, setBranch] = useState('');
  const [semester, setSemester] = useState('');
  const [tags, setTags] = useState('');
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please select a file to upload.");

    setIsUploading(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('subject', subject);
    formData.append('branch', branch);
    formData.append('semester', semester);
    formData.append('tags', tags);
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await response.json();

      if (response.ok) {
        onUploadSuccess(data);
        onClose();
      } else {
        alert(data.error || "Upload failed");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to connect to the server.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel" style={{ maxWidth: '500px' }}>
        <button 
          className="modal-close-btn" 
          onClick={onClose}
        >
          ×
        </button>
        <h2 className="panel-title" style={{ marginBottom: '20px', fontSize: '1.5rem' }}>Upload Document</h2>
        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div className="form-group">
            <label className="form-label">Document Title</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="e.g. Midterm Study Guide" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Subject / Course Name</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="e.g. Data Structures" 
              value={subject} 
              onChange={(e) => setSubject(e.target.value)} 
              required 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Branch</label>
              <select className="input-field" value={branch} onChange={(e) => setBranch(e.target.value)} required>
                <option value="" disabled>Select Branch...</option>
                {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Semester</label>
              <select className="input-field" value={semester} onChange={(e) => setSemester(e.target.value)} required>
                <option value="" disabled>Select Semester...</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                  <option key={sem} value={sem}>Semester {sem}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Tags (comma separated)</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="e.g. algorithms, trees, finals" 
              value={tags} 
              onChange={(e) => setTags(e.target.value)} 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Select File (PDF)</label>
            <input 
              type="file" 
              className="input-field" 
              accept=".pdf" 
              onChange={(e) => setFile(e.target.files[0])} 
              required 
              style={{ padding: '10px' }}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ marginTop: '10px', width: '100%' }}
            disabled={isUploading}
          >
            {isUploading ? 'Uploading to Cloud...' : 'Publish Document'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadModal;
