import { useState, useEffect } from 'react';
import { api } from '../api';

function formatDate(str) {
  if (!str) return 'Never';
  const d = new Date(str + (str.includes('T') ? '' : 'Z'));
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminView() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getAdminUsers()
      .then(setUsers)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main style={{ padding: '1.5rem', background: '#f9fafb', minHeight: '100%' }}>
      <h1 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111827', marginBottom: '0.25rem' }}>
        Admin Console
      </h1>
      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem' }}>
        {users.length} registered {users.length === 1 ? 'user' : 'users'}
      </p>

      {loading && <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Loading...</p>}
      {error && (
        <p style={{ color: '#991b1b', background: '#fee2e2', padding: '0.75rem', borderRadius: '0.375rem', fontSize: '0.875rem' }}>
          {error}
        </p>
      )}

      {!loading && !error && (
        <div style={{ background: '#fff', borderRadius: '0.5rem', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Email', 'Joined', 'Last Login', 'Admin'].map(h => (
                  <th key={h} style={{ padding: '0.625rem 1rem', textAlign: 'left', fontWeight: '600', color: '#6b7280', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id} style={{ borderBottom: i < users.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                  <td style={{ padding: '0.75rem 1rem', color: '#111827', fontWeight: '500' }}>{u.email}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#6b7280' }}>{formatDate(u.created_at)}</td>
                  <td style={{ padding: '0.75rem 1rem', color: u.last_login ? '#6b7280' : '#9ca3af', fontStyle: u.last_login ? 'normal' : 'italic' }}>
                    {formatDate(u.last_login)}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {u.is_admin ? (
                      <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#1a2744', background: '#e8eaf0', padding: '0.2rem 0.5rem', borderRadius: '1rem' }}>
                        Admin
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
