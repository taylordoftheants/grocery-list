import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import listsRouter from './routes/lists.js';
import itemsRouter from './routes/items.js';
import authRouter from './routes/auth.js';
import recipesRouter from './routes/recipes.js';
import mealplanRouter from './routes/mealplan.js';
import adminRouter from './routes/admin.js';
import krogerRouter from './routes/kroger.js';
import pantryRouter from './routes/pantry.js';
import nutritionRouter from './routes/nutrition.js';

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set');
  process.exit(1);
}

const allowedOrigin = process.env.ALLOWED_ORIGIN || false;
app.use(cors({ origin: allowedOrigin, credentials: true }));

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later' },
});
app.use(express.json());
app.use(cookieParser());

app.get('/api/auth/me', authRouter);
app.use('/api/auth', authLimiter, authRouter);

app.use('/api/lists', listsRouter);
app.use('/api/lists/:listId/items', itemsRouter);
app.use('/api/recipes', recipesRouter);
app.use('/api/mealplan', mealplanRouter);
app.use('/api/admin', adminRouter);
app.use('/api/kroger', krogerRouter);
app.use('/api/pantry', pantryRouter);
app.use('/api/nutrition', nutritionRouter);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => console.log(`Backend listening on port ${PORT}`));
