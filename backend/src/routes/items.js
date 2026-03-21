import { Router } from 'express';
import db from '../db.js';

const router = Router({ mergeParams: true });

router.get('/', (req, res) => {
  const items = db
    .prepare('SELECT * FROM items WHERE list_id = ? ORDER BY created_at ASC')
    .all(req.params.listId);
  res.json(items);
});

router.post('/', (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'name is required' });
  const result = db
    .prepare('INSERT INTO items (list_id, name) VALUES (?, ?)')
    .run(req.params.listId, name.trim());
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(item);
});

router.patch('/:itemId', (req, res) => {
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
  const info = db
    .prepare('DELETE FROM items WHERE id = ? AND list_id = ?')
    .run(req.params.itemId, req.params.listId);
  if (info.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.status(204).send();
});

export default router;
