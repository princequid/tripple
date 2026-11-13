import type { Metadata } from 'next';
import { LegalPage } from '../_legal';

export const metadata: Metadata = { title: 'Privacy' };

export default function Page() {
  return (
    <LegalPage title="Privacy">
      <p>We keep the minimum needed to run the service: your sign-in email (never shown publicly), your public profile, your likes, and anonymous daily view counts. Sign-in codes are stored only as hashes and deleted within a day. To delete your account, write to the contact address below; we act within 30 days.</p>
    </LegalPage>
  );
}
