import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initDB } from './db.js';
import authRoutes from './routes/auth.js';
import mindmapRoutes from './routes/mindmaps.js';
import shareRoutes from './routes/share.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize database
initDB();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
// Support large payload for mindmaps with embedded images / rich content (up to 50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/mindmaps', mindmapRoutes);
app.use('/api/share', shareRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Production client static assets serving
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  console.log(`[Static] Serving frontend from: ${clientDistPath}`);
  app.use(express.static(clientDistPath));

  // Catch-all for Vue Router SPA HTML5 History mode
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(clientDistPath, 'index.html'));
    }
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`========================================`);
  console.log(`🚀 OpenMindMap Server is running on:`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`========================================`);
});
