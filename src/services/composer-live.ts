/**
 * Live composer adapters (API_SPECIFICATION §5.4–5.5). Upload = 3 steps: POST /api/uploads (slot) → send the file
 * (ImageKit signed multipart POST, or the local dev PUT to /api/uploads/:id/file) → POST /api/uploads/:id/complete.
 * XMLHttpRequest is used for the file step so the composer can show real upload progress.
 */
import { api, type ApiResult } from '@/lib/api-client';
import { mediaUrl } from '@/lib/media';
import type { ComposerBlock, MediaRef, ShotDraft, ShotDraftInput, UploadedMedia } from './contracts';

type Slot = { uploadId: string; mediaId: string; provider: 'local' | 'imagekit'; method: 'POST' | 'PUT'; uploadUrl: string; fields: Record<string, string>; token: string; expiresAt: string; maxBytes: number };
type LiveMedia = { mediaId: string; status: 'pending' | 'ready' | 'failed'; key: string; width: number; height: number; dominantColor: string | null; previewUrl: string | null; failureReason: string | null };
type LiveDraft = {
  id: number; status: 'draft' | 'published'; title: string; slug: string; description: string | null; categorySlug: string; tags: string[]; teamUsername: string | null;
  commentsDisabled: boolean; blocks: ({ type: 'image'; mediaId: string; alt: string | null; isFullWidth: boolean; media: MediaRef | null } | { type: 'text'; text: string })[];
  updatedAt: string; publishedAt: string | null; canonicalPath: string;
};

function sendFile(slot: Slot, file: File, onProgress: (p: number) => void): Promise<{ ok: boolean; status: number; body: Record<string, unknown> | null }> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open(slot.method, slot.uploadUrl);
    xhr.withCredentials = slot.provider === 'local';
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.min(95, Math.round((e.loaded / e.total) * 95)));
    xhr.onload = () => {
      let body: Record<string, unknown> | null = null;
      try {
        body = JSON.parse(xhr.responseText) as Record<string, unknown>;
      } catch {
        /* empty */
      }
      resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, body });
    };
    xhr.onerror = () => resolve({ ok: false, status: 0, body: null });
    if (slot.method === 'POST') {
      const form = new FormData();
      Object.entries(slot.fields).forEach(([k, v]) => form.append(k, v));
      form.append('file', file);
      xhr.send(form);
    } else {
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    }
  });
}

export async function liveUpload(file: File, onProgress: (p: number) => void): Promise<ApiResult<UploadedMedia>> {
  const slot = await api<Slot>('/api/uploads', { method: 'POST', body: JSON.stringify({ purpose: 'shot', fileName: file.name, mimeType: file.type, size: file.size }) });
  if (!slot.ok) return { ...slot, message: slot.fields?.file ?? slot.message };
  onProgress(5);
  const sent = await sendFile(slot.data, file, onProgress);
  if (!sent.ok) return { ok: false, status: sent.status, code: 'UPLOAD_FAILED', message: `${file.name}: the upload did not finish. Try again.` };
  const fileId = slot.data.provider === 'imagekit' ? String(sent.body?.fileId ?? '') : undefined;
  const done = await api<LiveMedia>(`/api/uploads/${encodeURIComponent(slot.data.uploadId)}/complete`, { method: 'POST', body: JSON.stringify(fileId ? { fileId } : {}) });
  if (!done.ok) return { ...done, message: `${file.name}: ${done.fields?.file ?? done.message}` };
  onProgress(100);
  const d = done.data;
  return { ...done, data: { mediaId: d.mediaId, key: d.key, width: d.width, height: d.height, dominantColor: d.dominantColor, previewUrl: d.previewUrl ?? mediaUrl(d.key, 'w800') } };
}

const toDraft = (d: LiveDraft): ShotDraft => {
  const previewBlocks: ComposerBlock[] = d.blocks.map((b, i) =>
    b.type === 'text'
      ? { kind: 'text', clientId: `t${i}`, text: b.text }
      : {
          kind: 'image', clientId: `i${i}-${b.mediaId}`, alt: b.alt ?? '', isFullWidth: b.isFullWidth, progress: 100, error: b.media ? null : 'This image is no longer available.', fileName: b.mediaId,
          media: b.media ? { mediaId: b.mediaId, key: b.media.key, width: b.media.width, height: b.media.height, dominantColor: b.media.dominantColor, previewUrl: mediaUrl(b.media.key, 'w800') } : null,
        },
  );
  return {
    id: d.id, status: d.status, slug: d.slug, updatedAt: d.updatedAt, canonicalPath: d.canonicalPath, title: d.title, description: d.description ?? '', categorySlug: d.categorySlug,
    tags: d.tags, teamUsername: d.teamUsername, commentsDisabled: d.commentsDisabled, previewBlocks,
    blocks: d.blocks.map((b) => (b.type === 'text' ? b : { type: 'image' as const, mediaId: b.mediaId, alt: b.alt ?? '', isFullWidth: b.isFullWidth })),
  };
};

export async function liveSave(id: number | null, input: ShotDraftInput, publish: boolean): Promise<ApiResult<ShotDraft>> {
  const body = JSON.stringify({ ...input, description: input.description || null, blocks: input.blocks.map((b) => (b.type === 'image' ? { ...b, alt: b.alt || null } : b)) });
  const saved = id ? await api<LiveDraft>(`/api/shots/${id}`, { method: 'PATCH', body }) : await api<LiveDraft>('/api/shots', { method: 'POST', body });
  if (!saved.ok) return saved;
  if (!publish || saved.data.status === 'published') return { ...saved, data: toDraft(saved.data) };
  const pub = await api<LiveDraft>(`/api/shots/${saved.data.id}/publish`, { method: 'POST', body: '{}' });
  return pub.ok ? { ...pub, data: toDraft(pub.data) } : pub;
}

export async function liveGet(id: number): Promise<ApiResult<ShotDraft>> {
  const r = await api<LiveDraft>(`/api/shots/${id}/edit`);
  return r.ok ? { ...r, data: toDraft(r.data) } : r;
}

export async function liveList(): Promise<ApiResult<{ id: number; title: string; status: 'draft' | 'published'; updatedAt: string }[]>> {
  const r = await api<{ id: number; title: string; status: 'draft' | 'published'; updatedAt: string }[]>('/api/me/shots?status=draft');
  return r.ok ? { ...r, data: r.data.map(({ id, title, status, updatedAt }) => ({ id, title, status, updatedAt })) } : r;
}
