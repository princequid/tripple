import { headers } from 'next/headers';
import { SettingsNav } from '@/components/settings/SettingsNav';
import { requireMemberPage } from '../../_guard';

/** Settings shell (SCR-30…36, SCR-58): auth-only; side nav ≥ md, scrolling tab row below. */
export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const path = (await headers()).get('x-pathname') ?? '/settings/profile';
  await requireMemberPage(path);
  return (
    <div className="settings-layout">
      <header className="page-head">
        <h1 className="t-h2">Settings</h1>
      </header>
      <SettingsNav />
      <div className="settings-layout__body">{children}</div>
    </div>
  );
}
