import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createLowDb } from './store/db.js';
import authRouter, { authMiddleware } from './routes/auth.js';
import usersRouter from './routes/users.js';
import postsRouter from './routes/posts.js';
import adminRouter from './routes/admin.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use(morgan('dev'));

const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
const dataDir = process.env.DATA_DIR || path.join(__dirname, '../../data');

app.use('/uploads', express.static(uploadDir));

app.use(async (req, res, next) => {
  try {
    req.db = await createLowDb(path.join(dataDir, 'db.json'));

    // seed admin user if empty
    await req.db.read();
    if (!req.db.data.users || req.db.data.users.length === 0) {
      const passwordHash = await bcrypt.hash('admin123', 10);
      req.db.data.users.push({
        id: 'admin',
        name: 'Administrator',
        email: 'admin@sociallift.local',
        passwordHash,
        role: 'admin',
        avatarUrl: '',
        createdAt: new Date().toISOString()
      });
      await req.db.write();
      // eslint-disable-next-line no-console
      console.log('Seeded default admin user: admin@sociallift.local / admin123');
    }

    next();
  } catch (err) {
    next(err);
  }
});

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/posts', postsRouter);
app.use('/api/admin', adminRouter);

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`SocialLift backend running on http://localhost:${port}`);
});