import { create } from 'zustand';
import type { FileNode, Tab, ViewMode } from '../types';
import { fetchFileTree } from '../services/api';

const USER_COLORS = [
  '#e06c75', '#98c379', '#e5c07b', '#61afef',
  '#c678dd', '#56b6c2', '#d19a66', '#be5046',
];

function randomUserColor(): string {
  return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
}

function randomUserName(): string {
  const adjectives = ['Swift', 'Bright', 'Calm', 'Bold', 'Keen'];
  const nouns = ['Fox', 'Owl', 'Bear', 'Wolf', 'Hawk'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj} ${noun}`;
}

interface AppState {
  fileTree: FileNode[];
  setFileTree: (tree: FileNode[]) => void;
  refreshFileTree: () => Promise<void>;

  openTabs: Tab[];
  activeTabId: string | null;
  openFile: (fileId: string, fileName: string) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTabPath: (oldId: string, newId: string, newName: string) => void;

  sidebarOpen: boolean;
  toggleSidebar: () => void;

  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;

  currentUser: { name: string; color: string };
}

export const useAppStore = create<AppState>((set, get) => ({
  fileTree: [],
  setFileTree: (tree) => set({ fileTree: tree }),
  refreshFileTree: async () => {
    const tree = await fetchFileTree();
    set({ fileTree: tree });
  },

  openTabs: [],
  activeTabId: null,

  openFile: (fileId, fileName) => {
    const { openTabs } = get();
    const existing = openTabs.find((t) => t.id === fileId);
    if (!existing) {
      set({
        openTabs: [...openTabs, { id: fileId, name: fileName }],
        activeTabId: fileId,
      });
    } else {
      set({ activeTabId: fileId });
    }
  },

  closeTab: (tabId) => {
    const { openTabs, activeTabId } = get();
    const newTabs = openTabs.filter((t) => t.id !== tabId);
    let newActive = activeTabId;
    if (activeTabId === tabId) {
      const idx = openTabs.findIndex((t) => t.id === tabId);
      newActive = newTabs[Math.min(idx, newTabs.length - 1)]?.id ?? null;
    }
    set({ openTabs: newTabs, activeTabId: newActive });
  },

  updateTabPath: (oldId, newId, newName) => {
    const { openTabs, activeTabId } = get();
    set({
      openTabs: openTabs.map((t) =>
        t.id === oldId ? { id: newId, name: newName } : t
      ),
      activeTabId: activeTabId === oldId ? newId : activeTabId,
    });
  },

  setActiveTab: (tabId) => set({ activeTabId: tabId }),

  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  viewMode: 'source',
  setViewMode: (mode) => set({ viewMode: mode }),

  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

  currentUser: { name: randomUserName(), color: randomUserColor() },
}));
