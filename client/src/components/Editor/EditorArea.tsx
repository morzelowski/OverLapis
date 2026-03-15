import { useCallback } from 'react';
import { marked } from 'marked';
import { useAppStore } from '../../stores/appStore';
import { useYjsContext } from '../../hooks/YjsContext';
import TabBar from '../Tabs/TabBar';
import EditorPane from './EditorPane';
import MarkdownPreview from './MarkdownPreview';
import ImagePreview from './ImagePreview';
import { getPdfStyles } from './pdfStyles';
import './EditorArea.css';

const IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.ico'];

function isImageFile(path: string | null): boolean {
  if (!path) return false;
  const lower = path.toLowerCase();
  return IMAGE_EXTS.some((ext) => lower.endsWith(ext));
}

export default function EditorArea() {
  const { activeTabId, viewMode, setViewMode, toggleSidebar } = useAppStore();
  const { ytext, awareness, connected } = useYjsContext();
  const isImage = isImageFile(activeTabId);

  const handleExportPdf = useCallback(() => {
    if (!ytext || !activeTabId) return;

    const content = ytext.toString();
    const htmlContent = marked.parse(content);
    if (typeof htmlContent !== 'string') return;

    const title = activeTabId.replace(/\.md$/, '');

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '-9999px';
    iframe.style.width = '0';
    iframe.style.height = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument!;
    doc.open();
    doc.write(`<!DOCTYPE html>
<html><head>
  <meta charset="utf-8">
  <title>${title} — OverLapis</title>
  <style>${getPdfStyles()}</style>
</head><body>
  <table class="print-table">
    <thead class="print-header"><tr><td></td></tr></thead>
    <tfoot class="print-footer"><tr><td>OpenLapis</td></tr></tfoot>
    <tbody class="print-body"><tr><td>
      <div class="content">${htmlContent}</div>
    </td></tr></tbody>
  </table>
</body></html>`);
    doc.close();

    const images = Array.from(doc.images).filter((img) => !img.complete);

    function doPrint() {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }

    if (images.length === 0) {
      setTimeout(doPrint, 100);
    } else {
      Promise.all(
        images.map((img) => new Promise<void>((r) => { img.onload = img.onerror = () => r(); }))
      ).then(doPrint);
    }
  }, [ytext, activeTabId]);

  return (
    <div className="editor-area">
      <div className="editor-toolbar">
        <div className="editor-toolbar-left">
          <button className="toolbar-btn" onClick={toggleSidebar} title="Toggle sidebar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
            </svg>
          </button>
        </div>
        <TabBar />
        <div className="editor-toolbar-right">
          <div className="view-mode-toggle">
            <button
              className={`toolbar-btn ${viewMode === 'source' ? 'active' : ''}`}
              onClick={() => setViewMode('source')}
              title="Source mode"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </button>
            <button
              className={`toolbar-btn ${viewMode === 'split' ? 'active' : ''}`}
              onClick={() => setViewMode('split')}
              title="Split mode"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="12" y1="3" x2="12" y2="21" />
              </svg>
            </button>
            <button
              className={`toolbar-btn ${viewMode === 'preview' ? 'active' : ''}`}
              onClick={() => setViewMode('preview')}
              title="Preview mode"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          </div>
          {activeTabId && !isImage && (
            <button
              className="toolbar-btn"
              onClick={handleExportPdf}
              title="Export as PDF"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="editor-content">
        {isImage ? (
          <ImagePreview filePath={activeTabId!} />
        ) : (
          <>
            <div
              className="editor-pane-wrapper"
              style={{ display: viewMode === 'preview' ? 'none' : undefined }}
            >
              <EditorPane
                ytext={ytext}
                awareness={awareness}
                filePath={activeTabId}
              />
            </div>
            {(viewMode === 'preview' || viewMode === 'split') && (
              <MarkdownPreview ytext={ytext} />
            )}
          </>
        )}
      </div>

      {activeTabId && (
        <div className="editor-statusbar">
          <span className={`status-dot ${connected ? 'connected' : ''}`} />
          <span className="status-text">
            {connected ? 'Connected' : 'Connecting...'}
          </span>
          <span className="status-file">{activeTabId}</span>
        </div>
      )}
    </div>
  );
}
