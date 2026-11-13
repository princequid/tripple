'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { sanitizeHtml } from '@/lib/sanitize';
import { htmlTextLength } from '@/services/reference';
import { Icon } from '../Icon';

/**
 * Rich text editor for job descriptions (J-03, BR-72): a contenteditable region with a toolbar limited to the
 * allow-list (bold, italic, heading, sub-heading, bulleted/numbered list, link). Output is sanitised on every
 * change. Keyboard: Ctrl/⌘+B, Ctrl/⌘+I work natively; the toolbar is a single tab stop with arrow-key roving.
 */
type Cmd = { label: string; run: () => void; icon?: React.ReactNode; text?: string };

export function RichTextEditor({ label, value, onChange, error, hint, min = 50 }: { label: string; value: string; onChange: (html: string) => void; error?: string | null; hint?: string; min?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  const [focusIdx, setFocusIdx] = useState(0);
  const [count, setCount] = useState(htmlTextLength(value));
  const [link, setLink] = useState<{ open: boolean; url: string; error: string | null }>({ open: false, url: 'https://', error: null });
  const saved = useRef<Range | null>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value && document.activeElement !== ref.current) ref.current.innerHTML = sanitizeHtml(value);
  }, [value]);

  const emit = () => {
    const html = sanitizeHtml(ref.current?.innerHTML ?? '');
    setCount(htmlTextLength(html));
    onChange(html);
  };
  const exec = (cmd: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    emit();
  };
  const cmds: Cmd[] = [
    { label: 'Bold', run: () => exec('bold'), text: 'B' },
    { label: 'Italic', run: () => exec('italic'), text: 'I' },
    { label: 'Heading', run: () => exec('formatBlock', 'H2'), text: 'H' },
    { label: 'Sub-heading', run: () => exec('formatBlock', 'H3'), text: 'h' },
    { label: 'Paragraph', run: () => exec('formatBlock', 'P'), text: '¶' },
    { label: 'Bulleted list', run: () => exec('insertUnorderedList'), icon: <Icon name="menu" /> },
    { label: 'Numbered list', run: () => exec('insertOrderedList'), text: '1.' },
    {
      label: 'Link',
      run: () => {
        const sel = window.getSelection();
        saved.current = sel && sel.rangeCount && ref.current?.contains(sel.anchorNode) ? sel.getRangeAt(0).cloneRange() : null;
        setLink({ open: true, url: 'https://', error: null });
      },
      icon: <Icon name="link" />,
    },
  ];

  return (
    <div className="ui-field">
      <div className="field-labelrow">
        <span className="ui-field__label" id={`${id}-label`}>
          {label}
        </span>
        <span className={`t-caption ${count < min ? 'text-secondary' : ''}`}>{count} characters</span>
      </div>
      <div className={`rte neu-field${error ? ' is-invalid' : ''}`}>
        <div
          className="rte__toolbar"
          role="toolbar"
          aria-label="Formatting"
          onKeyDown={(e) => {
            if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
            const n = (focusIdx + (e.key === 'ArrowRight' ? 1 : -1) + cmds.length) % cmds.length;
            setFocusIdx(n);
            (e.currentTarget.children[n] as HTMLElement | undefined)?.focus();
          }}
        >
          {cmds.map((c, i) => (
            <button key={c.label} type="button" className="rte__btn" aria-label={c.label} title={c.label} tabIndex={i === focusIdx ? 0 : -1} onMouseDown={(e) => e.preventDefault()} onClick={c.run}>
              {c.icon ?? <span aria-hidden="true">{c.text}</span>}
            </button>
          ))}
        </div>
        {link.open && (
          <div className="rte__link">
            <label className="visually-hidden" htmlFor={`${id}-url`}>
              Link address
            </label>
            <input
              id={`${id}-url`}
              className="ui-input neu-field"
              value={link.url}
              autoFocus
              aria-invalid={link.error ? true : undefined}
              onChange={(e) => setLink({ ...link, url: e.target.value, error: null })}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setLink({ ...link, open: false });
                if (e.key !== 'Enter') return;
                e.preventDefault();
                const url = link.url.trim();
                if (!/^(https:\/\/\S+\.\S+|mailto:\S+@\S+)$/i.test(url)) return setLink({ ...link, error: 'Use an https:// or mailto: link.' });
                ref.current?.focus();
                const sel = window.getSelection();
                if (saved.current && sel) (sel.removeAllRanges(), sel.addRange(saved.current));
                if (sel && sel.isCollapsed) document.execCommand('insertHTML', false, `<a href="${url.replace(/"/g, '&quot;')}">${url.replace(/[<>&]/g, '')}</a>`);
                else document.execCommand('createLink', false, url);
                emit();
                setLink({ open: false, url: 'https://', error: null });
              }}
            />
            <span className="t-caption">{link.error ?? 'Press Enter to add, Escape to cancel.'}</span>
          </div>
        )}
        <div
          ref={ref}
          id={id}
          className="rte__area"
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-labelledby={`${id}-label`}
          aria-invalid={error ? true : undefined}
          aria-describedby={[hint ? `${id}-hint` : '', error ? `${id}-err` : ''].filter(Boolean).join(' ') || undefined}
          onInput={emit}
          onBlur={emit}
          onPaste={(e) => {
            e.preventDefault();
            const html = e.clipboardData.getData('text/html');
            const text = e.clipboardData.getData('text/plain');
            document.execCommand('insertHTML', false, html ? sanitizeHtml(html) : text.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!).replace(/\n/g, '<br>'));
            emit();
          }}
        />
      </div>
      {hint && (
        <p id={`${id}-hint`} className="ui-field__hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-err`} className="ui-field__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
