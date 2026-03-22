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

  const itemNames = new Set();

  // Collect ingredients from recipe entries
  const recipeIds = [...new Set(entries.map(e => e.recipe_id).filter(Boolean))];
  if (recipeIds.length > 0) {
    const ings = db
      .prepare(`SELECT name, amount FROM recipe_ingredients WHERE recipe_id IN (${recipeIds.map(() => '?').join(',')})`)
      .all(...recipeIds);
    for (const ing of ings) {
      const label = [ing.amount, ing.name].filter(Boolean).join(' ').trim();
      if (label) itemNames.add(label);
    }
  }

  // Collect manual entries (no recipe)
  for (const entry of entries) {
    if (!entry.recipe_id && entry.label?.trim()) {
      itemNames.add(entry.label.trim());
    }
  }

  const insertItem = db.prepare('INSERT INTO items (list_id, name) VALUES (?, ?)');
  db.transaction(() => {
    for (const name of itemNames) insertItem.run(listId, name);
  })();

  res.json({ added: itemNames.size });
});

// POST /api/mealplan
router.post('/', (req, res) => {
  const { date, recipe_id, label } = req.body;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'date must be YYYY-MM-DD' });
  }
  if (!label?.trim()) return res.status(400).json({ error: 'label is required' });

  if (recipe_id != null) {
    const recipe = db.prepare('SELECT id FROM recipes WHERE id = ? AND user_id = ?').get(recipe_id, req.user.id);
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' });
  }

  const maxRow = db
    .prepare('SELECT MAX(sort_order) as m FROM meal_plan_entries WHERE user_id = ? AND date = ?')
    .get(req.user.id, date);
  const sortOrder = (maxRow?.m ?? -1) + 1;

  const { lastInsertRowid } = db
    .prepare('INSERT INTO meal_plan_entries (user_id, date, recipe_id, label, sort_order) VALUES (?, ?, ?, ?, ?)')
    .run(req.user.id, date, recipe_id ?? null, label.trim(), sortOrder);

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
