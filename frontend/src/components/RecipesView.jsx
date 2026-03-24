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

function RecipeEditor({ recipe, onSave, onCancel, allRecipes }) {
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

  const setIng = (i, field, value) =>
    setIngredients(prev => prev.map((ing, idx) => idx === i ? { ...ing, [field]: value } : ing));
  const addIng = () => setIngredients(prev => [...prev, { name: '', amount: '' }]);
  const removeIng = (i) => setIngredients(prev => prev.filter((_, idx) => idx !== i));

  const setSide = (i, field, value) =>
    setSideOptions(prev => prev.map((ing, idx) => idx === i ? { ...ing, [field]: value } : ing));
  const addSide = () => setSideOptions(prev => [...prev, { name: '', amount: '' }]);
  const removeSide = (i) => setSideOptions(prev => prev.filter((_, idx) => idx !== i));

  const setProtein = (i, field, value) =>
    setProteinOptions(prev => prev.map((ing, idx) => idx === i ? { ...ing, [field]: value } : ing));
  const addProtein = () => setProteinOptions(prev => [...prev, { name: '', amount: '' }]);
  const removeProtein = (i) => setProteinOptions(prev => prev.filter((_, idx) => idx !== i));

  const setSpice = (i, field, value) =>
    setSpiceItems(prev => prev.map((ing, idx) => idx === i ? { ...ing, [field]: value } : ing));
  const addSpice = () => setSpiceItems(prev => [...prev, { name: '', amount: '' }]);
  const removeSpice = (i) => setSpiceItems(prev => prev.filter((_, idx) => idx !== i));

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
      onSave(saved);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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

  const ingInputStyle = { width: '90px', padding: '0.4rem 0.5rem', border: `1px solid ${colors.borderMid}`, borderRadius: radii.md, fontSize: fontSizes.base, flexShrink: 0, background: colors.white, fontFamily: fonts.sans };
  const ingNameStyle = { flex: 1, padding: '0.4rem 0.5rem', border: `1px solid ${colors.borderMid}`, borderRadius: radii.md, fontSize: fontSizes.base, background: colors.white, fontFamily: fonts.sans };
  const removeBtn = { border: 'none', background: 'transparent', color: colors.textSubtle, fontSize: '1.125rem', cursor: 'pointer', lineHeight: 1, padding: '0.25rem', minWidth: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' };

  const labelStyle = { display: 'block', fontSize: fontSizes.base, fontWeight: fontWeights.medium, color: colors.textSecondary, marginBottom: '0.25rem', fontFamily: fonts.sans };

  return (
    <form onSubmit={handleSubmit} style={{ padding: '1.5rem 1rem', maxWidth: '480px', fontFamily: fonts.sans }}>
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
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Spaghetti Bolognese"
          required
          style={input}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={labelStyle}>Category</label>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
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
            <input value={ing.amount} onChange={e => setIng(i, 'amount', e.target.value)} placeholder="Amount" style={ingInputStyle} />
            <input value={ing.name} onChange={e => setIng(i, 'name', e.target.value)} placeholder="Ingredient" style={{ ...ingNameStyle }} />
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
              <input value={ing.amount} onChange={e => setSide(i, 'amount', e.target.value)} placeholder="Amount"
                style={{ ...ingInputStyle, border: `1px solid ${colors.sides.border}`, background: colors.sides.bg }} />
              <input value={ing.name} onChange={e => setSide(i, 'name', e.target.value)} placeholder="Side option"
                style={{ ...ingNameStyle, border: `1px solid ${colors.sides.border}`, background: colors.sides.bg }} />
              <button type="button" onClick={() => removeSide(i)} style={removeBtn}>×</button>
            </div>
          ))
        )}
        {suggestedSides.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.5rem' }}>
            <span style={{ fontSize: fontSizes.sm, color: colors.textSubtle, alignSelf: 'center' }}>Suggestions:</span>
            {suggestedSides.map(name => (
              <button key={name} type="button" onClick={() => setSideOptions(prev => [...prev, { name, amount: '' }])}
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
              <input value={ing.amount} onChange={e => setProtein(i, 'amount', e.target.value)} placeholder="Amount"
                style={{ ...ingInputStyle, border: `1px solid ${colors.protein.border}`, background: colors.protein.bg }} />
              <input value={ing.name} onChange={e => setProtein(i, 'name', e.target.value)} placeholder="Protein option"
                style={{ ...ingNameStyle, border: `1px solid ${colors.protein.border}`, background: colors.protein.bg }} />
              <button type="button" onClick={() => removeProtein(i)} style={removeBtn}>×</button>
            </div>
          ))
        )}
        {suggestedProteins.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.5rem' }}>
            <span style={{ fontSize: fontSizes.sm, color: colors.textSubtle, alignSelf: 'center' }}>Suggestions:</span>
            {suggestedProteins.map(name => (
              <button key={name} type="button" onClick={() => setProteinOptions(prev => [...prev, { name, amount: '' }])}
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
              <input value={ing.amount} onChange={e => setSpice(i, 'amount', e.target.value)} placeholder="Amount"
                style={{ ...ingInputStyle, border: `1px solid ${colors.spices.border}`, background: colors.spices.bg }} />
              <input value={ing.name} onChange={e => setSpice(i, 'name', e.target.value)} placeholder="Spice or seasoning"
                style={{ ...ingNameStyle, border: `1px solid ${colors.spices.border}`, background: colors.spices.bg }} />
              <button type="button" onClick={() => removeSpice(i)} style={removeBtn}>×</button>
            </div>
          ))
        )}
        {suggestedSpices.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.5rem' }}>
            <span style={{ fontSize: fontSizes.sm, color: colors.textSubtle, alignSelf: 'center' }}>Suggestions:</span>
            {suggestedSpices.map(name => (
              <button key={name} type="button" onClick={() => setSpiceItems(prev => [...prev, { name, amount: '' }])}
                style={{ padding: '0.2rem 0.625rem', background: colors.spices.bg, border: `1px solid ${colors.spices.border}`, borderRadius: radii.full, fontSize: fontSizes.base, color: colors.spices.label, cursor: 'pointer', fontFamily: fonts.sans }}>
                + {name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          type="submit"
          disabled={loading || !title.trim()}
          style={{
            ...btnPrimary,
            background: loading || !title.trim() ? colors.borderMid : colors.blue,
            cursor: loading || !title.trim() ? 'default' : 'pointer',
          }}
        >
          {loading ? 'Saving...' : 'Save Recipe'}
        </button>
        <button type="button" onClick={onCancel} style={{ ...btnSecondary }}>
          Cancel
        </button>
      </div>
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

// ── RecipesView ───────────────────────────────────────────────────────────────

export default function RecipesView({ isMobile }) {
  const [recipes, setRecipes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [activeId, setActiveId] = useState(null);
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
    setSelectedId(null);
    setIsEditing(false);
    setShowNew(false);
  };

  const grouped = CATEGORIES
    .map(cat => ({ category: cat, items: recipes.filter(r => r.category === cat) }))
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
    </div>
  );

  const mainPanel = (
    <div style={{ flex: 1, overflowY: 'auto', background: colors.bgPage }}>
      {showNew && (
        <RecipeEditor recipe={null} onSave={handleSave} onCancel={() => setShowNew(false)} allRecipes={recipes} />
      )}
      {!showNew && selectedRecipe && !isEditing && (
        <RecipeDetail
          recipe={selectedRecipe}
          onEdit={() => setIsEditing(true)}
          onDelete={() => handleDelete(selectedRecipe.id)}
        />
      )}
      {!showNew && selectedRecipe && isEditing && (
        <RecipeEditor recipe={selectedRecipe} onSave={handleSave} onCancel={() => setIsEditing(false)} allRecipes={recipes} />
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
