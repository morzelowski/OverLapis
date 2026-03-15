import type { FileNode } from '../types';

const BASE = '/api/files';

export async function fetchFileTree(): Promise<FileNode[]> {
  const res = await fetch(BASE);
  if (!res.ok) throw new Error('Failed to fetch file tree');
  return res.json();
}

export async function fetchFileContent(filePath: string): Promise<string> {
  const res = await fetch(`${BASE}/${encodeURIComponent(filePath)}`);
  if (!res.ok) throw new Error('Failed to fetch file content');
  return res.text();
}

export async function createFile(
  path: string,
  type: 'file' | 'folder',
  content = ''
): Promise<void> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, type, content }),
  });
  if (!res.ok) throw new Error('Failed to create file');
}

export async function renameFile(
  oldPath: string,
  newPath: string
): Promise<void> {
  const res = await fetch(`${BASE}/${encodeURIComponent(oldPath)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newPath }),
  });
  if (!res.ok) throw new Error('Failed to rename file');
}

export async function deleteFile(filePath: string): Promise<void> {
  const res = await fetch(`${BASE}/${encodeURIComponent(filePath)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete file');
}

export interface UploadResult {
  originalName: string;
  fileName: string;
  path: string;
  size: number;
  isImage: boolean;
}

export async function uploadFiles(files: File[]): Promise<UploadResult[]> {
  const formData = new FormData();
  for (const file of files) {
    formData.append('files', file);
  }
  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to upload files');
  return res.json();
}

export async function uploadPastedImage(blob: Blob, contentType: string): Promise<UploadResult> {
  const res = await fetch('/api/upload/paste', {
    method: 'POST',
    headers: { 'Content-Type': contentType },
    body: blob,
  });
  if (!res.ok) throw new Error('Failed to upload pasted image');
  return res.json();
}
