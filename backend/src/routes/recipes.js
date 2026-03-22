import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

const CATEGORIES = ['Core Meals', 'Protein Options', 'Extras / Sauces'];

function attachIngredients(recipes) {
  if (recipes.length === 0) return recipes;
  const ids = recipes.map(r => r.id);
  const ingredients = db
    .prepare(`SELECT * FROM recipe_ingredients WHERE recipe_id IN (${ids.map(() => '?').join(',')}) ORDER BY id ASC`)
    .all(...ids);
  const byRecipe = {};
  for (const ing of ingredients) {
    if (!byRecipe[ing.recipe_id]) byRecipe[ing.recipe_id] = [];
    byRecipe[ing.recipe_id].push(ing);
  }
  return recipes.map(r => ({ ...r, ingredients: byRecipe[r.id] ?? [] }));
}

function verifyOwnership(id, userId, res) {
  const recipe = db.prepare('SELECT id FROM recipes WHERE id = ? AND user_id = ?').get(id, userId);
  if (!recipe) { res.status(404).json({ error: 'Not found' }); return false; }
  return true;
}

// GET /api/recipes
router.get('/', (req, res) => {
  const recipes = db
    .prepare('SELECT id, user_id, title, category, sort_order, created_at FROM recipes WHERE user_id = ? ORDER BY sort_order ASC, created_at ASC')
    .all(req.user.id);
  res.json(attachIngredients(recipes));
});

// POST /api/recipes/reorder  — must be before /:id
router.post('/reorder', (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'ids must be a non-empty array' });
  }
  const update = db.prepare('UPDATE recipes SET sort_order = ? WHERE id = ? AND user_id = ?');
  db.exec('BEGIN');
  try {
    ids.forEach((id, i) => update.run(i, id, req.user.id));
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
  res.json({ ok: true });
});

// POST /api/recipes
router.post('/', (req, res) => {
  const { title, ingredients = [], category = 'Core Meals' } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'title is required' });
  if (!CATEGORIES.includes(category)) return res.status(400).json({ error: 'Invalid category' });

  const { c: count } = db.prepare('SELECT COUNT(*) as c FROM recipes WHERE user_id = ?').get(req.user.id);
  const insertRecipe = db.prepare('INSERT INTO recipes (user_id, title, category, sort_order) VALUES (?, ?, ?, ?)');
  const insertIng = db.prepare('INSERT INTO recipe_ingredients (recipe_id, name, amount, is_optional) VALUES (?, ?, ?, ?)');

  let recipeId;
  db.exec('BEGIN');
  try {
    const { lastInsertRowid } = insertRecipe.run(req.user.id, title.trim(), category, count);
    recipeId = Number(lastInsertRowid);
    for (const ing of ingredients) {
      if (ing.name?.trim()) insertIng.run(recipeId, ing.name.trim(), ing.amount?.trim() ?? '', ing.is_optional ? 1 : 0);
    }
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }

  const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(recipeId);
  const ings = db.prepare('SELECT * FROM recipe_ingredients WHERE recipe_id = ? ORDER BY id ASC').all(recipeId);
  res.status(201).json({ ...recipe, ingredients: ings });
});

// GET /api/recipes/:id
router.get('/:id', (req, res) => {
  if (!verifyOwnership(req.params.id, req.user.id, res)) return;
  const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(req.params.id);
  const ings = db.prepare('SELECT * FROM recipe_ingredients WHERE recipe_id = ? ORDER BY id ASC').all(req.params.id);
  res.json({ ...recipe, ingredients: ings });
});

// PUT /api/recipes/:id
router.put('/:id', (req, res) => {
  if (!verifyOwnership(req.params.id, req.user.id, res)) return;
  const { title, ingredients = [], category = 'Core Meals' } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'title is required' });
  if (!CATEGORIES.includes(category)) return res.status(400).json({ error: 'Invalid category' });

  const updateRecipe = db.prepare('UPDATE recipes SET title = ?, category = ? WHERE id = ?');
  const deleteIngs = db.prepare('DELETE FROM recipe_ingredients WHERE recipe_id = ?');
  const insertIng = db.prepare('INSERT INTO recipe_ingredients (recipe_id, name, amount, is_optional) VALUES (?, ?, ?, ?)');

  db.exec('BEGIN');
  try {
    updateRecipe.run(title.trim(), category, req.params.id);
    deleteIngs.run(req.params.id);
    for (const ing of ingredients) {
      if (ing.name?.trim()) insertIng.run(req.params.id, ing.name.trim(), ing.amount?.trim() ?? '', ing.is_optional ? 1 : 0);
    }
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }

  const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(req.params.id);
  const ings = db.prepare('SELECT * FROM recipe_ingredients WHERE recipe_id = ? ORDER BY id ASC').all(req.params.id);
  res.json({ ...recipe, ingredients: ings });
});

// DELETE /api/recipes/:id
router.delete('/:id', (req, res) => {
  if (!verifyOwnership(req.params.id, req.user.id, res)) return;
  db.prepare('DELETE FROM recipes WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

export default router;
