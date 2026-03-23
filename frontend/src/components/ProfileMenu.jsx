import { useState, useEffect, useRef } from 'react';
import { api } from '../api';

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

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        top: '3rem',
        right: '0.75rem',
        zIndex: 200,
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        width: '280px',
        overflow: 'hidden',
      }}
    >
      {/* Email header */}
      <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid #f3f4f6', background: '#f9fafb' }}>
        <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.125rem' }}>Signed in as</p>
        <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827', wordBreak: 'break-all' }}>{user.email}</p>
      </div>

      <div style={{ padding: '0.5rem' }}>
        {/* Change Password toggle */}
        <button
          onClick={() => { setShowChangePassword(v => !v); setError(null); setSuccess(false); }}
          style={{
            width: '100%', textAlign: 'left', padding: '0.5rem 0.75rem',
            background: 'transparent', border: 'none', borderRadius: '0.375rem',
            fontSize: '0.875rem', color: '#374151', cursor: 'pointer',
          }}
        >
          {showChangePassword ? '▾' : '▸'} Change Password
        </button>

        {showChangePassword && (
          <form onSubmit={handleChangePassword} style={{ padding: '0.5rem 0.75rem 0.75rem' }}>
            {error && (
              <p style={{ fontSize: '0.8125rem', color: '#991b1b', background: '#fee2e2', padding: '0.375rem 0.5rem', borderRadius: '0.25rem', marginBottom: '0.5rem' }}>
                {error}
              </p>
            )}
            {success && (
              <p style={{ fontSize: '0.8125rem', color: '#065f46', background: '#d1fae5', padding: '0.375rem 0.5rem', borderRadius: '0.25rem', marginBottom: '0.5rem' }}>
                Password updated!
              </p>
            )}
            {[
              { label: 'Current Password', value: currentPassword, onChange: setCurrentPassword, autoComplete: 'current-password' },
              { label: 'New Password', value: newPassword, onChange: setNewPassword, autoComplete: 'new-password' },
              { label: 'Confirm New Password', value: confirmPassword, onChange: setConfirmPassword, autoComplete: 'new-password' },
            ].map(({ label, value, onChange, autoComplete }) => (
              <div key={label} style={{ marginBottom: '0.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.2rem' }}>{label}</label>
                <input
                  type="password"
                  value={value}
                  onChange={e => onChange(e.target.value)}
                  required
                  autoComplete={autoComplete}
                  style={{
                    width: '100%', padding: '0.375rem 0.5rem',
                    border: '1px solid #d1d5db', borderRadius: '0.25rem',
                    fontSize: '0.875rem',
                  }}
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '0.4rem',
                background: loading ? '#d1d5db' : '#1a2744',
                color: '#fff', border: 'none', borderRadius: '0.25rem',
                fontSize: '0.8125rem', fontWeight: '600', cursor: loading ? 'default' : 'pointer',
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
            style={{
              width: '100%', textAlign: 'left', padding: '0.5rem 0.75rem',
              background: 'transparent', border: 'none', borderRadius: '0.375rem',
              fontSize: '0.875rem', color: '#374151', cursor: 'pointer',
            }}
          >
            ⚙ Admin Console
          </button>
        )}

        {/* Divider + Sign Out */}
        <div style={{ borderTop: '1px solid #f3f4f6', marginTop: '0.25rem', paddingTop: '0.25rem' }}>
          <button
            onClick={onLogout}
            style={{
              width: '100%', textAlign: 'left', padding: '0.5rem 0.75rem',
              background: 'transparent', border: 'none', borderRadius: '0.375rem',
              fontSize: '0.875rem', color: '#dc2626', cursor: 'pointer', fontWeight: '500',
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
