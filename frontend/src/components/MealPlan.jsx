import { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api } from '../api';
import AddToListModal from './AddToListModal';
import AddToDayModal from './AddToDayModal';

const CATEGORIES = ['Core Meals', 'Protein Options', 'Extras / Sauces'];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getMondayOf(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDateKey(date) {
  return date.toLocaleDateString('en-CA');
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

function dateKeyToLabel(dateKey) {
  return formatDayLabel(new Date(dateKey + 'T00:00:00'));
}

// ── SortableRecipe ────────────────────────────────────────────────────────────

function SortableRecipe({ recipe }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: recipe.id });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
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
        touchAction: 'none',
      }}
    >
      {recipe.title}
    </div>
  );
}

// ── DayColumn (desktop) ───────────────────────────────────────────────────────

function DayColumn({ dateKey, dayLabel, entries, onDelete, onOpenPicker }) {
  const { setNodeRef, isOver } = useDroppable({ id: dateKey });

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

      <button
        onClick={() => onOpenPicker(dateKey)}
        style={{ marginTop: '0.25rem', width: '100%', padding: '0.25rem', border: '1px dashed #d1d5db', borderRadius: '0.25rem', background: 'transparent', color: '#9ca3af', fontSize: '0.75rem', cursor: 'pointer' }}
      >
        + Add
      </button>
    </div>
  );
}

// ── Mobile vertical layout ────────────────────────────────────────────────────

function MobileDayCard({ dateKey, dayLabel, entries, onDelete, onOpenPicker }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: '0.5rem',
      padding: '0.75rem',
      marginBottom: '0.5rem',
    }}>
      <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
        {dayLabel}
      </p>

      {entries.length === 0 && (
        <p style={{ fontSize: '0.8125rem', color: '#d1d5db', marginBottom: '0.375rem' }}>Nothing planned</p>
      )}

      {entries.map(entry => (
        <div key={entry.id} style={{
          display: 'flex', alignItems: 'center', gap: '0.375rem',
          background: entry.recipe_id ? '#eff6ff' : '#f0fdf4',
          border: `1px solid ${entry.recipe_id ? '#bfdbfe' : '#bbf7d0'}`,
          borderRadius: '0.375rem',
          padding: '0.375rem 0.625rem',
          marginBottom: '0.25rem',
          fontSize: '0.875rem',
        }}>
          <span style={{ flex: 1, color: '#374151' }}>{entry.label}</span>
          <button
            onClick={() => onDelete(entry.id)}
            style={{ border: 'none', background: 'transparent', color: '#9ca3af', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: '0 0.125rem', flexShrink: 0 }}
          >
            ×
          </button>
        </div>
      ))}

      <button
        onClick={() => onOpenPicker(dateKey)}
        style={{ marginTop: '0.375rem', width: '100%', padding: '0.5rem', border: '1px dashed #d1d5db', borderRadius: '0.375rem', background: 'transparent', color: '#6b7280', fontSize: '0.875rem', cursor: 'pointer' }}
      >
        + Add
      </button>
    </div>
  );
}

function MobilePlanView({ weekDays, entriesByDate, onDeleteEntry, onOpenPicker }) {
  return (
    <div>
      {weekDays.map(day => {
        const key = formatDateKey(day);
        return (
          <MobileDayCard
            key={key}
            dateKey={key}
            dayLabel={formatDayLabel(day)}
            entries={entriesByDate[key] ?? []}
            onDelete={onDeleteEntry}
            onOpenPicker={onOpenPicker}
          />
        );
      })}
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
  const [pickingForDate, setPickingForDate] = useState(null);
  const isDraggingRef = useRef(false);

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

  useEffect(() => {
    const id = setInterval(() => {
      if (!isDraggingRef.current) api.getRecipes().then(setRecipes);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const key = formatDateKey(weekStart);
    const id = setInterval(() => {
      if (!isDraggingRef.current) api.getMealPlan(key).then(setEntries);
    }, 5000);
    return () => clearInterval(id);
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

  const handlePickerConfirm = async (entriesToAdd) => {
    await Promise.all(entriesToAdd.map(e => handleAddEntry(e)));
    setPickingForDate(null);
  };

  const handleDragStart = (event) => {
    isDraggingRef.current = true;
    const recipe = recipes.find(r => r.id === event.active.id);
    setActiveRecipe(recipe ?? null);
  };

  const handleDragEnd = (event) => {
    isDraggingRef.current = false;
    setActiveRecipe(null);
    const { active, over } = event;
    if (!over) return;

    if (typeof over.id === 'string') {
      const recipe = recipes.find(r => r.id === active.id);
      if (recipe) handleAddEntry({ date: over.id, recipe_id: recipe.id, label: recipe.title });
    } else if (active.id !== over.id) {
      const src = recipes.find(r => r.id === active.id);
      const dst = recipes.find(r => r.id === over.id);
      if (!src || !dst || src.category !== dst.category) return;
      const oldIndex = recipes.findIndex(r => r.id === active.id);
      const newIndex = recipes.findIndex(r => r.id === over.id);
      const newOrder = arrayMove(recipes, oldIndex, newIndex);
      setRecipes(newOrder);
      api.reorderRecipes(newOrder.map(r => r.id));
    }
  };

  const handleDragCancel = () => {
    isDraggingRef.current = false;
    setActiveRecipe(null);
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

  const grouped = CATEGORIES
    .map(cat => ({ category: cat, items: recipes.filter(r => r.category === cat) }))
    .filter(g => g.items.length > 0);

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
            onOpenPicker={setPickingForDate}
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
          onDeleteEntry={handleDeleteEntry}
          onOpenPicker={setPickingForDate}
        />
      ) : (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
          <div style={{ display: 'flex', gap: '1rem', flex: 1, minHeight: 0 }}>
            {/* Recipe source panel */}
            <div style={{ width: '200px', flexShrink: 0, overflowY: 'auto' }}>
              {grouped.length === 0 && <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No recipes yet.</p>}
              {grouped.map(group => (
                <div key={group.category} style={{ marginBottom: '0.75rem' }}>
                  <p style={{ fontSize: '0.6875rem', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.375rem' }}>
                    {group.category}
                  </p>
                  <SortableContext items={group.items.map(r => r.id)} strategy={verticalListSortingStrategy}>
                    {group.items.map(r => <SortableRecipe key={r.id} recipe={r} />)}
                  </SortableContext>
                </div>
              ))}
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

      {pickingForDate && (
        <AddToDayModal
          recipes={recipes}
          date={pickingForDate}
          dayLabel={dateKeyToLabel(pickingForDate)}
          onConfirm={handlePickerConfirm}
          onClose={() => setPickingForDate(null)}
        />
      )}
    </div>
  );
}
