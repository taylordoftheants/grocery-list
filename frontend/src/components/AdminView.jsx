import { useState, useEffect } from 'react';
import { api } from '../api';
import { colors, fonts, fontSizes, fontWeights, radii, card, sectionLabel } from '../theme';

function formatDate(str) {
  if (!str) return 'Never';
  const d = new Date(str + (str.includes('T') ? '' : 'Z'));
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminView() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [antHovered, setAntHovered] = useState(false);
  const [cacheMsg, setCacheMsg] = useState(null);
  const [cacheClearing, setCacheClearing] = useState(false);

  useEffect(() => {
    api.getAdminUsers()
      .then(setUsers)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function handleClearCache() {
    setCacheClearing(true);
    api.clearPantryCache()
      .then(({ cleared }) => {
        setCacheMsg(`Cleared ${cleared} cached classification${cleared === 1 ? '' : 's'}`);
        setTimeout(() => setCacheMsg(null), 4000);
      })
      .catch(err => setCacheMsg(`Error: ${err.message}`))
      .finally(() => setCacheClearing(false));
  }

  return (
    <main style={{ padding: '1.5rem 1rem', background: colors.bgPage, minHeight: '100%', fontFamily: fonts.sans }}>
      <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: fontSizes['2xl'], fontWeight: fontWeights.bold, color: colors.textPrimary, marginBottom: '0.25rem' }}>
          Admin Console
        </h1>
        <p style={{ fontSize: fontSizes.base, color: colors.textMuted }}>
          {users.length} registered {users.length === 1 ? 'user' : 'users'}
        </p>

        {/* Ant easter egg — secondary placement in admin */}
        <span
          title="For the colony 🐜"
          onMouseEnter={() => setAntHovered(true)}
          onMouseLeave={() => setAntHovered(false)}
          style={{
            position: 'absolute',
            bottom: '-4px',
            right: '0',
            fontSize: '1rem',
            opacity: antHovered ? 0.85 : 0.25,
            cursor: 'default',
            userSelect: 'none',
            display: 'inline-block',
            transform: antHovered ? 'scale(1.5) rotate(-15deg)' : 'scale(1) rotate(0deg)',
            transition: 'transform 0.2s ease, opacity 0.2s ease',
          }}
        >
          🐜
        </span>
      </div>

      {loading && <p style={{ color: colors.textSubtle, fontSize: fontSizes.base }}>Loading...</p>}
      {error && (
        <p style={{ color: colors.errorText, background: colors.errorBg, padding: '0.75rem', borderRadius: radii.md, fontSize: fontSizes.base }}>
          {error}
        </p>
      )}

      {!loading && !error && (
        <div style={{ ...card, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: fontSizes.base, minWidth: '400px' }}>
            <thead>
              <tr style={{ background: colors.bgSurface, borderBottom: `1px solid ${colors.border}` }}>
                {['Email', 'Joined', 'Last Login', 'Admin'].map(h => (
                  <th key={h} style={{ ...sectionLabel, padding: '0.625rem 1rem', textAlign: 'left', display: 'table-cell' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id} style={{ borderBottom: i < users.length - 1 ? `1px solid ${colors.borderLight}` : 'none' }}>
                  <td style={{ padding: '0.75rem 1rem', color: colors.textPrimary, fontWeight: fontWeights.medium }}>{u.email}</td>
                  <td style={{ padding: '0.75rem 1rem', color: colors.textMuted }}>{formatDate(u.created_at)}</td>
                  <td style={{ padding: '0.75rem 1rem', color: u.last_login ? colors.textMuted : colors.textSubtle, fontStyle: u.last_login ? 'normal' : 'italic' }}>
                    {formatDate(u.last_login)}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {u.is_admin ? (
                      <span style={{ fontSize: fontSizes.sm, fontWeight: fontWeights.semibold, color: colors.navy, background: colors.blueLight, padding: '0.2rem 0.625rem', borderRadius: radii.full }}>
                        Admin
                      </span>
                    ) : (
                      <span style={{ fontSize: fontSizes.sm, color: colors.textSubtle }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && (
        <div style={{ marginTop: '1.5rem' }}>
          <p style={{ ...sectionLabel, marginBottom: '0.75rem' }}>Classifier</p>
          <div style={{ ...card, display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: fontSizes.base, color: colors.textPrimary, fontWeight: fontWeights.medium, margin: 0 }}>
                Clear classification cache
              </p>
              <p style={{ fontSize: fontSizes.sm, color: colors.textMuted, margin: '0.2rem 0 0' }}>
                Forces all items to be re-classified on next Kroger modal open. Use after prompt changes or to fix bad classifications.
              </p>
            </div>
            <button
              onClick={handleClearCache}
              disabled={cacheClearing}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: radii.md,
                border: `1px solid ${colors.border}`,
                background: cacheClearing ? colors.bgSurface : colors.bgPage,
                color: cacheClearing ? colors.textSubtle : colors.textPrimary,
                fontSize: fontSizes.sm,
                fontWeight: fontWeights.medium,
                cursor: cacheClearing ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {cacheClearing ? 'Clearing…' : 'Clear cache'}
            </button>
            {cacheMsg && (
              <span style={{ fontSize: fontSizes.sm, color: colors.textMuted, fontStyle: 'italic' }}>
                {cacheMsg}
              </span>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
