import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config';

const NoteCard = ({ note, onUpdateNote, onViewPdf }) => {
  const { token, user } = useAuth();
  const [isCommentsExpanded, setIsCommentsExpanded] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [expandedReplies, setExpandedReplies] = useState({});
  const handleUpvote = async () => {
    if (!user) return; // Must be logged in

    const hasVoted = note.upvotedBy?.includes(user.id);
    
    // Optimistic Update
    const optimisticNote = {
      ...note,
      upvotedBy: hasVoted 
        ? note.upvotedBy.filter(id => id !== user.id)
        : [...(note.upvotedBy || []), user.id]
    };
    onUpdateNote(optimisticNote);

    try {
      const response = await fetch(`${API_URL}/api/notes/${note._id}/upvote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const updatedNote = await response.json();
        onUpdateNote(updatedNote); // Sync with actual server response
      } else {
        onUpdateNote(note); // Revert on failure
      }
    } catch (err) {
      console.error("Upvote error:", err);
      onUpdateNote(note); // Revert on failure
    }
  };

  const hasVoted = user ? note.upvotedBy?.includes(user.id) : false;
  const legacyUpvotes = Math.max(0, note.upvotes || 0);
  const upvoteCount = (note.upvotedBy?.length || 0) + legacyUpvotes;

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;

    // Optimistic Update
    const optimisticComment = {
      _id: `temp-${Date.now()}`,
      text: commentText,
      author: user.name || 'You',
      user: user.id,
      createdAt: new Date().toISOString()
    };
    
    const optimisticNote = {
      ...note,
      comments: [...(note.comments || []), optimisticComment]
    };
    onUpdateNote(optimisticNote);
    const submittedText = commentText;
    setCommentText('');

    try {
      const response = await fetch(`${API_URL}/api/notes/${note._id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: submittedText })
      });

      if (response.ok) {
        const updatedNote = await response.json();
        onUpdateNote(updatedNote);
      } else {
        onUpdateNote(note); // Revert
        setCommentText(submittedText);
      }
    } catch (err) {
      console.error("Comment submit error:", err);
      onUpdateNote(note); // Revert
      setCommentText(submittedText);
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

  const handlePostReply = async (commentId) => {
    if (!replyText.trim() || !user) return;
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
        onUpdateNote(updatedNote);
        setReplyText('');
        setActiveReplyId(null);
      }
    } catch (err) {
      console.error("Failed to post reply", err);
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
        onUpdateNote(updatedNote);
      }
    } catch (err) {
      console.error("Failed to delete reply", err);
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

      <p className="note-uploader" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
        Uploaded by: <strong>{note.uploadedBy?.name || 'Unknown User'}</strong>
      </p>

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
                  
                  <div className="comment-actions" style={{ marginTop: '8px' }}>
                    <button className="btn-reply" onClick={() => setActiveReplyId(activeReplyId === comment._id ? null : comment._id)}>Reply</button>
                  </div>

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
                        <div className="replies-list" style={{ marginTop: '8px' }}>
                          {comment.replies.map(reply => (
                            <div key={reply._id} className="reply-box">
                              <div className="comment-header">
                                <span className="comment-author">{reply.author}</span>
                                <span className="comment-date">{new Date(reply.createdAt).toLocaleDateString()}</span>
                              </div>
                              <p className="comment-text" style={{ fontSize: '0.85rem' }}>{reply.text}</p>
                              {token && reply.user === user?.id && (
                                <button className="btn-delete" onClick={() => handleDeleteReply(comment._id, reply._id)}>Delete</button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeReplyId === comment._id && (
                    <div className="reply-input-box" style={{ marginTop: '8px' }}>
                      <textarea 
                        className="comment-textarea" 
                        placeholder="Write a reply..." 
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        style={{ minHeight: '40px' }}
                      />
                      <button className="btn-post-reply" onClick={() => handlePostReply(comment._id)}>Post Reply</button>
                    </div>
                  )}
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

export default React.memo(NoteCard);
