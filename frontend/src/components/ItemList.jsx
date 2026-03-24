import { useState, useEffect } from 'react';
import { api } from '../api';
import AddItemForm from './AddItemForm';
import { colors, fonts, fontSizes, fontWeights, radii, card, sectionLabel } from '../theme';

export default function ItemList({ list, isMobile }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.getItems(list.id).then(setItems);
  }, [list.id]);

  useEffect(() => {
    const id = setInterval(() => api.getItems(list.id).then(setItems), 5000);
    return () => clearInterval(id);
  }, [list.id]);

  const handleAdd = async (name, amount) => {
    const item = await api.addItem(list.id, name, amount);
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

  const unpurchased = items.filter(i => !i.purchased && !i.is_spice);
  const spiceItems = items.filter(i => !i.purchased && i.is_spice);
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
    <main style={{ padding: isMobile ? '1rem' : '1.5rem', background: colors.bgPage, minHeight: '100%', fontFamily: fonts.sans }}>
      <h1 style={{ fontSize: fontSizes['2xl'], fontWeight: fontWeights.bold, marginBottom: '1rem', color: colors.textPrimary }}>
        {list.name}
      </h1>
      <AddItemForm onAdd={handleAdd} />

      {unpurchased.length === 0 && spiceItems.length === 0 && purchased.length === 0 && (
        <p style={{ color: colors.textSubtle, fontSize: fontSizes.base }}>No items yet. Add one above.</p>
      )}

      {recipeGroups.map(([recipeName, groupItems]) => (
        <div key={recipeName} style={{ marginBottom: '0.75rem' }}>
          <p style={{ ...sectionLabel, margin: '0 0 0.375rem 0' }}>
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
            <p style={{ ...sectionLabel, margin: '0 0 0.375rem 0' }}>
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

      {spiceItems.length > 0 && (
        <div style={{ marginBottom: '0.75rem' }}>
          <p style={{ ...sectionLabel, color: colors.spices.label, margin: '0 0 0.375rem 0' }}>
            Spices and Such
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {spiceItems.map(item => (
              <Item key={item.id} item={item} onToggle={handleToggle} onDelete={handleDelete} />
            ))}
          </ul>
        </div>
      )}

      {purchased.length > 0 && (
        <>
          <p style={{ ...sectionLabel, margin: '1rem 0 0.5rem' }}>
            Purchased ({purchased.length})
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
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
      ...card,
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.625rem 0.75rem',
      marginBottom: '0.375rem',
    }}>
      <input
        type="checkbox"
        checked={!!item.purchased}
        onChange={() => onToggle(item)}
        style={{ width: '1rem', height: '1rem', cursor: 'pointer', accentColor: colors.blue, flexShrink: 0 }}
      />
      <span style={{
        flex: 1,
        fontSize: fontSizes.base,
        color: item.purchased ? colors.textSubtle : colors.textPrimary,
        textDecoration: item.purchased ? 'line-through' : 'none',
        fontFamily: fonts.sans,
      }}>
        {item.name}
      </span>
      {item.amount && (
        <span style={{
          fontSize: fontSizes.sm,
          color: colors.textSubtle,
          whiteSpace: 'nowrap',
        }}>
          {item.amount}
        </span>
      )}
      <button
        onClick={() => onDelete(item.id)}
        aria-label={`Remove ${item.name}`}
        style={{
          border: 'none',
          background: 'transparent',
          color: colors.textSubtle,
          fontSize: '1rem',
          padding: '0.375rem',
          lineHeight: 1,
          cursor: 'pointer',
          minWidth: '44px',
          minHeight: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: radii.sm,
        }}
      >
        ×
      </button>
    </li>
  );
}
