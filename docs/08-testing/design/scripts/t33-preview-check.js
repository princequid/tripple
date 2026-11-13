// T-33 v1.2 — design foundation preview validation (extends the 2026-11-12 harness)
// Usage: node ds-preview2.js <outDir> <design-system root>
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const http = require('http');
const OUT = process.argv[2]; const ROOT = process.argv[3];
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript' };
const srv = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': mime[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); });

const pageChecks = () => {
  const vis = e => e.offsetParent !== null || getComputedStyle(e).position === 'fixed';
  // 1. target sizes (a ::before hit-area extension counts)
  const small = [...document.querySelectorAll('button, a, input, [role=switch], [role=radio]')].filter(e => vis(e) && !e.closest('[aria-hidden=true]')).map(e => {
    const r = e.getBoundingClientRect(); let h = r.height;
    const b = getComputedStyle(e, '::before'); if (b.content !== 'none' && b.position === 'absolute') h += 2 * Math.max(0, -parseFloat(b.top) || 0);
    return { t: (e.getAttribute('aria-label') || e.textContent || e.className).trim().replace(/\s+/g, ' ').slice(0, 30), w: Math.round(r.width), h: Math.round(h), cls: String(e.className).slice(0, 50) };
  }).filter(x => (x.h < 44 || x.w < 44) && !/ui-shot-card__link|text-link|ui-shot-card__author|ui-otp__input|ui-icon-btn--sm/.test(x.cls));
  // 2. raised (outer) neumorphic shadow inside any glass layer
  const raisedOnGlass = [...document.querySelectorAll('.glass-subtle *, .glass-panel *, .glass-modal *')].filter(vis).filter(e => {
    const s = getComputedStyle(e).boxShadow; return s !== 'none' && s.split(/,(?![^(]*\))/).some(p => /84, 70, 76/.test(p) && !/inset/.test(p));
  }).map(e => String(e.className).slice(0, 60));
  // 3. text colours permitted per glass level (COLOR_SYSTEM §7)
  const P = 'rgb(37, 35, 38)', SEC = 'rgb(112, 106, 112)', ACC = 'rgb(179, 38, 62)', DAN = 'rgb(154, 52, 18)', DIS = 'rgb(150, 144, 150)'; // identity v2 (A-16)
  const bad = []; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (w.nextNode()) {
    const n = w.currentNode; if (!n.textContent.trim()) continue; const el = n.parentElement;
    if (!vis(el) || el.closest('.visually-hidden, [aria-hidden=true], script, style')) continue;
    const g = el.closest('.glass-subtle, .glass-panel, .glass-modal'); if (!g) continue;
    if (el.closest('.ui-btn--primary, .ui-btn--on-glass, .ui-input, .ui-share-row, .ui-content-block, .ui-avatar, .ui-badge')) continue; // opaque fills: checked against their own fill in T-15
    const c = getComputedStyle(el).color; const lvl = g.classList.contains('glass-modal') ? 'modal' : g.classList.contains('glass-panel') ? 'panel' : 'subtle';
    const ok = lvl === 'modal' ? [P, SEC, ACC, DAN, DIS] : [P, DIS];
    if (!ok.includes(c)) bad.push({ lvl, c, t: n.textContent.trim().slice(0, 30) });
  }
  return { small, raisedOnGlass, glassText: bad };
};

(async () => {
  await new Promise(res => srv.listen(0, '127.0.0.1', res)); const URL = `http://127.0.0.1:${srv.address().port}/preview/index.html`;
  const b = await chromium.launch({ channel: 'chrome' }); fs.mkdirSync(OUT, { recursive: true });
  const results = {};
  for (const [name, wd, ht, mobile] of [['1440', 1440, 900, false], ['1280', 1280, 800, false], ['1024', 1024, 800, false], ['768', 768, 1024, true], ['390', 390, 844, true], ['360', 360, 780, true]]) {
    const ctx = await b.newContext({ viewport: { width: wd, height: ht }, deviceScaleFactor: 1, hasTouch: mobile, isMobile: mobile });
    const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', e => errs.push(e.message)); p.on('requestfailed', r => errs.push('FAILED ' + r.url())); p.on('response', r => { if (r.status() >= 400) errs.push(r.status() + ' ' + r.url()); });
    await p.goto(URL, { waitUntil: 'networkidle' }); await p.waitForTimeout(600);
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    const c = await p.evaluate(pageChecks);
    await p.screenshot({ path: path.join(OUT, `preview-${name}.png`), fullPage: true });
    let axe = null;
    if (['1440', '1024', '390'].includes(name)) {
      await p.addScriptTag({ path: require.resolve('axe-core') });
      axe = await p.evaluate(async () => { const r = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } }); return { version: axe.version, violations: r.violations.map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length, help: v.help, targets: v.nodes.slice(0, 4).map(n => n.target.join(' ')) })), passes: r.passes.length, incomplete: r.incomplete.map(v => v.id) }; });
    }
    results[name] = { overflow, ...c, errors: errs, axe };
    await ctx.close();
  }
  { const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }); const p = await ctx.newPage(); await p.goto(URL, { waitUntil: 'networkidle' });
    results.reducedMotion = await p.evaluate(() => ({ skeletonDuration: getComputedStyle(document.querySelector('.ui-skeleton')).animationDuration, spinnerIterations: getComputedStyle(document.querySelector('.ui-spinner')).animationIterationCount })); await ctx.close(); }
  { const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, forcedColors: 'active' }); const p = await ctx.newPage(); await p.goto(URL, { waitUntil: 'networkidle' });
    await p.screenshot({ path: path.join(OUT, 'preview-1440-forced-colors.png'), fullPage: true });
    results.forcedColors = await p.evaluate(() => { const sel = ['.ui-btn--primary', '.ui-btn--ghost', '.ui-btn--on-glass', '.ui-chip', '.ui-pill', '.ui-segmented__item', '.ui-input', '.ui-switch__track', '.ui-radio__dot', '.ui-pill[aria-current="page"]', '.ui-input[aria-invalid="true"]'];
      return Object.fromEntries(sel.map(s => { const e = document.querySelector(s); const cs = e && getComputedStyle(e); return [s, cs ? `${cs.borderTopWidth} ${cs.borderTopStyle}` : 'missing']; })); });
    await ctx.close(); }
  { const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage(); await p.goto(URL, { waitUntil: 'networkidle' }); const r = {};
    const like = p.locator('.ui-like--labelled').first(); await like.click(); r.likeAfterClick = await like.getAttribute('aria-pressed');
    await p.click('#filters-toggle'); r.panelHiddenAfterToggle = await p.evaluate(() => document.getElementById('filter-panel').hidden);
    await p.locator('.ui-shot-card').first().locator('.ui-like').focus(); await p.waitForTimeout(350);
    r.cardBarOpacityOnKeyboardFocus = await p.evaluate(() => getComputedStyle(document.querySelector('.ui-shot-card .ui-shot-card__bar')).opacity);
    await p.keyboard.press('Tab'); await p.keyboard.press('Shift+Tab');
    r.focusRing = await p.evaluate(() => { const c = getComputedStyle(document.activeElement); return `${c.outlineStyle} ${c.outlineWidth} ${c.outlineColor}`; });
    results.interaction = r; await ctx.close(); }
  fs.writeFileSync(path.join(OUT, 'preview-checks.json'), JSON.stringify(results, null, 1));
  const summary = {}; for (const [k, v] of Object.entries(results)) summary[k] = (v && 'axe' in v) ? { overflow: v.overflow, small: v.small, raisedOnGlass: v.raisedOnGlass, glassText: v.glassText, errors: v.errors, axe: v.axe && { version: v.axe.version, violations: v.axe.violations, passes: v.axe.passes, incomplete: v.axe.incomplete } } : v;
  console.log(JSON.stringify(summary, null, 1)); await b.close(); srv.close();
})();
