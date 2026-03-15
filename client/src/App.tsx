import { useEffect } from 'react';
import { useAppStore } from './stores/appStore';
import { fetchFileTree } from './services/api';
import { useYjs } from './hooks/useYjs';
import { YjsProvider } from './hooks/YjsContext';
import Sidebar from './components/Sidebar/Sidebar';
import EditorArea from './components/Editor/EditorArea';
import CommandPalette from './components/CommandPalette/CommandPalette';
import './App.css';

export default function App() {
  const { setFileTree, openFile, sidebarOpen, activeTabId, commandPaletteOpen, setCommandPaletteOpen } =
    useAppStore();

  const yjsState = useYjs(activeTabId);

  useEffect(() => {
    fetchFileTree().then((tree) => {
      setFileTree(tree);
      // Auto-open Welcome.md on first load if no tab is open
      if (!useAppStore.getState().activeTabId) {
        const welcome = tree.find((f) => f.name === 'Welcome.md' && f.type === 'file');
        if (welcome) {
          openFile(welcome.id, welcome.name);
        }
      }
    }).catch(console.error);
  }, [setFileTree, openFile]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  return (
    <YjsProvider
      value={{
        ytext: yjsState?.ytext ?? null,
        awareness: yjsState?.awareness ?? null,
        provider: yjsState?.provider ?? null,
        connected: yjsState?.connected ?? false,
      }}
    >
      <div className="app">
        {sidebarOpen && <Sidebar />}
        <EditorArea />
        {commandPaletteOpen && <CommandPalette />}
      </div>
    </YjsProvider>
  );
}
