import * as uploads from '@/modules/media/uploads';
import { getViewer } from '@/modules/auth/service';
import { json } from '@/server/http';
import { assertSameOrigin, readJson, route } from '@/server/route';

/** POST /api/uploads { purpose, fileName, mimeType, size } (FR-61, BR-61/62/66): 201 UploadSlot (where and how to send the file). 422 UNSUPPORTED_MEDIA, 429 RL-UPLOAD. */
export const POST = route(async (req) => {
  assertSameOrigin(req);
  const viewer = await getViewer(req.headers);
  return json(await uploads.create(viewer, await readJson(req)), { status: 201 });
});
