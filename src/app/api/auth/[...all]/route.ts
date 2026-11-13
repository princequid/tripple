import { authRouteHandlers } from '@/server/auth';

/** Better Auth (D-03, D-04, ADR-003). Library formats are kept as-is (API_RESPONSE_CONVENTIONS §8). */
export const { GET, POST } = authRouteHandlers;
