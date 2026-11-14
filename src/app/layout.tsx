import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import '../../design-system/index.css';
import './app.css';
import './features.css';
import './brand.css';
import './redesign.css';
import { Splash } from '@/components/brand/TrippleMark';
import { AppProviders, type ClientViewer } from '@/components/providers/AppProviders';
import { CookieBanner } from '@/components/shell/CookieConsent';
import { currentViewer } from './_viewer';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'),
  title: { default: 'Trippple: discover independent design work', template: '%s · Trippple' },
  description: 'Discover shots from independent designers: product, web, mobile, branding, illustration and more.',
};

/** v3 UI face (A-27). Exposed as --font-jakarta; the wordmark keeps its own face (--font-logo). */
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-jakarta', display: 'swap' });

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#EDF2F4' };

/**
 * Root layout: the design-system CSS is the single source of visual values (A-12). The viewer is resolved once
 * per request and handed to the client session context (auth gate, mock services, header).
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const v = await currentViewer();
  const viewer: ClientViewer =
    v.kind === 'member' ? { kind: 'member', username: v.username, displayName: v.displayName, avatarKey: v.avatarKey, role: v.role } : { kind: 'visitor' };
  return (
    <html lang="en" className={jakarta.variable} suppressHydrationWarning>
      <body>
        <Splash />
        <AppProviders viewer={viewer} googleEnabled={Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)} passwordAuth={process.env.PROTOTYPE_PASSWORD_AUTH === '1'}>
          {children}
          <CookieBanner />
        </AppProviders>
      </body>
    </html>
  );
}
