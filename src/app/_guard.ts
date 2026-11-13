import 'server-only';
import { notFound, redirect } from 'next/navigation';
import { isStaff, type Member } from '@/modules/auth/types';
import { currentViewer } from './_viewer';

/** Auth-only pages (A-05, BR-17): visitors are redirected to /login?returnTo=<this page>. */
export async function requireMemberPage(returnTo: string): Promise<Member> {
  const v = await currentViewer();
  if (v.kind !== 'member') redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  return v;
}

/** Staff-only pages: everyone else gets 404 so the page's existence is not disclosed. */
export async function requireStaffPage(): Promise<Member> {
  const v = await currentViewer();
  if (v.kind !== 'member' || !isStaff(v)) notFound();
  return v;
}

/** Leading numeric id of an `:id-:slug` segment, or 404. */
export function idFromSegment(segment: string): number {
  const m = /^(\d{1,12})(?:-.*)?$/.exec(decodeURIComponent(segment));
  if (!m) notFound();
  return Number(m[1]);
}
