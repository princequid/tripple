import { getViewer } from '@/modules/auth/service';
import * as collections from '@/modules/collections/service';
import { idempotencyKeyFrom, withIdempotency } from '@/server/idempotency';
import { json } from '@/server/http';
import { assertSameOrigin, readJson, route } from '@/server/route';

/**
 * POST /api/collections { name, description?, isPrivate? } (FR-46). 201 CollectionSummary. 409 CONFLICT
 * (duplicate name, case-insensitive), 422 QUOTA_EXCEEDED (100 collections), 429 RL-CONTENT. Optional
 * `Idempotency-Key` header.
 */
export const POST = route(async (req) => {
  assertSameOrigin(req);
  const viewer = await getViewer(req.headers);
  const body = await readJson(req) as Parameters<typeof collections.create>[1];
  const actor = viewer.kind === 'member' ? viewer.profileId : 0;
  const { result } = actor
    ? await withIdempotency(actor, 'collection.create', idempotencyKeyFrom(req), () => collections.create(viewer, body))
    : { result: await collections.create(viewer, body) };
  return json(result, { status: 201, headers: { Location: `/api/collections/${result.id}` } });
});
