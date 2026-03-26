import { useState, useRef } from 'react';
import {
  SortableContext, useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { colors, fonts, fontSizes, fontWeights, radii, input, btnPrimary, shadows } from '../theme';

export default function ListSidebar({ lists, selectedListId, onSelect, onCreate, onDelete, onRename, onReorderLists, isMobile }) {
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const addInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newName.trim() || loading) return;
    setLoading(true);
    setCreateError('');
    try {
      await onCreate(newName.trim());
      setNewName('');
      // Keep form open for creating multiple lists
      setTimeout(() => addInputRef.current?.focus(), 0);
    } catch (err) {
      setCreateError(err.message || 'Could not create list');
    } finally {
      setLoading(false);
    }
  };

  const handleRenameCommit = async (listId) => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== lists.find(l => l.id === listId)?.name) {
      try {
        await onRename(listId, trimmed);
      } catch {
        // silently revert
      }
    }
    setEditingId(null);
  };

  // ── Mobile: inline horizontal bar ────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{
        background: colors.bgSurface,
        borderBottom: `1px solid ${colors.border}`,
        padding: '0.5rem 1rem',
        flexShrink: 0,
        fontFamily: fonts.sans,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {lists.map(list => (
            <MobileChip
              key={list.id}
              list={list}
              selected={selectedListId === list.id}
              onSelect={onSelect}
            />
          ))}

          {showAddForm ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.25rem', flexShrink: 0, alignItems: 'center' }}>
              <input
                autoFocus
                value={newName}
                onChange={e => { setNewName(e.target.value); setCreateError(''); }}
                placeholder="List name"
                style={{ ...input, padding: '0.375rem 0.625rem', width: '110px', minHeight: '36px', borderRadius: radii.full }}
              />
              <button type="submit" disabled={loading || !newName.trim()} style={{ padding: '0.375rem 0.625rem', background: colors.amber, color: colors.charcoal, border: 'none', borderRadius: radii.full, fontSize: fontSizes.base, cursor: 'pointer', minHeight: '36px' }}>✓</button>
              <button type="button" onClick={() => { setShowAddForm(false); setNewName(''); setCreateError(''); }} style={{ padding: '0.375rem 0.625rem', background: 'transparent', border: `1px solid ${colors.borderMid}`, borderRadius: radii.full, fontSize: fontSizes.base, cursor: 'pointer', color: colors.textMuted, minHeight: '36px' }}>✕</button>
            </form>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              style={{ flexShrink: 0, padding: '0.375rem 0.75rem', border: `1px dashed ${colors.borderMid}`, borderRadius: radii.full, background: 'transparent', color: colors.textMuted, fontSize: fontSizes.base, cursor: 'pointer', whiteSpace: 'nowrap', minHeight: '36px', fontFamily: fonts.sans }}
            >
              + New
            </button>
          )}
        </div>
        {createError && (
          <p style={{ margin: '0.25rem 0 0', fontSize: fontSizes.xs, color: colors.error, fontFamily: fonts.sans }}>
            {createError}
          </p>
        )}
      </div>
    );
  }

  // ── Desktop: sidebar (SortableContext lives here; DndContext is in App) ────────
  const canSubmit = newName.trim().length > 0 && !loading;

  return (
    <aside style={{
      width: '220px',
      borderRight: `1px solid ${colors.border}`,
      background: colors.bgSurface,
      display: 'flex',
      flexDirection: 'column',
      padding: '1rem',
      flexShrink: 0,
      fontFamily: fonts.sans,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <h2 style={{ fontSize: fontSizes.lg, fontWeight: fontWeights.bold, color: colors.textPrimary }}>Lists</h2>
        <button
          onClick={() => { setShowAddForm(v => !v); setCreateError(''); }}
          style={{ fontSize: fontSizes.md, color: colors.amber, background: 'none', border: 'none', cursor: 'pointer', fontWeight: fontWeights.semibold, fontFamily: fonts.display }}
        >
          + New
        </button>
      </div>

      <SortableContext items={lists.map(l => l.id)} strategy={verticalListSortingStrategy}>
        <ul style={{ listStyle: 'none', flex: 1, overflowY: 'auto', padding: 0, margin: 0 }}>
          {lists.map(list => (
            <SortableListItem
              key={list.id}
              list={list}
              selected={selectedListId === list.id}
              confirmDeleteId={confirmDeleteId}
              editingId={editingId}
              editName={editName}
              onSelect={onSelect}
              onDelete={onDelete}
              onSetConfirmDelete={setConfirmDeleteId}
              onEditStart={(l) => { setEditingId(l.id); setEditName(l.name); }}
              onEditChange={setEditName}
              onEditCommit={handleRenameCommit}
              onEditCancel={() => setEditingId(null)}
            />
          ))}
        </ul>
      </SortableContext>

      {showAddForm && (
        <div style={{ marginTop: '0.75rem' }}>
          {createError && (
            <p style={{ margin: '0 0 0.375rem', fontSize: fontSizes.xs, color: colors.error, fontFamily: fonts.sans }}>
              {createError}
            </p>
          )}
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.25rem' }}>
            <input
              ref={addInputRef}
              autoFocus
              value={newName}
              onChange={e => { setNewName(e.target.value); setCreateError(''); }}
              placeholder="List name..."
              style={{ ...input, flex: 1, width: 'auto', minHeight: '40px' }}
            />
            <button
              type="submit"
              disabled={!canSubmit}
              style={{
                ...btnPrimary,
                padding: '0.5rem 0.75rem',
                background: canSubmit ? colors.blue : colors.borderMid,
                cursor: canSubmit ? 'pointer' : 'default',
                flexShrink: 0,
                minHeight: '40px',
              }}
            >
              +
            </button>
          </form>
        </div>
      )}
    </aside>
  );
}

// ── Mobile chip (droppable for item→list drag) ────────────────────────────────

function MobileChip({ list, selected, onSelect }) {
  const { setNodeRef, isOver } = useDroppable({ id: list.id });
  return (
    <button
      ref={setNodeRef}
      onClick={() => onSelect(list.id)}
      style={{
        flexShrink: 0,
        padding: '0.375rem 0.75rem',
        border: `1px solid ${isOver ? colors.amber : selected ? colors.amber : colors.border}`,
        borderRadius: radii.full,
        background: isOver ? colors.amberLight : selected ? colors.amber : colors.bgCard,
        color: selected && !isOver ? colors.charcoal : isOver ? colors.amberDark : colors.textSecondary,
        fontSize: fontSizes.base,
        fontWeight: selected ? fontWeights.semibold : fontWeights.normal,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        minHeight: '36px',
        fontFamily: fonts.sans,
        transition: 'background 0.15s ease, border-color 0.15s ease',
      }}
    >
      {list.name}
    </button>
  );
}

// ── Sortable list item (desktop) — drag handle + rename + delete ──────────────

function SortableListItem({ list, selected, confirmDeleteId, editingId, editName, onSelect, onDelete, onSetConfirmDelete, onEditStart, onEditChange, onEditCommit, onEditCancel }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: list.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    marginBottom: '0.375rem',
  };

  if (confirmDeleteId === list.id) {
    return (
      <li ref={setNodeRef} style={style}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.5rem', borderRadius: radii.md, background: colors.errorBg, border: `1px solid ${colors.errorBorder}` }}>
          <span style={{ flex: 1, fontSize: fontSizes.sm, color: colors.errorText, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Delete "{list.name}"?
          </span>
          <button
            onClick={() => { onDelete(list.id); onSetConfirmDelete(null); }}
            style={{ border: 'none', background: colors.error, color: colors.white, borderRadius: radii.sm, fontSize: fontSizes.sm, padding: '0.2rem 0.5rem', cursor: 'pointer', flexShrink: 0 }}
          >
            Delete
          </button>
          <button
            onClick={() => onSetConfirmDelete(null)}
            style={{ border: `1px solid ${colors.borderMid}`, background: 'transparent', color: colors.textMuted, borderRadius: radii.sm, fontSize: fontSizes.sm, padding: '0.2rem 0.5rem', cursor: 'pointer', flexShrink: 0 }}
          >
            Cancel
          </button>
        </div>
      </li>
    );
  }

  const isEditing = editingId === list.id;
  const cardBorder = selected ? colors.amberBorder : colors.border;
  const cardBg = selected ? colors.amberLight : colors.bgCard;

  return (
    <li ref={setNodeRef} style={style}>
      <div style={{
        display: 'flex', alignItems: 'center',
        border: `1px solid ${cardBorder}`,
        borderRadius: radii.md,
        background: cardBg,
        transition: 'background 0.15s ease, border-color 0.15s ease',
      }}>
        {/* Drag handle */}
        <span
          {...listeners}
          {...attributes}
          style={{
            cursor: 'grab',
            color: colors.textSubtle,
            padding: '0 0.375rem 0 0.5rem',
            fontSize: '0.875rem',
            lineHeight: 1,
            touchAction: 'none',
            flexShrink: 0,
            userSelect: 'none',
          }}
        >
          ⠿
        </span>

        {isEditing ? (
          <input
            autoFocus
            value={editName}
            onChange={e => onEditChange(e.target.value)}
            onBlur={() => onEditCommit(list.id)}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); onEditCommit(list.id); }
              if (e.key === 'Escape') { e.preventDefault(); onEditCancel(); }
            }}
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              padding: '0.5rem 0.25rem',
              fontSize: fontSizes.base,
              fontFamily: 'inherit',
              color: colors.textPrimary,
              outline: 'none',
              minWidth: 0,
            }}
          />
        ) : (
          <button
            onClick={() => onSelect(list.id)}
            style={{
              flex: 1, textAlign: 'left',
              padding: '0.5rem 0.25rem',
              border: 'none', borderRadius: radii.md,
              background: 'transparent',
              fontWeight: selected ? fontWeights.semibold : fontWeights.normal,
              color: selected ? colors.amberDark : colors.textSecondary,
              fontSize: fontSizes.base,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              cursor: 'pointer',
              fontFamily: fonts.sans,
            }}
          >
            {list.name}
          </button>
        )}

        {/* Rename button */}
        {!isEditing && (
          <button
            onClick={() => onEditStart(list)}
            aria-label={`Rename ${list.name}`}
            style={{ border: 'none', background: 'transparent', color: colors.textSubtle, fontSize: '0.75rem', padding: '0.375rem 0.25rem', lineHeight: 1, cursor: 'pointer', flexShrink: 0 }}
          >
            ✏
          </button>
        )}

        {/* Delete button */}
        <button
          onClick={() => onSetConfirmDelete(list.id)}
          aria-label={`Delete ${list.name}`}
          style={{ border: 'none', background: 'transparent', color: colors.textSubtle, fontSize: '1rem', padding: '0.375rem 0.5rem', borderRadius: `0 ${radii.md} ${radii.md} 0`, lineHeight: 1, cursor: 'pointer', flexShrink: 0 }}
        >
          ×
        </button>
      </div>
    </li>
  );
}
