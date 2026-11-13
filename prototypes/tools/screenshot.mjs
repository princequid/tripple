// P06-04 prototype screenshot harness (T-18 smoke).
// One command: `npm run shots` (from prototypes/tools). Optional: `npm run shots -- r1/scr-02` to filter, `--axe` for axe-core.
// For every page under prototypes/r1|r2|r3 (plus index.html) and every state in its <meta name="proto-states">,
// takes a full-page screenshot at 1440/1280/1024/768/390/360 and runs layout checks.
// Output: docs/08-testing/design/screenshots/prototypes/<page>/<state>-<width>.png + report.json
// Exit code 1 if any check fails.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..', '..');
const PROTO = path.join(REPO, 'prototypes');
const OUT = path.join(REPO, 'docs', '08-testing', 'design', 'screenshots', 'prototypes');
const WIDTHS = [[1440, 900, false], [1280, 800, false], [1024, 800, false], [768, 1024, true], [390, 844, true], [360, 780, true]];
const args = process.argv.slice(2);
const useAxe = args.includes('--axe');
const filter = args.find(a => !a.startsWith('--'));

const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
const server = http.createServer((req, res) => {
  const file = path.join(REPO, decodeURIComponent(req.url.split('?')[0]));
  if (!file.startsWith(REPO) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': mime[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

const listPages = () => {
  const pages = ['index.html'];
  for (const rel of ['r1', 'r2', 'r3']) {
    const dir = path.join(PROTO, rel);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).sort()) if (f.endsWith('.html')) pages.push(`${rel}/${f}`);
  }
  return pages.filter(p => !filter || p.includes(filter));
};

const pageChecks = () => {
  const vis = e => e.offsetParent !== null || getComputedStyle(e).position === 'fixed';
  const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
  const small = [...document.querySelectorAll('button, a, input, select, [role=switch], [role=radio], [role=tab]')]
    .filter(e => vis(e) && !e.closest('[aria-hidden=true], .px-table') && !e.matches('.text-link, .ui-shot-card__link, .ui-shot-card__author, .ui-otp__input, .ui-icon-btn--sm, .skip-link'))
    .map(e => { const r = e.getBoundingClientRect(); let h = r.height; const b = getComputedStyle(e, '::before'); if (b.content !== 'none' && b.position === 'absolute') h += 2 * Math.max(0, -parseFloat(b.top) || 0); return { label: (e.getAttribute('aria-label') || e.textContent).trim().replace(/\s+/g, ' ').slice(0, 40), w: Math.round(r.width), h: Math.round(h) }; })
    .filter(x => x.w < 44 || x.h < 44);
  const raisedOnGlass = [...document.querySelectorAll('.glass-subtle *, .glass-panel *, .glass-modal *')].filter(vis)
    .filter(e => getComputedStyle(e).boxShadow.split(/,(?![^(]*\))/).some(p => /84, 70, 76/.test(p) && !/inset/.test(p)))
    .map(e => String(e.className).slice(0, 60));
  return { overflow, small, raisedOnGlass };
};

(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}/prototypes/`;
  const browser = await chromium.launch({ channel: 'chrome' });
  const pages = listPages();
  const report = { date: new Date().toISOString(), widths: WIDTHS.map(w => w[0]), pages: {}, failures: [] };
  const indexHtml = fs.readFileSync(path.join(PROTO, 'index.html'), 'utf8');

  for (const pagePath of pages) {
    if (pagePath !== 'index.html' && !indexHtml.includes(`href="${pagePath}"`)) report.failures.push(`${pagePath}: not linked from prototypes/index.html`);
    const html = fs.readFileSync(path.join(PROTO, pagePath), 'utf8');
    const statesMeta = html.match(/<meta name="proto-states" content="([^"]+)"/);
    const states = statesMeta ? statesMeta[1].trim().split(/\s+/) : ['default'];
    const outDir = path.join(OUT, pagePath.replace(/\.html$/, ''));
    fs.rmSync(outDir, { recursive: true, force: true }); fs.mkdirSync(outDir, { recursive: true });
    report.pages[pagePath] = {};
    for (const state of states) {
      for (const [w, h, mobile] of WIDTHS) {
        const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: mobile, isMobile: mobile });
        const p = await ctx.newPage(); const errors = [];
        p.on('pageerror', e => errors.push(e.message));
        p.on('response', r => { if (r.status() >= 400 && !r.url().includes('/favicon')) errors.push(`${r.status()} ${r.url()}`); });
        p.on('requestfailed', r => errors.push(`FAILED ${r.url()}`));
        await p.goto(`${base}${pagePath}?state=${encodeURIComponent(state)}`, { waitUntil: 'networkidle' });
        await p.waitForTimeout(300);
        const c = await p.evaluate(pageChecks);
        await p.screenshot({ path: path.join(outDir, `${state}-${w}.png`), fullPage: true });
        let axe;
        if (useAxe && (w === 1440 || w === 390)) {
          await p.addScriptTag({ path: require.resolve('axe-core') });
          axe = await p.evaluate(async () => (await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } })).violations.map(v => `${v.id} (${v.nodes.length})`));
        }
        // axe's CSSOM preloader re-requests @imports relative to the page; those 404s are a tool artefact.
        // Only ignored on axe runs, so a real broken stylesheet still fails the plain run.
        const pageErrors = axe ? errors.filter(e => !/\/prototypes\/(.*\/)?(styles|components)\/[^/]+\.css$/.test(e)) : errors;
        report.pages[pagePath][`${state}@${w}`] = { ...c, errors: pageErrors, ...(axe ? { axe } : {}) };
        const id = `${pagePath} [${state}] @${w}`;
        if (c.overflow > 0) report.failures.push(`${id}: horizontal overflow ${c.overflow}px`);
        if (c.small.length) report.failures.push(`${id}: targets < 44px: ${c.small.map(s => s.label).join(', ')}`);
        if (c.raisedOnGlass.length) report.failures.push(`${id}: raised neumorphism inside glass`);
        if (pageErrors.length) report.failures.push(`${id}: ${pageErrors.join('; ')}`);
        if (axe && axe.length) report.failures.push(`${id}: axe ${axe.join(', ')}`);
        await ctx.close();
      }
    }
    console.log(`✓ ${pagePath}: ${states.length} state(s) × ${WIDTHS.length} widths`);
  }
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 1));
  await browser.close(); server.close();
  const shots = Object.values(report.pages).reduce((n, s) => n + Object.keys(s).length, 0);
  console.log(`\n${pages.length} page(s), ${shots} screenshots → ${path.relative(REPO, OUT)}`);
  if (report.failures.length) { console.error(`\n${report.failures.length} failure(s):\n- ` + report.failures.join('\n- ')); process.exit(1); }
  console.log('All checks passed.');
})();
