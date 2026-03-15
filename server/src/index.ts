import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import filesRouter from './routes/files.js';
import uploadRouter from './routes/upload.js';
import { setupWebSocket } from './ws.js';
import { getDocsRoot, seedWelcomeIfEmpty } from './services/fileSystem.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

seedWelcomeIfEmpty();

const app = express();
const PORT = parseInt(process.env.PORT || '4444', 10);

app.use(cors());
app.use(express.json());

// Serve uploaded assets statically
app.use('/api/assets', express.static(getDocsRoot() + '/assets', {
  maxAge: '7d',
  immutable: true,
}));

app.use('/api/files', filesRouter);
app.use('/api/upload', uploadRouter);

// Serve built frontend in production
const clientDist = path.resolve(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (_req, res, next) => {
  // Don't serve index.html for API/WS routes
  if (_req.path.startsWith('/api') || _req.path.startsWith('/ws')) {
    return next();
  }
  res.sendFile(path.join(clientDist, 'index.html'));
});

const server = http.createServer(app);
setupWebSocket(server);

server.listen(PORT, () => {
  console.log(`OverLapis server running :)`);
});
