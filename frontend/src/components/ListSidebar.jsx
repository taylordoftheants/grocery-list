import { useState } from 'react';
import { colors, fonts, fontSizes, fontWeights, radii, input, btnPrimary } from '../theme';

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
        background: colors.white,
        borderBottom: `1px solid ${colors.border}`,
        padding: '0.5rem 1rem',
        flexShrink: 0,
        fontFamily: fonts.sans,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {lists.map(list => (
            <button
              key={list.id}
              onClick={() => onSelect(list.id)}
              style={{
                flexShrink: 0,
                padding: '0.375rem 0.75rem',
                border: `1px solid ${selectedListId === list.id ? colors.blue : colors.border}`,
                borderRadius: radii.full,
                background: selectedListId === list.id ? colors.blue : colors.white,
                color: selectedListId === list.id ? colors.white : colors.textSecondary,
                fontSize: fontSizes.base,
                fontWeight: selectedListId === list.id ? fontWeights.semibold : fontWeights.normal,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                minHeight: '36px',
                fontFamily: fonts.sans,
                transition: 'background 0.15s ease',
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
                style={{ ...input, padding: '0.375rem 0.625rem', width: '110px', minHeight: '36px', borderRadius: radii.full }}
              />
              <button type="submit" disabled={loading || !newName.trim()} style={{ padding: '0.375rem 0.625rem', background: colors.blue, color: colors.white, border: 'none', borderRadius: radii.full, fontSize: fontSizes.base, cursor: 'pointer', minHeight: '36px' }}>✓</button>
              <button type="button" onClick={() => { setShowAddForm(false); setNewName(''); }} style={{ padding: '0.375rem 0.625rem', background: 'transparent', border: `1px solid ${colors.borderMid}`, borderRadius: radii.full, fontSize: fontSizes.base, cursor: 'pointer', color: colors.textMuted, minHeight: '36px' }}>✕</button>
            </form>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              style={{ flexShrink: 0, padding: '0.375rem 0.75rem', border: `1px dashed ${colors.borderMid}`, borderRadius: radii.full, background: 'transparent', color: colors.textMuted, fontSize: fontSizes.base, cursor: 'pointer', whiteSpace: 'nowrap', minHeight: '36px', fontFamily: fonts.sans }}
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
      borderRight: `1px solid ${colors.border}`,
      background: colors.white,
      display: 'flex',
      flexDirection: 'column',
      padding: '1rem',
      flexShrink: 0,
      fontFamily: fonts.sans,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <h2 style={{ fontSize: fontSizes.lg, fontWeight: fontWeights.bold, color: colors.textPrimary }}>Lists</h2>
        <button
          onClick={() => setShowAddForm(v => !v)}
          style={{ fontSize: fontSizes.md, color: colors.blue, background: 'none', border: 'none', cursor: 'pointer', fontWeight: fontWeights.semibold, fontFamily: fonts.sans }}
        >
          + New
        </button>
      </div>

      <ul style={{ listStyle: 'none', flex: 1, overflowY: 'auto', padding: 0, margin: 0 }}>
        {lists.map(list => (
          <li key={list.id} style={{ marginBottom: '0.375rem' }}>
            {confirmDeleteId === list.id ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.5rem', borderRadius: radii.md, background: colors.errorBg, border: `1px solid ${colors.errorBorder}` }}>
                <span style={{ flex: 1, fontSize: fontSizes.sm, color: colors.errorText, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Delete "{list.name}"?
                </span>
                <button
                  onClick={() => { onDelete(list.id); setConfirmDeleteId(null); }}
                  style={{ border: 'none', background: colors.error, color: colors.white, borderRadius: radii.sm, fontSize: fontSizes.sm, padding: '0.2rem 0.5rem', cursor: 'pointer', flexShrink: 0 }}
                >
                  Delete
                </button>
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  style={{ border: `1px solid ${colors.borderMid}`, background: 'transparent', color: colors.textMuted, borderRadius: radii.sm, fontSize: fontSizes.sm, padding: '0.2rem 0.5rem', cursor: 'pointer', flexShrink: 0 }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${selectedListId === list.id ? colors.blueBorder : colors.border}`, borderRadius: radii.md, background: selectedListId === list.id ? colors.blueLight : colors.bgCard }}>
                <button
                  onClick={() => onSelect(list.id)}
                  style={{
                    flex: 1, textAlign: 'left',
                    padding: '0.5rem 0.75rem',
                    border: 'none', borderRadius: radii.md,
                    background: 'transparent',
                    fontWeight: selectedListId === list.id ? fontWeights.semibold : fontWeights.normal,
                    color: selectedListId === list.id ? colors.blueDark : colors.textSecondary,
                    fontSize: fontSizes.base,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    fontFamily: fonts.sans,
                  }}
                >
                  {list.name}
                </button>
                <button
                  onClick={() => setConfirmDeleteId(list.id)}
                  aria-label={`Delete ${list.name}`}
                  style={{ border: 'none', background: 'transparent', color: colors.textSubtle, fontSize: '1rem', padding: '0.375rem 0.5rem', borderRadius: `0 ${radii.md} ${radii.md} 0`, lineHeight: 1, cursor: 'pointer', flexShrink: 0 }}
                >
                  ×
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      {showAddForm && (
        <form onSubmit={handleSubmit} style={{ marginTop: '0.75rem', display: 'flex', gap: '0.25rem' }}>
          <input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="List name..."
            style={{ ...input, flex: 1, width: 'auto', minHeight: '40px' }}
          />
          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              ...btnPrimary,
              padding: '0.5rem 0.75rem',
              background: canSubmit ? colors.blue : colors.borderMid,
              cursor: canSubmit ? 'pointer' : 'default',
              flexShrink: 0,
              minHeight: '40px',
            }}
          >
            +
          </button>
        </form>
      )}
    </aside>
  );
}
