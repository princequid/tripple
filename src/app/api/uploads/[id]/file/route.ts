import { getViewer } from '@/modules/auth/service';
import * as uploads from '@/modules/media/uploads';
import { AppError } from '@/server/errors';
import { json } from '@/server/http';
import { assertSameOrigin, route } from '@/server/route';

export const runtime = 'nodejs';

const MAX = 20 * 1024 * 1024;

/**
 * PUT /api/uploads/:id/file (FR-61, local provider only; 404 with ImageKit). Body = the raw file bytes.
 * Bodies over 20 MB are refused while streaming (422 UNSUPPORTED_MEDIA).
 */
export const PUT = route<{ id: string }>(async (req, { params }) => {
  assertSameOrigin(req);
  const viewer = await getViewer(req.headers);
  const declared = Number(req.headers.get('content-length') ?? 0);
  if (declared > MAX) throw new AppError('UNSUPPORTED_MEDIA', 'The file is larger than 20 MB.');
  const chunks: Uint8Array[] = [];
  let total = 0;
  if (req.body) {
    const reader = req.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > MAX) {
        await reader.cancel();
        throw new AppError('UNSUPPORTED_MEDIA', 'The file is larger than 20 MB.');
      }
      chunks.push(value);
    }
  }
  return json(await uploads.receiveLocal(viewer, params.id, Buffer.concat(chunks)));
});
