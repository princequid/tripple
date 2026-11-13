import 'server-only';

/**
 * Image validation and analysis (BR-61…BR-63, D-15). Runs on the server after upload because a signed
 * direct upload cannot enforce type or size (F-08 equivalent for ImageKit).
 */
export type ImageType = { mime: 'image/jpeg' | 'image/png' | 'image/webp'; ext: 'jpg' | 'png' | 'webp' };
export type Purpose = 'shot' | 'avatar' | 'logo';

export const ACCEPTED_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const;

/** BR-62 (shots), BR-71 (logo ≤ 5 MB). Avatars and logos may be small squares (clone decision, DECISION_LOG A-25). */
export const LIMITS: Record<Purpose, { maxBytes: number; minW: number; minH: number }> = {
  shot: { maxBytes: 20 * 1024 * 1024, minW: 400, minH: 300 },
  avatar: { maxBytes: 20 * 1024 * 1024, minW: 100, minH: 100 },
  logo: { maxBytes: 5 * 1024 * 1024, minW: 64, minH: 64 },
};
export const MAX_SIDE = 8000;
export const MAX_PIXELS = 40_000_000;

/** BR-61: type by magic bytes only (never the extension or declared MIME). SVG/GIF/others → null. */
export function sniff(buf: Uint8Array): ImageType | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { mime: 'image/jpeg', ext: 'jpg' };
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (buf.length >= 8 && png.every((b, i) => buf[i] === b)) return { mime: 'image/png', ext: 'png' };
  if (
    buf.length >= 12 &&
    String.fromCharCode(buf[0]!, buf[1]!, buf[2]!, buf[3]!) === 'RIFF' &&
    String.fromCharCode(buf[8]!, buf[9]!, buf[10]!, buf[11]!) === 'WEBP'
  ) {
    return { mime: 'image/webp', ext: 'webp' };
  }
  return null;
}

export class ImageRejected extends Error {
  constructor(readonly reason: string) {
    super(reason);
  }
}

const mb = (n: number) => `${Math.round(n / 1024 / 1024)} MB`;

export type Inspection = { type: ImageType; width: number; height: number; bytes: number; dominantColor: string; palette: string[] };

/** Validates limits and extracts dominant colour + 7-colour palette. Throws ImageRejected with a user-facing reason. */
export async function inspect(buf: Buffer, purpose: Purpose): Promise<Inspection> {
  const lim = LIMITS[purpose];
  if (buf.length > lim.maxBytes) throw new ImageRejected(`The file is larger than ${mb(lim.maxBytes)}.`);
  const type = sniff(buf);
  if (!type) throw new ImageRejected('Upload a JPEG, PNG or WebP image.');
  const sharp = (await import('sharp')).default;
  let meta;
  try {
    meta = await sharp(buf, { limitInputPixels: MAX_PIXELS + 1 }).metadata();
  } catch {
    throw new ImageRejected('The image could not be read. It may be damaged or larger than 40 megapixels.');
  }
  // EXIF orientation 5–8 swaps the displayed sides.
  const rotated = (meta.orientation ?? 1) >= 5;
  const width = (rotated ? meta.height : meta.width) ?? 0;
  const height = (rotated ? meta.width : meta.height) ?? 0;
  if (width > MAX_SIDE || height > MAX_SIDE) throw new ImageRejected(`Images can be at most ${MAX_SIDE.toLocaleString('en')} px on either side.`);
  if (width * height > MAX_PIXELS) throw new ImageRejected('Images can be at most 40 megapixels.');
  if (width < lim.minW || height < lim.minH) throw new ImageRejected(`Images must be at least ${lim.minW} × ${lim.minH} px.`);
  const { dominant, palette } = await colours(buf);
  return { type, width, height, bytes: buf.length, dominantColor: dominant, palette };
}

const hex = (r: number, g: number, b: number) => `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;

/** Deterministic k-means (k = 7) on a 64 px thumbnail; clusters sorted by size, largest = dominant (BR-63). */
export async function colours(buf: Buffer, k = 7): Promise<{ dominant: string; palette: string[] }> {
  const sharp = (await import('sharp')).default;
  const { data, info } = await sharp(buf).rotate().resize(64, 64, { fit: 'inside' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const n = info.width * info.height;
  const px: [number, number, number][] = [];
  for (let i = 0; i < n; i++) px.push([data[i * 3]!, data[i * 3 + 1]!, data[i * 3 + 2]!]);
  // Init: evenly spaced pixels by luminance order (deterministic).
  const sorted = [...px].sort((a, b) => a[0] * 0.299 + a[1] * 0.587 + a[2] * 0.114 - (b[0] * 0.299 + b[1] * 0.587 + b[2] * 0.114));
  let centres = Array.from({ length: k }, (_, i) => sorted[Math.min(sorted.length - 1, Math.floor(((i + 0.5) * sorted.length) / k))]!.slice() as [number, number, number]);
  let counts = new Array<number>(k).fill(0);
  for (let iter = 0; iter < 8; iter++) {
    const sums = Array.from({ length: k }, () => [0, 0, 0]);
    counts = new Array<number>(k).fill(0);
    for (const p of px) {
      let best = 0;
      let bestD = Infinity;
      for (let c = 0; c < k; c++) {
        const d = (p[0] - centres[c]![0]) ** 2 + (p[1] - centres[c]![1]) ** 2 + (p[2] - centres[c]![2]) ** 2;
        if (d < bestD) {
          bestD = d;
          best = c;
        }
      }
      counts[best]!++;
      sums[best]![0]! += p[0];
      sums[best]![1]! += p[1];
      sums[best]![2]! += p[2];
    }
    centres = centres.map((c, i) => (counts[i] ? [sums[i]![0]! / counts[i]!, sums[i]![1]! / counts[i]!, sums[i]![2]! / counts[i]!] : c)) as [number, number, number][];
  }
  const order = centres.map((c, i) => ({ c, n: counts[i]! })).sort((a, b) => b.n - a.n);
  const palette: string[] = [];
  for (const { c } of order) {
    const h = hex(c[0], c[1], c[2]);
    if (!palette.includes(h)) palette.push(h);
  }
  return { dominant: palette[0] ?? '#cccccc', palette: palette.slice(0, k) };
}

/** sRGB hex → CIELAB (D65), stored with each palette colour for R3 colour search (BR-80). */
export function hexToLab(h: string): { l: number; a: number; b: number } {
  const v = h.replace('#', '');
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const [r, g, b] = [0, 2, 4].map((i) => lin(parseInt(v.slice(i, i + 2), 16))) as [number, number, number];
  const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return { l: 116 * f(y) - 16, a: 500 * (f(x) - f(y)), b: 200 * (f(y) - f(z)) };
}
