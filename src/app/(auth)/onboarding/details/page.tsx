import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { OnboardingDetails } from '@/components/OnboardingDetails';
import { safeReturnTo } from '@/lib/return-to';
import { currentViewer, first } from '../../../_viewer';

export const metadata: Metadata = { title: 'Set up your profile', robots: { index: false } };

/** /onboarding/details — SCR-29 optional steps after the username (FR-18). Pending users finish the username first. */
export default async function OnboardingDetailsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const next = safeReturnTo(first((await searchParams).returnTo));
  const viewer = await currentViewer();
  if (viewer.kind === 'visitor') redirect('/login');
  if (viewer.kind === 'pending') redirect(`/onboarding?returnTo=${encodeURIComponent(next)}`);
  return <OnboardingDetails username={viewer.username} next={next} />;
}
