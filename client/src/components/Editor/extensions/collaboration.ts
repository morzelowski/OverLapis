import * as Y from 'yjs';
import { yCollab } from 'y-codemirror.next';
import type { Awareness } from 'y-protocols/awareness';

export function collaborationExtension(ytext: Y.Text, awareness: Awareness) {
  const undoManager = new Y.UndoManager(ytext);
  return yCollab(ytext, awareness, { undoManager });
}
