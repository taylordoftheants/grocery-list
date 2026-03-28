import { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { colors, fonts, fontSizes, fontWeights, radii, shadows, input, btnPrimary } from '../theme';

export default function ProfileMenu({ user, onLogout, onNavigateAdmin, onNavigateItemMemory, onClose, onOpenKroger }) {
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [krogerStatus, setKrogerStatus] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    api.krogerStatus()
      .then(setKrogerStatus)
      .catch(() => setKrogerStatus({ connected: false }));
  }, []);

  const handleKrogerDisconnect = async () => {
    await api.krogerDisconnect();
    setKrogerStatus({ connected: false });
  };

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

        {/* Ant's Memory */}
        <button
          onClick={() => { onNavigateItemMemory(); onClose(); }}
          style={menuBtnStyle}
          title="What Ant remembers about your items"
        >
          🧠 Ant's Memory
        </button>

        {/* Kroger connection */}
        <div style={{ borderTop: `1px solid ${colors.charcoalBorder}`, marginTop: '0.25rem', paddingTop: '0.25rem' }}>
          <div style={{ padding: '0.375rem 0.75rem 0.25rem' }}>
            <p style={{ fontSize: fontSizes.xs, color: 'rgba(255,255,255,0.35)', margin: '0 0 0.375rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: fonts.display }}>
              Harris Teeter
            </p>
            {krogerStatus === null ? (
              <p style={{ fontSize: fontSizes.sm, color: 'rgba(255,255,255,0.4)', fontFamily: fonts.sans, margin: 0 }}>Loading…</p>
            ) : krogerStatus.connected ? (
              <>
                <p style={{ fontSize: fontSizes.sm, color: 'rgba(255,255,255,0.7)', fontFamily: fonts.sans, margin: '0 0 0.375rem' }}>
                  {krogerStatus.location_name || 'Connected'}
                </p>
                <div style={{ display: 'flex', gap: '0.375rem' }}>
                  <button
                    onClick={() => { onOpenKroger('change'); onClose(); }}
                    style={{ flex: 1, padding: '0.3rem 0.5rem', background: 'rgba(255,255,255,0.08)', border: `1px solid rgba(255,255,255,0.15)`, borderRadius: radii.sm, fontSize: fontSizes.xs, color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontFamily: fonts.sans }}
                  >
                    Change Store
                  </button>
                  <button
                    onClick={handleKrogerDisconnect}
                    style={{ flex: 1, padding: '0.3rem 0.5rem', background: 'rgba(255,255,255,0.08)', border: `1px solid rgba(255,255,255,0.15)`, borderRadius: radii.sm, fontSize: fontSizes.xs, color: colors.error, cursor: 'pointer', fontFamily: fonts.sans }}
                  >
                    Disconnect
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={() => { onOpenKroger('connect'); onClose(); }}
                style={{ width: '100%', padding: '0.3rem 0.5rem', background: 'rgba(255,255,255,0.08)', border: `1px solid rgba(255,255,255,0.15)`, borderRadius: radii.sm, fontSize: fontSizes.xs, color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontFamily: fonts.sans, textAlign: 'left' }}
              >
                Connect Harris Teeter
              </button>
            )}
          </div>
        </div>

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
