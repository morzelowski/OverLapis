import { useState, useRef } from 'react';
import type { FileNode } from '../../types';
import { useAppStore } from '../../stores/appStore';
import { deleteFile, renameFile } from '../../services/api';
import ContextMenu from '../common/ContextMenu';
import './FileTree.css';

interface FileTreeProps {
  nodes: FileNode[];
  depth?: number;
  onRefresh: () => void;
}

export default function FileTree({ nodes, depth = 0, onRefresh }: FileTreeProps) {
  return (
    <div className="file-tree">
      {nodes.map((node) => (
        <FileTreeItem key={node.id} node={node} depth={depth} onRefresh={onRefresh} />
      ))}
    </div>
  );
}

function FileTreeItem({
  node,
  depth,
  onRefresh,
}: {
  node: FileNode;
  depth: number;
  onRefresh: () => void;
}) {
  const { openFile, activeTabId, updateTabPath, openTabs, closeTab } = useAppStore();
  const [expanded, setExpanded] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [renameName, setRenameName] = useState(node.name);
  const [dragOver, setDragOver] = useState(false);
  const dragCounter = useRef(0);

  const isActive = activeTabId === node.id;

  function handleClick() {
    if (node.type === 'folder') {
      setExpanded(!expanded);
    } else {
      openFile(node.id, node.name);
    }
  }

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }

  async function handleDelete() {
    setContextMenu(null);
    await deleteFile(node.id);
    // Close tabs for the deleted file (or children if folder)
    for (const tab of openTabs) {
      if (tab.id === node.id || tab.id.startsWith(node.id + '/')) {
        closeTab(tab.id);
      }
    }
    onRefresh();
  }

  function handleRenameStart() {
    setContextMenu(null);
    setRenaming(true);
    setRenameName(node.name);
  }

  async function handleRenameSubmit() {
    if (renameName.trim() && renameName !== node.name) {
      const parentPath = node.id.includes('/')
        ? node.id.substring(0, node.id.lastIndexOf('/') + 1)
        : '';
      const newPath = parentPath + renameName;
      await renameFile(node.id, newPath);
      // Update open tabs for renamed file (or children if folder)
      for (const tab of openTabs) {
        if (tab.id === node.id || tab.id.startsWith(node.id + '/')) {
          const updatedId = newPath + tab.id.slice(node.id.length);
          const updatedName = updatedId.includes('/')
            ? updatedId.substring(updatedId.lastIndexOf('/') + 1)
            : updatedId;
          updateTabPath(tab.id, updatedId, updatedName);
        }
      }
      onRefresh();
    }
    setRenaming(false);
  }

  // --- Drag & Drop ---

  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.setData('text/plain', node.id);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragEnter(e: React.DragEvent) {
    if (node.type !== 'folder') return;
    e.preventDefault();
    dragCounter.current++;
    setDragOver(true);
  }

  function handleDragOver(e: React.DragEvent) {
    if (node.type !== 'folder') return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  function handleDragLeave() {
    if (node.type !== 'folder') return;
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragOver(false);
    }
  }

  async function handleDrop(e: React.DragEvent) {
    if (node.type !== 'folder') return;
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setDragOver(false);

    const sourceId = e.dataTransfer.getData('text/plain');
    if (!sourceId) return;

    // Don't drop on itself or into its own subtree
    if (sourceId === node.id || node.id.startsWith(sourceId + '/')) return;

    const sourceName = sourceId.includes('/')
      ? sourceId.substring(sourceId.lastIndexOf('/') + 1)
      : sourceId;
    const newPath = node.id + '/' + sourceName;

    // Don't move if already in this folder
    if (sourceId === newPath) return;

    await renameFile(sourceId, newPath);
    // Update open tab if the moved file (or its children) is open
    for (const tab of openTabs) {
      if (tab.id === sourceId || tab.id.startsWith(sourceId + '/')) {
        const updatedId = newPath + tab.id.slice(sourceId.length);
        const updatedName = updatedId.includes('/')
          ? updatedId.substring(updatedId.lastIndexOf('/') + 1)
          : updatedId;
        updateTabPath(tab.id, updatedId, updatedName);
      }
    }
    setExpanded(true);
    onRefresh();
  }

  return (
    <>
      <div
        className={`file-tree-item ${isActive ? 'active' : ''} ${dragOver ? 'drop-target' : ''}`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        draggable={!renaming}
        onDragStart={handleDragStart}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {node.type === 'folder' ? (
          <svg
            className={`file-tree-chevron ${expanded ? 'expanded' : ''}`}
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        ) : (
          <svg
            className="file-tree-icon"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        )}

        {renaming ? (
          <input
            className="file-tree-rename"
            value={renameName}
            onChange={(e) => setRenameName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameSubmit();
              if (e.key === 'Escape') setRenaming(false);
            }}
            onBlur={handleRenameSubmit}
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="file-tree-name">{node.name}</span>
        )}
      </div>

      {node.type === 'folder' && expanded && node.children && (
        <FileTree nodes={node.children} depth={depth + 1} onRefresh={onRefresh} />
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          items={[
            { label: 'Rename', action: handleRenameStart },
            { label: 'Delete', action: handleDelete, danger: true },
          ]}
        />
      )}
    </>
  );
}
