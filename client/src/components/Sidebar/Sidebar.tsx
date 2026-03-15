import { useState, useRef, useCallback } from 'react';
import { useAppStore } from '../../stores/appStore';
import { fetchFileTree, createFile, uploadFiles, renameFile } from '../../services/api';
import FileTree from './FileTree';
import UserPresence from './UserPresence';
import './Sidebar.css';

/** Check if a drag event carries external files (from OS) vs internal tree items */
function isExternalFileDrag(e: React.DragEvent): boolean {
  return e.dataTransfer.types.includes('Files');
}

export default function Sidebar() {
  const { fileTree, setFileTree, openFile, openTabs, updateTabPath } = useAppStore();
  const [creating, setCreating] = useState<'file' | 'folder' | null>(null);
  const [newName, setNewName] = useState('');
  const [dragging, setDragging] = useState(false);
  const [rootDropActive, setRootDropActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const rootDropCounter = useRef(0);

  async function handleCreate() {
    if (!newName.trim() || !creating) return;
    const name = creating === 'file' && !newName.endsWith('.md') ? `${newName}.md` : newName;
    await createFile(name, creating, creating === 'file' ? '' : undefined);
    setCreating(null);
    setNewName('');
    await refreshTree();
  }

  async function refreshTree() {
    const tree = await fetchFileTree();
    setFileTree(tree);
  }

  const handleUpload = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    // Separate .md files (import as documents) from other files (upload as assets)
    const mdFiles = fileArray.filter((f) => f.name.endsWith('.md'));
    const assetFiles = fileArray.filter((f) => !f.name.endsWith('.md'));

    // Import .md files directly into docs/
    for (const mdFile of mdFiles) {
      const content = await mdFile.text();
      await createFile(mdFile.name, 'file', content);
    }

    // Upload asset files (images etc.)
    if (assetFiles.length > 0) {
      await uploadFiles(assetFiles);
    }

    await refreshTree();

    // Open the first imported .md file
    if (mdFiles.length > 0) {
      openFile(mdFiles[0].name, mdFiles[0].name);
    }
  }, [setFileTree, openFile]);

  function handleDragEnter(e: React.DragEvent) {
    if (!isExternalFileDrag(e)) return;
    e.preventDefault();
    dragCounter.current++;
    setDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    if (!isExternalFileDrag(e)) return;
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragging(false);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    dragCounter.current = 0;
    setDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  }

  return (
    <div
      className={`sidebar ${dragging ? 'sidebar-drag-active' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <svg width="18" height="18" viewBox="0 0 32 32">
            <defs>
              <linearGradient id="lapis" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1a3ae0" />
                <stop offset="100%" stopColor="#4b6bf5" />
              </linearGradient>
            </defs>
            <rect width="32" height="32" rx="6" fill="url(#lapis)" />
            <path d="M10 22 L16 8 L22 22 Z" fill="none" stroke="white" strokeWidth="2.5" strokeLinejoin="round" />
            <line x1="12" y1="18" x2="20" y2="18" stroke="white" strokeWidth="2" />
          </svg>
          <span className="sidebar-title">OverLapis</span>
        </div>
        <div className="sidebar-actions">
          <button
            className="sidebar-btn"
            title="Upload files"
            onClick={() => fileInputRef.current?.click()}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </button>
          <button
            className="sidebar-btn"
            title="New file"
            onClick={() => setCreating('file')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          </button>
          <button
            className="sidebar-btn"
            title="New folder"
            onClick={() => setCreating('folder')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              <line x1="12" y1="11" x2="12" y2="17" />
              <line x1="9" y1="14" x2="15" y2="14" />
            </svg>
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".md,.txt,.csv,.json,.png,.jpg,.jpeg,.gif,.webp,.svg,.bmp,.ico"
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files) {
            handleUpload(e.target.files);
            e.target.value = '';
          }
        }}
      />

      {creating && (
        <div className="sidebar-create">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
              if (e.key === 'Escape') { setCreating(null); setNewName(''); }
            }}
            placeholder={creating === 'file' ? 'filename.md' : 'folder name'}
            autoFocus
          />
        </div>
      )}

      <div
        className={`sidebar-files ${rootDropActive ? 'sidebar-files-drop-active' : ''}`}
        onDragEnter={(e) => {
          if (isExternalFileDrag(e)) return;
          e.preventDefault();
          rootDropCounter.current++;
          setRootDropActive(true);
        }}
        onDragOver={(e) => {
          if (isExternalFileDrag(e)) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        }}
        onDragLeave={() => {
          rootDropCounter.current--;
          if (rootDropCounter.current === 0) setRootDropActive(false);
        }}
        onDrop={async (e) => {
          if (isExternalFileDrag(e)) return;
          e.preventDefault();
          rootDropCounter.current = 0;
          setRootDropActive(false);
          const sourceId = e.dataTransfer.getData('text/plain');
          if (!sourceId || !sourceId.includes('/')) return; // already at root
          const sourceName = sourceId.substring(sourceId.lastIndexOf('/') + 1);
          await renameFile(sourceId, sourceName);
          // Update open tabs for moved file (or children if folder)
          for (const tab of openTabs) {
            if (tab.id === sourceId || tab.id.startsWith(sourceId + '/')) {
              const updatedId = sourceName + tab.id.slice(sourceId.length);
              const updatedName = updatedId.includes('/')
                ? updatedId.substring(updatedId.lastIndexOf('/') + 1)
                : updatedId;
              updateTabPath(tab.id, updatedId, updatedName);
            }
          }
          await refreshTree();
        }}
        onDragEnd={() => {
          rootDropCounter.current = 0;
          setRootDropActive(false);
        }}
      >
        <div className="sidebar-section-title">FILES</div>
        <FileTree nodes={fileTree} onRefresh={refreshTree} />
      </div>

      {dragging && (
        <div className="sidebar-drop-overlay">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span>Drop files here</span>
        </div>
      )}

      <UserPresence />
    </div>
  );
}
