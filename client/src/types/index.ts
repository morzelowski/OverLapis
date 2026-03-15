export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

export interface Tab {
  id: string;
  name: string;
}

export interface UserInfo {
  name: string;
  color: string;
}

export type ViewMode = 'source' | 'preview' | 'split';
