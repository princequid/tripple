import type { Metadata, Viewport } from 'next';
import '../../design-system/index.css';
import './app.css';
import './features.css';
import { AppProviders, type ClientViewer } from '@/components/providers/AppProviders';
import { CookieBanner } from '@/components/shell/CookieConsent';
import { currentViewer } from './_viewer';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'),
  title: { default: 'Trippple: discover independent design work', template: '%s · Trippple' },
  description: 'Discover shots from independent designers: product, web, mobile, branding, illustration and more.',
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#FFFFFF' };

/**
 * Root layout: the design-system CSS is the single source of visual values (A-12). The viewer is resolved once
 * per request and handed to the client session context (auth gate, mock services, header).
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const v = await currentViewer();
  const viewer: ClientViewer =
    v.kind === 'member' ? { kind: 'member', username: v.username, displayName: v.displayName, avatarKey: v.avatarKey, role: v.role } : { kind: 'visitor' };
  return (
    <html lang="en">
      <body>
        <AppProviders viewer={viewer} googleEnabled={Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)}>
          {children}
          <CookieBanner />
        </AppProviders>
      </body>
    </html>
  );
}
