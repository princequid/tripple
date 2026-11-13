import { z } from 'zod';

/** Shot IDs are positive integers (BR-42). Used for `/api/shots/:id` and `/api/shots/:id/like`. */
export const shotIdParam = z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER);
