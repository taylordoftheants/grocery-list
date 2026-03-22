import { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import { api } from '../api';
import AddToListModal from './AddToListModal';

// ── Helpers ──────────────────────────────────────────────────────────────────

function getMondayOf(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon…
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDateKey(date) {
  return date.toLocaleDateString('en-CA'); // 'YYYY-MM-DD'
}

function getWeekDays(monday) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function formatDayLabel(date) {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
}

function formatWeekRange(monday) {
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  const opts = { month: 'short', day: 'numeric' };
  return `${monday.toLocaleDateString('en-US', opts)} – ${sunday.toLocaleDateString('en-US', opts)}`;
}

// ── DraggableRecipe ───────────────────────────────────────────────────────────

function DraggableRecipe({ recipe }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `recipe-${recipe.id}`,
    data: { recipeId: recipe.id, label: recipe.title },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        padding: '0.5rem 0.75rem',
        background: isDragging ? '#dbeafe' : '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '0.375rem',
        marginBottom: '0.375rem',
        fontSize: '0.875rem',
        color: '#374151',
        cursor: 'grab',
        opacity: isDragging ? 0.4 : 1,
        userSelect: 'none',
      }}
    >
      {recipe.title}
    </div>
  );
}

// ── DayColumn ─────────────────────────────────────────────────────────────────

function DayColumn({ dateKey, dayLabel, entries, onDelete, onAddManual }) {
  const { setNodeRef, isOver } = useDroppable({ id: dateKey });
  const [manualInput, setManualInput] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [adding, setAdding] = useState(false);

  const handleManualAdd = async (e) => {
    e.preventDefault();
    if (!manualInput.trim() || adding) return;
    setAdding(true);
    try {
      await onAddManual(dateKey, manualInput.trim());
      setManualInput('');
      setShowInput(false);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        background: isOver ? '#eff6ff' : '#fff',
        transition: 'background 0.15s',
        padding: '0.5rem',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '120px',
      }}
    >
      <p style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.375rem', textAlign: 'center' }}>
        {dayLabel}
      </p>

      <div style={{ flex: 1 }}>
        {entries.map(entry => (
          <div key={entry.id} style={{
            display: 'flex', alignItems: 'center', gap: '0.25rem',
            background: entry.recipe_id ? '#eff6ff' : '#f0fdf4',
            border: `1px solid ${entry.recipe_id ? '#bfdbfe' : '#bbf7d0'}`,
            borderRadius: '0.25rem',
            padding: '0.25rem 0.375rem',
            marginBottom: '0.25rem',
            fontSize: '0.8125rem',
          }}>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#374151' }}>
              {entry.label}
            </span>
            <button
              onClick={() => onDelete(entry.id)}
              style={{ border: 'none', background: 'transparent', color: '#9ca3af', cursor: 'pointer', lineHeight: 1, fontSize: '0.875rem', padding: '0 0.125rem', flexShrink: 0 }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {showInput ? (
        <form onSubmit={handleManualAdd} style={{ marginTop: '0.25rem', display: 'flex', gap: '0.25rem' }}>
          <input
            autoFocus
            value={manualInput}
            onChange={e => setManualInput(e.target.value)}
            placeholder="Meal name"
            style={{ flex: 1, padding: '0.25rem 0.375rem', border: '1px solid #d1d5db', borderRadius: '0.25rem', fontSize: '0.8125rem', minWidth: 0 }}
          />
          <button type="submit" disabled={adding} style={{ padding: '0.25rem 0.375rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '0.25rem', fontSize: '0.8125rem', cursor: 'pointer' }}>✓</button>
          <button type="button" onClick={() => setShowInput(false)} style={{ padding: '0.25rem 0.375rem', background: 'transparent', border: '1px solid #d1d5db', borderRadius: '0.25rem', fontSize: '0.8125rem', cursor: 'pointer', color: '#6b7280' }}>✕</button>
        </form>
      ) : (
        <button
          onClick={() => setShowInput(true)}
          style={{ marginTop: '0.25rem', width: '100%', padding: '0.25rem', border: '1px dashed #d1d5db', borderRadius: '0.25rem', background: 'transparent', color: '#9ca3af', fontSize: '0.75rem', cursor: 'pointer' }}
        >
          + Add
        </button>
      )}
    </div>
  );
}

// ── MobilePlanView ────────────────────────────────────────────────────────────

function MobilePlanView({ weekDays, entriesByDate, recipes, onAddEntry, onDeleteEntry }) {
  const [expandRecipes, setExpandRecipes] = useState(false);

  return (
    <div>
      {/* Recipe accordion */}
      <div style={{ marginBottom: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', overflow: 'hidden' }}>
        <button
          onClick={() => setExpandRecipes(e => !e)}
          style={{ width: '100%', padding: '0.75rem 1rem', background: '#fff', border: 'none', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
        >
          Add Recipe to Plan
          <span>{expandRecipes ? '▲' : '▼'}</span>
        </button>
        {expandRecipes && (
          <div style={{ background: '#f9fafb', borderTop: '1px solid #e5e7eb', padding: '0.75rem' }}>
            {recipes.length === 0 && <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No recipes yet.</p>}
            {recipes.map(recipe => (
              <MobileRecipeRow key={recipe.id} recipe={recipe} weekDays={weekDays} onAdd={onAddEntry} />
            ))}
          </div>
        )}
      </div>

      {/* Day list */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 140px)', gap: '0.5rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '0.5rem' }}>
        {weekDays.map(day => {
          const key = formatDateKey(day);
          return (
            <DayColumn
              key={key}
              dateKey={key}
              dayLabel={formatDayLabel(day)}
              entries={entriesByDate[key] ?? []}
              onDelete={onDeleteEntry}
              onAddManual={(dateKey, label) => onAddEntry({ date: dateKey, recipe_id: null, label })}
            />
          );
        })}
      </div>
      <p style={{ fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center', marginTop: '0.25rem' }}>← scroll to see all days →</p>
    </div>
  );
}

function MobileRecipeRow({ recipe, weekDays, onAdd }) {
  const [selectedDate, setSelectedDate] = useState(formatDateKey(weekDays[0]));
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    setAdding(true);
    try {
      await onAdd({ date: selectedDate, recipe_id: recipe.id, label: recipe.title });
    } finally {
      setAdding(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
      <span style={{ flex: 1, fontSize: '0.875rem', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{recipe.title}</span>
      <select
        value={selectedDate}
        onChange={e => setSelectedDate(e.target.value)}
        style={{ padding: '0.3rem 0.375rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.8125rem', background: '#fff' }}
      >
        {weekDays.map(d => (
          <option key={formatDateKey(d)} value={formatDateKey(d)}>
            {d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' })}
          </option>
        ))}
      </select>
      <button
        onClick={handleAdd}
        disabled={adding}
        style={{ padding: '0.3rem 0.5rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '0.375rem', fontSize: '0.8125rem', cursor: adding ? 'default' : 'pointer' }}
      >
        Add
      </button>
    </div>
  );
}

// ── MealPlan ──────────────────────────────────────────────────────────────────

export default function MealPlan({ lists, isMobile }) {
  const [weekStart, setWeekStart] = useState(() => getMondayOf(new Date()));
  const [entries, setEntries] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [isAddToListOpen, setIsAddToListOpen] = useState(false);
  const [addToListLoading, setAddToListLoading] = useState(false);
  const [addToListSuccess, setAddToListSuccess] = useState(null);
  const [activeRecipe, setActiveRecipe] = useState(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  useEffect(() => {
    api.getRecipes().then(setRecipes);
  }, []);

  useEffect(() => {
    const key = formatDateKey(weekStart);
    api.getMealPlan(key).then(setEntries);
  }, [weekStart]);

  const weekDays = getWeekDays(weekStart);

  const entriesByDate = entries.reduce((acc, e) => {
    if (!acc[e.date]) acc[e.date] = [];
    acc[e.date].push(e);
    return acc;
  }, {});

  const handleAddEntry = async (entryData) => {
    const entry = await api.addMealPlanEntry(entryData);
    setEntries(prev => [...prev, entry]);
  };

  const handleDeleteEntry = async (id) => {
    await api.deleteMealPlanEntry(id);
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const handleDragStart = (event) => {
    const recipe = recipes.find(r => `recipe-${r.id}` === event.active.id);
    setActiveRecipe(recipe ?? null);
  };

  const handleDragEnd = (event) => {
    setActiveRecipe(null);
    const { over, active } = event;
    if (!over) return;
    const { recipeId, label } = active.data.current;
    handleAddEntry({ date: over.id, recipe_id: recipeId, label });
  };

  const handleAddToList = async (listId) => {
    setAddToListLoading(true);
    try {
      const { added } = await api.addMealPlanToList(listId, formatDateKey(weekStart));
      const listName = lists.find(l => l.id === listId)?.name ?? 'list';
      setAddToListSuccess(`${added} item${added !== 1 ? 's' : ''} added to "${listName}"`);
      setIsAddToListOpen(false);
      setTimeout(() => setAddToListSuccess(null), 4000);
    } finally {
      setAddToListLoading(false);
    }
  };

  const weekGrid = (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', minWidth: 0 }}>
      {weekDays.map(day => {
        const key = formatDateKey(day);
        return (
          <DayColumn
            key={key}
            dateKey={key}
            dayLabel={formatDayLabel(day)}
            entries={entriesByDate[key] ?? []}
            onDelete={handleDeleteEntry}
            onAddManual={(dateKey, label) => handleAddEntry({ date: dateKey, recipe_id: null, label })}
          />
        );
      })}
    </div>
  );

  return (
    <div style={{ padding: '1rem', height: '100%', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={() => setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; })}
            style={{ padding: '0.375rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', background: '#fff', cursor: 'pointer', fontSize: '0.875rem' }}>
            ← Prev
          </button>
          <span style={{ fontSize: '0.9375rem', fontWeight: '600', color: '#374151' }}>{formatWeekRange(weekStart)}</span>
          <button onClick={() => setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; })}
            style={{ padding: '0.375rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', background: '#fff', cursor: 'pointer', fontSize: '0.875rem' }}>
            Next →
          </button>
        </div>
        <button
          onClick={() => setIsAddToListOpen(true)}
          style={{ padding: '0.5rem 1rem', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '0.375rem', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer' }}
        >
          Add to List
        </button>
      </div>

      {addToListSuccess && (
        <div style={{ background: '#dcfce7', color: '#166534', padding: '0.625rem 1rem', borderRadius: '0.375rem', fontSize: '0.875rem', marginBottom: '1rem' }}>
          ✓ {addToListSuccess}
        </div>
      )}

      {/* Main content */}
      {isMobile ? (
        <MobilePlanView
          weekDays={weekDays}
          entriesByDate={entriesByDate}
          recipes={recipes}
          onAddEntry={handleAddEntry}
          onDeleteEntry={handleDeleteEntry}
        />
      ) : (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div style={{ display: 'flex', gap: '1rem', flex: 1, minHeight: 0 }}>
            {/* Recipe source panel */}
            <div style={{ width: '200px', flexShrink: 0, overflowY: 'auto' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Recipes
              </p>
              {recipes.length === 0 && <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No recipes yet.</p>}
              {recipes.map(r => <DraggableRecipe key={r.id} recipe={r} />)}
            </div>

            {/* Week grid */}
            <div style={{ flex: 1, overflowX: 'auto' }}>
              {weekGrid}
            </div>
          </div>

          <DragOverlay>
            {activeRecipe && (
              <div style={{
                padding: '0.5rem 0.75rem',
                background: '#dbeafe',
                border: '1px solid #93c5fd',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                color: '#1d4ed8',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                cursor: 'grabbing',
              }}>
                {activeRecipe.title}
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {isAddToListOpen && (
        <AddToListModal
          lists={lists}
          onConfirm={handleAddToList}
          onClose={() => setIsAddToListOpen(false)}
          loading={addToListLoading}
        />
      )}
    </div>
  );
}
