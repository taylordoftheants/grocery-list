import { Router } from 'express';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

const KROGER_BASE = 'https://api.kroger.com/v1';
const CLIENT_ID = process.env.KROGER_CLIENT_ID;
const CLIENT_SECRET = process.env.KROGER_CLIENT_SECRET;
const REDIRECT_URI = process.env.KROGER_REDIRECT_URI;

// Module-level Client Credentials token cache
let ccToken = null;
let ccExpiry = 0;

async function getClientToken() {
  if (Date.now() < ccExpiry) return ccToken;
  const creds = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const res = await fetch(`${KROGER_BASE}/connect/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${creds}`,
    },
    body: 'grant_type=client_credentials&scope=product.compact',
  });
  if (!res.ok) throw new Error(`CC token fetch failed: ${res.status}`);
  const data = await res.json();
  ccToken = data.access_token;
  ccExpiry = Date.now() + data.expires_in * 1000 - 60_000;
  return ccToken;
}

async function refreshKrogerToken(userId) {
  const row = db.prepare('SELECT * FROM kroger_tokens WHERE user_id = ?').get(userId);
  if (!row) throw new Error('No Kroger token found');
  const creds = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const res = await fetch(`${KROGER_BASE}/connect/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${creds}`,
    },
    body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(row.refresh_token)}`,
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`);
  const data = await res.json();
  const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();
  db.prepare(`
    UPDATE kroger_tokens
    SET access_token = ?, expires_at = ?, updated_at = datetime('now')
    WHERE user_id = ?
  `).run(data.access_token, expiresAt, userId);
  return data.access_token;
}

// Helper: search Kroger product API for a term; returns normalized product array
// Pick the best URL from an images[] entry's sizes[], preferring listed sizes in order
function pickImageUrl(imgEntry, ...sizePrefs) {
  if (!imgEntry?.sizes?.length) return null;
  for (const pref of sizePrefs) {
    const found = imgEntry.sizes.find(s => s.size === pref);
    if (found?.url) return found.url;
  }
  return imgEntry.sizes[0]?.url || null;
}

async function searchKrogerProducts(term, locationId, ccAccessToken, limit = 8) {
  const url = `${KROGER_BASE}/products?filter.term=${encodeURIComponent(term)}&filter.locationId=${encodeURIComponent(locationId)}&filter.fulfillment=ais&filter.limit=${limit}`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${ccAccessToken}`, 'Accept': 'application/json' },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.data || []).map(p => {
    const item = p.items?.[0];
    const frontImg = p.images?.find(img => img.perspective === 'front');
    const nutritionImg = p.images?.find(img => img.perspective === 'nutrition');
    return {
      upc: p.upc,
      description: p.description || '',
      brand: p.brand || '',
      size: item?.size || '',
      price: item?.price?.regular ?? null,
      imageUrl: pickImageUrl(frontImg, 'small', 'thumbnail', 'medium')
        || pickImageUrl(p.images?.[0], 'small', 'thumbnail', 'medium'),
      nutritionImageUrl: pickImageUrl(nutritionImg, 'medium', 'small', 'large') || null,
      previouslySelected: false,
    };
  });
}

// Helper: surface a user's previously-selected product to the top with a flag
function applyPreviousSelection(products, savedRow) {
  if (!savedRow) return products;
  const idx = products.findIndex(p => p.upc === savedRow.upc);
  if (idx >= 0) {
    // Already in results — move to front and flag
    const updated = products.map((p, i) => ({ ...p, previouslySelected: i === idx }));
    const [prev] = updated.splice(idx, 1);
    return [prev, ...updated];
  }
  // Not in results — prepend from saved data
  const prev = {
    upc: savedRow.upc,
    description: savedRow.description,
    brand: savedRow.brand,
    size: savedRow.size,
    price: null,
    imageUrl: null,
    previouslySelected: true,
  };
  return [prev, ...products];
}

// GET /api/kroger/chains  (discovery — used to find chain identifiers like Harris Teeter)
router.get('/chains', authMiddleware, async (req, res) => {
  try {
    const token = await getClientToken();
    const krogerRes = await fetch(`${KROGER_BASE}/chains`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
    });
    if (!krogerRes.ok) throw new Error(`Kroger chains API error: ${krogerRes.status}`);
    const data = await krogerRes.json();
    res.json(data.data || []);
  } catch (e) {
    console.error('Kroger chains error:', e);
    res.status(502).json({ error: 'Failed to fetch chain list' });
  }
});

// GET /api/kroger/locations?zipCode=&chain=
router.get('/locations', authMiddleware, async (req, res) => {
  const { zipCode, chain } = req.query;
  if (!zipCode) return res.status(400).json({ error: 'zipCode is required' });
  try {
    const token = await getClientToken();
    const chainParam = chain ? `&filter.chain=${encodeURIComponent(chain)}` : '';
    const url = `${KROGER_BASE}/locations?filter.zipCode.near=${encodeURIComponent(zipCode)}&filter.radiusInMiles=20&filter.limit=20${chainParam}`;
    const krogerRes = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
    });
    if (!krogerRes.ok) throw new Error(`Kroger locations API error: ${krogerRes.status}`);
    const data = await krogerRes.json();
    const locations = (data.data || []).map(loc => ({
      locationId: loc.locationId,
      name: loc.name,
      chain: loc.chain,
      address: `${loc.address?.addressLine1}, ${loc.address?.city}, ${loc.address?.state}`,
      lat: loc.geolocation?.latitude,
      lon: loc.geolocation?.longitude,
    }));
    res.json(locations);
  } catch (e) {
    console.error('Kroger locations error:', e);
    res.status(502).json({ error: 'Failed to fetch store locations' });
  }
});

// GET /api/kroger/auth/start?locationId=
router.get('/auth/start', authMiddleware, (req, res) => {
  const { locationId } = req.query;
  if (!locationId) return res.status(400).json({ error: 'locationId is required' });
  const state = jwt.sign(
    { userId: req.user.id, locationId },
    process.env.JWT_SECRET,
    { expiresIn: '10m' }
  );
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: 'cart.basic:write profile.compact',
    state,
  });
  res.redirect(302, `${KROGER_BASE}/connect/oauth2/authorize?${params}`);
});

// GET /api/kroger/auth/callback?code=&state=  (public — no authMiddleware)
router.get('/auth/callback', async (req, res) => {
  const { code, state } = req.query;
  try {
    const { userId, locationId } = jwt.verify(state, process.env.JWT_SECRET);
    const creds = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    const tokenRes = await fetch(`${KROGER_BASE}/connect/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${creds}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
      }).toString(),
    });
    if (!tokenRes.ok) throw new Error(`Token exchange failed: ${tokenRes.status}`);
    const data = await tokenRes.json();
    const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();
    db.prepare(`
      INSERT OR REPLACE INTO kroger_tokens (user_id, access_token, refresh_token, expires_at, location_id, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).run(userId, data.access_token, data.refresh_token, expiresAt, locationId);
    res.redirect(302, 'https://taykate.com/?kroger_success=1');
  } catch (e) {
    console.error('Kroger OAuth callback error:', e);
    res.redirect(302, 'https://taykate.com/?kroger_error=1');
  }
});

// GET /api/kroger/status
router.get('/status', authMiddleware, (req, res) => {
  const row = db.prepare('SELECT location_id, expires_at FROM kroger_tokens WHERE user_id = ?').get(req.user.id);
  if (!row) return res.json({ connected: false });
  res.json({ connected: true, location_id: row.location_id, expires_at: row.expires_at });
});

// DELETE /api/kroger/disconnect
router.delete('/disconnect', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM kroger_tokens WHERE user_id = ?').run(req.user.id);
  res.json({ ok: true });
});

// GET /api/kroger/product/:upc  — full product detail (images, ingredients, nutrition)
router.get('/product/:upc', authMiddleware, async (req, res) => {
  const { upc } = req.params;
  try {
    const ccAccessToken = await getClientToken();
    const krogerRes = await fetch(
      `${KROGER_BASE}/products?filter.productId.in=${encodeURIComponent(upc)}`,
      { headers: { 'Authorization': `Bearer ${ccAccessToken}`, 'Accept': 'application/json' } }
    );
    if (!krogerRes.ok) return res.status(502).json({ error: 'Kroger product lookup failed' });
    const data = await krogerRes.json();
    const p = data.data?.[0];
    if (!p) return res.status(404).json({ error: 'Product not found' });

    const frontImg   = p.images?.find(img => img.perspective === 'front');
    const nutritionImg = p.images?.find(img => img.perspective === 'nutrition');
    const backImg    = p.images?.find(img => img.perspective === 'back');
    const item = p.items?.[0];

    res.json({
      upc: p.upc,
      description: p.description || '',
      brand: p.brand || '',
      imageUrl:          pickImageUrl(frontImg,     'large', 'xlarge', 'medium', 'small'),
      nutritionImageUrl: pickImageUrl(nutritionImg, 'large', 'xlarge', 'medium', 'small'),
      backImageUrl:      pickImageUrl(backImg,      'large', 'xlarge', 'medium', 'small'),
      ingredients:   item?.ingredients   || null,
      nutritionFacts: item?.nutritionFacts || null,
    });
  } catch (e) {
    console.error('Kroger product detail error:', e);
    res.status(502).json({ error: 'Failed to fetch product detail' });
  }
});

// GET /api/kroger/products?listId=X  — bulk product search for all items in a list
// GET /api/kroger/products?q=text&itemName=text  — re-search a single item with custom query
router.get('/products', authMiddleware, async (req, res) => {
  const { listId, q, itemName } = req.query;
  if (!listId && !(q && itemName)) {
    return res.status(400).json({ error: 'listId or (q + itemName) required' });
  }
  try {
    const tokenRow = db.prepare('SELECT location_id FROM kroger_tokens WHERE user_id = ?').get(req.user.id);
    if (!tokenRow) return res.status(401).json({ error: 'Kroger not connected' });
    const locationId = tokenRow.location_id;
    const ccAccessToken = await getClientToken();

    if (q && itemName) {
      // Single re-search
      const products = await searchKrogerProducts(q, locationId, ccAccessToken, 8);
      const normalizedName = itemName.toLowerCase().trim();
      const saved = db.prepare('SELECT * FROM kroger_product_selections WHERE user_id = ? AND item_name = ?').get(req.user.id, normalizedName);
      return res.json({ products: applyPreviousSelection(products, saved) });
    }

    // Bulk search — verify list ownership
    const list = db.prepare('SELECT id FROM lists WHERE id = ? AND user_id = ?').get(listId, req.user.id);
    if (!list) return res.status(404).json({ error: 'List not found' });

    const rows = db.prepare('SELECT name FROM items WHERE list_id = ? AND purchased = 0').all(listId);
    // Deduplicate by normalized name, preserve original casing
    const seen = new Set();
    const uniqueItems = [];
    for (const row of rows) {
      const key = row.name.toLowerCase().trim();
      if (!seen.has(key)) { seen.add(key); uniqueItems.push({ name: row.name, normalized: key }); }
    }

    const results = [];
    for (const item of uniqueItems) {
      const products = await searchKrogerProducts(item.name, locationId, ccAccessToken, 8);
      const saved = db.prepare('SELECT * FROM kroger_product_selections WHERE user_id = ? AND item_name = ?').get(req.user.id, item.normalized);
      results.push({ itemName: item.name, normalizedName: item.normalized, products: applyPreviousSelection(products, saved) });
    }
    res.json({ items: results });
  } catch (e) {
    console.error('Kroger products error:', e);
    res.status(502).json({ error: 'Failed to fetch products' });
  }
});

// POST /api/kroger/cart/add  body: { selections: [{ upc, quantity, itemName, description, brand, size }] }
router.post('/cart/add', authMiddleware, async (req, res) => {
  const { selections } = req.body;
  if (!selections || !Array.isArray(selections) || selections.length === 0) {
    return res.status(400).json({ error: 'selections array is required' });
  }

  // Load user's Kroger token
  let tokenRow = db.prepare('SELECT * FROM kroger_tokens WHERE user_id = ?').get(req.user.id);
  if (!tokenRow) return res.status(401).json({ error: 'Kroger not connected' });

  // Refresh token if expired
  let userAccessToken = tokenRow.access_token;
  if (Date.now() >= Date.parse(tokenRow.expires_at)) {
    try {
      userAccessToken = await refreshKrogerToken(req.user.id);
    } catch (e) {
      return res.status(401).json({ error: 'Kroger session expired, please reconnect' });
    }
  }

  // Persist each selection for future sessions
  const upsertSel = db.prepare(`
    INSERT OR REPLACE INTO kroger_product_selections (user_id, item_name, upc, description, brand, size, selected_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `);
  for (const sel of selections) {
    upsertSel.run(req.user.id, sel.itemName.toLowerCase().trim(), sel.upc, sel.description || '', sel.brand || '', sel.size || '');
  }

  const cartItems = selections.map(sel => ({ upc: sel.upc, quantity: sel.quantity || 1, modality: 'PICKUP' }));

  const cartRes = await fetch(`${KROGER_BASE}/cart/add`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${userAccessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ items: cartItems }),
  });
  if (!cartRes.ok) {
    const errText = await cartRes.text();
    console.error('Kroger cart add error:', cartRes.status, errText);
    return res.status(502).json({ error: 'Failed to add items to Kroger cart' });
  }

  res.json({ added: cartItems.length, skipped: 0, skippedNames: [] });
});

export default router;
