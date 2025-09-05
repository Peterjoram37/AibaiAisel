import { Router } from 'express';
import { authMiddleware } from './auth.js';

const router = Router();

router.get('/me', authMiddleware, async (req, res) => {
  const db = req.db;
  await db.read();
  const me = db.data.users.find(u => u.id === req.user.id);
  if (!me) return res.status(404).json({ error: 'User not found' });
  res.json({ id: me.id, name: me.name, email: me.email, role: me.role, avatarUrl: me.avatarUrl, createdAt: me.createdAt });
});

router.put('/me', authMiddleware, async (req, res) => {
  const db = req.db;
  const { name, avatarUrl } = req.body;
  await db.read();
  const me = db.data.users.find(u => u.id === req.user.id);
  if (!me) return res.status(404).json({ error: 'User not found' });
  if (name) me.name = name;
  if (typeof avatarUrl === 'string') me.avatarUrl = avatarUrl;
  await db.write();
  res.json({ id: me.id, name: me.name, email: me.email, role: me.role, avatarUrl: me.avatarUrl, createdAt: me.createdAt });
});

export default router;