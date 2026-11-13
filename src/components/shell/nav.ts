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
