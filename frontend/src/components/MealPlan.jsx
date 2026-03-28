import { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  pointerWithin,
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
import { colors, fonts, fontSizes, fontWeights, radii, shadows, card, sectionLabel } from '../theme';

const CATEGORIES = ['Core Meals', 'Extras / Sauces'];

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
        background: isDragging ? colors.blueLight : colors.bgCard,
        border: `1px solid ${isDragging ? colors.blueBorder : colors.border}`,
        borderRadius: radii.md,
        marginBottom: '0.375rem',
        fontSize: fontSizes.base,
        color: colors.textSecondary,
        cursor: 'grab',
        opacity: isDragging ? 0.4 : 1,
        userSelect: 'none',
        touchAction: 'none',
        fontFamily: fonts.sans,
      }}
    >
      {recipe.title}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getSelectedOptionalNames(entry, recipes) {
  if (!entry.recipe_id || !entry.selected_optional_ids) return [];
  let ids;
  try { ids = JSON.parse(entry.selected_optional_ids); } catch { return []; }
  if (!ids?.length) return [];
  const recipe = recipes.find(r => r.id === entry.recipe_id);
  if (!recipe) return [];
  return recipe.ingredients.filter(i => ids.includes(i.id)).map(i => i.name);
}

// ── DraggableEntry ────────────────────────────────────────────────────────────

function DraggableEntry({ entry, recipes, onDelete, variant = 'day' }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: `entry-${entry.id}` });
  const optNames = getSelectedOptionalNames(entry, recipes);
  const isLeftovers = entry.is_leftovers;

  if (variant === 'weekly') {
    return (
      <span
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        style={{
          display: 'inline-flex', alignItems: 'flex-start', gap: '0.25rem',
          background: isLeftovers ? '#f3f4f6' : entry.recipe_id ? '#eff6ff' : '#fefce8',
          border: `1px solid ${isLeftovers ? '#d1d5db' : entry.recipe_id ? '#bfdbfe' : '#fde68a'}`,
          borderRadius: '1rem',
          padding: '0.25rem 0.625rem',
          fontSize: '0.875rem',
          color: isLeftovers ? '#6b7280' : '#374151',
          cursor: isDragging ? 'grabbing' : 'grab',
          opacity: isDragging ? 0.4 : 1,
          userSelect: 'none',
          touchAction: 'none',
        }}
      >
        <span>
          <span style={{ display: 'block' }}>{isLeftovers ? `🍱 ${entry.label}` : entry.label}</span>
          {optNames.map((name, i) => (
            <span key={i} style={{ display: 'block', fontSize: '0.6875rem', color: '#6b7280', paddingLeft: '0.25rem' }}>· {name}</span>
          ))}
        </span>
        <button
          onClick={() => onDelete(entry.id)}
          style={{ border: 'none', background: 'transparent', color: '#9ca3af', cursor: 'pointer', fontSize: '0.875rem', lineHeight: 1, padding: '0', flexShrink: 0, marginTop: '0.125rem' }}
        >
          ×
        </button>
      </span>
    );
  }

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: '0.25rem',
        background: isLeftovers ? '#f3f4f6' : entry.recipe_id ? '#eff6ff' : '#f0fdf4',
        border: `1px solid ${isLeftovers ? '#d1d5db' : entry.recipe_id ? '#bfdbfe' : '#bbf7d0'}`,
        borderRadius: '0.25rem',
        padding: '0.25rem 0.375rem',
        marginBottom: '0.25rem',
        fontSize: '0.8125rem',
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.4 : 1,
        userSelect: 'none',
        touchAction: 'none',
        transform: transform ? `translate3d(${transform.x}px,${transform.y}px,0)` : undefined,
      }}
    >
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: isLeftovers ? '#6b7280' : '#374151' }}>
          {isLeftovers ? `🍱 ${entry.label}` : entry.label}
        </span>
        {optNames.map((name, i) => (
          <span key={i} style={{ display: 'block', fontSize: '0.625rem', color: '#6b7280', paddingLeft: '0.375rem' }}>· {name}</span>
        ))}
      </div>
      <button
        onClick={() => onDelete(entry.id)}
        style={{ border: 'none', background: 'transparent', color: '#9ca3af', cursor: 'pointer', lineHeight: 1, fontSize: '0.875rem', padding: '0 0.125rem', flexShrink: 0 }}
      >
        ×
      </button>
    </div>
  );
}

// ── DayColumn (desktop) ───────────────────────────────────────────────────────

function DayColumn({ dateKey, dayLabel, entries, recipes, onDelete, onOpenPicker }) {
  const { setNodeRef, isOver } = useDroppable({ id: dateKey });

  return (
    <div
      ref={setNodeRef}
      style={{
        border: `1px solid ${isOver ? colors.blueBorder : colors.border}`,
        borderRadius: radii.lg,
        background: isOver ? colors.blueLight : colors.bgCard,
        transition: 'background 0.15s, border-color 0.15s',
        padding: '0.5rem',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '120px',
        fontFamily: fonts.sans,
      }}
    >
      <p style={{ ...sectionLabel, marginBottom: '0.375rem', textAlign: 'center' }}>
        {dayLabel}
      </p>

      <div style={{ flex: 1 }}>
        {entries.map(entry => (
          <DraggableEntry key={entry.id} entry={entry} recipes={recipes} onDelete={onDelete} />
        ))}
      </div>

      <button
        onClick={() => onOpenPicker(dateKey)}
        style={{ marginTop: '0.25rem', width: '100%', padding: '0.25rem', border: `1px dashed ${colors.borderMid}`, borderRadius: radii.sm, background: 'transparent', color: colors.textSubtle, fontSize: fontSizes.sm, cursor: 'pointer', minHeight: '36px', fontFamily: fonts.sans }}
      >
        + Add
      </button>
    </div>
  );
}

// ── WeeklyBox ─────────────────────────────────────────────────────────────────

function WeeklyBox({ entries, recipes, onDelete, onOpenPicker, isMobile, setDropRef, isOver }) {
  if (isMobile) {
    return (
      <div style={{ ...card, padding: '0.75rem', marginBottom: '0.5rem', fontFamily: fonts.sans }}>
        <p style={{ ...sectionLabel, marginBottom: '0.5rem' }}>
          For the Week
        </p>

        {entries.length === 0 && (
          <p style={{ fontSize: fontSizes.base, color: colors.textDisabled, marginBottom: '0.375rem' }}>Nothing added yet</p>
        )}

        {entries.map(entry => {
          const optNames = getSelectedOptionalNames(entry, recipes);
          const isLeftovers = entry.is_leftovers;
          return (
            <div key={entry.id} style={{
              display: 'flex', alignItems: 'flex-start', gap: '0.375rem',
              background: isLeftovers ? '#f3f4f6' : entry.recipe_id ? '#eff6ff' : '#fefce8',
              border: `1px solid ${isLeftovers ? '#d1d5db' : entry.recipe_id ? '#bfdbfe' : '#fde68a'}`,
              borderRadius: '0.375rem',
              padding: '0.375rem 0.625rem',
              marginBottom: '0.25rem',
              fontSize: '0.875rem',
            }}>
              <div style={{ flex: 1 }}>
                <span style={{ display: 'block', color: isLeftovers ? '#6b7280' : '#374151' }}>
                  {isLeftovers ? `🍱 ${entry.label}` : entry.label}
                </span>
                {optNames.map((name, i) => (
                  <span key={i} style={{ display: 'block', fontSize: '0.6875rem', color: '#6b7280', paddingLeft: '0.375rem' }}>· {name}</span>
                ))}
              </div>
              <button
                onClick={() => onDelete(entry.id)}
                style={{ border: 'none', background: 'transparent', color: '#9ca3af', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: '0 0.125rem', flexShrink: 0 }}
              >
                ×
              </button>
            </div>
          );
        })}

        <button
          onClick={onOpenPicker}
          style={{ marginTop: '0.375rem', width: '100%', padding: '0.5rem', border: `1px dashed ${colors.borderMid}`, borderRadius: radii.md, background: 'transparent', color: colors.textMuted, fontSize: fontSizes.base, cursor: 'pointer', minHeight: '44px', fontFamily: fonts.sans }}
        >
          + Add
        </button>
      </div>
    );
  }

  return (
    <div ref={setDropRef} style={{ background: isOver ? colors.blueLight : colors.bgCard, border: `1px solid ${isOver ? colors.blueBorder : colors.border}`, transition: 'background 0.15s, border-color 0.15s', borderRadius: radii.lg, padding: '0.75rem 1rem', fontFamily: fonts.sans }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', flexWrap: 'wrap' }}>
        <span style={{ ...sectionLabel, marginRight: '0.25rem', flexShrink: 0, paddingTop: '0.25rem' }}>
          For the Week
        </span>
        {entries.map(entry => (
          <DraggableEntry key={entry.id} entry={entry} recipes={recipes} onDelete={onDelete} variant="weekly" />
        ))}
        <button
          onClick={onOpenPicker}
          style={{ border: `1px dashed ${colors.borderMid}`, borderRadius: radii.full, background: 'transparent', color: colors.textMuted, fontSize: fontSizes.base, padding: '0.25rem 0.625rem', cursor: 'pointer', flexShrink: 0, fontFamily: fonts.sans }}
        >
          + Add
        </button>
      </div>
    </div>
  );
}

// ── WeeklyDropZone (desktop only — must render inside DndContext) ─────────────

function WeeklyDropZone(props) {
  const { setNodeRef, isOver } = useDroppable({ id: 'weekly' });
  return <WeeklyBox {...props} setDropRef={setNodeRef} isOver={isOver} isMobile={false} />;
}

// ── Mobile vertical layout ────────────────────────────────────────────────────

function MobileDayCard({ dateKey, dayLabel, entries, recipes, onDelete, onOpenPicker, onOpenLeftoversPicker }) {
  return (
    <div style={{ ...card, padding: '0.75rem', marginBottom: '0.5rem', fontFamily: fonts.sans }}>
      <p style={{ fontSize: fontSizes.base, fontWeight: fontWeights.semibold, color: colors.textSecondary, marginBottom: '0.5rem' }}>
        {dayLabel}
      </p>

      {entries.length === 0 && (
        <p style={{ fontSize: fontSizes.base, color: colors.textDisabled, marginBottom: '0.375rem' }}>Nothing planned</p>
      )}

      {entries.map(entry => {
        const optNames = getSelectedOptionalNames(entry, recipes);
        const isLeftovers = entry.is_leftovers;
        return (
          <div key={entry.id} style={{
            display: 'flex', alignItems: 'flex-start', gap: '0.375rem',
            background: isLeftovers ? '#f3f4f6' : entry.recipe_id ? '#eff6ff' : '#f0fdf4',
            border: `1px solid ${isLeftovers ? '#d1d5db' : entry.recipe_id ? '#bfdbfe' : '#bbf7d0'}`,
            borderRadius: '0.375rem',
            padding: '0.375rem 0.625rem',
            marginBottom: '0.25rem',
            fontSize: '0.875rem',
          }}>
            <div style={{ flex: 1 }}>
              <span style={{ display: 'block', color: isLeftovers ? '#6b7280' : '#374151' }}>
                {isLeftovers ? `🍱 ${entry.label}` : entry.label}
              </span>
              {optNames.map((name, i) => (
                <span key={i} style={{ display: 'block', fontSize: '0.6875rem', color: '#6b7280', paddingLeft: '0.375rem' }}>· {name}</span>
              ))}
            </div>
            <button
              onClick={() => onDelete(entry.id)}
              style={{ border: 'none', background: 'transparent', color: '#9ca3af', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: '0 0.125rem', flexShrink: 0 }}
            >
              ×
            </button>
          </div>
        );
      })}

      <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.375rem' }}>
        <button
          onClick={() => onOpenPicker(dateKey)}
          style={{ flex: 1, padding: '0.5rem', border: `1px dashed ${colors.borderMid}`, borderRadius: radii.md, background: 'transparent', color: colors.textMuted, fontSize: fontSizes.base, cursor: 'pointer', minHeight: '44px', fontFamily: fonts.sans }}
        >
          + Add
        </button>
        <button
          onClick={() => onOpenLeftoversPicker(dateKey)}
          style={{ padding: '0.5rem 0.625rem', border: `1px dashed ${colors.borderMid}`, borderRadius: radii.md, background: 'transparent', color: colors.textMuted, fontSize: fontSizes.base, cursor: 'pointer', whiteSpace: 'nowrap', minHeight: '44px', fontFamily: fonts.sans }}
        >
          🍱
        </button>
      </div>
    </div>
  );
}

function MobilePlanView({ weekDays, entriesByDate, weeklyItems, recipes, onDeleteEntry, onOpenPicker, onOpenWeeklyPicker, onOpenLeftoversPicker }) {
  return (
    <div>
      <WeeklyBox
        entries={weeklyItems}
        recipes={recipes}
        onDelete={onDeleteEntry}
        onOpenPicker={onOpenWeeklyPicker}
        isMobile={true}
      />
      {weekDays.map(day => {
        const key = formatDateKey(day);
        return (
          <MobileDayCard
            key={key}
            dateKey={key}
            dayLabel={formatDayLabel(day)}
            entries={entriesByDate[key] ?? []}
            recipes={recipes}
            onDelete={onDeleteEntry}
            onOpenPicker={onOpenPicker}
            onOpenLeftoversPicker={onOpenLeftoversPicker}
          />
        );
      })}
    </div>
  );
}

// ── MealPlan ──────────────────────────────────────────────────────────────────

export default function MealPlan({ lists, isMobile, onCreateList, onNavigateToRecipes, onNavigateToList }) {
  const [weekStart, setWeekStart] = useState(() => getMondayOf(new Date()));
  const [entries, setEntries] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [isAddToListOpen, setIsAddToListOpen] = useState(false);
  const [addToListLoading, setAddToListLoading] = useState(false);
  const [activeRecipe, setActiveRecipe] = useState(null);
  const [activeEntry, setActiveEntry] = useState(null);
  const [pickingForDate, setPickingForDate] = useState(null);
  const [leftoversMode, setLeftoversMode] = useState(false);
  const [preCheckedRecipeId, setPreCheckedRecipeId] = useState(null);
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

  const weeklyItems = entries.filter(e => e.is_weekly);
  const entriesByDate = entries
    .filter(e => !e.is_weekly)
    .reduce((acc, e) => {
      if (!acc[e.date]) acc[e.date] = [];
      acc[e.date].push(e);
      return acc;
    }, {});

  const weekRecipeIds = new Set(entries.filter(e => e.recipe_id).map(e => e.recipe_id));
  const weekRecipes = recipes.filter(r => weekRecipeIds.has(r.id));

  const handleAddEntry = async (entryData) => {
    const entry = await api.addMealPlanEntry(entryData);
    setEntries(prev => [...prev, entry]);
  };

  const handleDeleteEntry = async (id) => {
    await api.deleteMealPlanEntry(id);
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const handlePickerConfirm = async (entriesToAdd) => {
    const isWeekly = pickingForDate === 'weekly';
    const date = isWeekly ? formatDateKey(weekStart) : pickingForDate;
    const finalEntries = entriesToAdd.map(e => ({ ...e, date, is_weekly: isWeekly ? 1 : 0 }));
    await Promise.all(finalEntries.map(e => handleAddEntry(e)));
    setPickingForDate(null);
    setLeftoversMode(false);
  };

  const handleMoveEntry = async (entryId, targetDropId) => {
    const isWeekly = targetDropId === 'weekly' ? 1 : 0;
    const date = isWeekly ? formatDateKey(weekStart) : targetDropId;
    setEntries(prev => prev.map(e => e.id === entryId ? { ...e, date, is_weekly: isWeekly } : e));
    await api.updateMealPlanEntry(entryId, { date, is_weekly: isWeekly });
  };

  const handleDragStart = (event) => {
    isDraggingRef.current = true;
    if (typeof event.active.id === 'string' && event.active.id.startsWith('entry-')) {
      const id = Number(event.active.id.replace('entry-', ''));
      setActiveEntry(entries.find(e => e.id === id) ?? null);
      setActiveRecipe(null);
    } else {
      setActiveEntry(null);
      const recipe = recipes.find(r => r.id === event.active.id);
      setActiveRecipe(recipe ?? null);
    }
  };

  const handleDragEnd = (event) => {
    isDraggingRef.current = false;
    setActiveRecipe(null);
    setActiveEntry(null);
    const { active, over } = event;

    if (typeof active.id === 'string' && active.id.startsWith('entry-')) {
      if (!over) return;
      const entryId = Number(active.id.replace('entry-', ''));
      const entry = entries.find(e => e.id === entryId);
      const sameDay = entry && !entry.is_weekly && over.id === entry.date;
      const sameWeekly = entry && entry.is_weekly && over.id === 'weekly';
      if (!sameDay && !sameWeekly) handleMoveEntry(entryId, over.id);
      return;
    }

    if (!over) return;

    if (typeof over.id === 'string') {
      const recipe = recipes.find(r => r.id === active.id);
      if (!recipe) return;
      const hasOptionals = recipe.ingredients?.some(i => i.is_optional);
      if (hasOptionals) {
        setPreCheckedRecipeId(recipe.id);
        setPickingForDate(over.id);
      } else if (over.id === 'weekly') {
        handleAddEntry({ date: formatDateKey(weekStart), recipe_id: recipe.id, label: recipe.title, is_weekly: 1 });
      } else {
        handleAddEntry({ date: over.id, recipe_id: recipe.id, label: recipe.title });
      }
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
    setActiveEntry(null);
  };

  const handleAddToList = async (listId) => {
    setAddToListLoading(true);
    try {
      await api.addMealPlanToList(listId, formatDateKey(weekStart));
      setIsAddToListOpen(false);
      onNavigateToList(listId);
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
            recipes={recipes}
            onDelete={handleDeleteEntry}
            onOpenPicker={setPickingForDate}
          />
        );
      })}
    </div>
  );

  return (
    <div style={{ padding: '1rem', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 5rem)', height: '100%', display: 'flex', flexDirection: 'column', overflowY: 'auto', background: colors.bgPage }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={() => setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; })}
            style={{ padding: '0.375rem 0.75rem', border: `1px solid ${colors.borderMid}`, borderRadius: radii.md, background: colors.bgCard, cursor: 'pointer', fontSize: fontSizes.base, fontFamily: fonts.sans, minHeight: '40px' }}>
            ← Prev
          </button>
          <span style={{ fontSize: fontSizes.md, fontWeight: fontWeights.semibold, color: colors.textSecondary, fontFamily: fonts.sans }}>{formatWeekRange(weekStart)}</span>
          <button onClick={() => setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; })}
            style={{ padding: '0.375rem 0.75rem', border: `1px solid ${colors.borderMid}`, borderRadius: radii.md, background: colors.bgCard, cursor: 'pointer', fontSize: fontSizes.base, fontFamily: fonts.sans, minHeight: '40px' }}>
            Next →
          </button>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            onClick={() => setIsAddToListOpen(true)}
            style={{ padding: '0.5rem 1rem', background: colors.navy, color: colors.white, border: 'none', borderRadius: radii.md, fontSize: fontSizes.base, fontWeight: fontWeights.semibold, cursor: 'pointer', minHeight: '40px', fontFamily: fonts.sans }}
          >
            Add Meals to Shopping List →
          </button>
        </div>
      </div>

      {/* Main content */}
      {isMobile ? (
        <MobilePlanView
          weekDays={weekDays}
          entriesByDate={entriesByDate}
          weeklyItems={weeklyItems}
          recipes={recipes}
          onDeleteEntry={handleDeleteEntry}
          onOpenPicker={setPickingForDate}
          onOpenWeeklyPicker={() => setPickingForDate('weekly')}
          onOpenLeftoversPicker={(dateKey) => { setLeftoversMode(true); setPickingForDate(dateKey); }}
        />
      ) : (
        <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
          <div style={{ display: 'flex', gap: '1rem', flex: 1, minHeight: 0 }}>
            {/* Recipe source panel */}
            <div style={{ width: '200px', flexShrink: 0, overflowY: 'auto', background: colors.white, border: `1px solid ${colors.border}`, borderRadius: radii.lg, padding: '1rem' }}>
              {grouped.length === 0 && (
                <div>
                  <p style={{ color: colors.textSubtle, fontSize: fontSizes.base, fontFamily: fonts.sans }}>No recipes yet.</p>
                  <button type="button" onClick={onNavigateToRecipes} style={{ marginTop: '0.5rem', display: 'block', width: '100%', padding: '0.3rem 0.5rem', border: `1px dashed ${colors.borderMid}`, borderRadius: radii.md, background: 'transparent', color: colors.textSubtle, fontSize: fontSizes.sm, cursor: 'pointer', textAlign: 'left', fontFamily: fonts.sans }}>
                    + New recipe
                  </button>
                </div>
              )}
              {grouped.map(group => (
                <div key={group.category} style={{ marginBottom: '0.75rem' }}>
                  <p style={{ ...sectionLabel, marginBottom: '0.375rem' }}>
                    {group.category}
                  </p>
                  <SortableContext items={group.items.map(r => r.id)} strategy={verticalListSortingStrategy}>
                    {group.items.map(r => <SortableRecipe key={r.id} recipe={r} />)}
                  </SortableContext>
                  <button type="button" onClick={onNavigateToRecipes} style={{ display: 'block', width: '100%', marginTop: '0.25rem', padding: '0.3rem 0.5rem', border: `1px dashed ${colors.borderMid}`, borderRadius: radii.md, background: 'transparent', color: colors.textSubtle, fontSize: fontSizes.sm, cursor: 'pointer', textAlign: 'left', fontFamily: fonts.sans }}>
                    + New recipe
                  </button>
                </div>
              ))}
            </div>

            {/* Week grid + For the Week */}
            <div style={{ flex: 1, overflowX: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {weekGrid}
              <WeeklyDropZone
                entries={weeklyItems}
                recipes={recipes}
                onDelete={handleDeleteEntry}
                onOpenPicker={() => setPickingForDate('weekly')}
              />
            </div>
          </div>

          <DragOverlay>
            {activeEntry && (
              <div style={{
                padding: '0.25rem 0.375rem',
                background: activeEntry.is_leftovers ? '#f3f4f6' : activeEntry.recipe_id ? '#eff6ff' : '#f0fdf4',
                border: `1px solid ${activeEntry.is_leftovers ? '#d1d5db' : activeEntry.recipe_id ? '#bfdbfe' : '#bbf7d0'}`,
                borderRadius: '0.25rem',
                fontSize: '0.8125rem',
                color: activeEntry.is_leftovers ? '#6b7280' : '#374151',
                boxShadow: shadows.md,
                cursor: 'grabbing',
                fontFamily: fonts.sans,
                maxWidth: '160px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {activeEntry.is_leftovers ? `🍱 ${activeEntry.label}` : activeEntry.label}
              </div>
            )}
            {activeRecipe && (
              <div style={{
                padding: '0.5rem 0.75rem',
                background: colors.blueLight,
                border: `1px solid ${colors.blueBorder}`,
                borderRadius: radii.md,
                fontSize: fontSizes.base,
                color: colors.blueDark,
                boxShadow: shadows.md,
                cursor: 'grabbing',
                fontFamily: fonts.sans,
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
          onCreate={onCreateList}
          isMobile={isMobile}
        />
      )}

      {pickingForDate && (
        <AddToDayModal
          recipes={recipes}
          weekRecipes={weekRecipes}
          leftoversMode={leftoversMode}
          date={pickingForDate === 'weekly' ? formatDateKey(weekStart) : pickingForDate}
          dayLabel={pickingForDate === 'weekly' ? 'For the Week' : dateKeyToLabel(pickingForDate)}
          initialCheckedId={preCheckedRecipeId}
          onConfirm={handlePickerConfirm}
          onClose={() => { setPickingForDate(null); setPreCheckedRecipeId(null); setLeftoversMode(false); }}
          onNewRecipe={onNavigateToRecipes}
          onSwitchToLeftovers={() => setLeftoversMode(true)}
          isMobile={isMobile}
        />
      )}
    </div>
  );
}
