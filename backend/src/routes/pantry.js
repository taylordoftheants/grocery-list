import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { classifyPantryItems } from '../llm.js';

const router = Router();
router.use(authMiddleware);

const CACHE_TTL_DAYS = 30;

/**
 * POST /api/pantry/classify
 * Body: { items: string[] }
 * Response: { classifications: { [itemName]: 'pantry' | 'buy' | 'check' } }
 *
 * Also overlays purchase history from kroger_product_selections:
 * - 'check' items purchased within 14 days → promoted to 'pantry' (skip)
 * - 'check' items never purchased → stays 'check'
 */
router.post('/classify', async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items array required' });
  }

  // Normalize item names for cache lookups
  const normalized = items.map(n => n.toLowerCase().trim());

  // 1. Check cache
  const cutoff = new Date(Date.now() - CACHE_TTL_DAYS * 24 * 60 * 60 * 1000)
    .toISOString()
    .replace('T', ' ')
    .slice(0, 19);

  const cached = {};
  const uncached = [];

  for (let i = 0; i < normalized.length; i++) {
    const row = db
      .prepare("SELECT classification FROM item_classifications WHERE item_name = ? AND classified_at > ?")
      .get(normalized[i], cutoff);
    if (row) {
      cached[items[i]] = row.classification;
    } else {
      uncached.push(items[i]);
    }
  }

  // 2. Call LLM for uncached items
  let llmResults = {};
  if (uncached.length > 0) {
    llmResults = await classifyPantryItems(uncached);

    // Persist to cache
    const upsert = db.prepare(`
      INSERT INTO item_classifications (item_name, classification, classified_at)
      VALUES (?, ?, datetime('now'))
      ON CONFLICT(item_name) DO UPDATE SET classification = excluded.classification, classified_at = excluded.classified_at
    `);
    for (const [name, classification] of Object.entries(llmResults)) {
      upsert.run(name.toLowerCase().trim(), classification);
    }
  }

  // 3. Merge cached + LLM results
  const classifications = { ...cached, ...llmResults };

  // 4. Overlay purchase history for 'check' items
  //    If a 'check' item was purchased within 14 days, treat it as 'pantry' (user likely still has it)
  const checkItems = Object.entries(classifications)
    .filter(([, v]) => v === 'check')
    .map(([k]) => k.toLowerCase().trim());

  if (checkItems.length > 0) {
    const recentCutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
      .toISOString()
      .replace('T', ' ')
      .slice(0, 19);

    for (const [origName, classification] of Object.entries(classifications)) {
      if (classification !== 'check') continue;
      const normName = origName.toLowerCase().trim();
      const purchase = db
        .prepare(`SELECT selected_at FROM kroger_product_selections
                  WHERE user_id = ? AND LOWER(TRIM(item_name)) = ? AND selected_at > ?`)
        .get(req.user.id, normName, recentCutoff);
      if (purchase) {
        classifications[origName] = 'pantry';
      }
    }
  }

  // 5. Apply user_pantry overrides — forces item to 'check' (never auto-unchecks)
  const userPantryRows = db
    .prepare('SELECT item_name FROM user_pantry WHERE user_id = ?')
    .all(req.user.id);
  const userPantrySet = new Set(userPantryRows.map(r => r.item_name));
  const userPantryMatched = [];

  for (const [origName] of Object.entries(classifications)) {
    if (userPantrySet.has(origName.toLowerCase().trim())) {
      classifications[origName] = 'check';
      userPantryMatched.push(origName);
    }
  }

  res.json({ classifications, userPantryItems: userPantryMatched });
});

// POST /api/pantry/have — save an item to the user's personal pantry
router.post('/have', (req, res) => {
  const { itemName } = req.body;
  if (!itemName?.trim()) return res.status(400).json({ error: 'itemName is required' });
  db.prepare(`
    INSERT INTO user_pantry (user_id, item_name)
    VALUES (?, ?)
    ON CONFLICT(user_id, item_name) DO NOTHING
  `).run(req.user.id, itemName.toLowerCase().trim());
  res.json({ ok: true });
});

// DELETE /api/pantry/have/:name — remove an item from the user's personal pantry
router.delete('/have/:name', (req, res) => {
  const itemName = decodeURIComponent(req.params.name).toLowerCase().trim();
  db.prepare('DELETE FROM user_pantry WHERE user_id = ? AND item_name = ?')
    .run(req.user.id, itemName);
  res.json({ ok: true });
});

export default router;
