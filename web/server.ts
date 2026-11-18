import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { apiRouter } from './server/routes/api.ts';

const PORT = 3000;
const app = express();

app.use(express.json());
app.use('/api', apiRouter);

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(path.resolve(process.cwd(), 'dist'));

  if (isProd) {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CampusSave server listening on http://localhost:${PORT}`);
  });
}

startServer();
