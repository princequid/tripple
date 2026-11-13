import type { Metadata } from 'next';
import { LegalPage } from '../_legal';

export const metadata: Metadata = { title: 'Contact' };

export default function Page() {
  return (
    <LegalPage title="Contact">
      <p>For support, account deletion requests or takedown notices, write to <strong>hello@trippple.example</strong> (placeholder address until the production domain is chosen).</p>
    </LegalPage>
  );
}
