import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { getDocsRoot } from '../services/fileSystem.js';

const router = Router();

const ALLOWED_IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.ico'];
const ALLOWED_DOC_EXTS = ['.md', '.txt', '.csv', '.json'];
const ALL_ALLOWED = [...ALLOWED_IMAGE_EXTS, ...ALLOWED_DOC_EXTS];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const assetsDir = path.join(getDocsRoot(), 'assets');
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }
    cb(null, assetsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_\-]/g, '_')
      .substring(0, 60);
    const hash = crypto.randomBytes(4).toString('hex');
    cb(null, `${base}-${hash}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALL_ALLOWED.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} not allowed`));
    }
  },
});

// Upload one or more files
router.post('/', upload.array('files', 20), (req, res) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    res.status(400).json({ error: 'No files uploaded' });
    return;
  }

  const results = files.map((f) => ({
    originalName: f.originalname,
    fileName: f.filename,
    path: `assets/${f.filename}`,
    size: f.size,
    isImage: ALLOWED_IMAGE_EXTS.includes(path.extname(f.originalname).toLowerCase()),
  }));

  res.status(201).json(results);
});

// Paste image from clipboard (raw binary body with filename in query)
router.post('/paste', (req, res) => {
  const chunks: Buffer[] = [];
  req.on('data', (chunk: Buffer) => chunks.push(chunk));
  req.on('end', () => {
    const buffer = Buffer.concat(chunks);
    if (buffer.length === 0) {
      res.status(400).json({ error: 'Empty body' });
      return;
    }

    const contentType = req.headers['content-type'] || 'image/png';
    let ext = '.png';
    if (contentType.includes('jpeg') || contentType.includes('jpg')) ext = '.jpg';
    else if (contentType.includes('gif')) ext = '.gif';
    else if (contentType.includes('webp')) ext = '.webp';
    else if (contentType.includes('svg')) ext = '.svg';

    const hash = crypto.randomBytes(6).toString('hex');
    const fileName = `pasted-${hash}${ext}`;
    const assetsDir = path.join(getDocsRoot(), 'assets');
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }

    fs.writeFileSync(path.join(assetsDir, fileName), buffer);

    res.status(201).json({
      originalName: fileName,
      fileName,
      path: `assets/${fileName}`,
      size: buffer.length,
      isImage: true,
    });
  });
});

export default router;
