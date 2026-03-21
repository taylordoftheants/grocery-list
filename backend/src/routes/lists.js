import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const lists = db.prepare('SELECT * FROM lists ORDER BY created_at ASC').all();
  res.json(lists);
});

router.post('/', (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'name is required' });
  try {
    const result = db.prepare('INSERT INTO lists (name) VALUES (?)').run(name.trim());
    const list = db.prepare('SELECT * FROM lists WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(list);
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'List name already exists' });
    throw e;
  }
});

router.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM lists WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.status(204).send();
});

export default router;
