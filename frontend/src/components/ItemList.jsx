import { useState, useEffect } from 'react';
import { api } from '../api';
import AddItemForm from './AddItemForm';

export default function ItemList({ list, isMobile }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.getItems(list.id).then(setItems);
  }, [list.id]);

  useEffect(() => {
    const id = setInterval(() => api.getItems(list.id).then(setItems), 5000);
    return () => clearInterval(id);
  }, [list.id]);

  const handleAdd = async (name) => {
    const item = await api.addItem(list.id, name);
    setItems(prev => [...prev, item]);
  };

  const handleToggle = async (item) => {
    const updated = await api.toggleItem(list.id, item.id, !item.purchased);
    setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
  };

  const handleDelete = async (itemId) => {
    await api.deleteItem(list.id, itemId);
    setItems(prev => prev.filter(i => i.id !== itemId));
  };

  const unpurchased = items.filter(i => !i.purchased);
  const purchased = items.filter(i => i.purchased);

  const groupMap = new Map();
  for (const item of unpurchased) {
    const key = item.source_recipe ?? null;
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key).push(item);
  }
  const recipeGroups = [...groupMap.entries()]
    .filter(([key]) => key !== null)
    .sort(([a], [b]) => a.localeCompare(b));
  const otherItems = groupMap.get(null) ?? [];

  return (
    <main style={{ padding: '1.5rem', background: '#f9fafb', minHeight: '100%' }}>
      <h1 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem', color: '#111827' }}>
        {list.name}
      </h1>
      <AddItemForm onAdd={handleAdd} />

      {unpurchased.length === 0 && purchased.length === 0 && (
        <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No items yet. Add one above.</p>
      )}

      {recipeGroups.map(([recipeName, groupItems]) => (
        <div key={recipeName} style={{ marginBottom: '0.75rem' }}>
          <p style={{ fontSize: '0.6875rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.375rem 0' }}>
            {recipeName}
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {groupItems.map(item => (
              <Item key={item.id} item={item} onToggle={handleToggle} onDelete={handleDelete} />
            ))}
          </ul>
        </div>
      ))}

      {otherItems.length > 0 && (
        <div style={{ marginBottom: '0.75rem' }}>
          {recipeGroups.length > 0 && (
            <p style={{ fontSize: '0.6875rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.375rem 0' }}>
              Other
            </p>
          )}
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {otherItems.map(item => (
              <Item key={item.id} item={item} onToggle={handleToggle} onDelete={handleDelete} />
            ))}
          </ul>
        </div>
      )}

      {purchased.length > 0 && (
        <>
          <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '1rem 0 0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Purchased ({purchased.length})
          </p>
          <ul style={{ listStyle: 'none' }}>
            {purchased.map(item => (
              <Item key={item.id} item={item} onToggle={handleToggle} onDelete={handleDelete} />
            ))}
          </ul>
        </>
      )}
    </main>
  );
}

function Item({ item, onToggle, onDelete }) {
  return (
    <li style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.5rem 0.75rem',
      background: '#fff',
      borderRadius: '0.375rem',
      marginBottom: '0.375rem',
      border: '1px solid #e5e7eb',
    }}>
      <input
        type="checkbox"
        checked={!!item.purchased}
        onChange={() => onToggle(item)}
        style={{ width: '1rem', height: '1rem', cursor: 'pointer' }}
      />
      <span style={{
        flex: 1,
        fontSize: '0.875rem',
        color: item.purchased ? '#9ca3af' : '#111827',
        textDecoration: item.purchased ? 'line-through' : 'none',
      }}>
        {item.name}
      </span>
      <button
        onClick={() => onDelete(item.id)}
        aria-label={`Remove ${item.name}`}
        style={{
          border: 'none',
          background: 'transparent',
          color: '#9ca3af',
          fontSize: '1rem',
          padding: '0.25rem',
          lineHeight: 1,
          cursor: 'pointer',
        }}
      >
        ×
      </button>
    </li>
  );
}
