import { z } from 'zod';
import { getViewer } from '@/modules/auth/service';
import * as comments from '@/modules/comments/service';
import { json } from '@/server/http';
import { validate } from '@/server/validation';
import { assertSameOrigin, parseId, readJson, route } from '@/server/route';

const body = z.object({ disabled: z.boolean() });

/** PUT /api/shots/:id/comments-setting { disabled } (FR-50, BR-51, BR-60): shot author or team owner/admin. */
export const PUT = route<{ id: string }>(async (req, { params }) => {
  assertSameOrigin(req);
  const id = parseId(params.id);
  const viewer = await getViewer(req.headers);
  const v = validate(body, await readJson(req));
  return json(await comments.setDisabled(viewer, id, v.disabled));
});
