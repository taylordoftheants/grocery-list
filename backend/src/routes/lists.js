import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const lists = db
    .prepare('SELECT * FROM lists WHERE user_id = ? ORDER BY sort_order ASC, created_at ASC')
    .all(req.user.id);
  res.json(lists);
});

router.post('/', (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'name is required' });
  try {
    const result = db
      .prepare('INSERT INTO lists (user_id, name, sort_order) VALUES (?, ?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM lists WHERE user_id = ?))')
      .run(req.user.id, name.trim(), req.user.id);
    const list = db.prepare('SELECT * FROM lists WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(list);
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'A list with that name already exists' });
    throw e;
  }
});

router.patch('/:id', (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'name is required' });
  const list = db.prepare('SELECT id FROM lists WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!list) return res.status(404).json({ error: 'Not found' });
  try {
    db.prepare('UPDATE lists SET name = ? WHERE id = ?').run(name.trim(), req.params.id);
    const updated = db.prepare('SELECT * FROM lists WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'A list with that name already exists' });
    throw e;
  }
});

router.post('/reorder', (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids must be an array' });
  const update = db.prepare('UPDATE lists SET sort_order = ? WHERE id = ? AND user_id = ?');
  for (let i = 0; i < ids.length; i++) {
    update.run(i, ids[i], req.user.id);
  }
  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  const info = db
    .prepare('DELETE FROM lists WHERE id = ? AND user_id = ?')
    .run(req.params.id, req.user.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.status(204).send();
});

export default router;
