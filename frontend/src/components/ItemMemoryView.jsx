import { useState, useEffect } from 'react';
import { api } from '../api';
import { colors, fonts, fontSizes, fontWeights, radii, card, btnDanger, sectionLabel } from '../theme';

function capitalizeFirst(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatLastBought(str) {
  if (!str) return null;
  // SQLite datetime('now') produces "2026-03-28 14:32:00" — no T, no Z
  const d = new Date(str.includes('T') ? str : str.replace(' ', 'T') + 'Z');
  const diffDays = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 14) return `${diffDays} days ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function buildMergedItems(pantryItems, purchaseHistory) {
  const map = new Map();
  for (const { itemName } of pantryItems) {
    const key = itemName.toLowerCase().trim();
    map.set(key, { key, displayName: capitalizeFirst(itemName), inPantry: true, lastPurchased: null });
  }
  for (const { itemName, lastPurchased } of purchaseHistory) {
    const key = itemName.toLowerCase().trim();
    if (map.has(key)) {
      map.get(key).lastPurchased = lastPurchased;
    } else {
      map.set(key, { key, displayName: capitalizeFirst(itemName), inPantry: false, lastPurchased });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export default function ItemMemoryView() {
  const [data, setData]                   = useState(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [confirmClear, setConfirmClear]   = useState(false);
  const [clearing, setClearing]           = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    api.getPantryMemory()
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleRemovePantry = async (itemName) => {
    await api.removeFromUserPantry(itemName);
    load();
  };

  const handleClearItemHistory = async (itemName) => {
    await api.clearItemPurchaseHistory(itemName);
    load();
  };

  const handleClearAll = async () => {
    setClearing(true);
    try {
      await api.clearAllPurchaseHistory();
      setConfirmClear(false);
      load();
    } catch (err) {
      setError(err.message);
      setClearing(false);
    }
  };

  const mergedItems       = data ? buildMergedItems(data.pantryItems, data.purchaseHistory) : [];
  const hasPurchaseHistory = data?.purchaseHistory?.length > 0;
  const isEmpty            = mergedItems.length === 0;

  return (
    <main style={{ padding: '1.5rem 1rem', background: colors.bgPage, minHeight: '100%', fontFamily: fonts.sans, maxWidth: '680px' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: fontSizes['2xl'], fontWeight: fontWeights.bold, color: colors.textPrimary, marginBottom: '0.3rem', fontFamily: fonts.display }}>
          🧠 Ant's Memory
        </h1>
        <p style={{ fontSize: fontSizes.base, color: colors.textMuted, margin: 0 }}>
          Everything Ant knows about your items — pantry tags you've set and Harris Teeter purchase history.
        </p>
      </div>

      {/* Error */}
      {error && (
        <p style={{ color: colors.errorText, background: colors.errorBg, padding: '0.75rem', borderRadius: radii.md, marginBottom: '1rem', fontSize: fontSizes.base }}>
          {error}
        </p>
      )}

      {/* Loading */}
      {loading && (
        <p style={{ color: colors.textSubtle, fontSize: fontSizes.base }}>Loading…</p>
      )}

      {/* Content */}
      {!loading && !error && (
        <>
          {/* Bulk clear action */}
          {hasPurchaseHistory && (
            <div style={{ marginBottom: '1.25rem' }}>
              {!confirmClear ? (
                <button
                  onClick={() => setConfirmClear(true)}
                  style={{ ...btnDanger, fontSize: fontSizes.sm, minHeight: '36px', padding: '0.375rem 0.875rem' }}
                >
                  Clear All Purchase History
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: fontSizes.sm, color: colors.textMuted }}>
                    Remove all Harris Teeter history?
                  </span>
                  <button
                    onClick={handleClearAll}
                    disabled={clearing}
                    style={{ ...btnDanger, fontSize: fontSizes.sm, minHeight: '32px', padding: '0.3rem 0.75rem' }}
                  >
                    {clearing ? 'Clearing…' : 'Yes, clear all'}
                  </button>
                  <button
                    onClick={() => setConfirmClear(false)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: fontSizes.sm, color: colors.textMuted, fontFamily: fonts.sans, padding: '0.3rem 0' }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Section label */}
          {!isEmpty && (
            <p style={{ ...sectionLabel, marginBottom: '0.625rem' }}>
              {mergedItems.length} {mergedItems.length === 1 ? 'item' : 'items'}
            </p>
          )}

          {/* Empty state */}
          {isEmpty && (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: colors.textSubtle }}>
              <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🐜</p>
              <p style={{ fontSize: fontSizes.base, margin: '0 0 0.25rem' }}>Ant doesn't know anything yet.</p>
              <p style={{ fontSize: fontSizes.sm, margin: 0 }}>
                Items appear here when you tag them "I have this" or purchase through Harris Teeter.
              </p>
            </div>
          )}

          {/* Item list */}
          {!isEmpty && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {mergedItems.map(item => (
                <ItemRow
                  key={item.key}
                  item={item}
                  onRemovePantry={handleRemovePantry}
                  onClearHistory={handleClearItemHistory}
                />
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}

function ItemRow({ item, onRemovePantry, onClearHistory }) {
  const [removingPantry,  setRemovingPantry]  = useState(false);
  const [removingHistory, setRemovingHistory] = useState(false);

  const handleRemovePantry = async () => {
    setRemovingPantry(true);
    await onRemovePantry(item.key);
  };

  const handleClearHistory = async () => {
    setRemovingHistory(true);
    await onClearHistory(item.key);
  };

  const smallDangerBtn = {
    background:   'transparent',
    border:       'none',
    cursor:       'pointer',
    color:        colors.error,
    fontSize:     fontSizes.xs,
    padding:      '0.2rem 0.4rem',
    borderRadius: radii.sm,
    fontFamily:   fonts.sans,
    lineHeight:   1,
    opacity:      (removingPantry || removingHistory) ? 0.5 : 1,
  };

  return (
    <div style={{ ...card, padding: '0.75rem 1rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
      {/* Left: name + badges */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: fontSizes.base, fontWeight: fontWeights.medium, color: colors.textPrimary, margin: '0 0 0.35rem' }}>
          {item.displayName}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', alignItems: 'center' }}>
          {item.inPantry && (
            <span style={{
              fontSize:     fontSizes.xs,
              fontWeight:   fontWeights.semibold,
              background:   colors.amberLight,
              color:        colors.amberDark,
              padding:      '0.15rem 0.5rem',
              borderRadius: radii.full,
              whiteSpace:   'nowrap',
            }}>
              📌 In my pantry
            </span>
          )}
          {item.lastPurchased && (
            <span style={{ fontSize: fontSizes.sm, color: colors.textMuted, whiteSpace: 'nowrap' }}>
              🛒 Last bought: {formatLastBought(item.lastPurchased)}
            </span>
          )}
        </div>
      </div>

      {/* Right: delete buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flexShrink: 0, alignItems: 'flex-end' }}>
        {item.inPantry && (
          <button
            onClick={handleRemovePantry}
            disabled={removingPantry}
            style={smallDangerBtn}
            title="Remove pantry tag"
          >
            {removingPantry ? '…' : '× pantry'}
          </button>
        )}
        {item.lastPurchased && (
          <button
            onClick={handleClearHistory}
            disabled={removingHistory}
            style={smallDangerBtn}
            title="Clear purchase history for this item"
          >
            {removingHistory ? '…' : '× history'}
          </button>
        )}
      </div>
    </div>
  );
}
