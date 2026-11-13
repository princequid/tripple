/**
 * Mock fixtures. People and teams mirror the deterministic R1 seed (scripts/seed.ts), so mock screens link to
 * real profiles. Companies, jobs and services are fictional and original (BR-87). Nothing here is rendered
 * directly: only the mock store reads it.
 */
import type { PersonRef } from '../contracts';

export type FixturePerson = PersonRef & { headline: string; location: string; skills: string[]; available: boolean };

const p = (id: number, username: string, displayName: string, headline: string, location: string, skills: string[], available = true): FixturePerson => ({
  id,
  username,
  displayName,
  avatarKey: null,
  isTeam: false,
  isFeaturedStudio: false,
  headline,
  location,
  skills,
  available,
});

export const PEOPLE: FixturePerson[] = [
  p(1, 'ines-moreau', 'Inès Moreau', 'Product designer crafting calm finance tools', 'Lyon, France', ['Product design', 'UX', 'Design systems']),
  p(2, 'kofi-asante', 'Kofi Asante', 'Brand and type designer', 'Accra, Ghana', ['Branding', 'Typography', 'Logo design']),
  p(3, 'mei-tanaka', 'Mei Tanaka', 'Illustrator who draws small worlds', 'Osaka, Japan', ['Illustration', 'Editorial', 'Character design']),
  p(4, 'lucas-brandt', 'Lucas Brandt', 'Motion designer and animator', 'Hamburg, Germany', ['Animation', 'Motion', 'After Effects'], false),
  p(5, 'priya-nair', 'Priya Nair', 'Mobile UX lead', 'Bengaluru, India', ['Mobile', 'UX research', 'Prototyping']),
  p(6, 'tomas-silva', 'Tomás Silva', 'Web designer for independent shops', 'Porto, Portugal', ['Web design', 'Webflow', 'E-commerce']),
  p(7, 'amara-okafor', 'Amara Okafor', 'Print and editorial designer', 'Lagos, Nigeria', ['Print', 'Editorial', 'Layout'], false),
  p(8, 'jonah-fields', 'Jonah Fields', 'Design systems at heart', 'Toronto, Canada', ['Design systems', 'UI', 'Figma']),
  p(9, 'sofia-lind', 'Sofia Lind', 'Packaging and identity', 'Malmö, Sweden', ['Packaging', 'Branding', 'Identity']),
  p(10, 'rafael-ortiz', 'Rafael Ortiz', 'Interfaces for health and care', 'Bogotá, Colombia', ['Product design', 'Accessibility', 'UI']),
  p(11, 'hana-kim', 'Hana Kim', 'Lettering and type experiments', 'Seoul, South Korea', ['Lettering', 'Typography', 'Illustration']),
  p(12, 'demo', 'Demo Member', 'Seed account for trying the product', 'Remote', ['Product design']),
];

export const TEAMS: (FixturePerson & { members: { username: string; role: 'owner' | 'admin' | 'member' }[] })[] = [
  {
    ...p(13, 'northfield', 'Northfield Studio', 'A small product studio', 'Lyon, France', ['Product design', 'Web design', 'Mobile']),
    isTeam: true,
    isFeaturedStudio: true,
    members: [
      { username: 'ines-moreau', role: 'owner' },
      { username: 'priya-nair', role: 'member' },
      { username: 'jonah-fields', role: 'member' },
    ],
  },
  {
    ...p(14, 'paper-harbor', 'Paper Harbor', 'Print, packaging and identity collective', 'Lagos, Nigeria', ['Print', 'Packaging', 'Branding']),
    isTeam: true,
    members: [
      { username: 'amara-okafor', role: 'owner' },
      { username: 'sofia-lind', role: 'member' },
    ],
  },
];

export const ALL_PROFILES: FixturePerson[] = [...PEOPLE, ...TEAMS];

export { SPECIALTIES, SERVICE_CATEGORIES } from '../reference';

const para = (...xs: string[]) => xs.map((x) => `<p>${x}</p>`).join('');

export const JOB_SEEDS = [
  {
    title: 'Senior Product Designer',
    company: 'Lumen Ledger',
    site: 'https://example.com/lumen-ledger',
    location: 'Berlin, Germany',
    workplace: 'hybrid',
    specialty: 'product',
    employment: 'full-time',
    days: 1,
    owner: 'ines-moreau',
  },
  { title: 'Brand Designer (contract)', company: 'Tidewater Tea Co.', site: 'https://example.com/tidewater', location: '', workplace: 'remote', specialty: 'brand-graphic', employment: 'freelance-contract', days: 2, owner: 'kofi-asante' },
  { title: 'Illustrator for a picture book series', company: 'Small Hours Press', site: 'https://example.com/small-hours', location: 'Osaka, Japan', workplace: 'remote', specialty: 'illustration', employment: 'freelance-contract', days: 3, owner: 'mei-tanaka' },
  { title: 'Motion Designer', company: 'Orbit Audio', site: 'https://example.com/orbit-audio', location: 'Hamburg, Germany', workplace: 'on-site', specialty: 'animation', employment: 'full-time', days: 4, owner: 'lucas-brandt' },
  { title: 'Lead Mobile Designer', company: 'Fernway Transit', site: 'https://example.com/fernway', location: 'Bengaluru, India', workplace: 'hybrid', specialty: 'mobile', employment: 'full-time', days: 6, owner: 'priya-nair' },
  { title: 'Web Designer for a coffee roaster', company: 'Ember & Bean', site: 'https://example.com/ember-bean', location: 'Porto, Portugal', workplace: 'remote', specialty: 'web', employment: 'freelance-contract', days: 8, owner: 'tomas-silva' },
  { title: 'Design Systems Designer', company: 'Quarry Cloud', site: 'https://example.com/quarry', location: 'Toronto, Canada', workplace: 'remote', specialty: 'ui-visual', employment: 'full-time', days: 10, owner: 'jonah-fields' },
  { title: 'UX Researcher and Designer', company: 'Carewell Health', site: 'https://example.com/carewell', location: 'Bogotá, Colombia', workplace: 'hybrid', specialty: 'ux', employment: 'full-time', days: 13, owner: 'rafael-ortiz' },
  { title: 'Head of Design', company: 'Northwind Labs', site: 'https://example.com/northwind', location: 'London, United Kingdom', workplace: 'on-site', specialty: 'leadership', employment: 'full-time', days: 16, owner: 'sofia-lind' },
  { title: 'Packaging Designer', company: 'Field & Fold', site: 'https://example.com/field-fold', location: 'Malmö, Sweden', workplace: 'on-site', specialty: 'brand-graphic', employment: 'freelance-contract', days: 21, owner: 'amara-okafor' },
  { title: 'Product Designer, Payments', company: 'Pocketmint', site: 'https://example.com/pocketmint', location: 'Lisbon, Portugal', workplace: 'remote', specialty: 'product', employment: 'full-time', days: 34, owner: 'hana-kim' },
] as const;

export const jobDescription = (title: string, company: string) =>
  `<h2>About the role</h2>${para(
    `${company} is looking for a ${title.toLowerCase()} to join a small, thoughtful team. You will own work from the first sketch to the shipped detail, and you will spend real time with the people who use it.`,
  )}<h2>What you will do</h2><ul><li>Shape new features with product and engineering from day one.</li><li>Prototype quickly and test with real users every sprint.</li><li>Care for the details: states, motion, copy and accessibility.</li></ul><h2>What we look for</h2><ul><li>A portfolio that shows how you think, not only the final screens.</li><li>Clear writing and calm collaboration.</li><li>Three or more years of relevant experience.</li></ul>${para(
    'We offer flexible hours, a learning budget and a generous equipment allowance.',
  )}`;

export const SERVICE_SEEDS = [
  { seller: 'kofi-asante', title: 'A distinctive logo and wordmark for your business', category: 'logo-design', price: 45000, days: 7, revisions: 3, includes: ['Three initial concepts', 'Vector source files', 'Mini usage guide'] },
  { seller: 'sofia-lind', title: 'Complete brand identity for small product companies', category: 'brand-identity', price: 180000, days: 21, revisions: 2, includes: ['Logo system', 'Colour and type', 'Brand guidelines PDF', 'Social templates'] },
  { seller: 'tomas-silva', title: 'A five-page website for an independent shop', category: 'web-design', price: 120000, days: 14, revisions: 2, includes: ['Responsive design', 'Desktop and mobile mockups', 'Developer handoff'] },
  { seller: 'priya-nair', title: 'Mobile app UX audit with prioritised fixes', category: 'mobile-app', price: 65000, days: 5, revisions: 1, includes: ['Heuristic review', 'Annotated screens', 'Prioritised action list'] },
  { seller: 'mei-tanaka', title: 'Custom editorial illustration', category: 'illustration', price: 35000, days: 6, revisions: 2, includes: ['One full-colour illustration', 'Print and web sizes', 'Commercial licence'] },
  { seller: 'lucas-brandt', title: 'Animated logo reveal (5–8 seconds)', category: 'animation', price: 40000, days: 5, revisions: 2, includes: ['MP4 and Lottie export', 'Two style directions', 'Sound-ready timing'] },
  { seller: 'amara-okafor', title: 'Packaging design for one product line', category: 'print', price: 95000, days: 18, revisions: 3, includes: ['Dieline layout', 'Print-ready files', 'Mockup renders'] },
  { seller: 'ines-moreau', title: 'Product design sprint for a finance feature', category: 'web-design', price: 250000, days: 10, revisions: 1, includes: ['Kick-off workshop', 'Clickable prototype', 'Usability test summary'] },
  { seller: 'hana-kim', title: 'Hand lettering for a headline or logotype', category: 'logo-design', price: 30000, days: 4, revisions: 2, includes: ['Two sketches', 'Vectorised final', 'Transparent PNG'] },
  { seller: 'jonah-fields', title: 'Starter design system in Figma', category: 'web-design', price: 160000, days: 15, revisions: 2, includes: ['Tokens and styles', '30 core components', 'Documentation page'] },
] as const;

export const COMMENT_LINES = [
  'The spacing here is so calm. Lovely work.',
  'Really like how the colour carries the hierarchy.',
  'Great attention to the small states. What did you use for the icons?',
  'This makes me want to redo my own dashboard.',
  'Beautiful palette. The muted accent is perfect.',
  'Clean and readable. Nice job on the type scale.',
  'How did you test this with users?',
  'The composition is so balanced!',
] as const;

export const SEARCH_VOCABULARY = [
  'dashboard', 'landing page', 'mobile', 'illustration', 'branding', 'logo', 'typography', 'poster', 'saas', 'fintech',
  'ecommerce', 'animation', 'motion', 'character', 'packaging', 'editorial', 'app', 'ios', 'android', 'website', 'ui', 'ux',
  'data visualization', 'lettering', 'identity', 'layout', 'responsive', 'interaction', 'loop', 'print',
];
