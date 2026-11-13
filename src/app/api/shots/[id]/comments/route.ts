import { getViewer } from '@/modules/auth/service';
import * as comments from '@/modules/comments/service';
import { pageQuery } from '@/modules/feed/schemas';
import { idempotencyKeyFrom, withIdempotency } from '@/server/idempotency';
import { json } from '@/server/http';
import { assertSameOrigin, parseId, queryOf, readJson, route } from '@/server/route';

/**
 * GET /api/shots/:id/comments?cursor&limit (FR-49): `{ data: { comments, total, disabled, canModerate },
 * page: { nextCursor, limit } }`. Top-level oldest first, replies nested oldest first (BR-49). Ineligible shot → 404.
 */
export const GET = route<{ id: string }>(async (req, { params }) => {
  const id = parseId(params.id);
  const q = pageQuery.parse(queryOf(req));
  const viewer = await getViewer(req.headers);
  const { nextCursor, ...thread } = await comments.thread(id, viewer, q);
  return new Response(JSON.stringify({ data: thread, page: { nextCursor, limit: q.limit } }), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
});

/**
 * POST /api/shots/:id/comments { body, parentId? } (FR-49, BR-48/49): 201 CommentDto. 403 COMMENTS_DISABLED,
 * 404 ineligible shot or parent, 400 VALIDATION, 429 RL-COMMENT. Optional `Idempotency-Key`.
 */
export const POST = route<{ id: string }>(async (req, { params }) => {
  assertSameOrigin(req);
  const id = parseId(params.id);
  const viewer = await getViewer(req.headers);
  const body = (await readJson(req)) as Parameters<typeof comments.create>[2];
  const run = () => comments.create(viewer, id, body);
  const { result } = viewer.kind === 'member' ? await withIdempotency(viewer.profileId, `comment:${id}`, idempotencyKeyFrom(req), run) : { result: await run() };
  return json(result, { status: 201 });
});
