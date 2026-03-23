import { useState } from 'react';
import { api } from '../api';

export default function LandingPage({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (mode === 'register' && password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const user = mode === 'login'
        ? await api.login(email, password)
        : await api.register(email, password);
      onAuth(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f2ead8',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
    }}>
      {/* Crest */}
      <img
        src="/crest.png"
        alt="Dubois Family Crest"
        style={{
          width: '220px',
          maxWidth: '60vw',
          marginBottom: '1.25rem',
          filter: 'drop-shadow(0 4px 16px rgba(26,39,68,0.18))',
        }}
      />

      {/* Title */}
      <h1 style={{
        fontFamily: "'Cinzel', serif",
        fontWeight: '600',
        fontSize: '2rem',
        color: '#1a2744',
        letterSpacing: '0.05em',
        marginBottom: '0.375rem',
        textAlign: 'center',
      }}>
        Dubois Family
      </h1>
      <p style={{
        fontFamily: "'Cinzel', serif",
        fontWeight: '400',
        fontSize: '0.75rem',
        color: '#4a5a7a',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        marginBottom: '2rem',
        textAlign: 'center',
      }}>
        Ad Astra Per Aspera
      </p>

      {/* Auth card */}
      <div style={{
        width: '100%',
        maxWidth: '360px',
        background: 'rgba(255, 253, 245, 0.85)',
        borderRadius: '0.75rem',
        border: '1px solid #c9b99a',
        padding: '1.75rem',
        boxShadow: '0 4px 24px rgba(26,39,68,0.10)',
      }}>
        <h2 style={{
          fontFamily: "'Cinzel', serif",
          fontSize: '1rem',
          fontWeight: '600',
          color: '#1a2744',
          marginBottom: '1.25rem',
          textAlign: 'center',
          letterSpacing: '0.05em',
        }}>
          {mode === 'login' ? 'Sign In' : 'Create Account'}
        </h2>

        {error && (
          <div style={{
            background: '#fee2e2',
            color: '#991b1b',
            padding: '0.625rem 0.75rem',
            borderRadius: '0.375rem',
            marginBottom: '1rem',
            fontSize: '0.875rem',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '0.875rem' }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '500', color: '#3a4a6a', marginBottom: '0.25rem' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid #c9b99a',
                borderRadius: '0.375rem',
                fontSize: '0.9375rem',
                background: '#fdf9f0',
                color: '#1a2744',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: mode === 'register' ? '0.875rem' : '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '500', color: '#3a4a6a', marginBottom: '0.25rem' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid #c9b99a',
                borderRadius: '0.375rem',
                fontSize: '0.9375rem',
                background: '#fdf9f0',
                color: '#1a2744',
                outline: 'none',
              }}
            />
          </div>

          {mode === 'register' && (
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '500', color: '#3a4a6a', marginBottom: '0.25rem' }}>
                Confirm Password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #c9b99a',
                  borderRadius: '0.375rem',
                  fontSize: '0.9375rem',
                  background: '#fdf9f0',
                  color: '#1a2744',
                  outline: 'none',
                }}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.625rem',
              background: loading ? '#6b7e9e' : '#1a2744',
              color: '#f2ead8',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.9375rem',
              fontFamily: "'Cinzel', serif",
              fontWeight: '600',
              letterSpacing: '0.05em',
              cursor: loading ? 'default' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {loading ? '...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.8125rem', color: '#6b7e9e' }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
            style={{
              background: 'none',
              border: 'none',
              color: '#1a2744',
              fontWeight: '600',
              fontSize: '0.8125rem',
              textDecoration: 'underline',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {mode === 'login' ? 'Create account' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
