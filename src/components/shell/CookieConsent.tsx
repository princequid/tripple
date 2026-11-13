'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Modal } from '../ui/Modal';
import { Switch } from '../ui/Field';
import { useToast } from '../ui/Toast';

/**
 * OV-10 cookie consent (X-05, FR-86, BR-85). Only essential cookies exist today, so the first-visit banner is shown
 * only when NEXT_PUBLIC_NONESSENTIAL_COOKIES=1 (the analytics client, X-03, will set it). The settings dialog is
 * always reachable from the footer and stores the choice (Accept and Reject carry equal weight).
 */
const KEY = 'trippple.consent.v1';
type Consent = { analytics: boolean; at: string };

const read = (): Consent | null => {
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? 'null') as Consent | null;
  } catch {
    return null;
  }
};
const write = (c: Consent) => {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(c));
  } catch {
    /* blocked storage */
  }
  window.dispatchEvent(new Event('trippple:consent'));
};

function SettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [analytics, setAnalytics] = useState(false);
  const toast = useToast();
  useEffect(() => {
    if (open) setAnalytics(read()?.analytics ?? false);
  }, [open]);
  const done = (v: boolean) => {
    write({ analytics: v, at: new Date().toISOString() });
    toast({ tone: 'success', text: 'Cookie preferences saved.' });
    onClose();
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Cookie settings"
      description="Choose which optional cookies we may use. You can change this at any time from the footer."
      footer={
        <>
          <button type="button" className="ui-btn ui-btn--on-glass" onClick={() => done(false)}>
            Reject optional
          </button>
          <button type="button" className="ui-btn ui-btn--on-glass" onClick={() => done(analytics)}>
            Save choices
          </button>
          <button type="button" className="ui-btn ui-btn--primary" onClick={() => done(true)}>
            Accept all
          </button>
        </>
      }
    >
      <div className="stack">
        <Switch label="Essential (always on)" checked onChange={() => undefined} hint="Sign-in and security. These cannot be turned off." />
        <Switch label="Analytics" checked={analytics} onChange={setAnalytics} hint="First-party, anonymous usage counts that help us improve the product. No third-party trackers." />
        <p className="t-body-sm">
          Read the <Link className="text-link" href="/cookies">cookie policy</Link>.
        </p>
      </div>
    </Modal>
  );
}

export function CookieSettingsButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="ui-footer__link link-button" onClick={() => setOpen(true)}>
        Cookie settings
      </button>
      <SettingsDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export function CookieBanner() {
  const [show, setShow] = useState(false);
  const [settings, setSettings] = useState(false);
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_NONESSENTIAL_COOKIES === '1' && !read()) setShow(true);
  }, []);
  if (!show) return <SettingsDialog open={settings} onClose={() => setSettings(false)} />;
  const done = (v: boolean) => {
    write({ analytics: v, at: new Date().toISOString() });
    setShow(false);
  };
  return (
    <div className="cookie-banner glass-panel glass-enter" role="region" aria-label="Cookie consent">
      <p className="t-body-sm">We use optional analytics cookies to understand how the product is used. Is that okay?</p>
      <div className="cluster">
        <button type="button" className="ui-btn ui-btn--on-glass" onClick={() => done(false)}>
          Reject
        </button>
        <button type="button" className="ui-btn ui-btn--on-glass" onClick={() => (setShow(false), setSettings(true))}>
          Settings
        </button>
        <button type="button" className="ui-btn ui-btn--primary" onClick={() => done(true)}>
          Accept
        </button>
      </div>
    </div>
  );
}
