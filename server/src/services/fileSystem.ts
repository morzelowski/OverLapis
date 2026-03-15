import fs from 'fs';
import path from 'path';
import type { FileNode } from '../types/index.js';

import { fileURLToPath } from 'url';

// Navigate up from server/src/services/ to project root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCS_ROOT = path.resolve(__dirname, '..', '..', '..', 'docs');

export function getDocsRoot(): string {
  return DOCS_ROOT;
}

function ensureDocsDir() {
  if (!fs.existsSync(DOCS_ROOT)) {
    fs.mkdirSync(DOCS_ROOT, { recursive: true });
  }
}

const WELCOME_CONTENT = `# Welcome to OverLapis

Your collaborative markdown workspace — write together, in real time.

---

## Quick Start

- **Create a file** — click the \`+\` button in the sidebar
- **Search files** — press \`Ctrl + P\` to open the command palette
- **Switch views** — use the toolbar buttons for source, split, or preview mode
- **Export to PDF** — click the document icon in the toolbar

## Markdown at a Glance

OverLapis supports the full markdown syntax:

### Text Formatting

Write in **bold**, *italic*, ~~strikethrough~~, or \`inline code\`.

> "Simplicity is the ultimate sophistication." — Leonardo da Vinci

### Code Blocks

\`\`\`python
def fibonacci(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a
\`\`\`

### Lists

- Unordered items work with \`-\`, \`*\`, or \`+\`
- Nest them by indenting with two spaces

1. Ordered lists are numbered automatically
2. Just start each line with a number and a dot

### Tables

| Shortcut   | Action             |
| ---------- | ------------------ |
| \`Ctrl + P\` | Command palette    |
| \`Ctrl + V\` | Paste image        |
| Drag & drop| Upload files       |

### Task Lists

- [x] Set up the workspace
- [x] Invite your team
- [ ] Start writing something great

---

## Collaboration

Share the URL with your team. Every edit syncs instantly — each person gets their own colored cursor so you can see who's writing where.

## Images & Attachments

Paste an image from your clipboard with **Ctrl + V**, or drag and drop any file into the editor. Uploaded files appear in the \`assets\` folder in the sidebar.

---

*Happy writing!*
`;

/**
 * Seed Welcome.md only when the docs directory has no user files yet.
 * Ignores internal dirs like .yjs and assets.
 */
export function seedWelcomeIfEmpty(): void {
  ensureDocsDir();
  const entries = fs.readdirSync(DOCS_ROOT);
  const userFiles = entries.filter((e) => e !== '.yjs' && e !== 'assets');
  if (userFiles.length === 0) {
    fs.writeFileSync(path.join(DOCS_ROOT, 'Welcome.md'), WELCOME_CONTENT, 'utf-8');
  }
}

function safePath(userPath: string): string {
  const resolved = path.resolve(DOCS_ROOT, userPath);
  if (!resolved.startsWith(DOCS_ROOT)) {
    throw new Error('Path traversal not allowed');
  }
  return resolved;
}

export function getFileTree(dir = DOCS_ROOT, relativeTo = DOCS_ROOT): FileNode[] {
  ensureDocsDir();
  if (!fs.existsSync(dir)) return [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const nodes: FileNode[] = [];

  for (const entry of entries) {
    // Hide internal Yjs state directory
    if (entry.name === '.yjs') continue;

    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(relativeTo, fullPath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      nodes.push({
        id: relPath,
        name: entry.name,
        type: 'folder',
        children: getFileTree(fullPath, relativeTo),
      });
    } else {
      nodes.push({
        id: relPath,
        name: entry.name,
        type: 'file',
      });
    }
  }

  nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return nodes;
}

export function readFile(filePath: string): string {
  const full = safePath(filePath);
  if (!fs.existsSync(full)) return '';
  return fs.readFileSync(full, 'utf-8');
}

export function writeFile(filePath: string, content: string): void {
  const full = safePath(filePath);
  const dir = path.dirname(full);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(full, content, 'utf-8');
}

export function createFileOrFolder(filePath: string, type: 'file' | 'folder', content = ''): void {
  const full = safePath(filePath);
  if (type === 'folder') {
    fs.mkdirSync(full, { recursive: true });
  } else {
    const dir = path.dirname(full);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(full, content, 'utf-8');
  }
}

export function renameFileOrFolder(oldPath: string, newPath: string): void {
  const fullOld = safePath(oldPath);
  const fullNew = safePath(newPath);
  const dir = path.dirname(fullNew);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.renameSync(fullOld, fullNew);
}

export function deleteFileOrFolder(filePath: string): void {
  const full = safePath(filePath);
  if (!fs.existsSync(full)) return;
  const stat = fs.statSync(full);
  if (stat.isDirectory()) {
    fs.rmSync(full, { recursive: true });
  } else {
    fs.unlinkSync(full);
  }
}
