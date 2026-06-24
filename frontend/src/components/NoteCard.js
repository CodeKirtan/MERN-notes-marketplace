import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config';

const NoteCard = ({ note, onUpdateNote, onViewPdf }) => {
  const { token, user } = useAuth();
  const [isCommentsExpanded, setIsCommentsExpanded] = useState(false);
  const [commentText, setCommentText] = useState('');

  const handleUpvote = async () => {
    try {
      const response = await fetch(`${API_URL}/api/notes/${note._id}/upvote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const updatedNote = await response.json();
        onUpdateNote(updatedNote);
      }
    } catch (err) {
      console.error("Upvote error:", err);
    }
  };

  const hasVoted = user ? note.upvotedBy?.includes(user.id) : false;
  const legacyUpvotes = Math.max(0, note.upvotes || 0);
  const upvoteCount = (note.upvotedBy?.length || 0) + legacyUpvotes;

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      const response = await fetch(`${API_URL}/api/notes/${note._id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: commentText })
      });

      if (response.ok) {
        const updatedNote = await response.json();
        onUpdateNote(updatedNote);
        setCommentText('');
      }
    } catch (err) {
      console.error("Comment submit error:", err);
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
        onUpdateNote(updatedNote);
      }
    } catch (err) {
      console.error("Comment delete error:", err);
    }
  };

  const commentCount = note.comments ? note.comments.length : 0;

  return (
    <div className="note-card glass-panel">
      <div className="note-header">
        <h3 className="note-title">{note.title}</h3>
        <span className="badge badge-branch">{note.branch}</span>
      </div>

      <p className="note-subject">{note.subject}</p>

      <div className="badge-container">
        <span className="badge badge-semester">Sem {note.semester}</span>
        {note.tags && note.tags.map(tag => (
          <span key={tag} className="badge badge-tag">
            #{tag}
          </span>
        ))}
      </div>

      <div className="card-actions">
        <div className="action-left">
          <button 
            className={`btn-upvote ${hasVoted ? 'voted' : ''}`}
            onClick={handleUpvote}
            title="Upvote Note"
          >
            👍 <span className="action-count">{upvoteCount}</span>
          </button>

          <button
            className="btn btn-primary"
            style={{ fontSize: '0.85rem', padding: '6px 16px' }}
            onClick={() => onViewPdf(note)}
          >
            View Document
          </button>
        </div>

        <button
          className="btn-comments-toggle"
          onClick={() => setIsCommentsExpanded(!isCommentsExpanded)}
        >
          💬 {commentCount} Comments
        </button>
      </div>

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
                      {token && comment.user === user?.id && (
                        <button
                          className="btn-delete-comment"
                          onClick={() => handleDeleteComment(comment._id)}
                          title="Delete comment"
                          style={{ background: 'transparent', border: 'none', color: 'var(--danger-color, #ff4d4f)', marginLeft: '10px', cursor: 'pointer', fontSize: '1.2rem', lineHeight: '1' }}
                        >
                          ×
                        </button>
                      )}
                    </span>
                  </div>
                  <div className="comment-body">{comment.text}</div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleAddComment} className="comment-form">
            <div className="comment-inputs-row">
              <input
                type="text"
                className="comment-input"
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                style={{ flex: 2 }}
                required
              />
              <button type="submit" className="btn btn-secondary btn-comment-submit">Post</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default NoteCard;
