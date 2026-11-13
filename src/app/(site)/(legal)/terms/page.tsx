import type { Metadata } from 'next';
import { LegalPage } from '../_legal';

export const metadata: Metadata = { title: 'Terms of use' };

export default function Page() {
  return (
    <LegalPage title="Terms of use">
      <p>By using Trippple you agree to share only work you have the right to share, to respect other members, and to follow the content policy: no illegal content, no sexually explicit content, no harassment. AI-assisted work is allowed when it is yours to publish.</p>
    </LegalPage>
  );
}
