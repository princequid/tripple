import * as uploads from '@/modules/media/uploads';
import { getViewer } from '@/modules/auth/service';
import { json } from '@/server/http';
import { assertSameOrigin, readJson, route } from '@/server/route';

/** POST /api/uploads/:id/complete { fileId? } (FR-62, BR-61…63): validates the stored file and returns UploadedMedia (status ready). ImageKit needs the `fileId` from its upload response. 422 UNSUPPORTED_MEDIA (file deleted), 409 not uploaded yet. */
export const POST = route<{ id: string }>(async (req, { params }) => {
  assertSameOrigin(req);
  const viewer = await getViewer(req.headers);
  return json(await uploads.complete(viewer, params.id, await readJson(req)));
});
