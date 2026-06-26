import React, { useState, useEffect } from 'react';
import API_URL from '../config';
import { useAuth } from '../context/AuthContext';

const PdfPreviewModal = ({ note, onClose }) => {
  const { token, user } = useAuth();
  const [localNote, setLocalNote] = useState(note);
  const [comments, setComments] = useState(note?.comments || []);
  const [newComment, setNewComment] = useState('');
  const [replyText, setReplyText] = useState('');
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [expandedReplies, setExpandedReplies] = useState({});

  const pdfUrl = note.filePath.startsWith('http') ? note.filePath : `${API_URL}${note.filePath}`;

  // Fetch the latest note data to get up-to-date comments
  useEffect(() => {
    const fetchLatestNote = async () => {
      try {
        // We can just use the search API with the specific ID to fetch the latest state
        const response = await fetch(`${API_URL}/api/search?query=${encodeURIComponent(note.title)}`);
        const data = await response.json();
        const latestNote = data.notes?.find(n => n._id === note._id);
        if (latestNote) {
          setLocalNote(latestNote);
          if (latestNote.comments) {
            setComments(latestNote.comments);
          }
        }
      } catch (err) {
        console.error("Error fetching latest comments:", err);
      }
    };
    fetchLatestNote();
  }, [note._id, note.title]);

  const handleUpvote = async () => {
    if (!user) return;
    try {
      const response = await fetch(`${API_URL}/api/notes/${localNote._id}/upvote`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const updatedNote = await response.json();
        setLocalNote(updatedNote);
      }
    } catch (err) {
      console.error("Upvote error:", err);
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    try {
      const response = await fetch(`${API_URL}/api/notes/${note._id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: newComment })
      });
      if (response.ok) {
        const updatedNote = await response.json();
        setComments(updatedNote.comments);
        setNewComment('');
      }
    } catch (err) {
      console.error("Failed to post comment", err);
    }
  };

  const handlePostReply = async (commentId) => {
    if (!replyText.trim()) return;
    try {
      const response = await fetch(`${API_URL}/api/notes/${note._id}/comments/${commentId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: replyText })
      });
      if (response.ok) {
        const updatedNote = await response.json();
        setComments(updatedNote.comments);
        setReplyText('');
        setActiveReplyId(null);
      }
    } catch (err) {
      console.error("Failed to post reply", err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const response = await fetch(`${API_URL}/api/notes/${note._id}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const updatedNote = await response.json();
        setComments(updatedNote.comments);
      }
    } catch (err) {
      console.error("Failed to delete comment", err);
    }
  };

  const handleDeleteReply = async (commentId, replyId) => {
    try {
      const response = await fetch(`${API_URL}/api/notes/${note._id}/comments/${commentId}/replies/${replyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const updatedNote = await response.json();
        setComments(updatedNote.comments);
      }
    } catch (err) {
      console.error("Failed to delete reply", err);
    }
  };

  return (
    <div className="modal-overlay split-modal-overlay">
      <div className="split-modal-content">
        
        {/* Left Side: PDF Viewer */}
        <div className="split-left">
          <div className="modal-header">
            <h3 className="modal-title">{note.title}</h3>
          </div>
          <iframe 
            src={`${pdfUrl}#toolbar=0`} 
            title="Notes PDF Preview" 
            className="pdf-iframe"
          />
        </div>

        {/* Right Side: Comments & Collaboration */}
        <div className="split-right">
          <div className="right-header">
            <h4>Discussion</h4>
            <button className="btn-close-modal" onClick={onClose}>×</button>
          </div>

          <div className="comments-list">
            {comments.length === 0 ? (
              <p className="no-comments-msg">No comments yet. Be the first to ask a question or start a discussion!</p>
            ) : (
              comments.map(comment => (
                <div key={comment._id} className="comment-thread">
                  <div className="comment-box">
                    <div className="comment-header">
                      <span className="comment-author">{comment.author}</span>
                      <span className="comment-date">{new Date(comment.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="comment-text">{comment.text}</p>
                    <div className="comment-actions">
                      <button className="btn-reply" onClick={() => setActiveReplyId(activeReplyId === comment._id ? null : comment._id)}>Reply</button>
                      {user && comment.user === user.id && (
                        <button className="btn-delete" onClick={() => handleDeleteComment(comment._id)}>Delete</button>
                      )}
                    </div>
                  </div>

                  {/* Replies List */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="replies-section">
                      <button 
                        className="btn-reply" 
                        style={{marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)'}}
                        onClick={() => setExpandedReplies(prev => ({...prev, [comment._id]: !prev[comment._id]}))}
                      >
                        {expandedReplies[comment._id] ? 'Hide Replies' : `View Replies (${comment.replies.length})`}
                      </button>
                      
                      {expandedReplies[comment._id] && (
                        <div className="replies-list">
                          {comment.replies.map(reply => (
                            <div key={reply._id} className="reply-box">
                              <div className="comment-header">
                                <span className="comment-author">{reply.author}</span>
                                <span className="comment-date">{new Date(reply.createdAt).toLocaleDateString()}</span>
                              </div>
                              <p className="comment-text">{reply.text}</p>
                              {user && reply.user === user.id && (
                                <button className="btn-delete" onClick={() => handleDeleteReply(comment._id, reply._id)}>Delete</button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Active Reply Input */}
                  {activeReplyId === comment._id && (
                    <div className="reply-input-box">
                      <textarea 
                        className="comment-textarea" 
                        placeholder="Write a reply..." 
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                      />
                      <button className="btn-post-reply" onClick={() => handlePostReply(comment._id)}>Post Reply</button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="comment-input-area" style={{ marginTop: 'auto' }}>
            <textarea 
              className="comment-textarea" 
              placeholder="Ask a doubt or start a discussion..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button className="btn btn-primary btn-post-comment" onClick={handlePostComment}>Post</button>
          </div>

          <div className="pdf-modal-footer" style={{ padding: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(15, 23, 42, 0.9)' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Found this helpful?</span>
            <button 
              className={`btn-upvote ${localNote.upvotedBy?.includes(user?.id) ? 'voted' : ''}`}
              onClick={handleUpvote}
              style={{ fontSize: '0.9rem', padding: '6px 12px' }}
            >
              👍 <span className="action-count">{(localNote.upvotedBy?.length || 0) + Math.max(0, localNote.upvotes || 0)}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfPreviewModal;
