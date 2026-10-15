'use client';

import React, { useRef, useState, useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write a thoughtful description of this handmade piece...',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showRawHtml, setShowRawHtml] = useState(false);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    h3: false,
    ul: false,
    ol: false,
  });

  // Sync external value to editor if different and not currently editing
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const updateActiveFormats = () => {
    if (typeof document === 'undefined') return;
    try {
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        h3: document.queryCommandValue('formatBlock').toLowerCase() === 'h3',
        ul: document.queryCommandState('insertUnorderedList'),
        ol: document.queryCommandState('insertOrderedList'),
      });
    } catch {
      // Ignore in non-supported environments
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
      updateActiveFormats();
    }
  };

  const executeCommand = (command: string, arg: string | undefined = undefined) => {
    document.execCommand(command, false, arg);
    if (editorRef.current) {
      editorRef.current.focus();
      onChange(editorRef.current.innerHTML);
      updateActiveFormats();
    }
  };

  const insertLink = () => {
    const url = prompt('Enter link URL (e.g. https://example.com):');
    if (url) {
      executeCommand('createLink', url);
    }
  };

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: '4px',
        backgroundColor: 'var(--background)',
        overflow: 'hidden',
      }}
    >
      {/* Editor Toolbar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '0.25rem',
          padding: '0.5rem 0.75rem',
          backgroundColor: 'rgba(244, 239, 235, 0.4)',
          borderBottom: '1px solid var(--border)',
          fontSize: '0.85rem',
        }}
      >
        <button
          type="button"
          onClick={() => executeCommand('bold')}
          title="Bold (Ctrl+B)"
          style={{
            fontWeight: 700,
            padding: '0.25rem 0.5rem',
            borderRadius: '3px',
            border: activeFormats.bold ? '1px solid var(--primary)' : '1px solid transparent',
            backgroundColor: activeFormats.bold ? 'rgba(180, 83, 9, 0.1)' : 'transparent',
            color: activeFormats.bold ? 'var(--primary)' : 'var(--foreground)',
            cursor: 'pointer',
          }}
        >
          B
        </button>

        <button
          type="button"
          onClick={() => executeCommand('italic')}
          title="Italic (Ctrl+I)"
          style={{
            fontStyle: 'italic',
            padding: '0.25rem 0.5rem',
            borderRadius: '3px',
            border: activeFormats.italic ? '1px solid var(--primary)' : '1px solid transparent',
            backgroundColor: activeFormats.italic ? 'rgba(180, 83, 9, 0.1)' : 'transparent',
            color: activeFormats.italic ? 'var(--primary)' : 'var(--foreground)',
            cursor: 'pointer',
          }}
        >
          I
        </button>

        <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--border)', margin: '0 0.25rem' }} />

        <button
          type="button"
          onClick={() => executeCommand('formatBlock', activeFormats.h3 ? '<p>' : '<h3>')}
          title="Subheading"
          style={{
            fontWeight: 600,
            padding: '0.25rem 0.5rem',
            borderRadius: '3px',
            border: activeFormats.h3 ? '1px solid var(--primary)' : '1px solid transparent',
            backgroundColor: activeFormats.h3 ? 'rgba(180, 83, 9, 0.1)' : 'transparent',
            color: activeFormats.h3 ? 'var(--primary)' : 'var(--foreground)',
            cursor: 'pointer',
          }}
        >
          H3
        </button>

        <button
          type="button"
          onClick={() => executeCommand('insertUnorderedList')}
          title="Bulleted List"
          style={{
            padding: '0.25rem 0.5rem',
            borderRadius: '3px',
            border: activeFormats.ul ? '1px solid var(--primary)' : '1px solid transparent',
            backgroundColor: activeFormats.ul ? 'rgba(180, 83, 9, 0.1)' : 'transparent',
            color: activeFormats.ul ? 'var(--primary)' : 'var(--foreground)',
            cursor: 'pointer',
          }}
        >
          &bull; List
        </button>

        <button
          type="button"
          onClick={() => executeCommand('insertOrderedList')}
          title="Numbered List"
          style={{
            padding: '0.25rem 0.5rem',
            borderRadius: '3px',
            border: activeFormats.ol ? '1px solid var(--primary)' : '1px solid transparent',
            backgroundColor: activeFormats.ol ? 'rgba(180, 83, 9, 0.1)' : 'transparent',
            color: activeFormats.ol ? 'var(--primary)' : 'var(--foreground)',
            cursor: 'pointer',
          }}
        >
          1. List
        </button>

        <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--border)', margin: '0 0.25rem' }} />

        <button
          type="button"
          onClick={insertLink}
          title="Insert Link"
          style={{
            padding: '0.25rem 0.5rem',
            borderRadius: '3px',
            border: '1px solid transparent',
            background: 'none',
            cursor: 'pointer',
            color: 'var(--foreground)',
          }}
        >
          &#128279; Link
        </button>

        <button
          type="button"
          onClick={() => executeCommand('removeFormat')}
          title="Clear Formatting"
          style={{
            padding: '0.25rem 0.5rem',
            borderRadius: '3px',
            border: '1px solid transparent',
            background: 'none',
            cursor: 'pointer',
            color: 'var(--muted-foreground)',
          }}
        >
          Clear
        </button>

        <div style={{ marginLeft: 'auto' }}>
          <button
            type="button"
            onClick={() => setShowRawHtml(!showRawHtml)}
            style={{
              fontSize: '0.75rem',
              padding: '0.2rem 0.45rem',
              borderRadius: '3px',
              border: '1px solid var(--border)',
              backgroundColor: showRawHtml ? 'var(--foreground)' : 'var(--background)',
              color: showRawHtml ? 'var(--background)' : 'var(--muted-foreground)',
              cursor: 'pointer',
            }}
          >
            {showRawHtml ? 'Visual Editor' : '< > HTML'}
          </button>
        </div>
      </div>

      {/* Editor Body */}
      {showRawHtml ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={7}
          style={{
            width: '100%',
            padding: '1rem',
            border: 'none',
            outline: 'none',
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            lineHeight: '1.6',
            backgroundColor: 'var(--background)',
            color: 'var(--foreground)',
            resize: 'vertical',
            display: 'block',
          }}
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onKeyUp={updateActiveFormats}
          onMouseUp={updateActiveFormats}
          data-placeholder={placeholder}
          style={{
            minHeight: '160px',
            padding: '1rem',
            outline: 'none',
            lineHeight: '1.7',
            fontSize: '0.95rem',
            color: 'var(--foreground)',
            fontFamily: 'var(--font-sans)',
          }}
          className="rich-text-content"
        />
      )}
    </div>
  );
}
