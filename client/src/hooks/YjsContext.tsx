import { createContext, useContext, type ReactNode } from 'react';
import type * as Y from 'yjs';
import type { Awareness } from 'y-protocols/awareness';
import type { WebsocketProvider } from 'y-websocket';

interface YjsContextValue {
  ytext: Y.Text | null;
  awareness: Awareness | null;
  provider: WebsocketProvider | null;
  connected: boolean;
}

const YjsContext = createContext<YjsContextValue>({
  ytext: null,
  awareness: null,
  provider: null,
  connected: false,
});

export function YjsProvider({
  value,
  children,
}: {
  value: YjsContextValue;
  children: ReactNode;
}) {
  return <YjsContext.Provider value={value}>{children}</YjsContext.Provider>;
}

export function useYjsContext() {
  return useContext(YjsContext);
}
