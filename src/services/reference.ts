/**
 * Reference data and client-side validation mirrors shared by forms and the mock store. The server stays
 * authoritative: these mirrors only give early feedback, and server 400 `fields` map onto the same keys.
 */
import type { JobInput, ServiceInput } from './contracts';

/** 9 fixed job specialties (BR-71): the shared catalog the server also seeds (single source of truth). */
export { SPECIALTIES } from '@/lib/catalog';

/** Service categories (R3, BR-84). */
export const SERVICE_CATEGORIES = [
  { slug: 'logo-design', name: 'Logo design' },
  { slug: 'brand-identity', name: 'Brand identity' },
  { slug: 'web-design', name: 'Web design' },
  { slug: 'mobile-app', name: 'Mobile app design' },
  { slug: 'illustration', name: 'Illustration' },
  { slug: 'animation', name: 'Animation' },
  { slug: 'print', name: 'Print and packaging' },
] as const;

export const WORKPLACE_LABEL = { remote: 'Remote', 'on-site': 'On-site', hybrid: 'Hybrid' } as const;
export const EMPLOYMENT_LABEL = { 'full-time': 'Full-time', 'freelance-contract': 'Freelance / contract' } as const;
export const REPORT_REASONS = [
  { value: 'spam', label: 'Spam or misleading' },
  { value: 'harassment', label: 'Harassment or hate' },
  { value: 'ip', label: 'Intellectual-property infringement' },
  { value: 'explicit', label: 'Explicit content' },
  { value: 'other', label: 'Something else' },
] as const;

export const htmlTextLength = (html: string) => html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim().length;

/** BR-71. Keys match JobInput so server field errors land on the same inputs. */
export function validateJob(i: JobInput, step: 'details' | 'company' | 'all' = 'all'): Record<string, string> {
  const e: Record<string, string> = {};
  if (step !== 'company') {
    if (i.title.trim().length < 5 || i.title.trim().length > 100) e.title = 'Use 5–100 characters.';
    const n = htmlTextLength(i.descriptionHtml);
    if (n < 50) e.descriptionHtml = `Write at least 50 characters (${n} so far).`;
    else if (n > 20000) e.descriptionHtml = 'Keep the description under 20,000 characters.';
    if (!['remote', 'on-site', 'hybrid'].includes(i.workplaceType)) e.workplaceType = 'Choose a workplace type.';
    if (!i.specialtySlug) e.specialtySlug = 'Choose a specialty.';
    if (!['full-time', 'freelance-contract'].includes(i.employmentType)) e.employmentType = 'Choose an employment type.';
    if (i.location.length > 120) e.location = 'Use at most 120 characters.';
    if (!/^(https:\/\/[^\s]+\.[^\s]+|mailto:[^\s@]+@[^\s@]+\.[^\s@]+)$/.test(i.applyUrl.trim()) || i.applyUrl.length > 512) e.applyUrl = 'Enter an https:// link or a mailto: address.';
  }
  if (step !== 'details') {
    if (i.companyName.trim().length < 1 || i.companyName.trim().length > 80) e.companyName = 'Use 1–80 characters.';
    if (!/^https:\/\/[^\s]+\.[^\s]+$/.test(i.companyWebsite.trim())) e.companyWebsite = 'Enter a website starting with https://';
  }
  return e;
}

/** BR-84. */
export function validateService(i: ServiceInput): Record<string, string> {
  const e: Record<string, string> = {};
  if (i.title.trim().length < 10 || i.title.trim().length > 100) e.title = 'Use 10–100 characters.';
  if (i.description.trim().length < 50 || i.description.trim().length > 5000) e.description = 'Use 50–5,000 characters.';
  if (!i.categorySlug) e.categorySlug = 'Choose a category.';
  if (!Number.isInteger(i.priceCents) || i.priceCents < 500 || i.priceCents > 10_000_000) e.priceCents = 'Enter a price from $5 to $100,000.';
  if (!Number.isInteger(i.deliveryDays) || i.deliveryDays < 1 || i.deliveryDays > 90) e.deliveryDays = 'Delivery is 1–90 days.';
  if (!Number.isInteger(i.revisions) || i.revisions < 0 || i.revisions > 10) e.revisions = 'Use 0–10 revisions.';
  return e;
}

export const formatPrice = (cents: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100);

/** "3h ago", "2d ago", then a date. */
export function timeAgo(iso: string, nowMs = Date.now()): string {
  const s = Math.max(0, Math.floor((nowMs - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(iso));
}
