import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import listsRouter from './routes/lists.js';
import itemsRouter from './routes/items.js';
import authRouter from './routes/auth.js';
import recipesRouter from './routes/recipes.js';
import mealplanRouter from './routes/mealplan.js';

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set');
  process.exit(1);
}

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRouter);
app.use('/api/lists', listsRouter);
app.use('/api/lists/:listId/items', itemsRouter);
app.use('/api/recipes', recipesRouter);
app.use('/api/mealplan', mealplanRouter);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => console.log(`Backend listening on port ${PORT}`));
