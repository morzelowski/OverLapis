import { useEffect, useRef } from 'react';
import { EditorView, keymap, placeholder, lineNumbers } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { obsidianTheme, obsidianHighlightStyle } from './extensions/theme';
import { markdownExtension } from './extensions/markdown';
import { collaborationExtension } from './extensions/collaboration';
import { uploadPastedImage, uploadFiles } from '../../services/api';
import { useAppStore } from '../../stores/appStore';
import type * as Y from 'yjs';
import type { Awareness } from 'y-protocols/awareness';
import './EditorPane.css';

interface EditorPaneProps {
  ytext: Y.Text | null;
  awareness: Awareness | null;
  filePath: string | null;
}

function insertTextAtCursor(view: EditorView, text: string) {
  const { from, to } = view.state.selection.main;
  view.dispatch({
    changes: { from, to, insert: text },
    selection: { anchor: from + text.length },
  });
  view.focus();
}

function markdownForUpload(result: { path: string; originalName: string; isImage: boolean }): string {
  const url = `/api/assets/${result.path.replace('assets/', '')}`;
  if (result.isImage) {
    return `![${result.originalName}](${url})`;
  }
  return `[${result.originalName}](${url})`;
}

export default function EditorPane({ ytext, awareness, filePath }: EditorPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const refreshFileTree = useAppStore((s) => s.refreshFileTree);
  const refreshRef = useRef(refreshFileTree);
  refreshRef.current = refreshFileTree;

  useEffect(() => {
    if (!containerRef.current || !filePath) return;

    if (viewRef.current) {
      viewRef.current.destroy();
      viewRef.current = null;
    }

    const pasteHandler = EditorView.domEventHandlers({
      paste(event, view) {
        const clipboardData = event.clipboardData;
        if (!clipboardData) return false;

        // Check for image in clipboard
        const items = Array.from(clipboardData.items);
        const imageItem = items.find((item) => item.type.startsWith('image/'));

        if (imageItem) {
          event.preventDefault();
          const blob = imageItem.getAsFile();
          if (!blob) return true;

          // Insert placeholder while uploading
          const placeholderText = '![Uploading...]()';
          const { from, to } = view.state.selection.main;
          view.dispatch({
            changes: { from, to, insert: placeholderText },
          });

          uploadPastedImage(blob, imageItem.type)
            .then((result) => {
              // Find and replace placeholder
              const doc = view.state.doc.toString();
              const placeholderPos = doc.indexOf(placeholderText);
              if (placeholderPos >= 0) {
                const md = markdownForUpload(result);
                view.dispatch({
                  changes: {
                    from: placeholderPos,
                    to: placeholderPos + placeholderText.length,
                    insert: md,
                  },
                });
              }
              refreshRef.current();
            })
            .catch((err) => {
              console.error('Paste upload failed:', err);
              // Remove placeholder on error
              const doc = view.state.doc.toString();
              const placeholderPos = doc.indexOf(placeholderText);
              if (placeholderPos >= 0) {
                view.dispatch({
                  changes: {
                    from: placeholderPos,
                    to: placeholderPos + placeholderText.length,
                    insert: '',
                  },
                });
              }
            });

          return true;
        }

        // Check for files (non-image)
        if (clipboardData.files.length > 0) {
          event.preventDefault();
          const files = Array.from(clipboardData.files);
          handleFileUpload(files, view, () => refreshRef.current());
          return true;
        }

        return false;
      },

      drop(event, view) {
        const dt = event.dataTransfer;
        if (!dt || dt.files.length === 0) return false;

        event.preventDefault();
        const files = Array.from(dt.files);
        handleFileUpload(files, view, () => refreshRef.current());
        return true;
      },
    });

    const extensions = [
      obsidianTheme,
      obsidianHighlightStyle,
      markdownExtension(),
      lineNumbers(),
      EditorView.lineWrapping,
      placeholder('Start writing...'),
      pasteHandler,
    ];

    if (ytext && awareness) {
      extensions.push(collaborationExtension(ytext, awareness));
    } else {
      extensions.push(history(), keymap.of(historyKeymap));
    }

    extensions.push(keymap.of(defaultKeymap));

    const state = EditorState.create({
      doc: ytext ? undefined : '',
      extensions,
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [ytext, awareness, filePath]);

  if (!filePath) {
    return (
      <div className="editor-pane editor-empty">
        <div className="editor-empty-content">
          <svg width="48" height="48" viewBox="0 0 32 32" opacity="0.3">
            <defs>
              <linearGradient id="lapis-empty" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1a3ae0" />
                <stop offset="100%" stopColor="#4b6bf5" />
              </linearGradient>
            </defs>
            <rect width="32" height="32" rx="6" fill="url(#lapis-empty)" />
            <path d="M10 22 L16 8 L22 22 Z" fill="none" stroke="white" strokeWidth="2.5" strokeLinejoin="round" />
            <line x1="12" y1="18" x2="20" y2="18" stroke="white" strokeWidth="2" />
          </svg>
          <p>Open a file from the sidebar or press <kbd>Ctrl+P</kbd> to search</p>
        </div>
      </div>
    );
  }

  return <div className="editor-pane" ref={containerRef} />;
}

async function handleFileUpload(files: File[], view: EditorView, onUploaded?: () => void) {
  const imageFiles = files.filter((f) => f.type.startsWith('image/'));
  const mdFiles = files.filter((f) =>
    f.name.endsWith('.md') || f.name.endsWith('.txt') ||
    f.name.endsWith('.csv') || f.name.endsWith('.json')
  );
  const otherFiles = files.filter(
    (f) => !imageFiles.includes(f) && !mdFiles.includes(f)
  );

  const toUpload = [...imageFiles, ...mdFiles, ...otherFiles];
  if (toUpload.length === 0) return;

  try {
    const results = await uploadFiles(toUpload);
    const mdSnippets = results.map(markdownForUpload);
    const text = mdSnippets.join('\n') + '\n';
    insertTextAtCursor(view, text);
    onUploaded?.();
  } catch (err) {
    console.error('File upload failed:', err);
  }
}
