/**
 * Media URLs (ADR-010, A-19). Every caller goes through `mediaUrl`, so the host is a configuration choice:
 *
 * - `local` (development, seed data): pre-rendered derivatives at `${base}/${key}/${variant}.webp`
 *   (base `/seed-media`).
 * - `imagekit` (preview/production): ImageKit stores one original per key and renders each variant on the
 *   fly from a URL transformation: `${urlEndpoint}/${key}?tr=...`. No derivatives are stored.
 *
 * Variants (BR-63, ADR-004): 4:3 covers 400×300 and 800×600; widths 800/1200/1600 for the detail view.
 */
export type MediaVariant = 'cover-400' | 'cover-800' | 'w800' | 'w1200' | 'w1600';
export type MediaProvider = 'local' | 'imagekit';

export const MEDIA_PROVIDER: MediaProvider = process.env.NEXT_PUBLIC_MEDIA_PROVIDER === 'imagekit' ? 'imagekit' : 'local';

export const MEDIA_BASE = (process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? '/seed-media').replace(/\/+$/, '');

/** ImageKit transformations per variant. `c-maintain_ratio` with both sides crops to 4:3; `fo-auto` picks the focus. */
export const IMAGEKIT_TRANSFORMS: Record<MediaVariant, string> = {
  'cover-400': 'w-400,h-300,c-maintain_ratio,fo-auto,f-auto,q-80',
  'cover-800': 'w-800,h-600,c-maintain_ratio,fo-auto,f-auto,q-80',
  w800: 'w-800,f-auto,q-85',
  w1200: 'w-1200,f-auto,q-85',
  w1600: 'w-1600,f-auto,q-85',
};

const encodeKey = (key: string) => key.replace(/^\/+/, '').split('/').map(encodeURIComponent).join('/');

export function mediaUrl(key: string, variant: MediaVariant, provider: MediaProvider = MEDIA_PROVIDER, base: string = MEDIA_BASE): string {
  if (provider === 'imagekit') return `${base}/${encodeKey(key)}?tr=${IMAGEKIT_TRANSFORMS[variant]}`;
  return `${base}/${key}/${variant}.webp`;
}

export const coverSrcSet = (key: string) => `${mediaUrl(key, 'cover-400')} 400w, ${mediaUrl(key, 'cover-800')} 800w`;

export const detailSrcSet = (key: string) =>
  `${mediaUrl(key, 'w800')} 800w, ${mediaUrl(key, 'w1200')} 1200w, ${mediaUrl(key, 'w1600')} 1600w`;
