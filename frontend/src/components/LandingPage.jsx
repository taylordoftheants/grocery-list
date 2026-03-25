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
    marginBottom: '0.3rem',
    fontFamily: fonts.sans,
    letterSpacing: '0.03em',
    textTransform: 'uppercase',
  };

  const inputStyle = {
    ...input,
    border: `1px solid ${colors.border}`,
    background: colors.bgPage,
    color: colors.textPrimary,
    fontFamily: fonts.sans,
    transition: 'border-color 0.15s ease',
  };

  return (
    <div style={{
      minHeight: '100vh',
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #1a1a2e 0%, #16213e 55%, #0d1526 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      paddingTop: 'calc(2rem + env(safe-area-inset-top, 0px))',
      paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))',
    }}>
      {/* Crest */}
      <img
        src="/crest.png"
        alt="Family Crest"
        className="anim-fade-in"
        style={{
          width: '160px',
          maxWidth: '45vw',
          marginBottom: '1.25rem',
          filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.5)) sepia(0.15) brightness(1.05)',
        }}
      />

      {/* Title */}
      <h1
        className="anim-fade-in-up-d1"
        style={{
          fontFamily: fonts.display,
          fontWeight: fontWeights.bold,
          fontSize: 'clamp(1.75rem, 7vw, 2.5rem)',
          color: colors.white,
          letterSpacing: '0.04em',
          marginBottom: '0.375rem',
          textAlign: 'center',
        }}
      >
        Assist<span style={{ color: colors.amber }}>.</span>ant
      </h1>

      {/* Tagline */}
      <p
        className="anim-fade-in-up-d1"
        style={{
          fontFamily: fonts.display,
          fontWeight: fontWeights.normal,
          fontSize: fontSizes.xs,
          color: 'rgba(255,255,255,0.45)',
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          marginBottom: '2.25rem',
          textAlign: 'center',
        }}
      >
        Ad Astra Per Aspera
      </p>

      {/* Auth card */}
      <div
        className="anim-fade-in-up-d2"
        style={{
          width: '100%',
          maxWidth: '360px',
          background: colors.warmWhite,
          borderRadius: radii.xl,
          border: `1px solid ${colors.borderLight}`,
          padding: '1.75rem',
          boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
        }}
      >
        <h2 style={{
          fontFamily: fonts.display,
          fontSize: fontSizes.xl,
          fontWeight: fontWeights.semibold,
          color: colors.textPrimary,
          marginBottom: '1.375rem',
          textAlign: 'center',
          letterSpacing: '0.02em',
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
            border: `1px solid ${colors.errorBorder}`,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: mode === 'register' ? '1rem' : '1.375rem' }}>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              style={inputStyle}
            />
          </div>

          {mode === 'register' && (
            <div style={{ marginBottom: '1.375rem' }}>
              <label style={labelStyle}>Confirm Password</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
                style={inputStyle}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...btnPrimary,
              width: '100%',
              background: loading ? colors.amberDark : colors.amber,
              color: colors.charcoal,
              cursor: loading ? 'default' : 'pointer',
              justifyContent: 'center',
              fontFamily: fonts.display,
              fontWeight: fontWeights.semibold,
              letterSpacing: '0.04em',
              opacity: loading ? 0.8 : 1,
            }}
          >
            {loading ? '…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p style={{
          textAlign: 'center',
          marginTop: '1rem',
          fontSize: fontSizes.base,
          color: colors.textMuted,
          fontFamily: fonts.sans,
        }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
            style={{
              background: 'none',
              border: 'none',
              color: colors.amberDark,
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
