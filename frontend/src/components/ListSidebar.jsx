import { useState } from 'react';

export default function ListSidebar({ lists, selectedListId, onSelect, onCreate, onDelete, isMobile }) {
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newName.trim() || loading) return;
    setLoading(true);
    try {
      await onCreate(newName.trim());
      setNewName('');
      setShowAddForm(false);
    } finally {
      setLoading(false);
    }
  };

  // ── Mobile: inline horizontal bar ────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{
        background: '#fff',
        borderBottom: '1px solid #e5e7eb',
        padding: '0.5rem 0.75rem',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {lists.map(list => (
            <button
              key={list.id}
              onClick={() => onSelect(list.id)}
              style={{
                flexShrink: 0,
                padding: '0.3rem 0.75rem',
                border: '1px solid #e5e7eb',
                borderRadius: '1rem',
                background: selectedListId === list.id ? '#2563eb' : '#fff',
                color: selectedListId === list.id ? '#fff' : '#374151',
                fontSize: '0.875rem',
                fontWeight: selectedListId === list.id ? '600' : 'normal',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {list.name}
            </button>
          ))}

          {showAddForm ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.25rem', flexShrink: 0, alignItems: 'center' }}>
              <input
                autoFocus
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="List name"
                style={{ padding: '0.3rem 0.5rem', border: '1px solid #d1d5db', borderRadius: '1rem', fontSize: '0.875rem', width: '110px' }}
              />
              <button type="submit" disabled={loading || !newName.trim()} style={{ padding: '0.3rem 0.5rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '1rem', fontSize: '0.8125rem', cursor: 'pointer' }}>✓</button>
              <button type="button" onClick={() => { setShowAddForm(false); setNewName(''); }} style={{ padding: '0.3rem 0.5rem', background: 'transparent', border: '1px solid #d1d5db', borderRadius: '1rem', fontSize: '0.8125rem', cursor: 'pointer', color: '#6b7280' }}>✕</button>
            </form>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              style={{ flexShrink: 0, padding: '0.3rem 0.625rem', border: '1px dashed #d1d5db', borderRadius: '1rem', background: 'transparent', color: '#6b7280', fontSize: '0.875rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              + New
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Desktop: sidebar ──────────────────────────────────────────────────────────
  const canSubmit = newName.trim().length > 0 && !loading;

  return (
    <aside style={{
      width: '220px',
      borderRight: '1px solid #e5e7eb',
      background: '#fff',
      display: 'flex',
      flexDirection: 'column',
      padding: '1rem',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: '600', color: '#374151' }}>Lists</h2>
      </div>

      <ul style={{ listStyle: 'none', flex: 1, overflowY: 'auto' }}>
        {lists.map(list => (
          <li key={list.id} style={{ marginBottom: '0.25rem' }}>
            {confirmDeleteId === list.id ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.5rem', borderRadius: '0.375rem', background: '#fee2e2', border: '1px solid #fca5a5' }}>
                <span style={{ flex: 1, fontSize: '0.8125rem', color: '#991b1b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Delete "{list.name}"?
                </span>
                <button
                  onClick={() => { onDelete(list.id); setConfirmDeleteId(null); }}
                  style={{ border: 'none', background: '#dc2626', color: '#fff', borderRadius: '0.25rem', fontSize: '0.75rem', padding: '0.2rem 0.5rem', cursor: 'pointer', flexShrink: 0 }}
                >
                  Delete
                </button>
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  style={{ border: '1px solid #d1d5db', background: 'transparent', color: '#6b7280', borderRadius: '0.25rem', fontSize: '0.75rem', padding: '0.2rem 0.5rem', cursor: 'pointer', flexShrink: 0 }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <button
                  onClick={() => onSelect(list.id)}
                  style={{
                    flex: 1, textAlign: 'left',
                    padding: '0.5rem 0.5rem',
                    borderRadius: '0.375rem', border: 'none',
                    background: selectedListId === list.id ? '#eff6ff' : 'transparent',
                    fontWeight: selectedListId === list.id ? '600' : 'normal',
                    color: selectedListId === list.id ? '#1d4ed8' : '#374151',
                    fontSize: '0.9375rem',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    cursor: 'pointer',
                  }}
                >
                  {list.name}
                </button>
                <button
                  onClick={() => setConfirmDeleteId(list.id)}
                  aria-label={`Delete ${list.name}`}
                  style={{ border: 'none', background: 'transparent', color: '#9ca3af', fontSize: '1.125rem', padding: '0.375rem', borderRadius: '0.25rem', lineHeight: 1, cursor: 'pointer' }}
                >
                  ×
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      <form onSubmit={handleSubmit} style={{ marginTop: '0.75rem', display: 'flex', gap: '0.25rem' }}>
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="New list..."
          style={{ flex: 1, padding: '0.5rem 0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.9375rem' }}
        />
        <button
          type="submit"
          disabled={!canSubmit}
          style={{
            padding: '0.5rem 0.75rem',
            background: canSubmit ? '#2563eb' : '#d1d5db',
            color: '#fff', border: 'none', borderRadius: '0.375rem',
            fontSize: '0.9375rem', cursor: canSubmit ? 'pointer' : 'default',
            transition: 'background 0.15s',
          }}
        >
          +
        </button>
      </form>
    </aside>
  );
}
