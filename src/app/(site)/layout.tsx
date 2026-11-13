import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { SiteHeader, SiteFooter } from '@/components/SiteChrome';
import { safeReturnTo } from '@/lib/return-to';
import { currentViewer } from '../_viewer';

/** `(site)` layout: header, main, footer. A signed-in user without a profile must finish onboarding (BR-16). */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const viewer = await currentViewer();
  if (viewer.kind === 'pending') {
    const path = (await headers()).get('x-pathname') ?? '/';
    redirect(`/onboarding?returnTo=${encodeURIComponent(safeReturnTo(path))}`);
  }
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" className="container site-main">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
