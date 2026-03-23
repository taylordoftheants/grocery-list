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

const CATEGORIES = ['Core Meals', 'Extras / Sauces'];

// ── SortableRecipeItem ────────────────────────────────────────────────────────

function SortableRecipeItem({ recipe, isSelected, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: recipe.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1, listStyle: 'none' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', borderRadius: '0.375rem', background: isSelected ? '#eff6ff' : 'transparent' }}>
        <span
          {...attributes}
          {...listeners}
          style={{ cursor: 'grab', color: '#d1d5db', padding: '0.25rem 0.375rem', touchAction: 'none', userSelect: 'none', fontSize: '0.875rem', lineHeight: 1, flexShrink: 0 }}
        >
          ⠿
        </span>
        <button
          onClick={onClick}
          style={{
            flex: 1, textAlign: 'left',
            padding: '0.5rem 0.5rem 0.5rem 0',
            border: 'none', borderRadius: '0.375rem',
            background: 'transparent',
            color: isSelected ? '#1d4ed8' : '#374151',
            fontWeight: isSelected ? '600' : 'normal',
            fontSize: '0.9375rem', cursor: 'pointer',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}
        >
          {recipe.title}
        </button>
      </div>
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
        suggestedSides.push(ing.name.trim());
        seenSides.add(lname);
      } else if (ing.optional_category === 'protein' && !seenProteins.has(lname)) {
        suggestedProteins.push(ing.name.trim());
        seenProteins.add(lname);
      } else if (ing.optional_category === 'spices' && !seenSpices.has(lname)) {
        suggestedSpices.push(ing.name.trim());
        seenSpices.add(lname);
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ padding: '1.5rem', maxWidth: '480px' }}>
      <h2 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '1rem', color: '#111827' }}>
        {recipe ? 'Edit Recipe' : 'New Recipe'}
      </h2>

      {error && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem', borderRadius: '0.375rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
          Recipe Title
        </label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Spaghetti Bolognese"
          required
          style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.9375rem', boxSizing: 'border-box' }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
          Category
        </label>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.9375rem', background: '#fff' }}
        >
          {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>Ingredients</label>
          <button type="button" onClick={addIng} style={{ fontSize: '0.8125rem', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '500' }}>
            + Add ingredient
          </button>
        </div>

        {ingredients.map((ing, i) => (
          <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.375rem', alignItems: 'center' }}>
            <input
              value={ing.amount}
              onChange={e => setIng(i, 'amount', e.target.value)}
              placeholder="Amount"
              style={{ width: '90px', padding: '0.4rem 0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem', flexShrink: 0 }}
            />
            <input
              value={ing.name}
              onChange={e => setIng(i, 'name', e.target.value)}
              placeholder="Ingredient"
              style={{ flex: 1, padding: '0.4rem 0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem' }}
            />
            {ingredients.length > 1 && (
              <button type="button" onClick={() => removeIng(i)} style={{ border: 'none', background: 'transparent', color: '#9ca3af', fontSize: '1.125rem', cursor: 'pointer', lineHeight: 1, padding: '0.25rem' }}>
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#92400e' }}>Side Options</label>
          <button type="button" onClick={addSide} style={{ fontSize: '0.8125rem', color: '#d97706', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '500' }}>
            + Add side
          </button>
        </div>
        {sideOptions.length === 0 ? (
          <p style={{ fontSize: '0.8125rem', color: '#9ca3af', fontStyle: 'italic' }}>e.g. green beans, roasted potatoes, rice</p>
        ) : (
          sideOptions.map((ing, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.375rem', alignItems: 'center' }}>
              <input value={ing.amount} onChange={e => setSide(i, 'amount', e.target.value)} placeholder="Amount"
                style={{ width: '90px', padding: '0.4rem 0.5rem', border: '1px solid #fde68a', borderRadius: '0.375rem', fontSize: '0.875rem', flexShrink: 0, background: '#fffbeb' }} />
              <input value={ing.name} onChange={e => setSide(i, 'name', e.target.value)} placeholder="Side option"
                style={{ flex: 1, padding: '0.4rem 0.5rem', border: '1px solid #fde68a', borderRadius: '0.375rem', fontSize: '0.875rem', background: '#fffbeb' }} />
              <button type="button" onClick={() => removeSide(i)} style={{ border: 'none', background: 'transparent', color: '#9ca3af', fontSize: '1.125rem', cursor: 'pointer', lineHeight: 1, padding: '0.25rem' }}>×</button>
            </div>
          ))
        )}
        {suggestedSides.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#9ca3af', alignSelf: 'center', marginRight: '0.125rem' }}>Suggestions:</span>
            {suggestedSides.map(name => (
              <button key={name} type="button" onClick={() => setSideOptions(prev => [...prev, { name, amount: '' }])}
                style={{ padding: '0.2rem 0.625rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '1rem', fontSize: '0.8125rem', color: '#92400e', cursor: 'pointer' }}>
                + {name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1e40af' }}>Protein Options</label>
          <button type="button" onClick={addProtein} style={{ fontSize: '0.8125rem', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '500' }}>
            + Add protein
          </button>
        </div>
        {proteinOptions.length === 0 ? (
          <p style={{ fontSize: '0.8125rem', color: '#9ca3af', fontStyle: 'italic' }}>e.g. chicken breast, tofu, shrimp</p>
        ) : (
          proteinOptions.map((ing, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.375rem', alignItems: 'center' }}>
              <input value={ing.amount} onChange={e => setProtein(i, 'amount', e.target.value)} placeholder="Amount"
                style={{ width: '90px', padding: '0.4rem 0.5rem', border: '1px solid #bfdbfe', borderRadius: '0.375rem', fontSize: '0.875rem', flexShrink: 0, background: '#eff6ff' }} />
              <input value={ing.name} onChange={e => setProtein(i, 'name', e.target.value)} placeholder="Protein option"
                style={{ flex: 1, padding: '0.4rem 0.5rem', border: '1px solid #bfdbfe', borderRadius: '0.375rem', fontSize: '0.875rem', background: '#eff6ff' }} />
              <button type="button" onClick={() => removeProtein(i)} style={{ border: 'none', background: 'transparent', color: '#9ca3af', fontSize: '1.125rem', cursor: 'pointer', lineHeight: 1, padding: '0.25rem' }}>×</button>
            </div>
          ))
        )}
        {suggestedProteins.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#9ca3af', alignSelf: 'center', marginRight: '0.125rem' }}>Suggestions:</span>
            {suggestedProteins.map(name => (
              <button key={name} type="button" onClick={() => setProteinOptions(prev => [...prev, { name, amount: '' }])}
                style={{ padding: '0.2rem 0.625rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '1rem', fontSize: '0.8125rem', color: '#1e40af', cursor: 'pointer' }}>
                + {name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#065f46' }}>Spices and Such</label>
          <button type="button" onClick={addSpice} style={{ fontSize: '0.8125rem', color: '#059669', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '500' }}>
            + Add spice
          </button>
        </div>
        {spiceItems.length === 0 ? (
          <p style={{ fontSize: '0.8125rem', color: '#9ca3af', fontStyle: 'italic' }}>e.g. cumin, paprika, red pepper flakes</p>
        ) : (
          spiceItems.map((ing, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.375rem', alignItems: 'center' }}>
              <input value={ing.amount} onChange={e => setSpice(i, 'amount', e.target.value)} placeholder="Amount"
                style={{ width: '90px', padding: '0.4rem 0.5rem', border: '1px solid #6ee7b7', borderRadius: '0.375rem', fontSize: '0.875rem', flexShrink: 0, background: '#d1fae5' }} />
              <input value={ing.name} onChange={e => setSpice(i, 'name', e.target.value)} placeholder="Spice or seasoning"
                style={{ flex: 1, padding: '0.4rem 0.5rem', border: '1px solid #6ee7b7', borderRadius: '0.375rem', fontSize: '0.875rem', background: '#d1fae5' }} />
              <button type="button" onClick={() => removeSpice(i)} style={{ border: 'none', background: 'transparent', color: '#9ca3af', fontSize: '1.125rem', cursor: 'pointer', lineHeight: 1, padding: '0.25rem' }}>×</button>
            </div>
          ))
        )}
        {suggestedSpices.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#9ca3af', alignSelf: 'center', marginRight: '0.125rem' }}>Suggestions:</span>
            {suggestedSpices.map(name => (
              <button key={name} type="button" onClick={() => setSpiceItems(prev => [...prev, { name, amount: '' }])}
                style={{ padding: '0.2rem 0.625rem', background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: '1rem', fontSize: '0.8125rem', color: '#065f46', cursor: 'pointer' }}>
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
            padding: '0.5rem 1.25rem',
            background: loading || !title.trim() ? '#d1d5db' : '#2563eb',
            color: '#fff', border: 'none', borderRadius: '0.375rem',
            fontSize: '0.9375rem', fontWeight: '600',
            cursor: loading || !title.trim() ? 'default' : 'pointer',
          }}
        >
          {loading ? 'Saving...' : 'Save Recipe'}
        </button>
        <button type="button" onClick={onCancel} style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.9375rem', cursor: 'pointer', color: '#374151' }}>
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
    <div style={{ padding: '1.5rem', maxWidth: '480px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111827' }}>{recipe.title}</h2>
        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, marginLeft: '0.5rem' }}>
          <button onClick={onEdit} style={{ padding: '0.375rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', background: 'transparent', fontSize: '0.875rem', cursor: 'pointer', color: '#374151' }}>
            Edit
          </button>
          <button onClick={onDelete} style={{ padding: '0.375rem 0.75rem', border: '1px solid #fca5a5', borderRadius: '0.375rem', background: 'transparent', fontSize: '0.875rem', cursor: 'pointer', color: '#dc2626' }}>
            Delete
          </button>
        </div>
      </div>
      <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '1rem' }}>{recipe.category}</p>

      {required.length === 0 && sideOptions.length === 0 && proteinOptions.length === 0 && spiceItems.length === 0 ? (
        <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No ingredients added.</p>
      ) : (
        <>
          {required.length > 0 && (
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: (sideOptions.length > 0 || proteinOptions.length > 0 || spiceItems.length > 0) ? '1rem' : 0 }}>
              {required.map(ing => (
                <li key={ing.id} style={{ padding: '0.4rem 0.75rem', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.375rem', marginBottom: '0.375rem', fontSize: '0.9375rem', color: '#374151' }}>
                  {[ing.amount, ing.name].filter(Boolean).join(' ')}
                </li>
              ))}
            </ul>
          )}

          {sideOptions.length > 0 && (
            <div style={{ marginBottom: (proteinOptions.length > 0 || spiceItems.length > 0) ? '1rem' : 0 }}>
              <p style={{ fontSize: '0.75rem', fontWeight: '600', color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                Side Options
              </p>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {sideOptions.map(ing => (
                  <li key={ing.id} style={{ padding: '0.4rem 0.75rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '0.375rem', marginBottom: '0.375rem', fontSize: '0.9375rem', color: '#78350f' }}>
                    {[ing.amount, ing.name].filter(Boolean).join(' ')}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {proteinOptions.length > 0 && (
            <div style={{ marginBottom: spiceItems.length > 0 ? '1rem' : 0 }}>
              <p style={{ fontSize: '0.75rem', fontWeight: '600', color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                Protein Options
              </p>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {proteinOptions.map(ing => (
                  <li key={ing.id} style={{ padding: '0.4rem 0.75rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '0.375rem', marginBottom: '0.375rem', fontSize: '0.9375rem', color: '#1e40af' }}>
                    {[ing.amount, ing.name].filter(Boolean).join(' ')}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {spiceItems.length > 0 && (
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: '600', color: '#065f46', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                Spices and Such
              </p>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {spiceItems.map(ing => (
                  <li key={ing.id} style={{ padding: '0.4rem 0.75rem', background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: '0.375rem', marginBottom: '0.375rem', fontSize: '0.9375rem', color: '#065f46' }}>
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
      borderRight: isMobile ? 'none' : '1px solid #e5e7eb',
      borderBottom: isMobile ? '1px solid #e5e7eb' : 'none',
      background: '#fff',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      padding: '1rem',
      overflowY: 'auto',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: '600', color: '#374151' }}>Recipes</h2>
        <button
          onClick={() => { setShowNew(true); setSelectedId(null); setIsEditing(false); }}
          style={{ fontSize: '0.8125rem', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}
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
          <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No recipes yet.</p>
        )}
        {grouped.map(group => (
          <div key={group.category} style={{ marginBottom: '0.75rem' }}>
            <p style={{ fontSize: '0.6875rem', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem', margin: '0 0 0.25rem 0' }}>
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
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '0.375rem',
              fontSize: '0.9375rem',
              color: '#1d4ed8',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}>
              {activeRecipe.title}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );

  const mainPanel = (
    <div style={{ flex: 1, overflowY: 'auto', background: '#f9fafb' }}>
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
        <div style={{ padding: '2rem', color: '#9ca3af', fontSize: '0.875rem' }}>
          Select a recipe or create a new one.
        </div>
      )}
    </div>
  );

  if (isMobile && (selectedId !== null || showNew)) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ flexShrink: 0, borderBottom: '1px solid #e5e7eb', background: '#fff', padding: '0.625rem 1rem' }}>
          <button
            onClick={handleBackToList}
            style={{ border: 'none', background: 'transparent', color: '#2563eb', fontSize: '0.9375rem', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
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
