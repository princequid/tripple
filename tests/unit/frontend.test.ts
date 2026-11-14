import { describe, expect, it } from 'vitest';
import { formatPrice, htmlTextLength, timeAgo, validateJob, validateService } from '@/services/reference';
import { validateDraft } from '@/services/composer';
import { paginate } from '@/services/mock/runtime';
import { sourceOf } from '@/services/config';
import type { JobInput, ServiceInput } from '@/services/contracts';
import type { ApiResult } from '@/lib/api-client';

const job: JobInput = {
  title: 'Senior Product Designer',
  descriptionHtml: `<p>${'x'.repeat(60)}</p>`,
  location: '',
  workplaceType: 'remote',
  specialtySlug: 'product-design',
  employmentType: 'full-time',
  applyUrl: 'https://example.com/apply',
  companyName: 'Acme',
  companyWebsite: 'https://example.com',
  companyLogoKey: null,
};

describe('BR-71 job validation mirror', () => {
  it('accepts a complete job', () => expect(validateJob(job)).toEqual({}));
  it('checks title length, description text length (markup excluded) and apply destination', () => {
    const e = validateJob({ ...job, title: 'Hey', descriptionHtml: '<p><strong>short</strong></p>', applyUrl: 'http://x.com' });
    expect(Object.keys(e).sort()).toEqual(['applyUrl', 'descriptionHtml', 'title']);
    expect(e.descriptionHtml).toContain('5 so far');
  });
  it('accepts mailto: apply destinations and validates per step', () => {
    expect(validateJob({ ...job, applyUrl: 'mailto:jobs@example.com' })).toEqual({});
    expect(validateJob({ ...job, companyName: '' }, 'details')).toEqual({});
    expect(validateJob({ ...job, companyName: '' }, 'company')).toHaveProperty('companyName');
  });
});

describe('BR-84 service validation and price display', () => {
  const svc: ServiceInput = { title: 'A logo for your shop', description: 'd'.repeat(60), categorySlug: 'logo-design', priceCents: 45000, deliveryDays: 7, revisions: 2, includes: [], coverKey: null };
  it('accepts a valid service', () => expect(validateService(svc)).toEqual({}));
  it('rejects out-of-range price and delivery', () => {
    expect(validateService({ ...svc, priceCents: 100, deliveryDays: 91 })).toMatchObject({ priceCents: expect.any(String), deliveryDays: expect.any(String) });
  });
  it('formats integer cents as USD', () => {
    expect(formatPrice(45000)).toBe('$450');
    expect(formatPrice(1999)).toBe('$19.99');
  });
});

describe('BR-64 composer rules', () => {
  const base = { title: 'Shot', description: '', categorySlug: '', tags: [], teamUsername: null, blocks: [], commentsDisabled: false };
  it('a draft needs a title and a category (the API requires both)', () => {
    expect(validateDraft(base, false)).toHaveProperty('categorySlug');
    expect(validateDraft({ ...base, categorySlug: 'print' }, false)).toEqual({});
  });
  it('publishing also needs at least one image', () => {
    expect(validateDraft({ ...base, categorySlug: 'print' }, true)).toMatchObject({ blocks: 'Add at least one image.' });
    expect(validateDraft({ ...base, categorySlug: 'print', blocks: [{ type: 'image', mediaId: 'm1', alt: '', isFullWidth: false }] }, true)).toEqual({});
  });
  it('limits tags to 20', () => expect(validateDraft({ ...base, categorySlug: 'print', tags: Array.from({ length: 21 }, (_, i) => `t${i}`) }, false)).toHaveProperty('tags'));
});

describe('helpers', () => {
  it('htmlTextLength ignores markup', () => expect(htmlTextLength('<h2>Hi</h2><p>there&nbsp;</p>')).toBe(7));
  it('timeAgo buckets', () => {
    const now = Date.parse('2026-11-13T12:00:00Z');
    expect(timeAgo('2026-11-13T11:59:30Z', now)).toBe('just now');
    expect(timeAgo('2026-11-13T11:15:00Z', now)).toBe('45m ago');
    expect(timeAgo('2026-11-13T07:00:00Z', now)).toBe('5h ago');
    expect(timeAgo('2026-11-10T12:00:00Z', now)).toBe('3d ago');
    expect(timeAgo('2026-01-02T12:00:00Z', now)).toBe('Jan 2, 2026');
  });
  it('mock pagination walks every item exactly once', () => {
    const items = Array.from({ length: 45 }, (_, i) => i);
    const seen: number[] = [];
    let cursor: string | null = null;
    do {
      const r: ApiResult<{ items: number[]; nextCursor: string | null }> = paginate(items, cursor, 20);
      if (!r.ok) throw new Error('page failed');
      seen.push(...r.data.items);
      cursor = r.data.nextCursor;
    } while (cursor);
    expect(seen).toEqual(items);
  });
  it('R2 features default to the live API; R3 features stay on the mock until their endpoints exist', () => {
    for (const f of ['follows', 'collections', 'comments', 'reports', 'composer', 'settings', 'teams', 'onboarding', 'jobs', 'search'] as const) expect(sourceOf(f)).toBe('live');
    for (const f of ['notifications', 'messages', 'blocks', 'hire', 'services'] as const) expect(sourceOf(f)).toBe('mock');
  });
});
