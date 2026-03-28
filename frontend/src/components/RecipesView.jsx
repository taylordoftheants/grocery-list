import { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api } from '../api';
import { colors, fonts, fontSizes, fontWeights, radii, shadows, card, input, btnPrimary, btnSecondary, btnDanger, sectionLabel } from '../theme';

const CATEGORIES = ['Core Meals', 'Extras / Sauces'];

// ── SortableRecipeItem ────────────────────────────────────────────────────────

function SortableRecipeItem({ recipe, isSelected, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: recipe.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1, listStyle: 'none', marginBottom: '0.375rem' }}
    >
      <button
        onClick={onClick}
        {...attributes}
        {...listeners}
        style={{
          width: '100%',
          textAlign: 'left',
          padding: '0.5rem 0.75rem',
          background: isDragging ? colors.blueLight : isSelected ? colors.blueLight : colors.bgCard,
          border: `1px solid ${isSelected || isDragging ? colors.blueBorder : colors.border}`,
          borderRadius: radii.md,
          fontSize: fontSizes.base,
          color: isSelected ? colors.blueDark : colors.textSecondary,
          fontWeight: isSelected ? fontWeights.semibold : fontWeights.normal,
          cursor: 'grab',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontFamily: fonts.sans,
          boxSizing: 'border-box',
          touchAction: 'none',
          userSelect: 'none',
        }}
      >
        {recipe.title}
      </button>
    </li>
  );
}

// ── RecipeEditor ──────────────────────────────────────────────────────────────

function RecipeEditor({ recipe, onSave, onCancel, allRecipes, isMobile, onDirtyChange }) {
  const [title, setTitle] = useState(recipe?.title ?? '');
  const [category, setCategory] = useState(recipe?.category ?? 'Core Meals');
  const [ingredients, setIngredients] = useState(
    recipe?.ingredients?.filter(i => !i.is_optional).length
      ? recipe.ingredients.filter(i => !i.is_optional)
      : [{ name: '', amount: '' }]
  );
  const [sideOptions, setSideOptions] = useState(
    recipe?.ingredients?.filter(i => i.optional_category === 'sides') ?? []
  );
  const [proteinOptions, setProteinOptions] = useState(
    recipe?.ingredients?.filter(i => i.optional_category === 'protein') ?? []
  );
  const [spiceItems, setSpiceItems] = useState(
    recipe?.ingredients?.filter(i => i.optional_category === 'spices') ?? []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);

  // Notify parent whenever dirty state changes
  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const markDirty = () => setIsDirty(true);

  // Ref arrays for name inputs (for auto-focus on add)
  const ingNameRefs = useRef([]);
  const sideNameRefs = useRef([]);
  const proteinNameRefs = useRef([]);
  const spiceNameRefs = useRef([]);

  // Track previous lengths to detect when a row is added
  const prevIngLen = useRef(ingredients.length);
  const prevSideLen = useRef(sideOptions.length);
  const prevProteinLen = useRef(proteinOptions.length);
  const prevSpiceLen = useRef(spiceItems.length);

  useEffect(() => {
    if (ingredients.length > prevIngLen.current) {
      ingNameRefs.current[ingredients.length - 1]?.focus();
    }
    prevIngLen.current = ingredients.length;
  }, [ingredients.length]);

  useEffect(() => {
    if (sideOptions.length > prevSideLen.current) {
      sideNameRefs.current[sideOptions.length - 1]?.focus();
    }
    prevSideLen.current = sideOptions.length;
  }, [sideOptions.length]);

  useEffect(() => {
    if (proteinOptions.length > prevProteinLen.current) {
      proteinNameRefs.current[proteinOptions.length - 1]?.focus();
    }
    prevProteinLen.current = proteinOptions.length;
  }, [proteinOptions.length]);

  useEffect(() => {
    if (spiceItems.length > prevSpiceLen.current) {
      spiceNameRefs.current[spiceItems.length - 1]?.focus();
    }
    prevSpiceLen.current = spiceItems.length;
  }, [spiceItems.length]);

  const setIng = (i, field, value) => {
    markDirty();
    setIngredients(prev => prev.map((ing, idx) => idx === i ? { ...ing, [field]: value } : ing));
  };
  const addIng = () => { markDirty(); setIngredients(prev => [...prev, { name: '', amount: '' }]); };
  const removeIng = (i) => { markDirty(); setIngredients(prev => prev.filter((_, idx) => idx !== i)); };

  const setSide = (i, field, value) => {
    markDirty();
    setSideOptions(prev => prev.map((ing, idx) => idx === i ? { ...ing, [field]: value } : ing));
  };
  const addSide = () => { markDirty(); setSideOptions(prev => [...prev, { name: '', amount: '' }]); };
  const removeSide = (i) => { markDirty(); setSideOptions(prev => prev.filter((_, idx) => idx !== i)); };

  const setProtein = (i, field, value) => {
    markDirty();
    setProteinOptions(prev => prev.map((ing, idx) => idx === i ? { ...ing, [field]: value } : ing));
  };
  const addProtein = () => { markDirty(); setProteinOptions(prev => [...prev, { name: '', amount: '' }]); };
  const removeProtein = (i) => { markDirty(); setProteinOptions(prev => prev.filter((_, idx) => idx !== i)); };

  const setSpice = (i, field, value) => {
    markDirty();
    setSpiceItems(prev => prev.map((ing, idx) => idx === i ? { ...ing, [field]: value } : ing));
  };
  const addSpice = () => { markDirty(); setSpiceItems(prev => [...prev, { name: '', amount: '' }]); };
  const removeSpice = (i) => { markDirty(); setSpiceItems(prev => prev.filter((_, idx) => idx !== i)); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const validIngs = ingredients.filter(i => i.name.trim()).map(i => ({ ...i, is_optional: 0, optional_category: '' }));
    const validSides = sideOptions.filter(i => i.name.trim()).map(i => ({ ...i, is_optional: 1, optional_category: 'sides' }));
    const validProteins = proteinOptions.filter(i => i.name.trim()).map(i => ({ ...i, is_optional: 1, optional_category: 'protein' }));
    const validSpices = spiceItems.filter(i => i.name.trim()).map(i => ({ ...i, is_optional: 1, optional_category: 'spices' }));
    setLoading(true);
    try {
      const saved = recipe
        ? await api.updateRecipe(recipe.id, title, [...validIngs, ...validSides, ...validProteins, ...validSpices], category)
        : await api.createRecipe(title, [...validIngs, ...validSides, ...validProteins, ...validSpices], category);
      setIsDirty(false);
      onSave(saved);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = () => {
    if (isDirty) {
      setShowUnsavedConfirm(true);
    } else {
      onCancel();
    }
  };

  const currentSideNames = new Set(sideOptions.map(i => i.name.trim().toLowerCase()).filter(Boolean));
  const currentProteinNames = new Set(proteinOptions.map(i => i.name.trim().toLowerCase()).filter(Boolean));
  const currentSpiceNames = new Set(spiceItems.map(i => i.name.trim().toLowerCase()).filter(Boolean));
  const suggestedSides = [];
  const suggestedProteins = [];
  const suggestedSpices = [];
  const seenSides = new Set(currentSideNames);
  const seenProteins = new Set(currentProteinNames);
  const seenSpices = new Set(currentSpiceNames);
  for (const r of allRecipes ?? []) {
    if (r.id === recipe?.id) continue;
    for (const ing of r.ingredients ?? []) {
      const lname = ing.name.trim().toLowerCase();
      if (!lname) continue;
      if (ing.optional_category === 'sides' && !seenSides.has(lname)) {
        suggestedSides.push(ing.name.trim()); seenSides.add(lname);
      } else if (ing.optional_category === 'protein' && !seenProteins.has(lname)) {
        suggestedProteins.push(ing.name.trim()); seenProteins.add(lname);
      } else if (ing.optional_category === 'spices' && !seenSpices.has(lname)) {
        suggestedSpices.push(ing.name.trim()); seenSpices.add(lname);
      }
    }
  }

  // 16px font size prevents iOS Safari auto-zoom
  const ingInputStyle = { width: '90px', padding: '0.4rem 0.5rem', border: `1px solid ${colors.borderMid}`, borderRadius: radii.md, fontSize: fontSizes.md, flexShrink: 0, background: colors.white, fontFamily: fonts.sans };
  const ingNameStyle = { flex: 1, padding: '0.4rem 0.5rem', border: `1px solid ${colors.borderMid}`, borderRadius: radii.md, fontSize: fontSizes.md, background: colors.white, fontFamily: fonts.sans };
  const removeBtn = { border: 'none', background: 'transparent', color: colors.textSubtle, fontSize: '1.125rem', cursor: 'pointer', lineHeight: 1, padding: '0.25rem', minWidth: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' };

  const labelStyle = { display: 'block', fontSize: fontSizes.base, fontWeight: fontWeights.medium, color: colors.textSecondary, marginBottom: '0.25rem', fontFamily: fonts.sans };

  // Floating footer for mobile: fixed above the bottom tab bar
  const mobileFooterStyle = {
    position: 'fixed',
    bottom: 'calc(56px + env(safe-area-inset-bottom, 0px))',
    left: 0,
    right: 0,
    background: colors.white,
    borderTop: `1px solid ${colors.border}`,
    boxShadow: shadows.navBottom,
    padding: '0.75rem 1rem',
    zIndex: 10,
  };

  const actionButtons = (
    <div style={isMobile ? mobileFooterStyle : { display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
      {showUnsavedConfirm ? (
        <div style={isMobile ? { display: 'flex', flexDirection: 'column', gap: '0.5rem' } : { display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
          <p style={{ fontSize: fontSizes.base, color: '#9a3412', fontWeight: fontWeights.medium, margin: 0, fontFamily: fonts.sans }}>
            Discard unsaved changes?
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" onClick={onCancel} style={{ ...btnDanger, padding: '0.5rem 1rem', minHeight: '40px', flex: isMobile ? 1 : 'none' }}>
              Discard
            </button>
            <button type="button" onClick={() => setShowUnsavedConfirm(false)} style={{ ...btnSecondary, padding: '0.5rem 1rem', minHeight: '40px', flex: isMobile ? 1 : 'none' }}>
              Keep Editing
            </button>
          </div>
        </div>
      ) : (
        <>
          <button
            type="submit"
            disabled={loading || !title.trim()}
            style={{
              ...btnPrimary,
              background: loading || !title.trim() ? colors.borderMid : colors.blue,
              cursor: loading || !title.trim() ? 'default' : 'pointer',
              flex: isMobile ? 1 : 'none',
            }}
          >
            {loading ? 'Saving...' : 'Save Recipe'}
          </button>
          <button type="button" onClick={handleCancelClick} style={{ ...btnSecondary, flex: isMobile ? 1 : 'none' }}>
            Cancel
          </button>
        </>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', fontFamily: fonts.sans }}>
      <div style={{ padding: '1.5rem 1rem', maxWidth: '480px', paddingBottom: isMobile ? '100px' : '1.5rem' }}>
        <h2 style={{ fontSize: fontSizes.xl, fontWeight: fontWeights.bold, marginBottom: '1rem', color: colors.textPrimary }}>
          {recipe ? 'Edit Recipe' : 'New Recipe'}
        </h2>

        {error && (
          <div style={{ background: colors.errorBg, color: colors.errorText, padding: '0.75rem', borderRadius: radii.md, marginBottom: '1rem', fontSize: fontSizes.base }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '1rem' }}>
          <label style={labelStyle}>Recipe Title</label>
          <input
            value={title}
            onChange={e => { markDirty(); setTitle(e.target.value); }}
            placeholder="e.g. Spaghetti Bolognese"
            required
            autoFocus={!recipe}
            style={input}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={labelStyle}>Category</label>
          <select
            value={category}
            onChange={e => { markDirty(); setCategory(e.target.value); }}
            style={{ ...input, cursor: 'pointer' }}
          >
            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label style={labelStyle}>Ingredients</label>
            <button type="button" onClick={addIng} style={{ fontSize: fontSizes.base, color: colors.blue, background: 'none', border: 'none', cursor: 'pointer', fontWeight: fontWeights.medium, fontFamily: fonts.sans }}>
              + Add ingredient
            </button>
          </div>
          {ingredients.map((ing, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.375rem', alignItems: 'center' }}>
              <input
                value={ing.amount}
                onChange={e => setIng(i, 'amount', e.target.value)}
                placeholder="Amount"
                inputMode="decimal"
                style={ingInputStyle}
              />
              <input
                ref={el => { ingNameRefs.current[i] = el; }}
                value={ing.name}
                onChange={e => setIng(i, 'name', e.target.value)}
                placeholder="Ingredient"
                inputMode="text"
                autoCapitalize="words"
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    addIng();
                  }
                }}
                style={{ ...ingNameStyle }}
              />
              {ingredients.length > 1 && (
                <button type="button" onClick={() => removeIng(i)} style={removeBtn}>×</button>
              )}
            </div>
          ))}
        </div>

        {/* Side Options — amber color coding preserved */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label style={{ ...labelStyle, color: colors.sides.label }}>Side Options</label>
            <button type="button" onClick={addSide} style={{ fontSize: fontSizes.base, color: '#d97706', background: 'none', border: 'none', cursor: 'pointer', fontWeight: fontWeights.medium, fontFamily: fonts.sans }}>
              + Add side
            </button>
          </div>
          {sideOptions.length === 0 ? (
            <p style={{ fontSize: fontSizes.base, color: colors.textSubtle, fontStyle: 'italic', fontFamily: fonts.sans }}>e.g. green beans, roasted potatoes, rice</p>
          ) : (
            sideOptions.map((ing, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.375rem', alignItems: 'center' }}>
                <input
                  value={ing.amount}
                  onChange={e => setSide(i, 'amount', e.target.value)}
                  placeholder="Amount"
                  inputMode="decimal"
                  style={{ ...ingInputStyle, border: `1px solid ${colors.sides.border}`, background: colors.sides.bg }}
                />
                <input
                  ref={el => { sideNameRefs.current[i] = el; }}
                  value={ing.name}
                  onChange={e => setSide(i, 'name', e.target.value)}
                  placeholder="Side option"
                  inputMode="text"
                  autoCapitalize="words"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      addSide();
                    }
                  }}
                  style={{ ...ingNameStyle, border: `1px solid ${colors.sides.border}`, background: colors.sides.bg }}
                />
                <button type="button" onClick={() => removeSide(i)} style={removeBtn}>×</button>
              </div>
            ))
          )}
          {suggestedSides.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.5rem' }}>
              <span style={{ fontSize: fontSizes.sm, color: colors.textSubtle, alignSelf: 'center' }}>Suggestions:</span>
              {suggestedSides.map(name => (
                <button key={name} type="button" onClick={() => { markDirty(); setSideOptions(prev => [...prev, { name, amount: '' }]); }}
                  style={{ padding: '0.2rem 0.625rem', background: colors.sides.bg, border: `1px solid ${colors.sides.border}`, borderRadius: radii.full, fontSize: fontSizes.base, color: colors.sides.label, cursor: 'pointer', fontFamily: fonts.sans }}>
                  + {name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Protein Options — blue color coding preserved */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label style={{ ...labelStyle, color: colors.protein.label }}>Protein Options</label>
            <button type="button" onClick={addProtein} style={{ fontSize: fontSizes.base, color: colors.blue, background: 'none', border: 'none', cursor: 'pointer', fontWeight: fontWeights.medium, fontFamily: fonts.sans }}>
              + Add protein
            </button>
          </div>
          {proteinOptions.length === 0 ? (
            <p style={{ fontSize: fontSizes.base, color: colors.textSubtle, fontStyle: 'italic', fontFamily: fonts.sans }}>e.g. chicken breast, tofu, shrimp</p>
          ) : (
            proteinOptions.map((ing, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.375rem', alignItems: 'center' }}>
                <input
                  value={ing.amount}
                  onChange={e => setProtein(i, 'amount', e.target.value)}
                  placeholder="Amount"
                  inputMode="decimal"
                  style={{ ...ingInputStyle, border: `1px solid ${colors.protein.border}`, background: colors.protein.bg }}
                />
                <input
                  ref={el => { proteinNameRefs.current[i] = el; }}
                  value={ing.name}
                  onChange={e => setProtein(i, 'name', e.target.value)}
                  placeholder="Protein option"
                  inputMode="text"
                  autoCapitalize="words"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      addProtein();
                    }
                  }}
                  style={{ ...ingNameStyle, border: `1px solid ${colors.protein.border}`, background: colors.protein.bg }}
                />
                <button type="button" onClick={() => removeProtein(i)} style={removeBtn}>×</button>
              </div>
            ))
          )}
          {suggestedProteins.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.5rem' }}>
              <span style={{ fontSize: fontSizes.sm, color: colors.textSubtle, alignSelf: 'center' }}>Suggestions:</span>
              {suggestedProteins.map(name => (
                <button key={name} type="button" onClick={() => { markDirty(); setProteinOptions(prev => [...prev, { name, amount: '' }]); }}
                  style={{ padding: '0.2rem 0.625rem', background: colors.protein.bg, border: `1px solid ${colors.protein.border}`, borderRadius: radii.full, fontSize: fontSizes.base, color: colors.protein.label, cursor: 'pointer', fontFamily: fonts.sans }}>
                  + {name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Spices — green color coding preserved */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label style={{ ...labelStyle, color: colors.spices.label }}>Spices and Such</label>
            <button type="button" onClick={addSpice} style={{ fontSize: fontSizes.base, color: '#059669', background: 'none', border: 'none', cursor: 'pointer', fontWeight: fontWeights.medium, fontFamily: fonts.sans }}>
              + Add spice
            </button>
          </div>
          {spiceItems.length === 0 ? (
            <p style={{ fontSize: fontSizes.base, color: colors.textSubtle, fontStyle: 'italic', fontFamily: fonts.sans }}>e.g. cumin, paprika, red pepper flakes</p>
          ) : (
            spiceItems.map((ing, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.375rem', alignItems: 'center' }}>
                <input
                  value={ing.amount}
                  onChange={e => setSpice(i, 'amount', e.target.value)}
                  placeholder="Amount"
                  inputMode="decimal"
                  style={{ ...ingInputStyle, border: `1px solid ${colors.spices.border}`, background: colors.spices.bg }}
                />
                <input
                  ref={el => { spiceNameRefs.current[i] = el; }}
                  value={ing.name}
                  onChange={e => setSpice(i, 'name', e.target.value)}
                  placeholder="Spice or seasoning"
                  inputMode="text"
                  autoCapitalize="words"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      addSpice();
                    }
                  }}
                  style={{ ...ingNameStyle, border: `1px solid ${colors.spices.border}`, background: colors.spices.bg }}
                />
                <button type="button" onClick={() => removeSpice(i)} style={removeBtn}>×</button>
              </div>
            ))
          )}
          {suggestedSpices.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.5rem' }}>
              <span style={{ fontSize: fontSizes.sm, color: colors.textSubtle, alignSelf: 'center' }}>Suggestions:</span>
              {suggestedSpices.map(name => (
                <button key={name} type="button" onClick={() => { markDirty(); setSpiceItems(prev => [...prev, { name, amount: '' }]); }}
                  style={{ padding: '0.2rem 0.625rem', background: colors.spices.bg, border: `1px solid ${colors.spices.border}`, borderRadius: radii.full, fontSize: fontSizes.base, color: colors.spices.label, cursor: 'pointer', fontFamily: fonts.sans }}>
                  + {name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Desktop-only inline action buttons */}
        {!isMobile && actionButtons}
      </div>

      {/* Mobile floating footer */}
      {isMobile && actionButtons}
    </form>
  );
}

// ── RecipeDetail ──────────────────────────────────────────────────────────────

function RecipeDetail({ recipe, onEdit, onDelete }) {
  const required = recipe.ingredients.filter(i => !i.is_optional);
  const sideOptions = recipe.ingredients.filter(i => i.optional_category === 'sides');
  const proteinOptions = recipe.ingredients.filter(i => i.optional_category === 'protein');
  const spiceItems = recipe.ingredients.filter(i => i.optional_category === 'spices');

  return (
    <div style={{ padding: '1.5rem 1rem', maxWidth: '480px', fontFamily: fonts.sans }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
        <h2 style={{ fontSize: fontSizes['2xl'], fontWeight: fontWeights.bold, color: colors.textPrimary }}>{recipe.title}</h2>
        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, marginLeft: '0.5rem' }}>
          <button onClick={onEdit} style={{ ...btnSecondary, padding: '0.375rem 0.75rem', minHeight: '36px' }}>
            Edit
          </button>
          <button onClick={onDelete} style={{ ...btnDanger, padding: '0.375rem 0.75rem', minHeight: '36px' }}>
            Delete
          </button>
        </div>
      </div>
      <p style={{ fontSize: fontSizes.sm, color: colors.textSubtle, marginBottom: '1rem' }}>{recipe.category}</p>

      {required.length === 0 && sideOptions.length === 0 && proteinOptions.length === 0 && spiceItems.length === 0 ? (
        <p style={{ color: colors.textSubtle, fontSize: fontSizes.base }}>No ingredients added.</p>
      ) : (
        <>
          {required.length > 0 && (
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: (sideOptions.length > 0 || proteinOptions.length > 0 || spiceItems.length > 0) ? '1rem' : 0 }}>
              {required.map(ing => (
                <li key={ing.id} style={{ ...card, padding: '0.4rem 0.75rem', marginBottom: '0.375rem', fontSize: fontSizes.md, color: colors.textSecondary }}>
                  {[ing.amount, ing.name].filter(Boolean).join(' ')}
                </li>
              ))}
            </ul>
          )}

          {sideOptions.length > 0 && (
            <div style={{ marginBottom: (proteinOptions.length > 0 || spiceItems.length > 0) ? '1rem' : 0 }}>
              <p style={{ ...sectionLabel, color: colors.sides.label, marginBottom: '0.5rem' }}>Side Options</p>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {sideOptions.map(ing => (
                  <li key={ing.id} style={{ padding: '0.4rem 0.75rem', background: colors.sides.bg, border: `1px solid ${colors.sides.border}`, borderRadius: radii.md, marginBottom: '0.375rem', fontSize: fontSizes.md, color: colors.sides.chip }}>
                    {[ing.amount, ing.name].filter(Boolean).join(' ')}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {proteinOptions.length > 0 && (
            <div style={{ marginBottom: spiceItems.length > 0 ? '1rem' : 0 }}>
              <p style={{ ...sectionLabel, color: colors.protein.label, marginBottom: '0.5rem' }}>Protein Options</p>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {proteinOptions.map(ing => (
                  <li key={ing.id} style={{ padding: '0.4rem 0.75rem', background: colors.protein.bg, border: `1px solid ${colors.protein.border}`, borderRadius: radii.md, marginBottom: '0.375rem', fontSize: fontSizes.md, color: colors.protein.chip }}>
                    {[ing.amount, ing.name].filter(Boolean).join(' ')}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {spiceItems.length > 0 && (
            <div>
              <p style={{ ...sectionLabel, color: colors.spices.label, marginBottom: '0.5rem' }}>Spices and Such</p>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {spiceItems.map(ing => (
                  <li key={ing.id} style={{ padding: '0.4rem 0.75rem', background: colors.spices.bg, border: `1px solid ${colors.spices.border}`, borderRadius: radii.md, marginBottom: '0.375rem', fontSize: fontSizes.md, color: colors.spices.chip }}>
                    {[ing.amount, ing.name].filter(Boolean).join(' ')}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Shared helper ────────────────────────────────────────────────────────────

export function buildSubCategories(ingredients) {
  const map = new Map();
  for (const ing of ingredients) {
    const cat = ing.optional_category || 'General';
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat).push({ id: ing.id, name: ing.name, amount: ing.amount ?? '' });
  }
  return [...map.entries()].map(([name, items]) => ({ name, items }));
}

// ── FavoritesEditor ───────────────────────────────────────────────────────────

function FavoritesEditor({ recipe, onSave, isMobile, onDirtyChange }) {
  const [subCategories, setSubCategories] = useState(() => buildSubCategories(recipe?.ingredients ?? []));
  const [editingCatIdx, setEditingCatIdx] = useState(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);
  const catInputRef = useRef(null);
  const newItemRefs = useRef({});

  useEffect(() => { onDirtyChange?.(isDirty); }, [isDirty, onDirtyChange]);

  const markDirty = () => setIsDirty(true);

  const addSubCategory = () => {
    markDirty();
    const newCat = { name: 'New Category', items: [] };
    setSubCategories(prev => [...prev, newCat]);
    const newIdx = subCategories.length;
    setEditingCatIdx(newIdx);
    setEditingCatName('New Category');
    setTimeout(() => catInputRef.current?.select(), 0);
  };

  const startRenameCategory = (idx) => {
    setEditingCatIdx(idx);
    setEditingCatName(subCategories[idx].name);
    setTimeout(() => catInputRef.current?.select(), 0);
  };

  const commitRenameCategory = () => {
    if (editingCatIdx === null) return;
    const trimmed = editingCatName.trim() || 'General';
    setSubCategories(prev => prev.map((cat, i) => i === editingCatIdx ? { ...cat, name: trimmed } : cat));
    setEditingCatIdx(null);
    markDirty();
  };

  const deleteSubCategory = (idx) => {
    const cat = subCategories[idx];
    if (cat.items.filter(i => i.name.trim()).length > 0) {
      if (!window.confirm(`Delete "${cat.name}" and all its items?`)) return;
    }
    setSubCategories(prev => prev.filter((_, i) => i !== idx));
    markDirty();
  };

  const addItemToCategory = (catIdx) => {
    markDirty();
    setSubCategories(prev => prev.map((cat, i) =>
      i === catIdx ? { ...cat, items: [...cat.items, { name: '', amount: '' }] } : cat
    ));
    setTimeout(() => {
      const lastIdx = subCategories[catIdx].items.length;
      newItemRefs.current[`${catIdx}-${lastIdx}`]?.focus();
    }, 0);
  };

  const updateItem = (catIdx, itemIdx, field, value) => {
    markDirty();
    setSubCategories(prev => prev.map((cat, i) =>
      i !== catIdx ? cat : {
        ...cat,
        items: cat.items.map((item, j) => j === itemIdx ? { ...item, [field]: value } : item)
      }
    ));
  };

  const removeItem = (catIdx, itemIdx) => {
    markDirty();
    setSubCategories(prev => prev.map((cat, i) =>
      i !== catIdx ? cat : { ...cat, items: cat.items.filter((_, j) => j !== itemIdx) }
    ));
  };

  const handleSave = async () => {
    setError(null);
    const allIngredients = subCategories.flatMap(cat =>
      cat.items
        .filter(item => item.name.trim())
        .map(item => ({
          name: item.name.trim(),
          amount: item.amount?.trim() ?? '',
          is_optional: 1,
          optional_category: cat.name,
        }))
    );
    setLoading(true);
    try {
      const saved = await api.updateRecipe(recipe.id, recipe.title, allIngredients, recipe.category);
      setIsDirty(false);
      onSave(saved);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const ingNameStyle = { flex: 1, padding: '0.4rem 0.5rem', border: `1px solid ${colors.borderMid}`, borderRadius: radii.md, fontSize: fontSizes.md, background: colors.white, fontFamily: fonts.sans };
  const removeBtn = { border: 'none', background: 'transparent', color: colors.textSubtle, fontSize: '1.125rem', cursor: 'pointer', lineHeight: 1, padding: '0.25rem', minWidth: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' };

  const mobileFooterStyle = {
    position: 'fixed',
    bottom: 'calc(56px + env(safe-area-inset-bottom, 0px))',
    left: 0,
    right: 0,
    background: colors.white,
    borderTop: `1px solid ${colors.border}`,
    boxShadow: shadows.navBottom,
    padding: '0.75rem 1rem',
    zIndex: 10,
  };

  const saveArea = (
    <div style={isMobile ? mobileFooterStyle : { display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
      {showUnsavedConfirm ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
          <p style={{ fontSize: fontSizes.base, color: '#9a3412', fontWeight: fontWeights.medium, margin: 0, fontFamily: fonts.sans }}>
            Discard unsaved changes?
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" onClick={() => { setShowUnsavedConfirm(false); setIsDirty(false); onSave(recipe); }} style={{ ...btnDanger, padding: '0.5rem 1rem', minHeight: '40px', flex: isMobile ? 1 : 'none' }}>
              Discard
            </button>
            <button type="button" onClick={() => setShowUnsavedConfirm(false)} style={{ ...btnSecondary, padding: '0.5rem 1rem', minHeight: '40px', flex: isMobile ? 1 : 'none' }}>
              Keep Editing
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleSave}
          disabled={loading || !isDirty}
          style={{
            ...btnPrimary,
            background: loading || !isDirty ? colors.borderMid : colors.blue,
            cursor: loading || !isDirty ? 'default' : 'pointer',
            flex: isMobile ? 1 : 'none',
          }}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      )}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', fontFamily: fonts.sans }}>
      <div style={{ padding: '1.5rem 1rem', maxWidth: '520px', paddingBottom: isMobile ? '100px' : '1.5rem' }}>
        <h2 style={{ fontSize: fontSizes.xl, fontWeight: fontWeights.bold, marginBottom: '0.25rem', color: colors.textPrimary }}>
          Favorites / Regular Items
        </h2>
        <p style={{ fontSize: fontSizes.sm, color: colors.textSubtle, marginBottom: '1.5rem', fontFamily: fonts.sans }}>
          Organize regularly-bought items by category. Select individual items when adding to your plan.
        </p>

        {error && (
          <div style={{ background: colors.errorBg, color: colors.errorText, padding: '0.75rem', borderRadius: radii.md, marginBottom: '1rem', fontSize: fontSizes.base }}>
            {error}
          </div>
        )}

        {subCategories.map((cat, catIdx) => (
          <div key={catIdx} style={{ marginBottom: '1.25rem', background: colors.bgSurface, border: `1px solid ${colors.border}`, borderRadius: radii.lg, padding: '0.875rem 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              {editingCatIdx === catIdx ? (
                <input
                  ref={catInputRef}
                  value={editingCatName}
                  onChange={e => setEditingCatName(e.target.value)}
                  onBlur={commitRenameCategory}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commitRenameCategory(); } }}
                  style={{ ...ingNameStyle, fontWeight: fontWeights.semibold, fontSize: fontSizes.md, flex: 1 }}
                  autoFocus
                />
              ) : (
                <button
                  type="button"
                  onClick={() => startRenameCategory(catIdx)}
                  title="Click to rename"
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: fontSizes.md, fontWeight: fontWeights.semibold, color: colors.textSecondary, textAlign: 'left', fontFamily: fonts.sans }}
                >
                  {cat.name}
                </button>
              )}
              <button
                type="button"
                onClick={() => deleteSubCategory(catIdx)}
                style={{ ...removeBtn, color: colors.textSubtle, marginLeft: '0.5rem', flexShrink: 0 }}
                title="Delete category"
              >
                ×
              </button>
            </div>

            {cat.items.map((item, itemIdx) => (
              <div key={itemIdx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.375rem', alignItems: 'center' }}>
                <input
                  ref={el => { newItemRefs.current[`${catIdx}-${itemIdx}`] = el; }}
                  value={item.name}
                  onChange={e => updateItem(catIdx, itemIdx, 'name', e.target.value)}
                  placeholder="Item name"
                  inputMode="text"
                  autoCapitalize="words"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      addItemToCategory(catIdx);
                    }
                  }}
                  style={ingNameStyle}
                />
                <button type="button" onClick={() => removeItem(catIdx, itemIdx)} style={removeBtn}>×</button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => addItemToCategory(catIdx)}
              style={{ fontSize: fontSizes.base, color: colors.blue, background: 'none', border: 'none', cursor: 'pointer', fontWeight: fontWeights.medium, fontFamily: fonts.sans, padding: '0.25rem 0' }}
            >
              + Add item
            </button>
          </div>
        ))}

        {subCategories.length === 0 && (
          <p style={{ color: colors.textSubtle, fontSize: fontSizes.base, marginBottom: '1rem', fontStyle: 'italic' }}>
            No categories yet. Add a sub-category to get started.
          </p>
        )}

        <button
          type="button"
          onClick={addSubCategory}
          style={{ display: 'block', width: '100%', padding: '0.625rem', border: `1.5px dashed ${colors.borderMid}`, borderRadius: radii.lg, background: 'transparent', color: colors.textMuted, fontSize: fontSizes.base, cursor: 'pointer', textAlign: 'center', fontFamily: fonts.sans }}
        >
          + New sub-category
        </button>

        {!isMobile && saveArea}
      </div>
      {isMobile && saveArea}
    </div>
  );
}

// ── RecipesView ───────────────────────────────────────────────────────────────

export default function RecipesView({ isMobile }) {
  const [recipes, setRecipes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [editorIsDirty, setEditorIsDirty] = useState(false);
  const isDraggingRef = useRef(false);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  useEffect(() => {
    api.getRecipes().then(setRecipes);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      if (!isDraggingRef.current) api.getRecipes().then(setRecipes);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const selectedRecipe = recipes.find(r => r.id === selectedId);

  const handleSave = (saved) => {
    setRecipes(prev => {
      const idx = prev.findIndex(r => r.id === saved.id);
      return idx >= 0 ? prev.map(r => r.id === saved.id ? saved : r) : [...prev, saved];
    });
    setSelectedId(saved.id);
    setIsEditing(false);
    setShowNew(false);
    setEditorIsDirty(false);
  };

  const handleDelete = async (id) => {
    await api.deleteRecipe(id);
    setRecipes(prev => prev.filter(r => r.id !== id));
    setSelectedId(null);
  };

  const handleDragStart = (event) => {
    isDraggingRef.current = true;
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    isDraggingRef.current = false;
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const src = recipes.find(r => r.id === active.id);
    const dst = recipes.find(r => r.id === over.id);
    if (!src || !dst || src.category !== dst.category) return;
    const oldIndex = recipes.findIndex(r => r.id === active.id);
    const newIndex = recipes.findIndex(r => r.id === over.id);
    const newOrder = arrayMove(recipes, oldIndex, newIndex);
    setRecipes(newOrder);
    api.reorderRecipes(newOrder.map(r => r.id));
  };

  const handleDragCancel = () => {
    isDraggingRef.current = false;
    setActiveId(null);
  };

  const handleBackToList = () => {
    if ((isEditing || showNew) && editorIsDirty) {
      if (!window.confirm('You have unsaved changes. Go back without saving?')) return;
    }
    setSelectedId(null);
    setIsEditing(false);
    setShowNew(false);
    setEditorIsDirty(false);
  };

  const favoritesRecipe = recipes.find(r => r.is_favorites);
  const grouped = CATEGORIES
    .filter(cat => cat !== 'Favorites / Regular Items')
    .map(cat => ({ category: cat, items: recipes.filter(r => !r.is_favorites && r.category === cat) }))
    .filter(g => g.items.length > 0);

  const activeRecipe = activeId != null ? recipes.find(r => r.id === activeId) : null;

  const listPanel = (
    <div style={{
      width: isMobile ? '100%' : '240px',
      borderRight: isMobile ? 'none' : `1px solid ${colors.border}`,
      borderBottom: isMobile ? `1px solid ${colors.border}` : 'none',
      background: colors.white,
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      padding: '1rem',
      overflowY: 'auto',
      fontFamily: fonts.sans,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h2 style={{ fontSize: fontSizes.lg, fontWeight: fontWeights.semibold, color: colors.textSecondary }}>Recipes</h2>
        <button
          onClick={() => { setShowNew(true); setSelectedId(null); setIsEditing(false); }}
          style={{ fontSize: fontSizes.base, color: colors.blue, background: 'none', border: 'none', cursor: 'pointer', fontWeight: fontWeights.semibold, fontFamily: fonts.sans }}
        >
          + New
        </button>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {grouped.length === 0 && (
          <p style={{ color: colors.textSubtle, fontSize: fontSizes.base, fontFamily: fonts.sans }}>No recipes yet.</p>
        )}
        {grouped.map(group => (
          <div key={group.category} style={{ marginBottom: '0.75rem' }}>
            <p style={{ ...sectionLabel, margin: '0 0 0.25rem 0' }}>
              {group.category}
            </p>
            <SortableContext items={group.items.map(r => r.id)} strategy={verticalListSortingStrategy}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {group.items.map(r => (
                  <SortableRecipeItem
                    key={r.id}
                    recipe={r}
                    isSelected={selectedId === r.id}
                    onClick={() => { setSelectedId(r.id); setIsEditing(false); setShowNew(false); }}
                  />
                ))}
              </ul>
            </SortableContext>
          </div>
        ))}
        <DragOverlay>
          {activeRecipe && (
            <div style={{
              padding: '0.4rem 0.75rem',
              background: colors.blueLight,
              border: `1px solid ${colors.blueBorder}`,
              borderRadius: radii.md,
              fontSize: fontSizes.md,
              color: colors.blueDark,
              boxShadow: shadows.md,
              fontFamily: fonts.sans,
            }}>
              {activeRecipe.title}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {favoritesRecipe && (
        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: `1px solid ${colors.border}` }}>
          <p style={{ ...sectionLabel, margin: '0 0 0.25rem 0' }}>
            Favorites / Regular Items
          </p>
          <li style={{ listStyle: 'none', marginBottom: '0.375rem' }}>
            <button
              onClick={() => { setSelectedId(favoritesRecipe.id); setIsEditing(false); setShowNew(false); }}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '0.5rem 0.75rem',
                background: selectedId === favoritesRecipe.id ? colors.blueLight : colors.bgCard,
                border: `1px solid ${selectedId === favoritesRecipe.id ? colors.blueBorder : colors.border}`,
                borderRadius: radii.md,
                fontSize: fontSizes.base,
                color: selectedId === favoritesRecipe.id ? colors.blueDark : colors.textSecondary,
                fontWeight: selectedId === favoritesRecipe.id ? fontWeights.semibold : fontWeights.normal,
                cursor: 'pointer',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontFamily: fonts.sans,
                boxSizing: 'border-box',
              }}
            >
              {favoritesRecipe.title}
            </button>
          </li>
        </div>
      )}
    </div>
  );

  const mainPanel = (
    <div style={{ flex: 1, overflowY: 'auto', background: colors.bgPage }}>
      {showNew && (
        <RecipeEditor
          recipe={null}
          onSave={handleSave}
          onCancel={() => setShowNew(false)}
          allRecipes={recipes}
          isMobile={isMobile}
          onDirtyChange={setEditorIsDirty}
        />
      )}
      {!showNew && selectedRecipe && selectedRecipe.is_favorites && (
        <FavoritesEditor
          recipe={selectedRecipe}
          onSave={handleSave}
          isMobile={isMobile}
          onDirtyChange={setEditorIsDirty}
        />
      )}
      {!showNew && selectedRecipe && !selectedRecipe.is_favorites && !isEditing && (
        <RecipeDetail
          recipe={selectedRecipe}
          onEdit={() => setIsEditing(true)}
          onDelete={() => handleDelete(selectedRecipe.id)}
        />
      )}
      {!showNew && selectedRecipe && !selectedRecipe.is_favorites && isEditing && (
        <RecipeEditor
          recipe={selectedRecipe}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
          allRecipes={recipes}
          isMobile={isMobile}
          onDirtyChange={setEditorIsDirty}
        />
      )}
      {!showNew && !selectedRecipe && (
        <div style={{ padding: '2rem', color: colors.textSubtle, fontSize: fontSizes.base, fontFamily: fonts.sans }}>
          Select a recipe or create a new one.
        </div>
      )}
    </div>
  );

  if (isMobile && (selectedId !== null || showNew)) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ flexShrink: 0, borderBottom: `1px solid ${colors.border}`, background: colors.white, padding: '0 1rem', minHeight: '44px', display: 'flex', alignItems: 'center' }}>
          <button
            onClick={handleBackToList}
            style={{ border: 'none', background: 'transparent', color: colors.blue, fontSize: fontSizes.md, cursor: 'pointer', padding: '0.625rem 0', display: 'flex', alignItems: 'center', gap: '0.25rem', fontFamily: fonts.sans }}
          >
            ← Recipes
          </button>
        </div>
        {mainPanel}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', height: '100%' }}>
      {listPanel}
      {mainPanel}
    </div>
  );
}
