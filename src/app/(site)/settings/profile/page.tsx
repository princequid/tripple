import type { Metadata } from 'next';
import { ProfileSettingsForm } from '@/components/settings/ProfileSettingsForm';
import { PreviewNote } from '@/components/ui/PreviewNote';

export const metadata: Metadata = { title: 'Profile settings', robots: { index: false } };

/** /settings/profile — SCR-30 (P-06, FR-59). */
export default function SettingsProfile() {
  return (
    <section className="stack" aria-labelledby="s-title">
      <h2 id="s-title" className="t-h3">
        Profile
      </h2>
      <PreviewNote feature="settings" />
      <ProfileSettingsForm />
    </section>
  );
}
