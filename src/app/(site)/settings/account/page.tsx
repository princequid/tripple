import type { Metadata } from 'next';
import { AccountSettingsView } from '@/components/settings/AccountSettings';
import { PreviewNote } from '@/components/ui/PreviewNote';

export const metadata: Metadata = { title: 'Account settings', robots: { index: false } };

/** /settings/account — SCR-31 (A-07, BR-23, BR-24). */
export default function SettingsAccount() {
  return (
    <section className="stack" aria-labelledby="s-title">
      <h2 id="s-title" className="t-h3">
        Account
      </h2>
      <PreviewNote feature="settings" />
      <AccountSettingsView />
    </section>
  );
}
