import { CATEGORIES } from '@/lib/catalog';

/** Navigation model (INFORMATION_ARCHITECTURE §3) shared by the header menus, the drawer and the footer. */
export const EXPLORE = [
  { href: '/shots/popular', label: 'Popular' },
  { href: '/shots/recent', label: 'Recent' },
] as const;
export const CATEGORY_LINKS = CATEGORIES.map((c) => ({ href: `/shots/popular/${c.slug}`, label: c.name }));
export const JOBS = [
  { href: '/jobs', label: 'Browse jobs' },
  { href: '/jobs/new', label: 'Post a job (free)' },
] as const;
export const HIRE = [
  { href: '/hire', label: 'Find designers' },
  { href: '/services', label: 'Browse services' },
  { href: '/jobs/new', label: 'Post a job' },
] as const;
export const LEGAL = [
  { href: '/terms', label: 'Terms' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/cookies', label: 'Cookies' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
] as const;

/**
 * v3 header groups (A-27). The reference design's four menus, mapped onto existing destinations only
 * (no new features): Explore = feeds; Inspiration = tags; Resources = jobs and help; Community = people.
 */
export const INSPIRATION = [
  { href: '/tags', label: 'Browse all tags' },
  { href: '---', label: '' },
  { href: '/tags/dashboard', label: 'Dashboards' },
  { href: '/tags/landing-page', label: 'Landing pages' },
  { href: '/tags/illustration', label: 'Illustration' },
  { href: '/tags/branding', label: 'Branding' },
  { href: '/tags/typography', label: 'Typography' },
] as const;
export const RESOURCES = [
  { href: '/jobs', label: 'Job board' },
  { href: '/jobs/new', label: 'Post a job (free)' },
  { href: '---', label: '' },
  { href: '/about', label: 'About Trippple' },
  { href: '/contact', label: 'Contact' },
] as const;
export const COMMUNITY = [
  { href: '/hire', label: 'Find designers' },
  { href: '/services', label: 'Browse services' },
  { href: '/teams/new', label: 'Create a team' },
] as const;
