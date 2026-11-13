import { getViewer } from '@/modules/auth/service';
import * as jobs from '@/modules/jobs/service';
import { idempotencyKeyFrom, withIdempotency } from '@/server/idempotency';
import { json, jsonPage } from '@/server/http';
import { assertSameOrigin, readJson, route } from '@/server/route';

/**
 * GET /api/jobs?q&specialty&location&remote&employment&cursor (J-01, FR-67, BR-75). Public; active jobs,
 * newest first, 20 per page. `specialty` and `employment` repeat for multi-select (OR).
 */
export const GET = route(async (req) => {
  const sp = new URL(req.url).searchParams;
  const viewer = await getViewer(req.headers);
  const q = {
    q: sp.get('q') ?? undefined,
    specialty: sp.getAll('specialty'),
    location: sp.get('location') ?? undefined,
    remote: (sp.get('remote') ?? undefined) as 'true' | 'false' | undefined,
    employment: sp.getAll('employment'),
    cursor: sp.get('cursor') ?? undefined,
  };
  return jsonPage(await jobs.list(viewer, q), jobs.PAGE_SIZE);
});

/**
 * POST /api/jobs (J-03, FR-69, BR-71…BR-73): publish a free job for 30 days. 201 JobDetail. 400 VALIDATION,
 * 422 QUOTA_EXCEEDED (3 active / 5 per day), 422 UNSUPPORTED_MEDIA (logo), 429 RL-CONTENT. Optional `Idempotency-Key`.
 */
export const POST = route(async (req) => {
  assertSameOrigin(req);
  const viewer = await getViewer(req.headers);
  const body = await readJson(req);
  const run = () => jobs.create(viewer, body);
  const { result } = viewer.kind === 'member' ? await withIdempotency(viewer.profileId, 'job.create', idempotencyKeyFrom(req), run) : { result: await run() };
  return json(result, { status: 201, headers: { Location: `/jobs/${result.id}-${result.slug}` } });
});
