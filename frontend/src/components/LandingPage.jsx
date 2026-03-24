import { useState } from 'react';
import { api } from '../api';
import { colors, fonts, fontSizes, fontWeights, radii, shadows, input, btnPrimary } from '../theme';

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

  const labelStyle = {
    display: 'block',
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors.textMuted,
    marginBottom: '0.25rem',
    fontFamily: fonts.sans,
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #1a2744 0%, #1e3a6e 60%, #162040 100%)',
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
          width: '200px',
          maxWidth: '55vw',
          marginBottom: '1.25rem',
          filter: 'drop-shadow(0 6px 20px rgba(0,0,0,0.4))',
        }}
      />

      {/* Title */}
      <h1 style={{
        fontFamily: fonts.serif,
        fontWeight: fontWeights.semibold,
        fontSize: fontSizes['4xl'],
        color: colors.white,
        letterSpacing: '0.05em',
        marginBottom: '0.375rem',
        textAlign: 'center',
      }}>
        Dubois Family
      </h1>
      <p style={{
        fontFamily: fonts.serif,
        fontWeight: fontWeights.normal,
        fontSize: fontSizes.sm,
        color: 'rgba(255,255,255,0.65)',
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
        background: colors.white,
        borderRadius: radii.xl,
        border: 'none',
        padding: '1.75rem',
        boxShadow: shadows.xl,
      }}>
        <h2 style={{
          fontFamily: fonts.sans,
          fontSize: fontSizes.xl,
          fontWeight: fontWeights.semibold,
          color: colors.textPrimary,
          marginBottom: '1.25rem',
          textAlign: 'center',
        }}>
          {mode === 'login' ? 'Sign In' : 'Create Account'}
        </h2>

        {error && (
          <div style={{
            background: colors.errorBg,
            color: colors.errorText,
            padding: '0.625rem 0.75rem',
            borderRadius: radii.md,
            marginBottom: '1rem',
            fontSize: fontSizes.base,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '0.875rem' }}>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={input}
            />
          </div>

          <div style={{ marginBottom: mode === 'register' ? '0.875rem' : '1.25rem' }}>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              style={input}
            />
          </div>

          {mode === 'register' && (
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={labelStyle}>Confirm Password</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
                style={input}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...btnPrimary,
              width: '100%',
              background: loading ? colors.textMuted : colors.navy,
              color: '#f8fafc',
              cursor: loading ? 'default' : 'pointer',
              justifyContent: 'center',
            }}
          >
            {loading ? '...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: fontSizes.base, color: colors.textMuted, fontFamily: fonts.sans }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
            style={{
              background: 'none',
              border: 'none',
              color: colors.blue,
              fontWeight: fontWeights.semibold,
              fontSize: fontSizes.base,
              textDecoration: 'underline',
              cursor: 'pointer',
              padding: 0,
              fontFamily: fonts.sans,
            }}
          >
            {mode === 'login' ? 'Create account' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
