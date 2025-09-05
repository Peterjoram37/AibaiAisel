import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { nanoid } from 'nanoid';
import { authMiddleware } from './auth.js';

const router = Router();

const uploadDir = process.env.UPLOAD_DIR || '/workspace/sociallift/uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadDir);
  },
  filename: function (_req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}_${nanoid()}${ext}`);
  }
});

const upload = multer({ storage });

router.get('/', authMiddleware, async (req, res) => {
  const db = req.db;
  await db.read();
  const posts = db.data.posts
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(posts);
});

router.post('/', authMiddleware, upload.single('media'), async (req, res) => {
  const db = req.db;
  await db.read();

  const { text } = req.body;
  const file = req.file;
  const mediaUrl = file ? `/uploads/${file.filename}` : '';

  const post = {
    id: nanoid(),
    authorId: req.user.id,
    text: text || '',
    mediaUrl,
    likes: [],
    createdAt: new Date().toISOString()
  };

  db.data.posts.push(post);
  await db.write();
  res.status(201).json(post);
});

router.post('/:postId/like', authMiddleware, async (req, res) => {
  const db = req.db;
  await db.read();
  const post = db.data.posts.find(p => p.id === req.params.postId);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  if (!post.likes.includes(req.user.id)) post.likes.push(req.user.id);
  await db.write();
  res.json({ likes: post.likes.length });
});

router.post('/:postId/unlike', authMiddleware, async (req, res) => {
  const db = req.db;
  await db.read();
  const post = db.data.posts.find(p => p.id === req.params.postId);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  post.likes = post.likes.filter(id => id !== req.user.id);
  await db.write();
  res.json({ likes: post.likes.length });
});

router.delete('/:postId', authMiddleware, async (req, res) => {
  const db = req.db;
  await db.read();
  const idx = db.data.posts.findIndex(p => p.id === req.params.postId);
  if (idx === -1) return res.status(404).json({ error: 'Post not found' });
  const post = db.data.posts[idx];
  if (post.authorId !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  db.data.posts.splice(idx, 1);
  await db.write();
  res.status(204).send();
});

export default router;