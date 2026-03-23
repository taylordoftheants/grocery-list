import { useState } from 'react';

const CATEGORIES = ['Core Meals', 'Extras / Sauces'];

export default function AddToDayModal({ recipes, weekRecipes, leftoversMode, date, dayLabel, initialCheckedId, onConfirm, onClose, onNewRecipe, onSwitchToLeftovers }) {
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

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
    }}>
      <div style={{
        background: '#fff', borderRadius: '0.75rem',
        padding: '1.5rem', width: '100%', maxWidth: '380px',
        maxHeight: '85vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '1rem', color: '#111827', flexShrink: 0 }}>
          Add to {dayLabel}
        </h2>

        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem' }}>
          {leftoversMode ? (
            <>
              <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginBottom: '0.75rem' }}>
                Choose which recipe's leftovers:
              </p>
              {!weekRecipes?.length ? (
                <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No recipes planned this week yet.</p>
              ) : (
                weekRecipes.map(recipe => {
                  const isSelected = selectedLeftoversId === recipe.id;
                  return (
                    <label key={recipe.id} style={{
                      display: 'flex', alignItems: 'center', gap: '0.625rem',
                      padding: '0.5rem 0.625rem', borderRadius: '0.375rem',
                      cursor: 'pointer',
                      background: isSelected ? '#f3f4f6' : 'transparent',
                      marginBottom: '0.125rem',
                      border: `1px solid ${isSelected ? '#d1d5db' : 'transparent'}`,
                    }}>
                      <input
                        type="radio"
                        name="leftovers-pick"
                        checked={isSelected}
                        onChange={() => setSelectedLeftoversId(recipe.id)}
                        style={{ width: '1rem', height: '1rem', cursor: 'pointer', flexShrink: 0 }}
                      />
                      <span style={{ fontSize: '0.9375rem', color: '#374151' }}>{recipe.title}</span>
                    </label>
                  );
                })
              )}
            </>
          ) : (
            <>
              {grouped.length === 0 ? (
                <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                  No recipes yet — use the custom entry below.
                </p>
              ) : (
                grouped.map(group => (
                  <div key={group.category} style={{ marginBottom: '0.875rem' }}>
                    <p style={{ fontSize: '0.6875rem', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.375rem' }}>
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
                              padding: '0.5rem 0.625rem', borderRadius: '0.375rem',
                              cursor: 'pointer',
                              background: isChecked ? '#eff6ff' : 'transparent',
                              marginBottom: '0.125rem',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleId(recipe.id)}
                              style={{ width: '1rem', height: '1rem', cursor: 'pointer', flexShrink: 0 }}
                            />
                            <span style={{ fontSize: '0.9375rem', color: '#374151' }}>{recipe.title}</span>
                          </label>

                          {isChecked && (sideOpts.length > 0 || proteinOpts.length > 0) && (
                            <div style={{ paddingLeft: '2.125rem', paddingBottom: '0.375rem' }}>
                              {sideOpts.length > 0 && (
                                <>
                                  <p style={{ fontSize: '0.6875rem', fontWeight: '600', color: '#92400e', marginBottom: '0.25rem' }}>Side Options</p>
                                  {sideOpts.map(ing => {
                                    const isSelected = selectedOptionals[recipe.id]?.has(ing.id) ?? false;
                                    return (
                                      <label key={ing.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0.5rem', borderRadius: '0.25rem', cursor: 'pointer', background: isSelected ? '#fffbeb' : 'transparent', marginBottom: '0.125rem' }}>
                                        <input type="checkbox" checked={isSelected} onChange={() => toggleOptional(recipe.id, ing.id)} style={{ width: '0.875rem', height: '0.875rem', cursor: 'pointer', flexShrink: 0 }} />
                                        <span style={{ fontSize: '0.875rem', color: '#92400e' }}>{ing.name}</span>
                                      </label>
                                    );
                                  })}
                                </>
                              )}
                              {proteinOpts.length > 0 && (
                                <>
                                  <p style={{ fontSize: '0.6875rem', fontWeight: '600', color: '#1e40af', marginBottom: '0.25rem', marginTop: sideOpts.length > 0 ? '0.375rem' : 0 }}>Protein Options</p>
                                  {proteinOpts.map(ing => {
                                    const isSelected = selectedOptionals[recipe.id]?.has(ing.id) ?? false;
                                    return (
                                      <label key={ing.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0.5rem', borderRadius: '0.25rem', cursor: 'pointer', background: isSelected ? '#eff6ff' : 'transparent', marginBottom: '0.125rem' }}>
                                        <input type="checkbox" checked={isSelected} onChange={() => toggleOptional(recipe.id, ing.id)} style={{ width: '0.875rem', height: '0.875rem', cursor: 'pointer', flexShrink: 0 }} />
                                        <span style={{ fontSize: '0.875rem', color: '#1e40af' }}>{ing.name}</span>
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
                  style={{ display: 'block', width: '100%', padding: '0.375rem 0.75rem', border: '1px dashed #d1d5db', borderRadius: '0.375rem', background: 'transparent', color: '#6b7280', fontSize: '0.8125rem', cursor: 'pointer', textAlign: 'left', marginBottom: '0.5rem' }}
                >
                  + Create a new recipe
                </button>
              )}

              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.375rem' }}>Or add something custom</p>
                <input
                  value={manualText}
                  onChange={e => setManualText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && totalCount > 0 && handleSubmit()}
                  placeholder="e.g. Date night out..."
                  style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.9375rem', boxSizing: 'border-box' }}
                />
              </div>

              {onSwitchToLeftovers && weekRecipes?.length > 0 && (
                <button
                  type="button"
                  onClick={onSwitchToLeftovers}
                  style={{ marginTop: '0.625rem', display: 'block', width: '100%', padding: '0.375rem 0.75rem', border: '1px dashed #9ca3af', borderRadius: '0.375rem', background: 'transparent', color: '#6b7280', fontSize: '0.8125rem', cursor: 'pointer', textAlign: 'left' }}
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
              flex: 1, padding: '0.625rem',
              background: loading || totalCount === 0 ? '#d1d5db' : '#2563eb',
              color: '#fff', border: 'none', borderRadius: '0.375rem',
              fontSize: '0.9375rem', fontWeight: '600',
              cursor: loading || totalCount === 0 ? 'default' : 'pointer',
            }}
          >
            {loading ? 'Adding...' : totalCount > 0 ? `Add (${totalCount})` : 'Add'}
          </button>
          <button
            onClick={onClose}
            style={{ padding: '0.625rem 1rem', background: 'transparent', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.9375rem', cursor: 'pointer', color: '#6b7280' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
