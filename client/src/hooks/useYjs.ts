import { useEffect, useRef, useState, useCallback } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import type { Awareness } from 'y-protocols/awareness';
import { useAppStore } from '../stores/appStore';

interface YjsState {
  ytext: Y.Text;
  awareness: Awareness;
  doc: Y.Doc;
  provider: WebsocketProvider;
  connected: boolean;
}

export function useYjs(filePath: string | null): YjsState | null {
  const [state, setState] = useState<YjsState | null>(null);
  const currentUser = useAppStore((s) => s.currentUser);
  const cleanupRef = useRef<(() => void) | null>(null);
  const reconnectKey = useRef(0);

  const setup = useCallback((path: string, key: number) => {
    const doc = new Y.Doc();
    const wsProtocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${location.host}/ws`;

    const provider = new WebsocketProvider(wsUrl, path, doc, {
      connect: true,
      // Disable auto-reconnect — we handle it manually to get a fresh Y.Doc
      maxBackoffTime: 2500,
    });

    const ytext = doc.getText('content');
    const awareness = provider.awareness;

    awareness.setLocalStateField('user', {
      name: currentUser.name,
      color: currentUser.color,
      colorLight: currentUser.color + '33',
    });

    const onStatus = ({ status }: { status: string }) => {
      setState({
        ytext,
        awareness,
        doc,
        provider,
        connected: status === 'connected',
      });

      // On disconnect, tear down and rebuild with a fresh Y.Doc
      // so we never merge stale local ops with a re-seeded server doc
      if (status === 'disconnected') {
        // Small delay to avoid tight reconnect loops
        setTimeout(() => {
          // Only reconnect if this is still the active setup
          if (reconnectKey.current !== key) return;
          cleanup();
          setup(path, key);
        }, 1000);
      }
    };

    provider.on('status', onStatus);

    setState({
      ytext,
      awareness,
      doc,
      provider,
      connected: false,
    });

    const cleanup = () => {
      provider.off('status', onStatus);
      provider.disconnect();
      provider.destroy();
      doc.destroy();
    };

    cleanupRef.current = cleanup;
  }, [currentUser.name, currentUser.color]);

  useEffect(() => {
    if (!filePath) {
      setState(null);
      return;
    }

    const key = ++reconnectKey.current;
    setup(filePath, key);

    return () => {
      reconnectKey.current++;
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [filePath, setup]);

  return state;
}
