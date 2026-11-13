import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import * as users from '@/modules/users/service';
import { OnboardingForm } from '@/components/OnboardingForm';
import { SignOutButton } from '@/components/SignOutButton';
import { safeReturnTo } from '@/lib/return-to';
import { currentViewer, first } from '../../_viewer';

export const metadata: Metadata = { title: 'Choose your username', robots: { index: false } };

/**
 * /onboarding (A-06 minimal, FR-17, BR-16, BR-21). Visitors → /login; members → returnTo. The username is
 * pre-filled from the email local part. "Not you? Sign out" (A-13 §7).
 */
export default async function OnboardingPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const returnTo = safeReturnTo(first(sp.returnTo));
  const viewer = await currentViewer();
  if (viewer.kind === 'visitor') redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  if (viewer.kind === 'member') redirect(returnTo);
  const suggested = await users.suggestUsername(viewer.email);
  const defaultName = viewer.name && viewer.name !== viewer.email ? viewer.name : '';
  return (
    <>
      <OnboardingForm suggested={suggested} defaultName={defaultName} returnTo={returnTo} />
      <p className="t-body-sm text-secondary" style={{ marginTop: 'var(--space-6)' }}>
        Signed in as {viewer.email}. Not you? <SignOutButton>Sign out</SignOutButton>
      </p>
    </>
  );
}
