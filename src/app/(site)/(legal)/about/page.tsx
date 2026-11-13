import type { Metadata } from 'next';
import { LegalPage } from '../_legal';

export const metadata: Metadata = { title: 'About Trippple' };

export default function Page() {
  return (
    <LegalPage title="About Trippple">
      <p>Trippple is an independent home for design work: interfaces, identities, illustration, motion and type, shared by the people who made them. Browse by popularity or recency, search, follow tags, and like what inspires you.</p>
    </LegalPage>
  );
}
