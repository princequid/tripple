import * as jobs from '@/modules/jobs/service';
import { json } from '@/server/http';
import { route } from '@/server/route';

/** GET /api/specialties (BR-71): the 9 fixed job specialties `{ slug, name }[]`. Public. */
export const GET = route(async () => json(jobs.specialties()));
