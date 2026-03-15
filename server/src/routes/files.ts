import { Router, type Request, type Response } from 'express';
import {
  getFileTree,
  readFile,
  createFileOrFolder,
  renameFileOrFolder,
  deleteFileOrFolder,
} from '../services/fileSystem.js';
import { markFileMoved, markFileDeleted } from '../ws.js';

const router = Router();

// Extract file path from URL (everything after /api/files/)
function extractPath(req: Request): string {
  // req.baseUrl is /api/files, req.path is the rest
  const p = req.path.startsWith('/') ? req.path.slice(1) : req.path;
  return decodeURIComponent(p);
}

router.get('/', (_req, res) => {
  try {
    const tree = getFileTree();
    res.json(tree);
  } catch {
    res.status(500).json({ error: 'Failed to read file tree' });
  }
});

router.post('/', (req, res) => {
  try {
    const { path: filePath, type, content } = req.body;
    if (!filePath || !type) {
      res.status(400).json({ error: 'path and type are required' });
      return;
    }
    createFileOrFolder(filePath, type, content || '');
    res.status(201).json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Failed to create file' });
  }
});

// Use a catch-all middleware for paths with file names
router.use('/', (req: Request, res: Response) => {
  const filePath = extractPath(req);
  if (!filePath) {
    res.status(400).json({ error: 'No file path provided' });
    return;
  }

  try {
    if (req.method === 'GET') {
      const content = readFile(filePath);
      res.type('text/plain').send(content);
    } else if (req.method === 'PUT') {
      const { newPath } = req.body;
      if (!newPath) {
        res.status(400).json({ error: 'newPath is required' });
        return;
      }
      markFileMoved(filePath);
      renameFileOrFolder(filePath, newPath);
      res.json({ ok: true });
    } else if (req.method === 'DELETE') {
      markFileDeleted(filePath);
      deleteFileOrFolder(filePath);
      res.json({ ok: true });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch {
    res.status(404).json({ error: 'File not found' });
  }
});

export default router;
