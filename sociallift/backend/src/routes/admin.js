import { Router } from 'express';
import { authMiddleware } from './auth.js';

const router = Router();

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }
  next();
}

router.get('/users', authMiddleware, requireAdmin, async (req, res) => {
  const db = req.db;
  await db.read();
  const users = db.data.users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, avatarUrl: u.avatarUrl, createdAt: u.createdAt, banned: !!u.banned }));
  res.json(users);
});

router.post('/users/:id/ban', authMiddleware, requireAdmin, async (req, res) => {
  const db = req.db;
  await db.read();
  const user = db.data.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.banned = true;
  await db.write();
  res.json({ ok: true });
});

router.post('/users/:id/unban', authMiddleware, requireAdmin, async (req, res) => {
  const db = req.db;
  await db.read();
  const user = db.data.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.banned = false;
  await db.write();
  res.json({ ok: true });
});

router.delete('/posts/:id', authMiddleware, requireAdmin, async (req, res) => {
  const db = req.db;
  await db.read();
  const idx = db.data.posts.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Post not found' });
  db.data.posts.splice(idx, 1);
  await db.write();
  res.status(204).send();
});

export default router;