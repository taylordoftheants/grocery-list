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

const CATEGORIES = ['Core Meals', 'Protein Options', 'Extras / Sauces'];

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

function RecipeEditor({ recipe, onSave, onCancel }) {
  const [title, setTitle] = useState(recipe?.title ?? '');
  const [category, setCategory] = useState(recipe?.category ?? 'Core Meals');
  const [ingredients, setIngredients] = useState(
    recipe?.ingredients?.filter(i => !i.is_optional).length
      ? recipe.ingredients.filter(i => !i.is_optional)
      : [{ name: '', amount: '' }]
  );
  const [optionals, setOptionals] = useState(
    recipe?.ingredients?.filter(i => i.is_optional) ?? []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const setIng = (i, field, value) =>
    setIngredients(prev => prev.map((ing, idx) => idx === i ? { ...ing, [field]: value } : ing));
  const addIng = () => setIngredients(prev => [...prev, { name: '', amount: '' }]);
  const removeIng = (i) => setIngredients(prev => prev.filter((_, idx) => idx !== i));

  const setOpt = (i, field, value) =>
    setOptionals(prev => prev.map((ing, idx) => idx === i ? { ...ing, [field]: value } : ing));
  const addOpt = () => setOptionals(prev => [...prev, { name: '', amount: '' }]);
  const removeOpt = (i) => setOptionals(prev => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const validIngs = ingredients.filter(i => i.name.trim()).map(i => ({ ...i, is_optional: 0 }));
    const validOpts = optionals.filter(i => i.name.trim()).map(i => ({ ...i, is_optional: 1 }));
    setLoading(true);
    try {
      const saved = recipe
        ? await api.updateRecipe(recipe.id, title, [...validIngs, ...validOpts], category)
        : await api.createRecipe(title, [...validIngs, ...validOpts], category);
      onSave(saved);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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

      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#92400e' }}>Optional Additions</label>
          <button type="button" onClick={addOpt} style={{ fontSize: '0.8125rem', color: '#d97706', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '500' }}>
            + Add optional
          </button>
        </div>

        {optionals.length === 0 ? (
          <p style={{ fontSize: '0.8125rem', color: '#9ca3af', fontStyle: 'italic' }}>
            None — add sides or accompaniments here (e.g. green beans, bread rolls).
          </p>
        ) : (
          optionals.map((ing, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.375rem', alignItems: 'center' }}>
              <input
                value={ing.amount}
                onChange={e => setOpt(i, 'amount', e.target.value)}
                placeholder="Amount"
                style={{ width: '90px', padding: '0.4rem 0.5rem', border: '1px solid #fde68a', borderRadius: '0.375rem', fontSize: '0.875rem', flexShrink: 0, background: '#fffbeb' }}
              />
              <input
                value={ing.name}
                onChange={e => setOpt(i, 'name', e.target.value)}
                placeholder="Optional item"
                style={{ flex: 1, padding: '0.4rem 0.5rem', border: '1px solid #fde68a', borderRadius: '0.375rem', fontSize: '0.875rem', background: '#fffbeb' }}
              />
              <button type="button" onClick={() => removeOpt(i)} style={{ border: 'none', background: 'transparent', color: '#9ca3af', fontSize: '1.125rem', cursor: 'pointer', lineHeight: 1, padding: '0.25rem' }}>
                ×
              </button>
            </div>
          ))
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
  const optional = recipe.ingredients.filter(i => i.is_optional);

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

      {required.length === 0 && optional.length === 0 ? (
        <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No ingredients added.</p>
      ) : (
        <>
          {required.length > 0 && (
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: optional.length > 0 ? '1rem' : 0 }}>
              {required.map(ing => (
                <li key={ing.id} style={{
                  padding: '0.4rem 0.75rem',
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.375rem',
                  marginBottom: '0.375rem',
                  fontSize: '0.9375rem',
                  color: '#374151',
                }}>
                  {[ing.amount, ing.name].filter(Boolean).join(' ')}
                </li>
              ))}
            </ul>
          )}

          {optional.length > 0 && (
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: '600', color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                Optional Additions
              </p>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {optional.map(ing => (
                  <li key={ing.id} style={{
                    padding: '0.4rem 0.75rem',
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: '0.375rem',
                    marginBottom: '0.375rem',
                    fontSize: '0.9375rem',
                    color: '#78350f',
                  }}>
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
        <RecipeEditor recipe={null} onSave={handleSave} onCancel={() => setShowNew(false)} />
      )}
      {!showNew && selectedRecipe && !isEditing && (
        <RecipeDetail
          recipe={selectedRecipe}
          onEdit={() => setIsEditing(true)}
          onDelete={() => handleDelete(selectedRecipe.id)}
        />
      )}
      {!showNew && selectedRecipe && isEditing && (
        <RecipeEditor recipe={selectedRecipe} onSave={handleSave} onCancel={() => setIsEditing(false)} />
      )}
      {!showNew && !selectedRecipe && (
        <div style={{ padding: '2rem', color: '#9ca3af', fontSize: '0.875rem' }}>
          Select a recipe or create a new one.
        </div>
      )}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', height: '100%' }}>
      {listPanel}
      {mainPanel}
    </div>
  );
}
