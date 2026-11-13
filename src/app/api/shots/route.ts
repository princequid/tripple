import { getViewer } from '@/modules/auth/service';
import * as feed from '@/modules/feed/service';
import * as composer from '@/modules/composer/service';
import { feedQuery } from '@/modules/feed/schemas';
import { idempotencyKeyFrom, withIdempotency } from '@/server/idempotency';
import { json, jsonPage } from '@/server/http';
import { assertSameOrigin, queryOf, readJson, route } from '@/server/route';

/** GET /api/shots?sort&category&timeframe&cursor&limit (D-01, BR-32…BR-37). Public. */
export const GET = route(async (req) => {
  const q = feedQuery.parse(queryOf(req));
  const viewer = await getViewer(req.headers);
  const page = await feed.list(q, viewer);
  return jsonPage(page, q.limit);
});

/**
 * POST /api/shots (FR-63, R2): create a DRAFT from ShotDraftInput. 201 ShotDraft. 400 VALIDATION (fields),
 * 403 team not yours (BR-59), 409 image used elsewhere, 422 UNSUPPORTED_MEDIA / QUOTA_EXCEEDED (50 drafts),
 * 429 RL-CONTENT. Optional `Idempotency-Key`.
 */
export const POST = route(async (req) => {
  assertSameOrigin(req);
  const viewer = await getViewer(req.headers);
  const body = await readJson(req);
  const run = () => composer.create(viewer, body);
  const { result } = viewer.kind === 'member' ? await withIdempotency(viewer.profileId, 'shot.create', idempotencyKeyFrom(req), run) : { result: await run() };
  return json(result, { status: 201, headers: { Location: `/api/shots/${result.id}/edit` } });
});
