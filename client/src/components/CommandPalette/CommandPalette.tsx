import { useState, useEffect, useRef, useMemo } from 'react';
import Fuse from 'fuse.js';
import { useAppStore } from '../../stores/appStore';
import type { FileNode } from '../../types';
import './CommandPalette.css';

function flattenFiles(nodes: FileNode[]): FileNode[] {
  const result: FileNode[] = [];
  for (const node of nodes) {
    if (node.type === 'file') {
      result.push(node);
    }
    if (node.children) {
      result.push(...flattenFiles(node.children));
    }
  }
  return result;
}

export default function CommandPalette() {
  const { fileTree, openFile, setCommandPaletteOpen } = useAppStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const files = useMemo(() => flattenFiles(fileTree), [fileTree]);
  const fuse = useMemo(
    () => new Fuse(files, { keys: ['name', 'id'], threshold: 0.4 }),
    [files]
  );

  const results = query
    ? fuse.search(query).map((r) => r.item)
    : files;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  function handleSelect(file: FileNode) {
    openFile(file.id, file.name);
    setCommandPaletteOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      setCommandPaletteOpen(false);
    }
  }

  return (
    <div className="command-palette-backdrop" onClick={() => setCommandPaletteOpen(false)}>
      <div className="command-palette" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="command-palette-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Open file..."
        />
        <div className="command-palette-results">
          {results.map((file, index) => (
            <div
              key={file.id}
              className={`command-palette-item ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => handleSelect(file)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span className="command-palette-name">{file.name}</span>
              <span className="command-palette-path">{file.id}</span>
            </div>
          ))}
          {results.length === 0 && (
            <div className="command-palette-empty">No files found</div>
          )}
        </div>
      </div>
    </div>
  );
}
