import { z } from 'zod';
import { shotIdParam } from '@/modules/shots/schemas';

/** `POST /api/views` body (M-10). */
export const viewBody = z.object({ shotId: shotIdParam });
