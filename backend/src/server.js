import express from 'express';
import cors from 'cors';
import listsRouter from './routes/lists.js';
import itemsRouter from './routes/items.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/lists', listsRouter);
app.use('/api/lists/:listId/items', itemsRouter);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => console.log(`Backend listening on port ${PORT}`));
