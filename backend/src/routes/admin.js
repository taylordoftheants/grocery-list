import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.use((req, res, next) => {
  const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(req.user.id);
  if (!user?.is_admin) return res.status(403).json({ error: 'Forbidden' });
  next();
});

// GET /api/admin/users
router.get('/users', (req, res) => {
  console.log(JSON.stringify({ event: 'admin_access', endpoint: 'GET /api/admin/users', user_id: req.user.id, ts: new Date().toISOString() }));
  const users = db
    .prepare('SELECT id, email, created_at, last_login, is_admin FROM users ORDER BY id ASC')
    .all();
  res.json(users);
});

// DELETE /api/admin/pantry-cache — wipe the global item_classifications cache
router.delete('/pantry-cache', (req, res) => {
  console.log(JSON.stringify({ event: 'admin_access', endpoint: 'DELETE /api/admin/pantry-cache', user_id: req.user.id, ts: new Date().toISOString() }));
  const { changes } = db.prepare('DELETE FROM item_classifications').run();
  res.json({ ok: true, cleared: changes });
});

export default router;
