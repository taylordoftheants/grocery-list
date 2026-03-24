import { useState } from 'react';
import { colors, fonts, fontSizes, fontWeights, radii, shadows, card, input, btnPrimary, btnSecondary, sectionLabel } from '../theme';

const CATEGORIES = ['Core Meals', 'Extras / Sauces'];

export default function AddToDayModal({ recipes, weekRecipes, leftoversMode, date, dayLabel, initialCheckedId, onConfirm, onClose, onNewRecipe, onSwitchToLeftovers, isMobile }) {
  const [checkedIds, setCheckedIds] = useState(() => initialCheckedId ? new Set([initialCheckedId]) : new Set());
  const [selectedOptionals, setSelectedOptionals] = useState({});
  const [manualText, setManualText] = useState('');
  const [selectedLeftoversId, setSelectedLeftoversId] = useState(null);
  const [loading, setLoading] = useState(false);

  const toggleId = (id) => setCheckedIds(prev => {
    const next = new Set(prev);
    if (next.has(id)) {
      next.delete(id);
      setSelectedOptionals(prev => { const n = { ...prev }; delete n[id]; return n; });
    } else {
      next.add(id);
    }
    return next;
  });

  const toggleOptional = (recipeId, ingId) => {
    setSelectedOptionals(prev => {
      const currentSet = new Set(prev[recipeId] ?? []);
      if (currentSet.has(ingId)) currentSet.delete(ingId); else currentSet.add(ingId);
      return { ...prev, [recipeId]: currentSet };
    });
  };

  const totalCount = leftoversMode ? (selectedLeftoversId != null ? 1 : 0) : checkedIds.size + (manualText.trim() ? 1 : 0);

  const handleSubmit = async () => {
    if (totalCount === 0) { onClose(); return; }
    setLoading(true);
    try {
      if (leftoversMode) {
        const recipe = weekRecipes?.find(r => r.id === selectedLeftoversId);
        if (recipe) {
          await onConfirm([{ date, recipe_id: null, label: `Leftovers – ${recipe.title}`, is_leftovers: 1 }]);
        }
        return;
      }
      const entries = [];
      for (const recipe of recipes) {
        if (checkedIds.has(recipe.id)) {
          entries.push({
            date,
            recipe_id: recipe.id,
            label: recipe.title,
            selected_optional_ids: [...(selectedOptionals[recipe.id] ?? [])],
          });
        }
      }
      if (manualText.trim()) {
        entries.push({ date, recipe_id: null, label: manualText.trim() });
      }
      await onConfirm(entries);
    } finally {
      setLoading(false);
    }
  };

  const grouped = CATEGORIES
    .map(cat => ({ category: cat, items: recipes.filter(r => r.category === cat) }))
    .filter(g => g.items.length > 0);

  const modalCard = isMobile ? {
    ...card,
    borderRadius: '1rem 1rem 0 0',
    padding: '1.5rem',
    width: '100%',
    maxWidth: '100%',
    maxHeight: '88vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: shadows.modal,
    paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.5rem)',
  } : {
    ...card,
    borderRadius: radii.xl,
    padding: '1.5rem',
    width: '100%',
    maxWidth: '380px',
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
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
        <h2 style={{ fontSize: fontSizes.xl, fontWeight: fontWeights.bold, marginBottom: '1rem', color: colors.textPrimary, flexShrink: 0, fontFamily: fonts.sans }}>
          Add to {dayLabel}
        </h2>

        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem' }}>
          {leftoversMode ? (
            <>
              <p style={{ fontSize: fontSizes.sm, color: colors.textMuted, marginBottom: '0.75rem', fontFamily: fonts.sans }}>
                Choose which recipe's leftovers:
              </p>
              {!weekRecipes?.length ? (
                <p style={{ color: colors.textSubtle, fontSize: fontSizes.base, fontFamily: fonts.sans }}>No recipes planned this week yet.</p>
              ) : (
                weekRecipes.map(recipe => {
                  const isSelected = selectedLeftoversId === recipe.id;
                  return (
                    <label key={recipe.id} style={{
                      display: 'flex', alignItems: 'center', gap: '0.625rem',
                      padding: '0.5rem 0.625rem', borderRadius: radii.md,
                      cursor: 'pointer',
                      background: isSelected ? colors.bgSurface : 'transparent',
                      marginBottom: '0.125rem',
                      border: `1px solid ${isSelected ? colors.borderMid : 'transparent'}`,
                    }}>
                      <input
                        type="radio"
                        name="leftovers-pick"
                        checked={isSelected}
                        onChange={() => setSelectedLeftoversId(recipe.id)}
                        style={{ width: '1rem', height: '1rem', cursor: 'pointer', flexShrink: 0, accentColor: colors.blue }}
                      />
                      <span style={{ fontSize: fontSizes.md, color: colors.textSecondary, fontFamily: fonts.sans }}>{recipe.title}</span>
                    </label>
                  );
                })
              )}
            </>
          ) : (
            <>
              {grouped.length === 0 ? (
                <p style={{ color: colors.textSubtle, fontSize: fontSizes.base, marginBottom: '0.75rem', fontFamily: fonts.sans }}>
                  No recipes yet — use the custom entry below.
                </p>
              ) : (
                grouped.map(group => (
                  <div key={group.category} style={{ marginBottom: '0.875rem' }}>
                    <p style={{ ...sectionLabel, marginBottom: '0.375rem' }}>
                      {group.category}
                    </p>
                    {group.items.map(recipe => {
                      const sideOpts = recipe.ingredients?.filter(i => i.optional_category === 'sides') ?? [];
                      const proteinOpts = recipe.ingredients?.filter(i => i.optional_category === 'protein') ?? [];
                      const isChecked = checkedIds.has(recipe.id);
                      return (
                        <div key={recipe.id}>
                          <label
                            style={{
                              display: 'flex', alignItems: 'center', gap: '0.625rem',
                              padding: '0.5rem 0.625rem', borderRadius: radii.md,
                              cursor: 'pointer',
                              background: isChecked ? colors.blueLight : 'transparent',
                              marginBottom: '0.125rem',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleId(recipe.id)}
                              style={{ width: '1rem', height: '1rem', cursor: 'pointer', flexShrink: 0, accentColor: colors.blue }}
                            />
                            <span style={{ fontSize: fontSizes.md, color: colors.textSecondary, fontFamily: fonts.sans }}>{recipe.title}</span>
                          </label>

                          {isChecked && (sideOpts.length > 0 || proteinOpts.length > 0) && (
                            <div style={{ paddingLeft: '2.125rem', paddingBottom: '0.375rem' }}>
                              {sideOpts.length > 0 && (
                                <>
                                  <p style={{ fontSize: fontSizes.xs, fontWeight: fontWeights.semibold, color: colors.sides.label, marginBottom: '0.25rem', fontFamily: fonts.sans }}>Side Options</p>
                                  {sideOpts.map(ing => {
                                    const isSelected = selectedOptionals[recipe.id]?.has(ing.id) ?? false;
                                    return (
                                      <label key={ing.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0.5rem', borderRadius: radii.sm, cursor: 'pointer', background: isSelected ? colors.sides.bg : 'transparent', marginBottom: '0.125rem' }}>
                                        <input type="checkbox" checked={isSelected} onChange={() => toggleOptional(recipe.id, ing.id)} style={{ width: '0.875rem', height: '0.875rem', cursor: 'pointer', flexShrink: 0, accentColor: colors.blue }} />
                                        <span style={{ fontSize: fontSizes.base, color: colors.sides.label, fontFamily: fonts.sans }}>{ing.name}</span>
                                      </label>
                                    );
                                  })}
                                </>
                              )}
                              {proteinOpts.length > 0 && (
                                <>
                                  <p style={{ fontSize: fontSizes.xs, fontWeight: fontWeights.semibold, color: colors.protein.label, marginBottom: '0.25rem', marginTop: sideOpts.length > 0 ? '0.375rem' : 0, fontFamily: fonts.sans }}>Protein Options</p>
                                  {proteinOpts.map(ing => {
                                    const isSelected = selectedOptionals[recipe.id]?.has(ing.id) ?? false;
                                    return (
                                      <label key={ing.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0.5rem', borderRadius: radii.sm, cursor: 'pointer', background: isSelected ? colors.protein.bg : 'transparent', marginBottom: '0.125rem' }}>
                                        <input type="checkbox" checked={isSelected} onChange={() => toggleOptional(recipe.id, ing.id)} style={{ width: '0.875rem', height: '0.875rem', cursor: 'pointer', flexShrink: 0, accentColor: colors.blue }} />
                                        <span style={{ fontSize: fontSizes.base, color: colors.protein.label, fontFamily: fonts.sans }}>{ing.name}</span>
                                      </label>
                                    );
                                  })}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))
              )}

              {onNewRecipe && (
                <button
                  type="button"
                  onClick={() => { onClose(); onNewRecipe(); }}
                  style={{ display: 'block', width: '100%', padding: '0.375rem 0.75rem', border: `1px dashed ${colors.borderMid}`, borderRadius: radii.md, background: 'transparent', color: colors.textMuted, fontSize: fontSizes.base, cursor: 'pointer', textAlign: 'left', marginBottom: '0.5rem', fontFamily: fonts.sans }}
                >
                  + Create a new recipe
                </button>
              )}

              <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                <p style={{ fontSize: fontSizes.sm, color: colors.textSubtle, marginBottom: '0.375rem', fontFamily: fonts.sans }}>Or add something custom</p>
                <input
                  value={manualText}
                  onChange={e => setManualText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && totalCount > 0 && handleSubmit()}
                  placeholder="e.g. Date night out..."
                  style={{ ...input }}
                />
              </div>

              {onSwitchToLeftovers && weekRecipes?.length > 0 && (
                <button
                  type="button"
                  onClick={onSwitchToLeftovers}
                  style={{ marginTop: '0.625rem', display: 'block', width: '100%', padding: '0.375rem 0.75rem', border: `1px dashed ${colors.borderMid}`, borderRadius: radii.md, background: 'transparent', color: colors.textMuted, fontSize: fontSizes.base, cursor: 'pointer', textAlign: 'left', fontFamily: fonts.sans }}
                >
                  🍱 Leftovers night →
                </button>
              )}
            </>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
          <button
            onClick={handleSubmit}
            disabled={loading || totalCount === 0}
            style={{
              ...btnPrimary,
              flex: 1,
              background: loading || totalCount === 0 ? colors.borderMid : colors.blue,
              cursor: loading || totalCount === 0 ? 'default' : 'pointer',
              justifyContent: 'center',
            }}
          >
            {loading ? 'Adding...' : totalCount > 0 ? `Add (${totalCount})` : 'Add'}
          </button>
          <button onClick={onClose} style={{ ...btnSecondary }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
