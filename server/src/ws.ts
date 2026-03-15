import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import * as Y from 'yjs';
import { readFile, writeFile } from './services/fileSystem.js';

// Use y-websocket's setupWSConnection
// @ts-expect-error - y-websocket/bin/utils is CommonJS
import { setupWSConnection, setPersistence } from 'y-websocket/bin/utils';

// Track files that have been moved/renamed so stale rooms don't recreate them
const movedFiles = new Set<string>();

export function markFileMoved(oldPath: string): void {
  movedFiles.add(oldPath);
}

// Persistence: read/write plain .md files — no .ystate binary blobs
setPersistence({
  bindState: async (docName: string, ydoc: Y.Doc) => {
    try {
      const content = readFile(docName);
      if (content) {
        const ytext = ydoc.getText('content');
        ydoc.transact(() => {
          ytext.insert(0, content);
        });
      }
    } catch {
      // file doesn't exist yet — start empty
    }

    // Debounced save to .md on every edit
    let saveTimeout: ReturnType<typeof setTimeout> | null = null;
    ydoc.on('update', () => {
      if (saveTimeout) clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        if (movedFiles.has(docName)) return;
        try {
          const ytext = ydoc.getText('content');
          writeFile(docName, ytext.toString());
        } catch {
          // ignore write errors
        }
      }, 2000);
    });
  },
  writeState: async (docName: string, ydoc: Y.Doc) => {
    if (movedFiles.delete(docName)) return;
    try {
      const ytext = ydoc.getText('content');
      writeFile(docName, ytext.toString());
    } catch {
      // ignore
    }
  },
});

export function setupWebSocket(server: http.Server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });

  wss.on('connection', (conn: WebSocket, req: http.IncomingMessage) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    let docName = decodeURIComponent(url.pathname.slice(1));

    if (docName.startsWith('ws/')) {
      docName = docName.slice(3);
    }

    setupWSConnection(conn, req, { docName });
  });
}
