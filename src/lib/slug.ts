/** BR-42: slug = title lower-cased, non-alphanumeric runs → "-", trimmed, capped at 80 characters. */
export function slugify(title: string): string {
  const s = title
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
  return s || 'shot';
}

export const shotPath = (id: number, slug: string) => `/shots/${id}-${slug}`;

/** Parses the `/shots/:id-:slug` segment. Returns null for a non-numeric ID (BR-42 → 404). */
export function parseShotSegment(segment: string): { id: number; slug: string } | null {
  const m = /^(\d{1,15})(?:-(.*))?$/.exec(decodeURIComponent(segment));
  if (!m) return null;
  const id = Number(m[1]);
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  return { id, slug: m[2] ?? '' };
}

/** BR-40: tag names are trimmed + lower-cased; slug replaces spaces with hyphens and collapses repeats. */
export function tagSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
