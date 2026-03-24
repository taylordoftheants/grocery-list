import { useState, useEffect } from 'react';
import { api } from '../api';
import AddItemForm from './AddItemForm';
import { colors, fonts, fontSizes, fontWeights, radii, card, sectionLabel, btnPrimary, btnSecondary } from '../theme';

export default function ItemList({ list, isMobile }) {
  const [items, setItems] = useState([]);
  const [viewMode, setViewMode] = useState('grouped'); // 'grouped' | 'aggregated'

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

  // Aggregated view: group unpurchased non-spice items by lowercase name
  const aggMap = new Map();
  for (const item of unpurchased) {
    const key = item.name.toLowerCase();
    if (!aggMap.has(key)) aggMap.set(key, { name: item.name, items: [], recipes: new Set() });
    const entry = aggMap.get(key);
    entry.items.push(item);
    if (item.source_recipe) entry.recipes.add(item.source_recipe);
  }
  const aggGroups = [...aggMap.values()].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <main style={{ padding: isMobile ? '1rem' : '1.5rem', background: colors.bgPage, minHeight: '100%', fontFamily: fonts.sans }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h1 style={{ fontSize: fontSizes['2xl'], fontWeight: fontWeights.bold, margin: 0, color: colors.textPrimary }}>
          {list.name}
        </h1>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {['grouped', 'aggregated'].map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                ...(viewMode === mode ? btnPrimary : btnSecondary),
                padding: '0.25rem 0.625rem',
                minHeight: 'unset',
                fontSize: fontSizes.sm,
              }}
            >
              {mode === 'grouped' ? 'By Recipe' : 'Aggregated'}
            </button>
          ))}
        </div>
      </div>
      <AddItemForm onAdd={handleAdd} />

      {unpurchased.length === 0 && spiceItems.length === 0 && purchased.length === 0 && (
        <p style={{ color: colors.textSubtle, fontSize: fontSizes.base }}>No items yet. Add one above.</p>
      )}

      {viewMode === 'grouped' ? (
        <>
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
        </>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, marginBottom: '0.75rem' }}>
          {aggGroups.map(group => (
            <AggregatedItem
              key={group.name.toLowerCase()}
              group={group}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </ul>
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

function AggregatedItem({ group, onToggle, onDelete }) {
  const { name, items, recipes } = group;
  const count = items.length;
  const amounts = [...new Set(items.map(i => i.amount).filter(Boolean))];
  const amountText = amounts.join(', ');
  const recipeList = [...recipes].sort().join(', ');
  const allPurchased = items.every(i => i.purchased);

  const handleGroupToggle = () => {
    const target = !allPurchased;
    for (const item of items) {
      if (!!item.purchased !== target) onToggle(item);
    }
  };

  const handleGroupDelete = () => {
    for (const item of items) onDelete(item.id);
  };

  return (
    <li style={{ ...card, display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.625rem 0.75rem', marginBottom: '0.375rem' }}>
      <input
        type="checkbox"
        checked={allPurchased}
        onChange={handleGroupToggle}
        style={{ width: '1rem', height: '1rem', cursor: 'pointer', accentColor: colors.blue, flexShrink: 0, marginTop: '0.125rem' }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
          <span style={{
            fontSize: fontSizes.base,
            color: allPurchased ? colors.textSubtle : colors.textPrimary,
            textDecoration: allPurchased ? 'line-through' : 'none',
            fontFamily: fonts.sans,
          }}>
            {name}
          </span>
          {count > 1 && (
            <span style={{
              fontSize: fontSizes.xs, fontWeight: fontWeights.semibold,
              color: colors.white, background: colors.blue,
              borderRadius: radii.full, padding: '0.1rem 0.4rem', lineHeight: 1.4,
            }}>
              ×{count}
            </span>
          )}
          {amountText && (
            <span style={{ fontSize: fontSizes.sm, color: colors.textSubtle, whiteSpace: 'nowrap' }}>
              {amountText}
            </span>
          )}
        </div>
        {recipeList && (
          <p style={{ margin: '0.2rem 0 0', fontSize: fontSizes.xs, color: colors.textSubtle, fontFamily: fonts.sans }}>
            {recipeList}
          </p>
        )}
      </div>
      <button
        onClick={handleGroupDelete}
        aria-label={`Remove ${name}`}
        style={{
          border: 'none', background: 'transparent', color: colors.textSubtle,
          fontSize: '1rem', padding: '0.375rem', lineHeight: 1, cursor: 'pointer',
          minWidth: '44px', minHeight: '44px', display: 'flex',
          alignItems: 'center', justifyContent: 'center', borderRadius: radii.sm,
        }}
      >
        ×
      </button>
    </li>
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
