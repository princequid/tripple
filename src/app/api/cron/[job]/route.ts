import * as platform from '@/modules/platform/service';
import * as feed from '@/modules/feed/service';
import { AppError } from '@/server/errors';
import { bearerMatches, json } from '@/server/http';
import { route } from '@/server/route';

/**
 * GET /api/cron/:job (M-15, BACKEND_ARCHITECTURE §6). `Authorization: Bearer CRON_SECRET` (constant-time).
 * Jobs: popularity (BR-33), cleanup (BR-79, BR-23, BR-66), reconcile (BR-27), purge (BR-24, BR-65), daily (all;
 * Vercel Hobby runs one cron/day).
 * A wrong or missing secret is 404, so the endpoint does not advertise itself.
 */
const JOBS = {
  popularity: () => feed.recomputePopularity(),
  cleanup: () => platform.cleanup(),
  reconcile: () => platform.reconcileCounters(),
  purge: () => platform.purge(), // R2: BR-24, BR-65
  daily: () => platform.daily(),
} as const;

export const GET = route<{ job: string }>(async (req, { params }) => {
  if (!bearerMatches(req.headers, process.env.CRON_SECRET)) throw new AppError('NOT_FOUND');
  const run = JOBS[params.job as keyof typeof JOBS];
  if (!run) throw new AppError('NOT_FOUND');
  const started = Date.now();
  const result = await run();
  return json({ job: params.job, result, durationMs: Date.now() - started });
});
