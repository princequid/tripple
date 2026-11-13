'use client';

import { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Icon } from '../Icon';
import { useToast } from '../ui/Toast';

/**
 * OV-01 Share modal (SD-02, FR-39, BR-44): plain share intents for X and Pinterest (no third-party scripts), copy
 * link with UTM tags, and the native share sheet where supported. Used for shots, collections, jobs and services.
 */
export function ShareModal({ open, onClose, path, title, kind = 'shot', image }: { open: boolean; onClose: () => void; path: string; title: string; kind?: string; image?: string | null }) {
  const [url, setUrl] = useState('');
  const [canNative, setCanNative] = useState(false);
  const toast = useToast();
  useEffect(() => {
    const u = new URL(path, window.location.origin);
    u.searchParams.set('utm_source', 'share');
    u.searchParams.set('utm_medium', 'copy_link');
    setUrl(u.toString());
    setCanNative(typeof navigator.share === 'function');
  }, [path]);

  const plain = url.split('?')[0] ?? url;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast({ tone: 'success', text: 'Link copied.' });
    } catch {
      (document.getElementById('share-url') as HTMLInputElement | null)?.select();
      toast({ tone: 'info', text: 'Press Ctrl+C (⌘C) to copy the selected link.' });
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Share this ${kind}`} description={title} size="sm">
      <div className="stack">
        <div className="ui-share-row" role="group" aria-label="Share to">
          <a className="ui-icon-btn ui-btn--ghost" href={`https://x.com/intent/post?url=${encodeURIComponent(plain)}&text=${encodeURIComponent(title)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on X (opens in a new tab)">
            <span aria-hidden="true" className="share-glyph">𝕏</span>
          </a>
          <a
            className="ui-icon-btn ui-btn--ghost"
            href={`https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(plain)}&description=${encodeURIComponent(title)}${image ? `&media=${encodeURIComponent(image)}` : ''}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Save on Pinterest (opens in a new tab)"
          >
            <span aria-hidden="true" className="share-glyph">P</span>
          </a>
          <a className="ui-icon-btn ui-btn--ghost" href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(plain)}`} aria-label="Share by email">
            <Icon name="mail" />
          </a>
          {canNative && (
            <button type="button" className="ui-icon-btn ui-btn--ghost" aria-label="More sharing options" onClick={() => navigator.share({ title, url: plain }).catch(() => undefined)}>
              <Icon name="share" />
            </button>
          )}
        </div>
        <div className="ui-copy-row">
          <label className="visually-hidden" htmlFor="share-url">
            Link
          </label>
          <input id="share-url" className="ui-input neu-field" readOnly value={url} onFocus={(e) => e.currentTarget.select()} />
          <button type="button" className="ui-btn ui-btn--primary" onClick={copy}>
            <Icon name="copy" /> Copy
          </button>
        </div>
      </div>
    </Modal>
  );
}
