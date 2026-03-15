import { useEffect, useState } from 'react';
import { marked } from 'marked';
import type * as Y from 'yjs';
import './MarkdownPreview.css';

marked.setOptions({
  gfm: true,
  breaks: true,
});

interface MarkdownPreviewProps {
  ytext: Y.Text | null;
}

export default function MarkdownPreview({ ytext }: MarkdownPreviewProps) {
  const [html, setHtml] = useState('');

  useEffect(() => {
    if (!ytext) {
      setHtml('');
      return;
    }

    function update() {
      const content = ytext!.toString();
      const result = marked.parse(content);
      if (typeof result === 'string') {
        setHtml(result);
      }
    }

    update();
    ytext.observe(update);
    return () => {
      ytext.unobserve(update);
    };
  }, [ytext]);

  return (
    <div className="markdown-preview">
      <div
        className="markdown-preview-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
