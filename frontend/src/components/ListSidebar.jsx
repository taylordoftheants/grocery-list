import { useState } from 'react';

export default function ListSidebar({ lists, selectedListId, onSelect, onCreate, onDelete, isOpen, isMobile, onToggle, onClose }) {
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newName.trim() || loading) return;
    setLoading(true);
    try {
      await onCreate(newName.trim());
      setNewName('');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (listId) => {
    onSelect(listId);
    if (isMobile) onClose();
  };

  const sidebarStyle = isMobile
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        zIndex: 200,
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s ease',
        width: '260px',
        borderRight: '1px solid #e5e7eb',
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        padding: '1rem',
      }
    : {
        width: '220px',
        borderRight: '1px solid #e5e7eb',
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        padding: '1rem',
        flexShrink: 0,
      };

  const canSubmit = newName.trim().length > 0 && !loading;

  return (
    <>
      {isMobile && !isOpen && (
        <button
          onClick={onToggle}
          style={{
            position: 'fixed',
            top: '0.75rem',
            left: '0.75rem',
            zIndex: 300,
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '0.375rem',
            padding: '0.4rem 0.75rem',
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          ☰ Lists
        </button>
      )}

      <aside style={sidebarStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: '600', color: '#374151' }}>
            Lists
          </h2>
          {isMobile && (
            <button
              onClick={onClose}
              aria-label="Close sidebar"
              style={{
                border: 'none',
                background: 'transparent',
                color: '#6b7280',
                fontSize: '1.25rem',
                padding: '0.25rem',
                lineHeight: 1,
                cursor: 'pointer',
              }}
            >
              ×
            </button>
          )}
        </div>

        <ul style={{ listStyle: 'none', flex: 1, overflowY: 'auto' }}>
          {lists.map(list => (
            <li key={list.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              marginBottom: '0.25rem',
            }}>
              <button
                onClick={() => handleSelect(list.id)}
                style={{
                  flex: 1,
                  textAlign: 'left',
                  padding: '0.5rem 0.5rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  background: selectedListId === list.id ? '#eff6ff' : 'transparent',
                  fontWeight: selectedListId === list.id ? '600' : 'normal',
                  color: selectedListId === list.id ? '#1d4ed8' : '#374151',
                  fontSize: '0.9375rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                }}
              >
                {list.name}
              </button>
              <button
                onClick={() => onDelete(list.id)}
                aria-label={`Delete ${list.name}`}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: '#9ca3af',
                  fontSize: '1.125rem',
                  padding: '0.375rem',
                  borderRadius: '0.25rem',
                  lineHeight: 1,
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </li>
          ))}
        </ul>

        <form onSubmit={handleSubmit} style={{ marginTop: '0.75rem', display: 'flex', gap: '0.25rem' }}>
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="New list..."
            style={{
              flex: 1,
              padding: '0.5rem 0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '0.9375rem',
            }}
          />
          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              padding: '0.5rem 0.75rem',
              background: canSubmit ? '#2563eb' : '#d1d5db',
              color: '#fff',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.9375rem',
              cursor: canSubmit ? 'pointer' : 'default',
              transition: 'background 0.15s',
            }}
          >
            +
          </button>
        </form>
      </aside>
    </>
  );
}
