import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// GET /api/mealplan?weekStart=YYYY-MM-DD
router.get('/', (req, res) => {
  const { weekStart } = req.query;
  if (!weekStart || !/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
    return res.status(400).json({ error: 'weekStart must be YYYY-MM-DD' });
  }
  const weekEnd = addDays(weekStart, 6);
  const entries = db
    .prepare(`SELECT * FROM meal_plan_entries WHERE user_id = ? AND date >= ? AND date <= ? ORDER BY date ASC, sort_order ASC`)
    .all(req.user.id, weekStart, weekEnd);
  res.json(entries);
});

// POST /api/mealplan/add-to-list  — must be before /:entryId
router.post('/add-to-list', (req, res) => {
  const { listId, weekStart } = req.body;
  if (!listId || !weekStart) return res.status(400).json({ error: 'listId and weekStart are required' });

  const list = db.prepare('SELECT id FROM lists WHERE id = ? AND user_id = ?').get(listId, req.user.id);
  if (!list) return res.status(404).json({ error: 'List not found' });

  const weekEnd = addDays(weekStart, 6);
  const entries = db
    .prepare('SELECT * FROM meal_plan_entries WHERE user_id = ? AND date >= ? AND date <= ?')
    .all(req.user.id, weekStart, weekEnd);

  const insertItems = [];       // all non-spice items in order
  const spicesMap = new Map();  // global spice dedup: name → { amount }
  const manualSeen = new Set(); // dedup non-recipe manual entries

  for (const entry of entries) {
    if (entry.recipe_id) {
      let selectedOptionalIds = new Set();
      try {
        const parsed = JSON.parse(entry.selected_optional_ids || '[]');
        if (Array.isArray(parsed)) selectedOptionalIds = new Set(parsed);
      } catch (_) {}

      const ings = db
        .prepare('SELECT id, name, amount, is_optional, optional_category FROM recipe_ingredients WHERE recipe_id = ?')
        .all(entry.recipe_id);

      const seenInEntry = new Set();
      for (const ing of ings) {
        const isSpice = ing.optional_category === 'spices';
        if (!ing.is_optional || selectedOptionalIds.has(ing.id) || isSpice) {
          const label = ing.name.trim();
          if (!label) continue;
          if (isSpice) {
            if (!spicesMap.has(label)) spicesMap.set(label, { amount: ing.amount ?? '' });
          } else if (!seenInEntry.has(label)) {
            seenInEntry.add(label);
            insertItems.push({ name: label, source_recipe: entry.label, amount: ing.amount ?? '', is_spice: 0 });
          }
        }
      }
    } else if (!entry.is_leftovers && entry.label?.trim()) {
      const label = entry.label.trim();
      if (!manualSeen.has(label)) {
        manualSeen.add(label);
        insertItems.push({ name: label, source_recipe: null, amount: '', is_spice: 0 });
      }
    }
  }

  for (const [name, { amount }] of spicesMap)
    insertItems.push({ name, source_recipe: null, amount, is_spice: 1 });

  const insertItem = db.prepare('INSERT INTO items (list_id, name, amount, source_recipe, is_spice) VALUES (?, ?, ?, ?, ?)');
  db.exec('BEGIN');
  try {
    for (const { name, source_recipe, amount, is_spice } of insertItems)
      insertItem.run(listId, name, amount, source_recipe ?? null, is_spice);
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }

  res.json({ added: insertItems.length });
});

// POST /api/mealplan
router.post('/', (req, res) => {
  const { date, recipe_id, label, is_weekly, selected_optional_ids, is_leftovers } = req.body;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'date must be YYYY-MM-DD' });
  }
  if (!label?.trim()) return res.status(400).json({ error: 'label is required' });

  if (recipe_id != null) {
    const recipe = db.prepare('SELECT id FROM recipes WHERE id = ? AND user_id = ?').get(recipe_id, req.user.id);
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' });
  }

  const isWeekly = is_weekly ? 1 : 0;
  const isLeftovers = is_leftovers ? 1 : 0;

  let selectedOptionalIdsStr = '';
  if (recipe_id != null && Array.isArray(selected_optional_ids) && selected_optional_ids.length > 0) {
    const ids = selected_optional_ids.filter(id => Number.isInteger(id));
    if (ids.length > 0) selectedOptionalIdsStr = JSON.stringify(ids);
  }

  const maxRow = db
    .prepare('SELECT MAX(sort_order) as m FROM meal_plan_entries WHERE user_id = ? AND date = ? AND is_weekly = ?')
    .get(req.user.id, date, isWeekly);
  const sortOrder = (maxRow?.m ?? -1) + 1;

  const { lastInsertRowid } = db
    .prepare('INSERT INTO meal_plan_entries (user_id, date, recipe_id, label, sort_order, is_weekly, selected_optional_ids, is_leftovers) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(req.user.id, date, recipe_id ?? null, label.trim(), sortOrder, isWeekly, selectedOptionalIdsStr, isLeftovers);

  const entry = db.prepare('SELECT * FROM meal_plan_entries WHERE id = ?').get(lastInsertRowid);
  res.status(201).json(entry);
});

// DELETE /api/mealplan/:entryId
router.delete('/:entryId', (req, res) => {
  const info = db
    .prepare('DELETE FROM meal_plan_entries WHERE id = ? AND user_id = ?')
    .run(req.params.entryId, req.user.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.status(204).send();
});

export default router;
