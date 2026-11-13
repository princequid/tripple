'use client';

import { useState } from 'react';
import { Icon } from './Icon';

/**
 * C31 Share (SD-02, BR-44): copies the canonical absolute URL with share UTM parameters. No third-party share
 * scripts. When the Clipboard API is unavailable, the URL is shown selected so it can be copied by hand.
 */
export function ShareButton({ path }: { path: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'manual'>('idle');
  const [url, setUrl] = useState('');

  const copy = async () => {
    const u = new URL(path, window.location.origin);
    u.searchParams.set('utm_source', 'share');
    u.searchParams.set('utm_medium', 'copy_link');
    setUrl(u.toString());
    try {
      await navigator.clipboard.writeText(u.toString());
      setState('copied');
    } catch {
      setState('manual');
    }
  };

  return (
    <div className="stack" style={{ ['--stack-gap' as string]: 'var(--space-2)' }}>
      <button className="ui-icon-btn neu-control" type="button" aria-label="Copy link to this shot" onClick={copy}>
        <Icon name={state === 'copied' ? 'check' : 'share'} />
      </button>
      {state === 'manual' && (
        <div className="ui-copy-row">
          <label className="visually-hidden" htmlFor="share-url">
            Shot link
          </label>
          <input id="share-url" className="ui-input neu-field" readOnly value={url} onFocus={(e) => e.currentTarget.select()} autoFocus />
        </div>
      )}
      <span role="status" className="visually-hidden">
        {state === 'copied' ? 'Link copied' : ''}
      </span>
    </div>
  );
}
