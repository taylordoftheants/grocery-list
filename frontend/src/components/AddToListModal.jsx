import { useState } from 'react';
import { colors, fonts, fontSizes, fontWeights, radii, shadows, card, input, btnPrimary, btnSecondary } from '../theme';

export default function AddToListModal({ lists, onConfirm, onClose, loading, onCreate, isMobile }) {
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

  const modalCard = isMobile ? {
    ...card,
    borderRadius: '1rem 1rem 0 0',
    padding: '1.5rem',
    width: '100%',
    maxWidth: '100%',
    maxHeight: '90vh',
    boxShadow: shadows.modal,
    paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.5rem)',
  } : {
    ...card,
    borderRadius: radii.xl,
    padding: '1.5rem',
    width: '100%',
    maxWidth: '360px',
    boxShadow: shadows.modal,
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: isMobile ? 'flex-end' : 'center',
      justifyContent: 'center',
      padding: isMobile ? '0' : '1rem',
    }}>
      <div style={modalCard}>
        <h2 style={{ fontSize: fontSizes.xl, fontWeight: fontWeights.bold, marginBottom: '0.25rem', color: colors.textPrimary, fontFamily: fonts.sans }}>
          Add to Shopping List
        </h2>
        <p style={{ fontSize: fontSizes.base, color: colors.textMuted, marginBottom: '1rem', fontFamily: fonts.sans }}>
          Which list should the ingredients go to?
        </p>

        {lists.length === 0 ? (
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ color: colors.textMuted, fontSize: fontSizes.md, marginBottom: '1rem', fontFamily: fonts.sans }}>
              You have no shopping lists.
            </p>
            {!showCreate ? (
              <button
                onClick={() => setShowCreate(true)}
                style={{ ...btnPrimary }}
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
                  style={{ ...input, flex: 1, width: 'auto' }}
                />
                <button
                  onClick={handleCreate}
                  disabled={creating || !newListName.trim()}
                  style={{
                    ...btnPrimary,
                    background: creating || !newListName.trim() ? colors.borderMid : colors.blue,
                    cursor: creating || !newListName.trim() ? 'default' : 'pointer',
                    flexShrink: 0,
                  }}
                >
                  {creating ? '...' : 'Create'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <ul style={{ listStyle: 'none', marginBottom: '1rem', padding: 0 }}>
            {lists.map(list => (
              <li key={list.id}>
                <button
                  disabled={loading}
                  onClick={() => onConfirm(list.id)}
                  style={{
                    width: '100%', textAlign: 'left',
                    padding: '0.75rem',
                    border: `1px solid ${colors.border}`,
                    borderRadius: radii.md,
                    background: colors.bgCard,
                    cursor: loading ? 'default' : 'pointer',
                    fontSize: fontSizes.md,
                    color: colors.textSecondary,
                    marginBottom: '0.375rem',
                    opacity: loading ? 0.6 : 1,
                    minHeight: '52px',
                    fontFamily: fonts.sans,
                    fontWeight: fontWeights.medium,
                    transition: 'background 0.15s ease',
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
          style={{ ...btnSecondary, width: '100%' }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
