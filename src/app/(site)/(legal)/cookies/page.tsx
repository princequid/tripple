import type { Metadata } from 'next';
import { LegalPage } from '../_legal';

export const metadata: Metadata = { title: 'Cookies' };

export default function Page() {
  return (
    <LegalPage title="Cookies">
      <p>Trippple uses one essential cookie: the session cookie that keeps you signed in. There are no analytics or advertising cookies, so there is nothing to consent to.</p>
    </LegalPage>
  );
}
