import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes/index.js';
import { sequelize } from './models/index.js';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api', routes);

const port = process.env.PORT || 4000;

async function boot() {
  await sequelize.sync({ alter: true });
  app.listen(port, () => console.log(`API running on ${port}`));
}

boot();
