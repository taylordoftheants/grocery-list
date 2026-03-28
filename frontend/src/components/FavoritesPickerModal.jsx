import { useState } from 'react';
import { colors, fonts, fontSizes, fontWeights, radii, shadows, btnPrimary, btnSecondary, sectionLabel } from '../theme';
import { buildSubCategories } from './RecipesView';

export default function FavoritesPickerModal({ recipe, onConfirm, onClose, isMobile }) {
  const [checkedIds, setCheckedIds] = useState(new Set());
  const [loading, setLoading] = useState(false);

  const toggleItem = (id) => setCheckedIds(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const subGroups = buildSubCategories(recipe.ingredients ?? []);

  const handleSubmit = async () => {
    if (checkedIds.size === 0) { onClose(); return; }
    setLoading(true);
    try {
      await onConfirm([...checkedIds]);
    } finally {
      setLoading(false);
    }
  };

  const modalCard = isMobile ? {
    borderRadius: '1rem 1rem 0 0',
    padding: '1.5rem',
    width: '100%',
    maxWidth: '100%',
    maxHeight: '88vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    background: colors.bgCard,
    boxShadow: shadows.modal,
    paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.5rem)',
  } : {
    borderRadius: radii.xl,
    padding: '1.5rem',
    width: '100%',
    maxWidth: '380px',
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
    background: colors.bgCard,
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
        <h2 style={{ fontSize: fontSizes.xl, fontWeight: fontWeights.bold, marginBottom: '0.25rem', color: colors.textPrimary, flexShrink: 0, fontFamily: fonts.sans }}>
          Add Favorites to Week
        </h2>
        <p style={{ fontSize: fontSizes.sm, color: colors.textSubtle, marginBottom: '1rem', flexShrink: 0, fontFamily: fonts.sans }}>
          Select items to add to your week.
        </p>

        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem' }}>
          {subGroups.length === 0 ? (
            <p style={{ color: colors.textSubtle, fontSize: fontSizes.base, fontStyle: 'italic', fontFamily: fonts.sans }}>
              No favorites yet — add items in the Recipes tab.
            </p>
          ) : (
            subGroups.map(group => (
              <div key={group.name} style={{ marginBottom: '0.875rem' }}>
                <p style={{ ...sectionLabel, marginBottom: '0.375rem' }}>
                  {group.name}
                </p>
                {group.items.map(ing => {
                  const isChecked = checkedIds.has(ing.id);
                  return (
                    <label key={ing.id} style={{
                      display: 'flex', alignItems: 'center', gap: '0.625rem',
                      padding: '0.5rem 0.625rem', borderRadius: radii.md,
                      cursor: 'pointer',
                      background: isChecked ? colors.blueLight : 'transparent',
                      marginBottom: '0.125rem',
                    }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleItem(ing.id)}
                        style={{ width: '1rem', height: '1rem', cursor: 'pointer', flexShrink: 0, accentColor: colors.blue }}
                      />
                      <span style={{ fontSize: fontSizes.md, color: colors.textSecondary, fontFamily: fonts.sans }}>{ing.name}</span>
                    </label>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
          <button
            onClick={handleSubmit}
            disabled={loading || checkedIds.size === 0}
            style={{
              ...btnPrimary,
              flex: 1,
              background: loading || checkedIds.size === 0 ? colors.borderMid : colors.blue,
              cursor: loading || checkedIds.size === 0 ? 'default' : 'pointer',
              justifyContent: 'center',
            }}
          >
            {loading ? 'Adding...' : checkedIds.size > 0 ? `Add (${checkedIds.size})` : 'Add'}
          </button>
          <button onClick={onClose} style={{ ...btnSecondary }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
