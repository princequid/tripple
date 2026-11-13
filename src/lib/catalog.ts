/** BR-36: exactly 8 categories with fixed slugs (names chosen with the seed set, D-25c). */
export const CATEGORIES = [
  { id: 1, slug: 'product-design', name: 'Product design' },
  { id: 2, slug: 'web-design', name: 'Web design' },
  { id: 3, slug: 'animation', name: 'Animation' },
  { id: 4, slug: 'branding', name: 'Branding' },
  { id: 5, slug: 'illustration', name: 'Illustration' },
  { id: 6, slug: 'mobile', name: 'Mobile' },
  { id: 7, slug: 'typography', name: 'Typography' },
  { id: 8, slug: 'print', name: 'Print' },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]['slug'];

export const categoryBySlug = (slug: string) => CATEGORIES.find((c) => c.slug === slug) ?? null;

/** BR-34 timeframes with the neutral labels from A-13. */
export const TIMEFRAMES = [
  { value: 'now', label: 'Trending now' },
  { value: 'week', label: 'Past 7 days' },
  { value: 'month', label: 'Past 30 days' },
  { value: 'year', label: 'Past 12 months' },
  { value: 'ever', label: 'All time' },
] as const;
export type Timeframe = (typeof TIMEFRAMES)[number]['value'];
export const TIMEFRAME_DAYS: Record<Exclude<Timeframe, 'now' | 'ever'>, number> = { week: 7, month: 30, year: 365 };

export type FeedSort = 'popular' | 'recent';

/** BR-71: the 9 fixed job specialties (RE doc 06 §2.4; neutral names). R2 jobs board. */
export const SPECIALTIES = [
  { id: 1, slug: 'animation', name: 'Animation' },
  { id: 2, slug: 'brand-graphic-design', name: 'Brand / Graphic design' },
  { id: 3, slug: 'illustration', name: 'Illustration' },
  { id: 4, slug: 'leadership', name: 'Leadership' },
  { id: 5, slug: 'mobile-design', name: 'Mobile design' },
  { id: 6, slug: 'ui-visual-design', name: 'UI / Visual design' },
  { id: 7, slug: 'product-design', name: 'Product design' },
  { id: 8, slug: 'ux-design-research', name: 'UX design / Research' },
  { id: 9, slug: 'web-design', name: 'Web design' },
] as const;
export type SpecialtySlug = (typeof SPECIALTIES)[number]['slug'];
export const specialtyBySlug = (slug: string) => SPECIALTIES.find((s) => s.slug === slug) ?? null;

/**
 * Release flags (BR-45): actions whose feature has not shipped are not rendered.
 * The server also refuses them, so flipping a flag never exposes an unfinished mutation.
 */
export const RELEASED = {
  likes: true,
  saves: false,
  follows: false,
  comments: false,
  messaging: false,
  uploads: false,
} as const;
