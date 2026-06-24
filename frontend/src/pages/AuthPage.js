import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config';

const AuthPage = () => {
  const { login } = useAuth();
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState(null);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setIsSubmittingAuth(true);

    const payload = { email: authEmail, password: authPassword };
    if (authMode === 'register') {
      payload.name = authName;
    }

    const endpoint = authMode === 'register' ? 'register' : 'login';

    try {
      const response = await fetch(`${API_URL}/api/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (response.ok) {
        login(data.token, data.user);
      } else {
        setAuthError(data.error || 'Authentication failed. Please check your credentials.');
      }
    } catch (err) {
      console.error("Auth error:", err);
      setAuthError('Unable to connect to the authentication server.');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="glass-panel auth-card">
        <header style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 className="app-title" style={{ fontSize: '2rem', marginBottom: '8px' }}>📚 Academic Hub</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Verify student email to access note marketplace
          </p>
        </header>

        <div className="auth-tabs">
          <button 
            className={`auth-tab-btn ${authMode === 'login' ? 'active' : ''}`}
            onClick={() => { setAuthMode('login'); setAuthError(null); }}
          >
            Sign In
          </button>
          <button 
            className={`auth-tab-btn ${authMode === 'register' ? 'active' : ''}`}
            onClick={() => { setAuthMode('register'); setAuthError(null); }}
          >
            Create Account
          </button>
        </div>

        {authError && (
          <div className="auth-error-box">
            {authError}
          </div>
        )}

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {authMode === 'register' && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="e.g. John Doe"
                value={authName}
                onChange={(e) => setAuthName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Student Email (.edu)</label>
            <input 
              type="email" 
              className="input-field" 
              placeholder="e.g. name@university.edu"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="••••••••"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '8px' }}
            disabled={isSubmittingAuth}
          >
            {isSubmittingAuth ? 'Verifying...' : authMode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;
