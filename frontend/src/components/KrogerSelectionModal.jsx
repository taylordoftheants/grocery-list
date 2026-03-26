import { useState, useEffect, Fragment } from 'react';
import { api } from '../api';
import { colors, fonts, fontSizes, fontWeights, radii, shadows, card, btnPrimary, btnSecondary } from '../theme';

export default function KrogerSelectionModal({ list, isMobile, onClose }) {
  const [step, setStep] = useState('loading'); // 'loading' | 'selecting' | 'adding' | 'result'
  const [itemStates, setItemStates] = useState({});
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    api.krogerGetProducts(list.id)
      .then(data => {
        const initial = {};
        for (const item of data.items) {
          const prevSelected = item.products.find(p => p.previouslySelected);
          initial[item.normalizedName] = {
            itemName: item.itemName,
            products: item.products,
            selectedUpc: prevSelected?.upc ?? item.products[0]?.upc ?? null,
            quantity: 1,
            included: true,
            expanded: false,
            searchQuery: item.itemName,
            searching: false,
          };
        }
        setItemStates(initial);
        setStep('selecting');
      })
      .catch(e => {
        setErrorMsg(e.message || 'Failed to load products');
        setStep('result');
      });
  }, [list.id]);

  function updateItem(key, patch) {
    setItemStates(prev => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }

  async function handleSearch(key) {
    const s = itemStates[key];
    if (!s.searchQuery.trim()) return;
    updateItem(key, { searching: true });
    try {
      const data = await api.krogerSearchProduct(s.searchQuery.trim(), s.itemName);
      const prevSelected = data.products.find(p => p.previouslySelected);
      updateItem(key, {
        products: data.products,
        selectedUpc: prevSelected?.upc ?? data.products[0]?.upc ?? null,
        searching: false,
        expanded: true,
      });
    } catch {
      updateItem(key, { searching: false });
    }
  }

  async function handleAddToCart() {
    setStep('adding');
    const selections = Object.values(itemStates)
      .filter(s => s.included && s.selectedUpc)
      .map(s => {
        const product = s.products.find(p => p.upc === s.selectedUpc);
        return {
          upc: s.selectedUpc,
          quantity: s.quantity,
          itemName: s.itemName,
          description: product?.description || '',
          brand: product?.brand || '',
          size: product?.size || '',
        };
      });
    try {
      const data = await api.krogerAddToCart(selections);
      setResult(data);
      setStep('result');
    } catch (e) {
      setErrorMsg(e.message || 'Something went wrong. Please try again.');
      setStep('result');
    }
  }

  const stateList = Object.entries(itemStates);
  const includedCount = stateList.filter(([, s]) => s.included && s.selectedUpc).length;

  const modalCard = {
    ...card,
    borderRadius: isMobile ? '1rem 1rem 0 0' : radii.xl,
    padding: 0,
    width: '100%',
    maxWidth: isMobile ? '100%' : '560px',
    maxHeight: isMobile ? '92vh' : '88vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: shadows.modal,
    overflow: 'hidden',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(0,0,0,0.55)',
      display: 'flex',
      alignItems: isMobile ? 'flex-end' : 'center',
      justifyContent: 'center',
      padding: isMobile ? '0' : '1rem',
    }}>
      <div style={modalCard}>

        {/* ── Header ── */}
        <div style={{
          padding: '1.25rem 1.5rem 1rem',
          borderBottom: `1px solid ${colors.border}`,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0, fontSize: fontSizes.xl, fontWeight: fontWeights.bold, color: colors.textPrimary, fontFamily: fonts.display }}>
              Add to Kroger Cart
            </h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: fontSizes.xl, color: colors.textMuted, lineHeight: 1, padding: '0.25rem' }}>
              ×
            </button>
          </div>
          {step === 'selecting' && (
            <p style={{ margin: '0.375rem 0 0', fontSize: fontSizes.sm, color: colors.textMuted, fontFamily: fonts.sans }}>
              Choose your preferred product for each item, then review quantities.
            </p>
          )}
        </div>

        {/* ── Body ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: step === 'selecting' ? '0' : '1.5rem' }}>

          {step === 'loading' && (
            <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
              <p style={{ color: colors.textMuted, fontFamily: fonts.sans, fontSize: fontSizes.base }}>
                Searching for your items…
              </p>
            </div>
          )}

          {step === 'adding' && (
            <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
              <p style={{ color: colors.textMuted, fontFamily: fonts.sans, fontSize: fontSizes.base }}>
                Adding {includedCount} {includedCount === 1 ? 'item' : 'items'} to your Kroger cart…
              </p>
            </div>
          )}

          {step === 'result' && errorMsg && (
            <>
              <h3 style={{ fontSize: fontSizes.lg, fontWeight: fontWeights.bold, marginBottom: '0.5rem', color: colors.textPrimary, fontFamily: fonts.sans }}>
                Something went wrong
              </h3>
              <p style={{ fontSize: fontSizes.base, color: colors.error, marginBottom: '1.5rem', fontFamily: fonts.sans }}>
                {errorMsg}
              </p>
              <button onClick={onClose} style={{ ...btnSecondary, width: '100%' }}>Close</button>
            </>
          )}

          {step === 'result' && result && (
            <>
              <h3 style={{ fontSize: fontSizes.lg, fontWeight: fontWeights.bold, marginBottom: '0.5rem', color: colors.textPrimary, fontFamily: fonts.sans }}>
                Done!
              </h3>
              <p style={{ fontSize: fontSizes.base, color: colors.success, marginBottom: result.skipped > 0 ? '0.75rem' : '1.5rem', fontFamily: fonts.sans }}>
                {result.added} {result.added === 1 ? 'item' : 'items'} added to your cart.
              </p>
              {result.skipped > 0 && (
                <div style={{ background: colors.bgSurface, border: `1px solid ${colors.border}`, borderRadius: radii.md, padding: '0.75rem', marginBottom: '1.5rem' }}>
                  <p style={{ fontSize: fontSizes.sm, color: colors.textMuted, fontFamily: fonts.sans, marginBottom: '0.25rem' }}>
                    {result.skipped} {result.skipped === 1 ? 'item' : 'items'} skipped:
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                    {result.skippedNames.map(name => (
                      <li key={name} style={{ fontSize: fontSizes.sm, color: colors.textMuted, fontFamily: fonts.sans }}>{name}</li>
                    ))}
                  </ul>
                </div>
              )}
              <button onClick={onClose} style={{ ...btnPrimary, width: '100%' }}>Done</button>
            </>
          )}

          {step === 'selecting' && stateList.map(([key, s], idx) => (
            <ItemSection
              key={key}
              normKey={key}
              state={s}
              isLast={idx === stateList.length - 1}
              onUpdate={patch => updateItem(key, patch)}
              onSearch={() => handleSearch(key)}
            />
          ))}
        </div>

        {/* ── Footer ── */}
        {step === 'selecting' && (
          <div style={{
            padding: '1rem 1.5rem',
            paddingBottom: isMobile ? 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' : '1rem',
            borderTop: `1px solid ${colors.border}`,
            flexShrink: 0,
            background: colors.bgCard,
            display: 'flex',
            gap: '0.75rem',
          }}>
            <button onClick={onClose} style={{ ...btnSecondary, flex: '0 0 auto', padding: '0.625rem 1rem' }}>
              Cancel
            </button>
            <button
              onClick={handleAddToCart}
              disabled={includedCount === 0}
              style={{
                ...btnPrimary,
                flex: 1,
                opacity: includedCount === 0 ? 0.5 : 1,
                cursor: includedCount === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              Add {includedCount} {includedCount === 1 ? 'Item' : 'Items'} to Cart
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Per-item section ──────────────────────────────────────────────────────────

function ItemSection({ normKey, state, isLast, onUpdate, onSearch }) {
  const [infoOpenUpc, setInfoOpenUpc] = useState(null);
  const visibleProducts = state.expanded ? state.products : state.products.slice(0, 3);
  const canShowMore = !state.expanded && state.products.length > 3;

  function handleInfo(upc) {
    setInfoOpenUpc(prev => prev === upc ? null : upc);
  }

  return (
    <div style={{
      borderBottom: isLast ? 'none' : `1px solid ${colors.border}`,
      padding: '1rem 1.5rem',
    }}>
      {/* Item name + include toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <span style={{ fontWeight: fontWeights.semibold, fontSize: fontSizes.base, color: colors.textPrimary, fontFamily: fonts.sans }}>
          {state.itemName}
        </span>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer', fontSize: fontSizes.sm, color: colors.textMuted, fontFamily: fonts.sans, userSelect: 'none' }}>
          <input
            type="checkbox"
            checked={state.included}
            onChange={e => onUpdate({ included: e.target.checked })}
            style={{ width: 16, height: 16, accentColor: colors.amber, cursor: 'pointer' }}
          />
          Include
        </label>
      </div>

      {state.included && (
        <>
          {/* Product tiles */}
          {state.products.length === 0 ? (
            <p style={{ fontSize: fontSizes.sm, color: colors.textSubtle, fontFamily: fonts.sans, marginBottom: '0.5rem' }}>
              No products found. Try editing the search below.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.5rem' }}>
              {visibleProducts.map(product => (
                <Fragment key={product.upc}>
                  <ProductTile
                    product={product}
                    selected={state.selectedUpc === product.upc}
                    infoOpen={infoOpenUpc === product.upc}
                    onSelect={() => onUpdate({ selectedUpc: product.upc })}
                    onInfo={() => handleInfo(product.upc)}
                  />
                  {infoOpenUpc === product.upc && (
                    <ProductInfoPanel upc={product.upc} />
                  )}
                </Fragment>
              ))}
            </div>
          )}

          {/* Show more */}
          {canShowMore && (
            <button
              onClick={() => onUpdate({ expanded: true })}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.amber, fontSize: fontSizes.sm, fontFamily: fonts.sans, fontWeight: fontWeights.semibold, padding: '0.25rem 0', marginBottom: '0.5rem' }}
            >
              Show more results ↓
            </button>
          )}

          {/* Expanded: search box */}
          {state.expanded && (
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', marginBottom: '0.25rem' }}>
              <input
                type="text"
                value={state.searchQuery}
                onChange={e => onUpdate({ searchQuery: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && onSearch()}
                placeholder="Refine search…"
                style={{
                  flex: 1,
                  border: `1px solid ${colors.border}`,
                  borderRadius: radii.md,
                  padding: '0.5rem 0.75rem',
                  fontSize: fontSizes.sm,
                  fontFamily: fonts.sans,
                  color: colors.textPrimary,
                  background: colors.bgPage,
                  outline: 'none',
                }}
              />
              <button
                onClick={onSearch}
                disabled={state.searching}
                style={{ ...btnPrimary, padding: '0.5rem 1rem', fontSize: fontSizes.sm, minHeight: 'unset', opacity: state.searching ? 0.6 : 1 }}
              >
                {state.searching ? '…' : 'Search'}
              </button>
            </div>
          )}

          {/* Quantity stepper */}
          {state.selectedUpc && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
              <span style={{ fontSize: fontSizes.sm, color: colors.textMuted, fontFamily: fonts.sans, marginRight: '0.25rem' }}>Qty:</span>
              <button
                onClick={() => onUpdate({ quantity: Math.max(1, state.quantity - 1) })}
                style={{ width: 28, height: 28, borderRadius: radii.sm, border: `1px solid ${colors.border}`, background: colors.bgSurface, cursor: 'pointer', fontSize: fontSizes.base, color: colors.textSecondary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                −
              </button>
              <span style={{ minWidth: 24, textAlign: 'center', fontWeight: fontWeights.semibold, fontSize: fontSizes.base, color: colors.textPrimary, fontFamily: fonts.sans }}>
                {state.quantity}
              </span>
              <button
                onClick={() => onUpdate({ quantity: state.quantity + 1 })}
                style={{ width: 28, height: 28, borderRadius: radii.sm, border: `1px solid ${colors.border}`, background: colors.bgSurface, cursor: 'pointer', fontSize: fontSizes.base, color: colors.textSecondary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                +
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Product image with error fallback ────────────────────────────────────────

// Route Kroger CDN URLs through our backend proxy to avoid browser CORS blocks
function krogerImageSrc(url) {
  if (!url) return null;
  return `/api/kroger/image?url=${encodeURIComponent(url)}`;
}

function ProductImage({ src }) {
  const [errored, setErrored] = useState(false);
  const proxied = krogerImageSrc(src);
  if (!proxied || errored) {
    return <span style={{ fontSize: '1.5rem' }}>🛒</span>;
  }
  return (
    <img
      src={proxied}
      alt=""
      onError={() => setErrored(true)}
      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
    />
  );
}

// ── Product tile (radio card) ─────────────────────────────────────────────────

function ProductTile({ product, selected, infoOpen, onSelect, onInfo }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onSelect()}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        padding: '0.625rem 0.75rem',
        border: `2px solid ${selected ? colors.amber : colors.border}`,
        borderRadius: radii.md,
        background: selected ? colors.amberLight : colors.bgCard,
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
        boxSizing: 'border-box',
        transition: 'border-color 0.12s, background 0.12s',
        outline: 'none',
      }}
    >
      {/* Thumbnail */}
      <div style={{
        width: 64, height: 64, flexShrink: 0,
        borderRadius: radii.sm,
        overflow: 'hidden',
        background: colors.bgSurface,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <ProductImage src={product.imageUrl} />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '0.125rem' }}>
          {product.previouslySelected && (
            <span style={{
              fontSize: '0.65rem',
              fontWeight: fontWeights.bold,
              fontFamily: fonts.sans,
              color: colors.amberDark,
              background: colors.amberLight,
              border: `1px solid ${colors.amberBorder}`,
              borderRadius: radii.sm,
              padding: '0.1rem 0.375rem',
              whiteSpace: 'nowrap',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}>
              Previously selected
            </span>
          )}
          {product.brand && (
            <span style={{ fontSize: fontSizes.xs, color: colors.textMuted, fontFamily: fonts.sans, fontWeight: fontWeights.semibold, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {product.brand}
            </span>
          )}
        </div>
        <p style={{ margin: 0, fontSize: fontSizes.sm, color: colors.textPrimary, fontFamily: fonts.sans, fontWeight: selected ? fontWeights.semibold : fontWeights.normal, lineHeight: 1.3 }}>
          {product.description}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.375rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {product.size && (
              <span style={{ fontSize: fontSizes.xs, color: colors.textMuted, fontFamily: fonts.sans }}>{product.size}</span>
            )}
            {product.price != null && (
              <span style={{ fontSize: fontSizes.xs, color: colors.textSecondary, fontFamily: fonts.sans, fontWeight: fontWeights.semibold }}>${product.price.toFixed(2)}</span>
            )}
          </div>
          {/* Info button */}
          <button
            onClick={e => { e.stopPropagation(); onInfo(); }}
            title="Nutrition & ingredients"
            style={{
              width: 22, height: 22, flexShrink: 0,
              borderRadius: '50%',
              border: `1.5px solid ${infoOpen ? colors.amber : colors.borderMid}`,
              background: infoOpen ? colors.amber : 'transparent',
              color: infoOpen ? colors.white : colors.textMuted,
              cursor: 'pointer',
              fontSize: '0.7rem',
              fontWeight: fontWeights.bold,
              fontFamily: fonts.sans,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              lineHeight: 1,
              padding: 0,
            }}
          >
            i
          </button>
        </div>
      </div>

      {/* Radio indicator */}
      <div style={{
        width: 18, height: 18, flexShrink: 0, marginTop: 2,
        borderRadius: '50%',
        border: `2px solid ${selected ? colors.amber : colors.borderMid}`,
        background: selected ? colors.amber : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {selected && <div style={{ width: 7, height: 7, borderRadius: '50%', background: colors.white }} />}
      </div>
    </div>
  );
}

// ── Product info panel ────────────────────────────────────────────────────────

function ProductInfoPanel({ upc }) {
  const [state, setState] = useState({ loading: true, data: null, error: null });
  const [ingredientsExpanded, setIngredientsExpanded] = useState(false);

  useEffect(() => {
    api.krogerGetProductDetail(upc)
      .then(data => setState({ loading: false, data, error: null }))
      .catch(e => setState({ loading: false, data: null, error: e.message || 'Could not load details' }));
  }, [upc]);

  const panelStyle = {
    background: colors.bgSurface,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.md,
    padding: '0.875rem',
    marginBottom: '0.25rem',
  };

  if (state.loading) {
    return (
      <div style={panelStyle}>
        <p style={{ margin: 0, fontSize: fontSizes.sm, color: colors.textMuted, fontFamily: fonts.sans }}>
          Loading details…
        </p>
      </div>
    );
  }

  if (state.error || !state.data) {
    return (
      <div style={panelStyle}>
        <p style={{ margin: 0, fontSize: fontSizes.sm, color: colors.textSubtle, fontFamily: fonts.sans }}>
          No additional details available.
        </p>
      </div>
    );
  }

  const { imageUrl, nutritionImageUrl, backImageUrl, ingredients, nutritionFacts } = state.data;
  const hasImages = imageUrl || nutritionImageUrl;
  const hasText = ingredients || (nutritionFacts && nutritionFacts.length > 0);

  if (!hasImages && !hasText) {
    return (
      <div style={panelStyle}>
        <p style={{ margin: 0, fontSize: fontSizes.sm, color: colors.textSubtle, fontFamily: fonts.sans }}>
          No additional details available.
        </p>
      </div>
    );
  }

  return (
    <div style={panelStyle}>
      {/* Images row */}
      {hasImages && (
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: hasText ? '0.875rem' : 0 }}>
          {imageUrl && (
            <div style={{ flex: 1, maxWidth: 140, borderRadius: radii.sm, overflow: 'hidden', background: colors.bgCard, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 120 }}>
              <ProductImage src={imageUrl} />
            </div>
          )}
          {nutritionImageUrl && (
            <div style={{ flex: 1, borderRadius: radii.sm, overflow: 'hidden', background: colors.bgCard, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 120 }}>
              <img src={krogerImageSrc(nutritionImageUrl)} alt="Nutrition facts" style={{ width: '100%', objectFit: 'contain' }} />
            </div>
          )}
        </div>
      )}

      {/* Ingredients */}
      {ingredients && (
        <div style={{ marginBottom: nutritionFacts?.length > 0 ? '0.75rem' : 0 }}>
          <p style={{ margin: '0 0 0.25rem', fontSize: fontSizes.xs, fontWeight: fontWeights.semibold, color: colors.textMuted, fontFamily: fonts.sans, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Ingredients
          </p>
          <p style={{
            margin: 0,
            fontSize: fontSizes.xs,
            color: colors.textSecondary,
            fontFamily: fonts.sans,
            lineHeight: 1.5,
            overflow: ingredientsExpanded ? 'visible' : 'hidden',
            display: ingredientsExpanded ? 'block' : '-webkit-box',
            WebkitLineClamp: ingredientsExpanded ? 'unset' : 3,
            WebkitBoxOrient: 'vertical',
          }}>
            {ingredients}
          </p>
          {ingredients.length > 180 && (
            <button
              onClick={() => setIngredientsExpanded(p => !p)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.amber, fontSize: fontSizes.xs, fontFamily: fonts.sans, fontWeight: fontWeights.semibold, padding: '0.25rem 0 0', display: 'block' }}
            >
              {ingredientsExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      )}

      {/* Nutrition facts table */}
      {nutritionFacts && nutritionFacts.length > 0 && (
        <div>
          <p style={{ margin: '0 0 0.375rem', fontSize: fontSizes.xs, fontWeight: fontWeights.semibold, color: colors.textMuted, fontFamily: fonts.sans, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Nutrition Facts
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: fontSizes.xs, fontFamily: fonts.sans }}>
            <tbody>
              {nutritionFacts.map((fact, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${colors.borderLight}` }}>
                  <td style={{ padding: '0.2rem 0.25rem 0.2rem 0', color: colors.textSecondary }}>{fact.name}</td>
                  <td style={{ padding: '0.2rem 0', color: colors.textPrimary, fontWeight: fontWeights.semibold, textAlign: 'right' }}>{fact.amount}</td>
                  {fact.percent != null && (
                    <td style={{ padding: '0.2rem 0 0.2rem 0.5rem', color: colors.textMuted, textAlign: 'right' }}>{fact.percent}%</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
