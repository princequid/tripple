import 'server-only';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import * as users from '@/modules/users/service';
import * as follows from '@/modules/follows/service';
import { checkUsernameShape, normaliseUsername } from '@/lib/username';
import { currentViewer, orNotFound } from '../../_viewer';

/**
 * Profile lookup shared by metadata and pages. The segment is validated against the username pattern before
 * any query (FRONTEND_ARCHITECTURE §4 rule 2), so `/anything-weird` 404s without touching the database.
 */
export const loadProfile = cache(async (segment: string) => {
  const name = normaliseUsername(decodeURIComponent(segment));
  if (checkUsernameShape(name) === 'invalid') notFound();
  const viewer = await currentViewer();
  const profile = await orNotFound(users.getPublicProfile(name, viewer, follows.lookupFor(viewer)));
  return { profile, viewer };
});
