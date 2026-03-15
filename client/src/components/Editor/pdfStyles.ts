export function getPdfStyles(): string {
  return `
    @page {
      margin: 0;
      size: A4;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html, body {
      width: 210mm;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 12pt;
      line-height: 1.7;
      color: #1a1a1a;
      background: white;
    }

    /* Table trick: thead/tfoot repeat on every printed page */
    .print-table {
      width: 100%;
      border-collapse: collapse;
    }

    .print-table td {
      padding: 0;
      border: none;
    }

    /* Top margin on every page */
    .print-header td {
      height: 20mm;
    }

    /* Bottom margin + footer on every page */
    .print-footer td {
      height: 20mm;
      vertical-align: bottom;
      text-align: center;
      padding-bottom: 8mm;
      font-size: 9pt;
      color: #999;
    }

    /* Content area with left/right margins */
    .print-body td {
      padding: 0 20mm;
      vertical-align: top;
    }

    .content {
      max-width: 100%;
    }

    h1 {
      font-size: 2em;
      font-weight: 700;
      margin: 0.8em 0 0.4em;
      padding-bottom: 0.2em;
      border-bottom: 1px solid #e0e0e0;
    }

    h2 {
      font-size: 1.5em;
      font-weight: 600;
      margin: 0.7em 0 0.3em;
    }

    h3 {
      font-size: 1.25em;
      font-weight: 600;
      margin: 0.6em 0 0.3em;
    }

    h4, h5, h6 {
      font-weight: 600;
      margin: 0.5em 0 0.3em;
    }

    p {
      margin: 0 0 0.8em;
    }

    a {
      color: #2546f0;
      text-decoration: underline;
    }

    strong {
      font-weight: 700;
    }

    code {
      background: #f4f4f4;
      padding: 1px 4px;
      border-radius: 3px;
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 0.9em;
    }

    pre {
      background: #f4f4f4;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 12px;
      overflow-x: auto;
      margin: 0.8em 0;
      page-break-inside: avoid;
    }

    pre code {
      background: none;
      padding: 0;
    }

    blockquote {
      border-left: 3px solid #2546f0;
      padding-left: 12px;
      margin: 0.8em 0;
      color: #555;
      font-style: italic;
    }

    ul, ol {
      margin: 0.5em 0;
      padding-left: 1.5em;
    }

    li {
      margin: 0.2em 0;
    }

    hr {
      border: none;
      border-top: 1px solid #e0e0e0;
      margin: 1.5em 0;
    }

    table:not(.print-table) {
      width: 100%;
      border-collapse: collapse;
      margin: 0.8em 0;
      page-break-inside: avoid;
    }

    table:not(.print-table) th,
    table:not(.print-table) td {
      border: 1px solid #d0d0d0;
      padding: 6px 10px;
      text-align: left;
    }

    table:not(.print-table) th {
      background: #f4f4f4;
      font-weight: 600;
    }

    img {
      max-width: 100%;
      page-break-inside: avoid;
    }

    h1, h2, h3, h4, h5, h6 {
      page-break-after: avoid;
    }

    pre, blockquote, img {
      page-break-inside: avoid;
    }
  `;
}
