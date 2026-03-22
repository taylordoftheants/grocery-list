import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const lists = db
    .prepare('SELECT * FROM lists WHERE user_id = ? ORDER BY created_at ASC')
    .all(req.user.id);
  res.json(lists);
});

router.post('/', (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'name is required' });
  try {
    const result = db
      .prepare('INSERT INTO lists (user_id, name) VALUES (?, ?)')
      .run(req.user.id, name.trim());
    const list = db.prepare('SELECT * FROM lists WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(list);
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'A list with that name already exists' });
    throw e;
  }
});

router.delete('/:id', (req, res) => {
  const info = db
    .prepare('DELETE FROM lists WHERE id = ? AND user_id = ?')
    .run(req.params.id, req.user.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.status(204).send();
});

export default router;
