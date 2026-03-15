import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';

export const obsidianTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: '#1e1e1e',
      color: '#dcddde',
      fontSize: '16px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },
    '.cm-content': {
      caretColor: '#dcddde',
      padding: '16px 0',
      lineHeight: '1.6',
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: '#dcddde',
      borderLeftWidth: '2px',
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
      backgroundColor: 'rgba(37, 70, 240, 0.25)',
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
    },
    '.cm-gutters': {
      backgroundColor: '#1e1e1e',
      color: '#4a4a4a',
      border: 'none',
      paddingRight: '8px',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'transparent',
      color: '#666666',
    },
    '.cm-lineNumbers .cm-gutterElement': {
      padding: '0 8px 0 16px',
      minWidth: '32px',
    },
    '.cm-foldGutter': {
      color: '#4a4a4a',
    },
    '.cm-line': {
      padding: '0 16px',
    },
    '.cm-matchingBracket': {
      backgroundColor: 'rgba(37, 70, 240, 0.2)',
      outline: 'none',
    },
    '.cm-searchMatch': {
      backgroundColor: 'rgba(229, 192, 123, 0.3)',
    },
    '.cm-searchMatch.cm-searchMatch-selected': {
      backgroundColor: 'rgba(229, 192, 123, 0.5)',
    },
    '.cm-panels': {
      backgroundColor: '#252525',
      color: '#dcddde',
    },
    '.cm-panels.cm-panels-top': {
      borderBottom: '1px solid #333333',
    },
    '.cm-tooltip': {
      backgroundColor: '#2b2b2b',
      border: '1px solid #333333',
      color: '#dcddde',
    },
    '.cm-tooltip-autocomplete': {
      '& > ul > li[aria-selected]': {
        backgroundColor: 'rgba(37, 70, 240, 0.2)',
      },
    },
    // Yjs remote cursor styles
    '.cm-ySelectionInfo': {
      padding: '2px 6px',
      borderRadius: '3px 3px 3px 0',
      fontSize: '11px',
      fontFamily: "'Inter', sans-serif",
      fontWeight: '500',
      opacity: '1',
      transitionDelay: '0s',
      position: 'absolute',
      top: '-18px',
      left: '-1px',
      whiteSpace: 'nowrap',
      zIndex: '10',
    },
    '.cm-yLineSelection': {
      opacity: '0.15',
    },
    '.cm-ySelection': {
      opacity: '0.3',
    },
  },
  { dark: true }
);

export const obsidianHighlightStyle = syntaxHighlighting(
  HighlightStyle.define([
    { tag: tags.heading1, color: '#e5c07b', fontWeight: '700', fontSize: '1.6em' },
    { tag: tags.heading2, color: '#e5c07b', fontWeight: '600', fontSize: '1.4em' },
    { tag: tags.heading3, color: '#e5c07b', fontWeight: '600', fontSize: '1.2em' },
    { tag: tags.heading4, color: '#e5c07b', fontWeight: '600', fontSize: '1.1em' },
    { tag: tags.heading5, color: '#e5c07b', fontWeight: '600' },
    { tag: tags.heading6, color: '#e5c07b', fontWeight: '600' },
    { tag: tags.strong, color: '#e5c07b', fontWeight: '700' },
    { tag: tags.emphasis, color: '#c678dd', fontStyle: 'italic' },
    { tag: tags.strikethrough, textDecoration: 'line-through', color: '#999999' },
    { tag: tags.link, color: '#2546f0', textDecoration: 'underline' },
    { tag: tags.url, color: '#61afef' },
    { tag: tags.monospace, color: '#e06c75', fontFamily: "'JetBrains Mono', monospace" },
    { tag: tags.content, color: '#dcddde' },
    { tag: tags.meta, color: '#666666' },
    { tag: tags.comment, color: '#5c6370', fontStyle: 'italic' },
    { tag: tags.quote, color: '#98c379', fontStyle: 'italic' },
    { tag: tags.list, color: '#61afef' },
    { tag: tags.processingInstruction, color: '#666666' },
    { tag: tags.keyword, color: '#c678dd' },
    { tag: tags.string, color: '#98c379' },
    { tag: tags.number, color: '#d19a66' },
    { tag: tags.operator, color: '#56b6c2' },
    { tag: tags.punctuation, color: '#999999' },
    { tag: tags.variableName, color: '#e06c75' },
    { tag: tags.function(tags.variableName), color: '#61afef' },
    { tag: tags.typeName, color: '#e5c07b' },
    { tag: tags.propertyName, color: '#e06c75' },
    { tag: tags.bool, color: '#d19a66' },
    { tag: tags.null, color: '#d19a66' },
    { tag: tags.atom, color: '#d19a66' },
    { tag: tags.regexp, color: '#98c379' },
    { tag: tags.escape, color: '#56b6c2' },
    { tag: tags.labelName, color: '#e06c75' },
    { tag: tags.definition(tags.variableName), color: '#61afef' },
    { tag: tags.className, color: '#e5c07b' },
  ])
);
