/**
 * Shot composer (R2: C-01, C-04, C-05). Live: composer-live.ts (API_SPECIFICATION §5.4–5.5; the server re-checks
 * every file). Mock: reads files locally (object URLs), checks BR-61/62 in the browser, keeps drafts in the mock store.
 */
import { api } from '@/lib/api-client';
import { liveGet, liveList, liveSave, liveUpload } from './composer-live';
import { isMock } from './config';
import { getDb, nextId, now, save } from './mock/db';
import { fail, mockViewer, ok, read, write } from './mock/runtime';
import type { ShotDraft, ShotDraftInput, UploadedMedia } from './contracts';
import type { ShotDetail } from '@/modules/shots/types';
import { mediaUrl } from '@/lib/media';
import type { ApiResult } from '@/lib/api-client';
import { slugify } from '@/lib/slug';

export const UPLOAD_RULES = { types: ['image/jpeg', 'image/png', 'image/webp'], maxBytes: 20 * 1024 * 1024, minW: 400, minH: 300, maxSide: 8000, maxMp: 40, maxBlocks: 20 } as const;

/** BR-61: verify the type by magic bytes (JPEG FF D8 FF, PNG 89 50 4E 47, WebP RIFF....WEBP). */
async function sniff(file: File): Promise<string | null> {
  const b = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return 'image/webp';
  return null;
}

function dimensions(url: string): Promise<{ w: number; h: number; color: string | null }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let color: string | null = null;
      try {
        const c = document.createElement('canvas');
        c.width = c.height = 1;
        const ctx = c.getContext('2d');
        ctx?.drawImage(img, 0, 0, 1, 1);
        const d = ctx?.getImageData(0, 0, 1, 1).data;
        if (d) color = `#${[d[0], d[1], d[2]].map((x) => (x ?? 0).toString(16).padStart(2, '0')).join('')}`;
      } catch {
        /* tainted canvas */
      }
      resolve({ w: img.naturalWidth, h: img.naturalHeight, color });
    };
    img.onerror = () => reject(new Error('decode'));
    img.src = url;
  });
}

/** Client checks (BR-61/62). Returns a user-facing message or null. */
export async function checkImage(file: File): Promise<string | null> {
  const type = await sniff(file);
  if (!type) return `${file.name}: only JPEG, PNG and WebP images are accepted.`;
  if (file.size > UPLOAD_RULES.maxBytes) return `${file.name}: images are at most 20 MB.`;
  return null;
}

export async function uploadImage(file: File, onProgress: (pct: number) => void): Promise<ApiResult<UploadedMedia>> {
  const problem = await checkImage(file);
  if (problem) return fail(400, 'VALIDATION', problem);
  if (!isMock('composer')) return liveUpload(file, onProgress);
  const url = URL.createObjectURL(file);
  let dims: { w: number; h: number; color: string | null };
  try {
    dims = await dimensions(url);
  } catch {
    return fail(400, 'VALIDATION', `${file.name}: this image could not be read.`);
  }
  if (dims.w < UPLOAD_RULES.minW || dims.h < UPLOAD_RULES.minH) return fail(400, 'VALIDATION', `${file.name}: images must be at least 400 × 300 px (this is ${dims.w} × ${dims.h}).`);
  if (dims.w > UPLOAD_RULES.maxSide || dims.h > UPLOAD_RULES.maxSide || dims.w * dims.h > UPLOAD_RULES.maxMp * 1e6) return fail(400, 'VALIDATION', `${file.name}: images are at most 8,000 px per side and 40 megapixels.`);
  for (let p = 10; p <= 100; p += 15) {
    await new Promise((r) => setTimeout(r, 70));
    onProgress(Math.min(100, p));
  }
  onProgress(100);
  return ok({ mediaId: `local-${Date.now()}-${Math.floor(Math.random() * 1e6)}`, key: `local/${file.name}`, width: dims.w, height: dims.h, dominantColor: dims.color, previewUrl: url });
}

/** BR-64 composition rules; keys match ShotDraftInput. */
export function validateDraft(i: ShotDraftInput, publishing: boolean): Record<string, string> {
  const e: Record<string, string> = {};
  if (i.title.trim().length < 1 || i.title.trim().length > 100) e.title = 'Give your shot a title (up to 100 characters).';
  if (!i.categorySlug) e.categorySlug = 'Choose a category.'; // required for drafts too (API_SPECIFICATION §5.5)
  if (i.description.length > 5000) e.description = 'Keep the description under 5,000 characters.';
  if (i.tags.length > 20) e.tags = 'Use at most 20 tags.';
  if (i.blocks.length > 20) e.blocks = 'A shot has at most 20 blocks.';
  if (publishing && !i.blocks.some((b) => b.type === 'image')) e.blocks = 'Add at least one image.';
  return e;
}

const mockSave = (id: number | null, input: ShotDraftInput & { previewBlocks: ShotDraft['previewBlocks'] }, publish: boolean) =>
  write(async (me) => {
    const errors = validateDraft(input, publish);
    if (Object.keys(errors).length) return fail<ShotDraft>(400, 'VALIDATION', 'Check the highlighted fields.', errors);
    const d = await getDb();
    if (!id && d.drafts.filter((x) => x.owner === me.username && x.status === 'draft').length >= 50) return fail<ShotDraft>(409, 'LIMIT_REACHED', 'You can keep at most 50 drafts.');
    let row = id ? d.drafts.find((x) => x.id === id && x.owner === me.username) : undefined;
    if (id && !row) return fail<ShotDraft>(404, 'NOT_FOUND', 'Draft not found.');
    if (!row) {
      row = { id: nextId(d), owner: me.username, status: 'draft', data: null, updatedAt: now() };
      d.drafts.push(row);
    }
    if (publish) row.status = 'published';
    // Object URLs die with the page, so only text and metadata are persisted.
    row.data = { ...input, previewBlocks: input.previewBlocks.map((b) => (b.kind === 'image' ? { ...b, media: b.media ? { ...b.media, previewUrl: b.media.previewUrl.startsWith('blob:') ? '' : b.media.previewUrl } : null } : b)) };
    row.updatedAt = now();
    save();
    return ok<ShotDraft>({ ...(row.data as ShotDraftInput & { previewBlocks: ShotDraft['previewBlocks'] }), id: row.id, status: row.status, slug: slugify(input.title), updatedAt: row.updatedAt });
  });

export const saveDraft = (id: number | null, input: ShotDraftInput, previewBlocks: ShotDraft['previewBlocks'], publish: boolean) =>
  isMock('composer')
    ? mockSave(id, { ...input, previewBlocks }, publish)
    : liveSave(id, input, publish);

export const getDraft = (id: number) =>
  isMock('composer')
    ? read(async () => {
        const d = await getDb();
        let row = d.drafts.find((x) => x.id === id && x.owner === mockViewer()?.username);
        if (!row) {
          // A real published shot (R1 data): load it from GET /api/shots/:id so the owner can edit it here.
          const live = await api<ShotDetail>(`/api/shots/${id}`);
          if (!live.ok || !live.data.isOwn) return fail<ShotDraft>(404, 'NOT_FOUND', 'Draft not found.');
          const s = live.data;
          const previewBlocks: ShotDraft['previewBlocks'] = s.blocks.map((b) =>
            b.type === 'text'
              ? { kind: 'text', clientId: `t${b.id}`, text: b.text }
              : { kind: 'image', clientId: `i${b.id}`, alt: b.media.alt, isFullWidth: b.isFullWidth, progress: 100, error: null, fileName: b.media.key, media: { mediaId: String(b.id), key: b.media.key, width: b.media.width, height: b.media.height, dominantColor: b.media.dominantColor, previewUrl: mediaUrl(b.media.key, 'w800') } },
          );
          const data = { title: s.title, description: s.description ?? '', categorySlug: s.category.slug, tags: s.tags.map((t) => t.name), teamUsername: s.team?.username ?? null, commentsDisabled: false, blocks: [], previewBlocks };
          row = { id, owner: mockViewer()!.username, status: 'published', data, updatedAt: s.publishedAt };
          d.drafts.push(row);
          save();
        }
        const data = row.data as ShotDraftInput & { previewBlocks: ShotDraft['previewBlocks'] };
        return ok<ShotDraft>({ ...data, id: row.id, status: row.status, slug: slugify(data.title), updatedAt: row.updatedAt });
      })
    : liveGet(id);

export const myDrafts = () =>
  isMock('composer')
    ? read(async () => {
        const d = await getDb();
        const me = mockViewer()?.username;
        return ok(
          d.drafts
            .filter((x) => x.owner === me)
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
            .map((r) => ({ id: r.id, title: (r.data as ShotDraftInput).title, status: r.status, updatedAt: r.updatedAt })),
        );
      })
    : liveList();

export const deleteDraft = (id: number) =>
  isMock('composer')
    ? write(async (me) => {
        const d = await getDb();
        d.drafts = d.drafts.filter((x) => !(x.id === id && x.owner === me.username));
        save();
        return ok(null);
      })
    : api<null>(`/api/shots/${id}`, { method: 'DELETE' });
