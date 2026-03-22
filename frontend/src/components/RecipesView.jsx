import { useState, useEffect } from 'react';
import { api } from '../api';

// ── RecipeEditor ────────────────────────────────────────────────────────────

function RecipeEditor({ recipe, onSave, onCancel }) {
  const [title, setTitle] = useState(recipe?.title ?? '');
  const [ingredients, setIngredients] = useState(
    recipe?.ingredients?.length ? recipe.ingredients : [{ name: '', amount: '' }]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const setIng = (i, field, value) =>
    setIngredients(prev => prev.map((ing, idx) => idx === i ? { ...ing, [field]: value } : ing));

  const addIng = () => setIngredients(prev => [...prev, { name: '', amount: '' }]);
  const removeIng = (i) => setIngredients(prev => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const validIngs = ingredients.filter(i => i.name.trim());
    setLoading(true);
    try {
      const saved = recipe
        ? await api.updateRecipe(recipe.id, title, validIngs)
        : await api.createRecipe(title, validIngs);
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

// ── RecipeDetail ─────────────────────────────────────────────────────────────

function RecipeDetail({ recipe, onEdit, onDelete }) {
  return (
    <div style={{ padding: '1.5rem', maxWidth: '480px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111827' }}>{recipe.title}</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={onEdit} style={{ padding: '0.375rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', background: 'transparent', fontSize: '0.875rem', cursor: 'pointer', color: '#374151' }}>
            Edit
          </button>
          <button onClick={onDelete} style={{ padding: '0.375rem 0.75rem', border: '1px solid #fca5a5', borderRadius: '0.375rem', background: 'transparent', fontSize: '0.875rem', cursor: 'pointer', color: '#dc2626' }}>
            Delete
          </button>
        </div>
      </div>

      {recipe.ingredients.length === 0 ? (
        <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No ingredients added.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {recipe.ingredients.map(ing => (
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
    </div>
  );
}

// ── RecipesView ──────────────────────────────────────────────────────────────

export default function RecipesView({ isMobile }) {
  const [recipes, setRecipes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    api.getRecipes().then(setRecipes);
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

  const listPanel = (
    <div style={{
      width: isMobile ? '100%' : '220px',
      borderRight: isMobile ? 'none' : '1px solid #e5e7eb',
      borderBottom: isMobile ? '1px solid #e5e7eb' : 'none',
      background: '#fff',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      padding: '1rem',
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
      <ul style={{ listStyle: 'none', overflowY: 'auto', flex: 1 }}>
        {recipes.length === 0 && <li style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No recipes yet.</li>}
        {recipes.map(r => (
          <li key={r.id}>
            <button
              onClick={() => { setSelectedId(r.id); setIsEditing(false); setShowNew(false); }}
              style={{
                width: '100%', textAlign: 'left',
                padding: '0.5rem 0.5rem',
                border: 'none', borderRadius: '0.375rem',
                background: selectedId === r.id ? '#eff6ff' : 'transparent',
                color: selectedId === r.id ? '#1d4ed8' : '#374151',
                fontWeight: selectedId === r.id ? '600' : 'normal',
                fontSize: '0.9375rem', cursor: 'pointer',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}
            >
              {r.title}
            </button>
          </li>
        ))}
      </ul>
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
