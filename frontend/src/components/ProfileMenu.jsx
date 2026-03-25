import { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { colors, fonts, fontSizes, fontWeights, radii, shadows, input, btnPrimary } from '../theme';

export default function ProfileMenu({ user, onLogout, onNavigateAdmin, onClose }) {
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => { setSuccess(false); setShowChangePassword(false); }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const menuBtnStyle = {
    width: '100%', textAlign: 'left', padding: '0.5rem 0.75rem',
    background: 'transparent', border: 'none', borderRadius: radii.md,
    fontSize: fontSizes.base, color: 'rgba(255,255,255,0.8)', cursor: 'pointer',
    fontFamily: fonts.sans, minHeight: '40px',
  };

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        top: '3.5rem',
        right: '0.75rem',
        zIndex: 200,
        background: colors.charcoal,
        border: `1px solid ${colors.charcoalBorder}`,
        borderRadius: radii.lg,
        boxShadow: shadows.xl,
        width: '280px',
        maxWidth: 'calc(100vw - 1.5rem)',
        overflow: 'hidden',
        fontFamily: fonts.sans,
      }}
    >
      {/* Email header */}
      <div style={{ padding: '0.875rem 1rem', borderBottom: `1px solid ${colors.charcoalBorder}`, background: colors.charcoalMid }}>
        <p style={{ fontSize: fontSizes.sm, color: 'rgba(255,255,255,0.45)', marginBottom: '0.125rem', fontFamily: fonts.display, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Signed in as</p>
        <p style={{ fontSize: fontSizes.base, fontWeight: fontWeights.semibold, color: colors.white, wordBreak: 'break-all' }}>{user.email}</p>
      </div>

      <div style={{ padding: '0.5rem' }}>
        {/* Change Password toggle */}
        <button
          onClick={() => { setShowChangePassword(v => !v); setError(null); setSuccess(false); }}
          style={menuBtnStyle}
        >
          {showChangePassword ? '▾' : '▸'} Change Password
        </button>

        {showChangePassword && (
          <form onSubmit={handleChangePassword} style={{ padding: '0.5rem 0.75rem 0.75rem' }}>
            {error && (
              <p style={{ fontSize: fontSizes.base, color: colors.errorText, background: colors.errorBg, padding: '0.375rem 0.5rem', borderRadius: radii.sm, marginBottom: '0.5rem' }}>
                {error}
              </p>
            )}
            {success && (
              <p style={{ fontSize: fontSizes.base, color: colors.successText, background: colors.successBg, padding: '0.375rem 0.5rem', borderRadius: radii.sm, marginBottom: '0.5rem' }}>
                Password updated!
              </p>
            )}
            {[
              { label: 'Current Password', value: currentPassword, onChange: setCurrentPassword, autoComplete: 'current-password' },
              { label: 'New Password', value: newPassword, onChange: setNewPassword, autoComplete: 'new-password' },
              { label: 'Confirm New Password', value: confirmPassword, onChange: setConfirmPassword, autoComplete: 'new-password' },
            ].map(({ label, value, onChange, autoComplete }) => (
              <div key={label} style={{ marginBottom: '0.5rem' }}>
                <label style={{ display: 'block', fontSize: fontSizes.sm, color: 'rgba(255,255,255,0.55)', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</label>
                <input
                  type="password"
                  value={value}
                  onChange={e => onChange(e.target.value)}
                  required
                  autoComplete={autoComplete}
                  style={{ ...input, padding: '0.375rem 0.5rem', minHeight: '40px' }}
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={loading}
              style={{
                ...btnPrimary,
                width: '100%',
                background: loading ? colors.amberDark : colors.amber,
                color: colors.charcoal,
                cursor: loading ? 'default' : 'pointer',
                minHeight: '40px',
                padding: '0.4rem',
              }}
            >
              {loading ? 'Saving...' : 'Update Password'}
            </button>
          </form>
        )}

        {/* Admin Console */}
        {user.is_admin === 1 && (
          <button
            onClick={() => { onNavigateAdmin(); onClose(); }}
            style={menuBtnStyle}
            title="For the colony 🐜"
          >
            ⚙ Admin Console
          </button>
        )}

        {/* Divider + Sign Out */}
        <div style={{ borderTop: `1px solid ${colors.charcoalBorder}`, marginTop: '0.25rem', paddingTop: '0.25rem' }}>
          <button
            onClick={onLogout}
            style={{ ...menuBtnStyle, color: colors.error, fontWeight: fontWeights.medium }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
