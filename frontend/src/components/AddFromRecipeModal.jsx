import { useState } from 'react';
import { colors, fonts, fontSizes, fontWeights, radii, shadows, btnPrimary, btnSecondary, sectionLabel } from '../theme';
import { buildSubCategories } from './RecipesView';

export default function AddFromRecipeModal({ recipes, onConfirm, onClose, isMobile }) {
  const [step, setStep] = useState(1);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [checkedIds, setCheckedIds] = useState(new Set());
  const [loading, setLoading] = useState(false);

  const handleSelectRecipe = (recipe) => {
    const initialChecked = new Set(
      (recipe.ingredients ?? [])
        .filter(ing => !ing.is_optional || ing.optional_category === 'spices')
        .map(ing => ing.id)
    );
    setSelectedRecipe(recipe);
    setCheckedIds(initialChecked);
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setSelectedRecipe(null);
    setCheckedIds(new Set());
  };

  const toggleItem = (id) => setCheckedIds(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const handleConfirm = async () => {
    if (checkedIds.size === 0) { onClose(); return; }
    setLoading(true);
    try {
      await onConfirm(selectedRecipe.id, [...checkedIds]);
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
    maxWidth: '420px',
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
          {step === 1 ? 'Add from Recipe' : selectedRecipe.title}
        </h2>
        <p style={{ fontSize: fontSizes.sm, color: colors.textSubtle, marginBottom: '1rem', flexShrink: 0, fontFamily: fonts.sans }}>
          {step === 1 ? 'Pick a recipe to add ingredients from.' : 'Choose ingredients to add to your list.'}
        </p>

        {step === 1 ? (
          <>
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem' }}>
              {recipes.length === 0 ? (
                <p style={{ color: colors.textSubtle, fontSize: fontSizes.base, fontStyle: 'italic', fontFamily: fonts.sans }}>
                  No recipes yet — add one in the Recipes tab.
                </p>
              ) : (
                recipes.map(recipe => (
                  <button
                    key={recipe.id}
                    onClick={() => handleSelectRecipe(recipe)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      textAlign: 'left',
                      background: 'transparent',
                      border: `1px solid ${colors.borderLight}`,
                      borderRadius: radii.md,
                      padding: '0.625rem 0.75rem',
                      marginBottom: '0.375rem',
                      cursor: 'pointer',
                      fontFamily: fonts.sans,
                      transition: 'background 0.12s, border-color 0.12s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = colors.blueLight; e.currentTarget.style.borderColor = colors.blueBorder; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = colors.borderLight; }}
                  >
                    <span style={{ fontSize: fontSizes.base, color: colors.textPrimary, fontWeight: fontWeights.medium }}>
                      {recipe.title}
                    </span>
                    <span style={{
                      fontSize: fontSizes.xs, color: colors.textSubtle,
                      background: colors.bgSurface, borderRadius: radii.full,
                      padding: '0.1rem 0.5rem', whiteSpace: 'nowrap', marginLeft: '0.5rem',
                    }}>
                      {(recipe.ingredients ?? []).length} ingredients
                    </span>
                  </button>
                ))
              )}
            </div>
            <div style={{ flexShrink: 0 }}>
              <button onClick={onClose} style={{ ...btnSecondary, width: '100%', justifyContent: 'center' }}>
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem' }}>
              {buildSubCategories(selectedRecipe.ingredients ?? []).map(group => (
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
                        <span style={{ fontSize: fontSizes.md, color: colors.textSecondary, fontFamily: fonts.sans }}>
                          {ing.name}{ing.amount ? ` – ${ing.amount}` : ''}
                        </span>
                      </label>
                    );
                  })}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
              <button
                onClick={handleConfirm}
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
              <button onClick={handleBack} style={{ ...btnSecondary }}>
                ← Back
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
