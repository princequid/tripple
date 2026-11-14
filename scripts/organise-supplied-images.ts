/**
 * One-off organiser for the user's supplied images (tripple/image/{mobile,web design}) → public/images/projects/<category>/
 * with ASCII file names, plus public/images/manifest.json (titles). The source folder is not modified.
 * The user asked for the images to be shared across every category filter, so each category gets 8 images,
 * chosen by what the artwork shows. Usage: npx tsx scripts/organise-supplied-images.ts, then npm run images:apply.
 */
import fs from 'node:fs';
import path from 'node:path';

const SRC = path.join(process.cwd(), 'image');
const OUT = path.join(process.cwd(), 'public', 'images', 'projects');
const M = (f: string) => `mobile/${f}`;
const W = (f: string) => `web design/${f}`;

// [source file, title] per category. 8 each = 64 covers; the 65th becomes a second image on a web-design shot.
const PLAN: Record<string, [string, string][]> = {
  mobile: [
    [M('Create a Shopping Experience Worth Exploring with Free Ecommerce App UI Kits (1).jpg'), 'Fashion shopping app'],
    [M('Create a Shopping Experience Worth Exploring with Free Ecommerce App UI Kits.jpg'), 'E-commerce app UI kit'],
    [M('Designed a luxury hotel booking mobile app concept….jpg'), 'Luxury hotel booking app'],
    [M('Login screen.jpg'), 'Login screen'],
    [M('Luxury Real Estate Mobile App UI Design.jpg'), 'Luxury real estate app'],
    [M('Pharmacy & Madicine Mobile App.jpg'), 'Pharmacy and medicine app'],
    [M('Shopping App UI Design _ Mobile App Design.jpg'), 'Shopping app'],
    [M('1108378158348619733.jpg'), 'Smart home lighting app'],
  ],
  'product-design': [
    [M('Build Powerful Apps With AI - No Coding Required.jpg'), 'No-code AI app builder'],
    [M('Fitness Activity Tracker App – Modern Health & Wellness UI.jpg'), 'Fitness activity tracker'],
    [M('Mobile App for Finance.jpg'), 'Personal finance app'],
    [M('Money management, but make it simple__Alvero is….jpg'), 'Simple money management'],
    [M('516436282294527992.jpg'), 'Neumorphic UI component kit'],
    [W('Nexora Light Neumorphism Dashboard _ Soft UI Design.jpg'), 'Soft UI analytics dashboard'],
    [W('download (35).jpg'), 'Workspace analytics dashboard'],
    [W('1056938606324748021.jpg'), 'Clinic client dashboard'],
  ],
  'web-design': [
    [W('464363411602643168.jpg'), 'Design studio landing page'],
    [W('961377851688641821.jpg'), 'Motorcycle showcase website'],
    [W('download (36).jpg'), 'Mindfulness app landing page'],
    [W('Furniture Landing Page by Zahra Mohammadi for Pela….jpg'), 'Furniture store landing page'],
    [W('Azentos _ Modern Agency Website Design by Abdul….jpg'), 'Creative agency website'],
    [W('SaaS & Tech Startup WordPress Theme for Modern Web Projects.jpg'), 'SaaS startup website'],
    [W('design launch ready web and mobile app UI UX in figma.jpg'), 'Product launch web and app UI'],
    [W('High Conversion Landing Page Design Ideas.jpg'), 'High-conversion landing page'],
    [W('Meeting.jpg'), 'Meeting scheduler'], // 9th: second image on a web-design shot
  ],
  animation: [
    [M('AI Voice Assistant & Image Generator Mobile App UI_UX Design.jpg'), 'AI voice assistant app'],
    [M('Give Your Fitness App a Fresh Burst of Energy with Free UI Kits.jpg'), 'Energetic fitness app'],
    [M('Screen design 👩_🎨 Dashboard & Saving Goals Money….jpg'), 'Savings goals dashboard'],
    [M('Simplify Your Workflow With One Platform📌.jpg'), 'Workflow platform app'],
    [M('🌿 Glassmorphism Plant Shop Mobile App UI Design _ Modern UI_UX Inspiration _ Ecommerce App Mockup _.jpg'), 'Glassmorphism plant shop'],
    [W('Dark Website Hero Section with Slideshow Animation for Art Gallery Using Frameblox UI Kit.jpg'), 'Art gallery hero slideshow'],
    [W('Futuristic AI Landing Page — Modern UI UX Web Design in Figma & Framer.jpg'), 'Futuristic AI landing page'],
    [W('107523509849212188.jpg'), 'AI agents landing page'],
  ],
  branding: [
    [M('Coffee App Design-UIdesignz _ App design layout, Mobile app design ins.jpg'), 'Coffee ordering app'],
    [M('Luxury Perfume Shopping App UI_UX Design _ E-Commerce App.jpg'), 'Luxury perfume store'],
    [M('MOYA - Mobile App UI Design _ Premium Matcha Ordering _ Matcha Mobile App UI_UX.jpg'), 'Matcha ordering app'],
    [M('Perfume Store Mobile App Stunning Looking UI Design.jpg'), 'Perfume boutique app'],
    [M('Premium Harshal Patel Ice Cream Application Layout - OAT & MILL -.jpg'), 'Ice cream shop app'],
    [M('Soro Co_ _ Logo Design & Brand on Instagram_ __ Ad.jpg'), 'Lifestyle shop brand identity'],
    [W('Fynite Echo — Premium Headphone Landing Page….jpg'), 'Premium headphone landing page'],
    [W('New landing page of zero lifestyle _#graphicart….jpg'), 'Lifestyle brand landing page'],
  ],
  illustration: [
    [M('Kashaf maryam khan (@webdesign_786) • Instagram ph.jpg'), 'Colourful app screens'],
    [M('Plant Shopping & Care App Design _ Green Ecommerce Mobile UI.jpg'), 'Plant shopping and care app'],
    [M('Plants app design_.jpg'), 'Plant collection app'],
    [M('Vocabulary Learning Mobile App Design.jpg'), 'Vocabulary learning app'],
    [M('333829391151716598.jpg'), 'Hoodie shop app'],
    [W('Ai Have A Dream - Web Ui Design Landing Shots - Duane Levi Smith.jpg'), 'Dreamlike AI landing page'],
    [W('Hey friends, This is the _Flow With It_ Website….jpg'), 'Flow wellness website'],
    [W('Minimalistic Design 😍.jpg'), 'Minimal product website'],
  ],
  typography: [
    [M('Mobile UI Design_ Principles for User Experiences in 2025 _.jpg'), 'Mobile UI principles'],
    [M('UI_UX Design Trends_ What to Expect in 2024 _ Sky Rye Design.jpg'), 'Design trends type study'],
    [W('Ultra-Premium Dark Mode Landing Page UI _ Hero Section Design.jpg'), 'Premium dark hero section'],
    [W('520025088246643877.jpg'), 'Spring summer collection website'],
    [W('948500371534844967.jpg'), 'Editorial about page'],
    [W('Портфолио.jpg'), 'Personal portfolio website'],
    [W('Дизайн сайта _ Web design _ Заказать сайт _ Сайт на Tilda.jpg'), 'Studio website hero'],
    [W('30 Cool Neumorphism UI Design Examples – Bashooka.jpg'), 'Neumorphic interface study'],
  ],
  print: [
    [M('Instagram (4).jpg'), 'Skincare store app'],
    [M('💗.jpg'), 'Pink audio store app'],
    [M('Original Designs.jpg'), 'Shopping assistant app'],
    [M('Жми на перейти, чтоб посмотреть портфолио и заказать разработку сайта.jpg'), 'Fitness and wellness screens'],
    [M('1097822846712996171.jpg'), 'Headphone store app'],
    [M('Mobile App UI_UX Design Services for Startups _ Fiverr.jpg'), 'Startup app showcase'],
    [M('Telecom App Dashboard Design with Balance, Data & Recharge UI.jpg'), 'Telecom balance and data app'],
    [W('About Us - Photography WordPress Theme.jpg'), 'Photography studio about page'],
  ],
};

const slug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const manifestPath = path.join(process.cwd(), 'public', 'images', 'manifest.json');
const manifest: Record<string, { title: string }> = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {};
const used = new Set<string>();
let n = 0;
for (const [cat, items] of Object.entries(PLAN)) {
  fs.mkdirSync(path.join(OUT, cat), { recursive: true });
  for (const [i, [src, title]] of items.entries()) {
    const from = path.join(SRC, src);
    if (!fs.existsSync(from)) throw new Error(`Missing source image: ${src}`);
    if (used.has(src)) throw new Error(`Used twice: ${src}`);
    used.add(src);
    const name = `${String(i + 1).padStart(2, '0')}-${slug(title)}.jpg`;
    fs.copyFileSync(from, path.join(OUT, cat, name));
    manifest[`projects/${cat}/${name}`] = { title };
    n++;
  }
}
const all = ['mobile', 'web design'].flatMap((d) => fs.readdirSync(path.join(SRC, d)).map((f) => `${d}/${f}`));
const unused = all.filter((f) => !used.has(f));
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`Organised ${n} images into ${Object.keys(PLAN).length} categories. Unused: ${unused.length ? unused.join(', ') : 'none'}.`);
