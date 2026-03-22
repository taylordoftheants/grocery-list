import { useState } from 'react';

export default function AddToListModal({ lists, onConfirm, onClose, loading, onCreate }) {
  const [showCreate, setShowCreate] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!newListName.trim() || creating) return;
    setCreating(true);
    try {
      await onCreate(newListName.trim());
      setNewListName('');
      setShowCreate(false);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
    }}>
      <div style={{
        background: '#fff', borderRadius: '0.75rem',
        padding: '1.5rem', width: '100%', maxWidth: '360px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '0.25rem', color: '#111827' }}>
          Add to Shopping List
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
          Which list should the ingredients go to?
        </p>

        {lists.length === 0 ? (
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ color: '#6b7280', fontSize: '0.9375rem', marginBottom: '1rem' }}>
              You have no shopping lists.
            </p>
            {!showCreate ? (
              <button
                onClick={() => setShowCreate(true)}
                style={{ padding: '0.5rem 1rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '0.375rem', fontSize: '0.9375rem', cursor: 'pointer' }}
              >
                Create one now
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  autoFocus
                  value={newListName}
                  onChange={e => setNewListName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && newListName.trim() && handleCreate()}
                  placeholder="List name..."
                  style={{ flex: 1, padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.9375rem' }}
                />
                <button
                  onClick={handleCreate}
                  disabled={creating || !newListName.trim()}
                  style={{ padding: '0.5rem 0.75rem', background: creating || !newListName.trim() ? '#d1d5db' : '#2563eb', color: '#fff', border: 'none', borderRadius: '0.375rem', fontSize: '0.9375rem', cursor: creating || !newListName.trim() ? 'default' : 'pointer' }}
                >
                  {creating ? '...' : 'Create'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <ul style={{ listStyle: 'none', marginBottom: '1rem' }}>
            {lists.map(list => (
              <li key={list.id}>
                <button
                  disabled={loading}
                  onClick={() => onConfirm(list.id)}
                  style={{
                    width: '100%', textAlign: 'left',
                    padding: '0.625rem 0.75rem',
                    border: '1px solid #e5e7eb', borderRadius: '0.375rem',
                    background: '#fff', cursor: loading ? 'default' : 'pointer',
                    fontSize: '0.9375rem', color: '#374151',
                    marginBottom: '0.375rem',
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {list.name}
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '0.5rem',
            background: 'transparent', border: '1px solid #d1d5db',
            borderRadius: '0.375rem', fontSize: '0.9375rem',
            cursor: 'pointer', color: '#6b7280',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
