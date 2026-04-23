import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes/index.js';
import { getBackendConfig } from './utils/env.js';

dotenv.config();
const app = express();
const { port } = getBackendConfig();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api', routes);

app.listen(port, () => console.log(`API running on ${port}`));
