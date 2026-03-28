import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router({ mergeParams: true });
router.use(authMiddleware);

function verifyListOwnership(listId, userId, res) {
  const list = db
    .prepare('SELECT id FROM lists WHERE id = ? AND user_id = ?')
    .get(listId, userId);
  if (!list) {
    res.status(404).json({ error: 'List not found' });
    return false;
  }
  return true;
}

router.get('/', (req, res) => {
  if (!verifyListOwnership(req.params.listId, req.user.id, res)) return;
  const items = db
    .prepare('SELECT * FROM items WHERE list_id = ? ORDER BY created_at ASC')
    .all(req.params.listId);
  res.json(items);
});

router.post('/', (req, res) => {
  if (!verifyListOwnership(req.params.listId, req.user.id, res)) return;
  const { name, amount = '' } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'name is required' });
  const result = db
    .prepare('INSERT INTO items (list_id, name, amount) VALUES (?, ?, ?)')
    .run(req.params.listId, name.trim().slice(0, 200), (amount ?? '').toString().trim().slice(0, 50));
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(item);
});

// Must be registered before /:itemId to avoid Express treating "purchased" as itemId
router.delete('/purchased', (req, res) => {
  if (!verifyListOwnership(req.params.listId, req.user.id, res)) return;
  const info = db
    .prepare('DELETE FROM items WHERE list_id = ? AND purchased = 1')
    .run(req.params.listId);
  res.json({ deleted: info.changes });
});

router.delete('/', (req, res) => {
  if (!verifyListOwnership(req.params.listId, req.user.id, res)) return;
  const info = db
    .prepare('DELETE FROM items WHERE list_id = ?')
    .run(req.params.listId);
  res.json({ deleted: info.changes });
});

// Must be registered before /:itemId to avoid Express treating "by-names" as itemId
router.delete('/by-names', (req, res) => {
  if (!verifyListOwnership(req.params.listId, req.user.id, res)) return;
  const { names } = req.body;
  if (!Array.isArray(names) || names.length === 0)
    return res.status(400).json({ error: 'names array required' });
  const placeholders = names.map(() => '?').join(', ');
  const lowerNames = names.map(n => n.toLowerCase().trim());
  const info = db
    .prepare(`DELETE FROM items WHERE list_id = ? AND LOWER(TRIM(name)) IN (${placeholders})`)
    .run(req.params.listId, ...lowerNames);
  res.json({ deleted: info.changes });
});

// Must be registered before /:itemId to avoid Express treating "from-recipe" as itemId
router.post('/from-recipe', (req, res) => {
  if (!verifyListOwnership(req.params.listId, req.user.id, res)) return;
  const { recipeId, selectedIngredientIds } = req.body;
  if (!Number.isInteger(recipeId)) return res.status(400).json({ error: 'recipeId must be an integer' });
  if (!Array.isArray(selectedIngredientIds) || selectedIngredientIds.length === 0)
    return res.status(400).json({ error: 'selectedIngredientIds must be a non-empty array' });

  const recipe = db.prepare('SELECT id, title, is_favorites FROM recipes WHERE id = ? AND user_id = ?').get(recipeId, req.user.id);
  if (!recipe) return res.status(404).json({ error: 'Recipe not found' });

  const placeholders = selectedIngredientIds.map(() => '?').join(', ');
  const ings = db
    .prepare(`SELECT id, name, amount, optional_category FROM recipe_ingredients WHERE recipe_id = ? AND id IN (${placeholders})`)
    .all(recipeId, ...selectedIngredientIds);

  // Load existing spice names for dedup
  const existingSpices = new Set(
    db.prepare('SELECT LOWER(TRIM(name)) as n FROM items WHERE list_id = ? AND is_spice = 1').all(req.params.listId).map(r => r.n)
  );

  const insertItem = db.prepare('INSERT INTO items (list_id, name, amount, source_recipe, is_spice) VALUES (?, ?, ?, ?, ?)');
  let added = 0;
  db.exec('BEGIN');
  try {
    for (const ing of ings) {
      const label = ing.name.trim();
      if (!label) continue;
      if (ing.optional_category === 'spices') {
        if (existingSpices.has(label.toLowerCase())) continue;
        insertItem.run(req.params.listId, label, ing.amount ?? '', null, 1);
        existingSpices.add(label.toLowerCase());
      } else {
        insertItem.run(req.params.listId, label, ing.amount ?? '', recipe.title, 0);
      }
      added++;
    }
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }

  res.json({ added });
});

router.patch('/:itemId/move', (req, res) => {
  if (!verifyListOwnership(req.params.listId, req.user.id, res)) return;
  const { toListId } = req.body;
  if (!toListId) return res.status(400).json({ error: 'toListId is required' });
  const targetList = db.prepare('SELECT id FROM lists WHERE id = ? AND user_id = ?').get(toListId, req.user.id);
  if (!targetList) return res.status(404).json({ error: 'Target list not found' });
  const info = db
    .prepare('UPDATE items SET list_id = ? WHERE id = ? AND list_id = ?')
    .run(toListId, req.params.itemId, req.params.listId);
  if (info.changes === 0) return res.status(404).json({ error: 'Item not found' });
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.itemId);
  res.json(item);
});

router.patch('/:itemId', (req, res) => {
  if (!verifyListOwnership(req.params.listId, req.user.id, res)) return;
  const { purchased } = req.body;
  if (typeof purchased !== 'boolean') return res.status(400).json({ error: 'purchased must be boolean' });
  const info = db
    .prepare('UPDATE items SET purchased = ? WHERE id = ? AND list_id = ?')
    .run(purchased ? 1 : 0, req.params.itemId, req.params.listId);
  if (info.changes === 0) return res.status(404).json({ error: 'Not found' });
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.itemId);
  res.json(item);
});

router.delete('/:itemId', (req, res) => {
  if (!verifyListOwnership(req.params.listId, req.user.id, res)) return;
  const info = db
    .prepare('DELETE FROM items WHERE id = ? AND list_id = ?')
    .run(req.params.itemId, req.params.listId);
  if (info.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.status(204).send();
});

export default router;
