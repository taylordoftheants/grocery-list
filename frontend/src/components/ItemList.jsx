import { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import AddItemForm from './AddItemForm';
import KrogerModal from './KrogerModal';
import KrogerSelectionModal from './KrogerSelectionModal';
import { colors, fonts, fontSizes, fontWeights, radii, card, sectionLabel, btnPrimary, btnSecondary, btnDanger, shadows } from '../theme';

export default function ItemList({ list, lists, isMobile, onMoveItem, refreshKey }) {
  const [items, setItems] = useState([]);
  const [viewMode, setViewMode] = useState('grouped'); // 'grouped' | 'aggregated'
  const [showKrogerModal, setShowKrogerModal] = useState(false);
  const [showKrogerSelectionModal, setShowKrogerSelectionModal] = useState(false);
  const [purchasedOpen, setPurchasedOpen] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);

  useEffect(() => {
    api.getItems(list.id).then(setItems);
  }, [list.id, refreshKey]);

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

  const handleClearAll = async () => {
    await api.clearAllItems(list.id);
    setItems([]);
    setClearConfirm(false);
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
    <>
    <main style={{ padding: isMobile ? '1rem' : '1.5rem', background: colors.bgPage, minHeight: '100%', fontFamily: fonts.sans }}>
      <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '1rem', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h1 style={{ fontSize: fontSizes['2xl'], fontWeight: fontWeights.bold, margin: 0, color: colors.textPrimary }}>
            {list.name}
          </h1>
          <button
            onClick={async () => {
              try {
                const status = await api.krogerStatus();
                if (status.connected) {
                  setShowKrogerSelectionModal(true);
                } else {
                  setShowKrogerModal(true);
                }
              } catch {
                setShowKrogerModal(true);
              }
            }}
            style={{ padding: '0.5rem 1rem', background: colors.navy, color: colors.white, border: 'none', borderRadius: radii.md, fontSize: fontSizes.base, fontWeight: fontWeights.semibold, cursor: 'pointer', minHeight: '40px', fontFamily: fonts.sans }}
          >
            Buy 'em, ant! →
          </button>
        </div>
        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'inline-flex',
              background: colors.bgSurface,
              border: `1px solid ${colors.borderMid}`,
              borderRadius: '999px',
              padding: '2px',
              gap: 0,
            }}
          >
            {[
              { value: 'grouped', label: 'By Recipe' },
              { value: 'aggregated', label: 'Aggregated' },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setViewMode(value)}
                style={{
                  background: viewMode === value ? colors.navy : 'transparent',
                  color: viewMode === value ? colors.white : colors.textSecondary,
                  border: 'none',
                  borderRadius: '999px',
                  padding: '0.2rem 0.625rem',
                  fontSize: fontSizes.sm,
                  fontWeight: viewMode === value ? fontWeights.semibold : fontWeights.normal,
                  cursor: 'pointer',
                  transition: 'background 0.15s, color 0.15s',
                  fontFamily: fonts.sans,
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </button>
            ))}
          </div>
          {clearConfirm ? (
            <>
              <button
                onClick={handleClearAll}
                style={{ ...btnDanger, padding: '0.25rem 0.625rem', minHeight: 'unset', fontSize: fontSizes.sm }}
              >
                Clear
              </button>
              <button
                onClick={() => setClearConfirm(false)}
                style={{ ...btnSecondary, padding: '0.25rem 0.625rem', minHeight: 'unset', fontSize: fontSizes.sm }}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setClearConfirm(true)}
              style={{ ...btnSecondary, padding: '0.25rem 0.625rem', minHeight: 'unset', fontSize: fontSizes.sm }}
            >
              Clear list
            </button>
          )}
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
                  <Item key={item.id} item={item} onToggle={handleToggle} onDelete={handleDelete} lists={lists} onMoveItem={onMoveItem} />
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
                  <Item key={item.id} item={item} onToggle={handleToggle} onDelete={handleDelete} lists={lists} onMoveItem={onMoveItem} />
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
              <Item key={item.id} item={item} onToggle={handleToggle} onDelete={handleDelete} lists={lists} onMoveItem={onMoveItem} />
            ))}
          </ul>
        </div>
      )}

      {purchased.length > 0 && (
        <>
          <button
            onClick={() => setPurchasedOpen(v => !v)}
            style={{
              ...sectionLabel,
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              margin: '1rem 0 0.5rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              fontFamily: fonts.display,
            }}
          >
            <span style={{ fontSize: fontSizes.xs }}>{purchasedOpen ? '▾' : '▸'}</span>
            Purchased ({purchased.length})
          </button>
          {purchasedOpen && (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {purchased.map(item => (
                <PurchasedItem key={item.id} item={item} onUndo={handleToggle} onDelete={handleDelete} />
              ))}
            </ul>
          )}
        </>
      )}
    </main>
    {showKrogerModal && <KrogerModal listId={list.id} isMobile={isMobile} onClose={() => setShowKrogerModal(false)} />}
    {showKrogerSelectionModal && <KrogerSelectionModal list={list} isMobile={isMobile} onClose={() => setShowKrogerSelectionModal(false)} />}
    </>
  );
}

function AggregatedItem({ group, onToggle, onDelete }) {
  const { name, items, recipes } = group;
  const count = items.length;
  const amounts = [...new Set(items.map(i => i.amount).filter(Boolean))];
  const sharedAmount = amounts.length === 1 ? amounts[0] : null;
  const bullets = items.map(item => ({
    label: item.source_recipe ?? 'Added manually',
    amount: item.amount ?? '',
  }));
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
              used {count}x
            </span>
          )}
          {sharedAmount && items.some(i => i.source_recipe) && (
            <span style={{
              fontSize: fontSizes.xs, fontWeight: fontWeights.semibold,
              color: colors.amberDark, background: colors.amberLight,
              borderRadius: radii.full, padding: '0.1rem 0.4rem', lineHeight: 1.4,
            }}>
              Qty: {sharedAmount}
            </span>
          )}
        </div>
        {bullets.length > 0 && (
          <ul style={{ margin: '0.25rem 0 0', padding: '0 0 0 1rem', listStyle: 'disc' }}>
            {bullets.map((b, i) => (
              <li key={i} style={{ fontSize: fontSizes.xs, color: colors.textSubtle, fontFamily: fonts.sans, lineHeight: 1.6 }}>
                {b.label}{b.amount ? `: ${b.amount}` : ''}
              </li>
            ))}
          </ul>
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

function Item({ item, onToggle, onDelete, lists, onMoveItem }) {
  const [popping, setPopping] = useState(false);
  const [showMovePopover, setShowMovePopover] = useState(false);

  const handleGotIt = () => {
    if (popping) return;
    setPopping(true);
    setTimeout(() => { setPopping(false); onToggle(item); }, 360);
  };

  return (
    <li
      style={{
        ...card,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 0.75rem',
        marginBottom: '0.375rem',
      }}
    >
      <span style={{
        flex: 1,
        fontSize: fontSizes.base,
        color: colors.textPrimary,
        fontFamily: fonts.sans,
      }}>
        {item.name}
      </span>
      {item.amount && (
        item.source_recipe ? (
          <span style={{
            fontSize: fontSizes.xs, fontWeight: fontWeights.semibold,
            color: colors.amberDark, background: colors.amberLight,
            borderRadius: radii.full, padding: '0.1rem 0.4rem', lineHeight: 1.4,
            whiteSpace: 'nowrap',
          }}>
            Qty: {item.amount}
          </span>
        ) : (
          <span style={{
            fontSize: fontSizes.sm,
            color: colors.textSubtle,
            whiteSpace: 'nowrap',
          }}>
            {item.amount}
          </span>
        )
      )}
      {onMoveItem && lists && lists.length > 1 && (
        <button
          onClick={() => setShowMovePopover(v => !v)}
          aria-label={`Move ${item.name} to another list`}
          title="Move to list"
          style={{
            border: 'none',
            background: showMovePopover ? colors.amberLight : 'transparent',
            color: showMovePopover ? colors.amberDark : colors.textSubtle,
            fontSize: '1rem',
            padding: '0.375rem',
            lineHeight: 1,
            cursor: 'pointer',
            minWidth: '36px',
            minHeight: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: radii.sm,
            flexShrink: 0,
            transition: 'background 0.12s, color 0.12s',
          }}
        >
          ↗
        </button>
      )}
      {showMovePopover && lists && lists.length > 1 && (
        <MovePopover
          item={item}
          lists={lists}
          onMoveItem={onMoveItem}
          onClose={() => setShowMovePopover(false)}
        />
      )}
      <button
        onClick={handleGotIt}
        aria-label={`Got it: ${item.name}`}
        style={{
          border: `1.5px solid ${popping ? colors.amber : colors.borderMid}`,
          background: popping ? colors.amber : 'transparent',
          color: popping ? colors.charcoal : colors.textSubtle,
          fontSize: '1.1rem',
          padding: '0.25rem',
          lineHeight: 1,
          cursor: 'pointer',
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: radii.sm,
          flexShrink: 0,
          animation: popping ? 'gotItPop 0.36s ease' : 'none',
          transition: 'border-color 0.15s, background 0.15s',
        }}
      >
        ×
      </button>
    </li>
  );
}

function MovePopover({ item, lists, onMoveItem, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        right: '2.75rem',
        top: '50%',
        transform: 'translateY(-50%)',
        background: colors.bgCard,
        border: `1px solid ${colors.amberBorder}`,
        borderRadius: radii.lg,
        boxShadow: shadows.md,
        zIndex: 50,
        minWidth: '140px',
        padding: '0.25rem',
        animation: 'fadeIn 0.15s ease both',
      }}
    >
      <p style={{
        fontSize: fontSizes.xs,
        color: colors.textMuted,
        padding: '0.25rem 0.5rem 0.125rem',
        fontWeight: fontWeights.semibold,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        fontFamily: fonts.display,
        margin: 0,
      }}>
        Move to…
      </p>
      {lists.filter(l => l.id !== item.list_id).map(l => (
        <button
          key={l.id}
          onClick={() => { onMoveItem(item.list_id, item.id, l.id, item.name); onClose(); }}
          style={{
            display: 'block',
            width: '100%',
            textAlign: 'left',
            background: 'transparent',
            border: 'none',
            padding: '0.375rem 0.5rem',
            fontSize: fontSizes.base,
            color: colors.textSecondary,
            cursor: 'pointer',
            borderRadius: radii.md,
            fontFamily: fonts.sans,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = colors.amberLight; e.currentTarget.style.color = colors.amberDark; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = colors.textSecondary; }}
        >
          {l.name}
        </button>
      ))}
    </div>
  );
}

function PurchasedItem({ item, onUndo, onDelete }) {
  return (
    <li style={{
      ...card,
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.5rem 0.75rem',
      marginBottom: '0.375rem',
      opacity: 0.65,
    }}>
      <span style={{
        flex: 1,
        fontSize: fontSizes.base,
        color: colors.textSubtle,
        textDecoration: 'line-through',
        fontFamily: fonts.sans,
      }}>
        {item.name}
      </span>
      {item.amount && (
        <span style={{ fontSize: fontSizes.sm, color: colors.textSubtle, whiteSpace: 'nowrap' }}>
          {item.amount}
        </span>
      )}
      <button
        onClick={() => onUndo(item)}
        style={{
          ...btnSecondary,
          padding: '0.2rem 0.5rem',
          minHeight: 'unset',
          fontSize: fontSizes.xs,
          flexShrink: 0,
        }}
      >
        Add back
      </button>
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
