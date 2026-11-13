// T-33 v1.2 supplementary checks: A11Y-09 reduced transparency, A11Y-12 zoom + text spacing, A11Y-06 focus not obscured
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = process.argv[2];
const srv = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': f.endsWith('.css') ? 'text/css' : 'text/html' }); fs.createReadStream(f).pipe(r); });
(async () => {
  await new Promise(r => srv.listen(0, '127.0.0.1', r)); const URL = `http://127.0.0.1:${srv.address().port}/preview/index.html`;
  const b = await chromium.launch({ channel: 'chrome' }); const out = {};
  // A11Y-09 via CDP media-feature emulation
  { const p = await b.newPage({ viewport: { width: 1440, height: 900 } }); const cdp = await p.context().newCDPSession(p);
    await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }] });
    await p.goto(URL, { waitUntil: 'networkidle' });
    out.reducedTransparency = await p.evaluate(() => ({ mediaMatches: matchMedia('(prefers-reduced-transparency: reduce)').matches,
      surfaces: ['.ui-header', '.ui-menu', '.ui-modal', '.ui-drawer', '.ui-toast'].map(s => { const c = getComputedStyle(document.querySelector(s)); return [s, c.backgroundColor, c.backdropFilter]; }) }));
    await p.close(); }
  // A11Y-12: 200% zoom ≈ 720 CSS px viewport at 1440 device px; plus WCAG 1.4.12 text-spacing override
  for (const [name, w] of [['zoom200@1440', 720], ['textspacing@390', 390], ['textspacing@1440', 1440]]) {
    const p = await b.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: name.startsWith('zoom') ? 2 : 1 });
    await p.goto(URL, { waitUntil: 'networkidle' });
    if (name.startsWith('textspacing')) await p.addStyleTag({ content: '* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }' });
    await p.waitForTimeout(300);
    out[name] = await p.evaluate(() => {
      const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
      // clipped text: element with overflow hidden whose scrollHeight exceeds clientHeight (excluding intentional single-line ellipsis)
      const clipped = [...document.querySelectorAll('button, a, label, p, span, h1, h2, h3')].filter(e => e.offsetParent && !e.closest('.visually-hidden') && e.children.length === 0 && e.textContent.trim()).filter(e => { const c = getComputedStyle(e); return c.overflow === 'hidden' && c.textOverflow !== 'ellipsis' && e.scrollHeight > e.clientHeight + 1; }).map(e => e.textContent.trim().slice(0, 30));
      return { overflow, clipped };
    });
    await p.close();
  }
  // A11Y-06: tab through the page; no focused element may sit under the sticky header
  { const p = await b.newPage({ viewport: { width: 1440, height: 900 } }); await p.goto(URL, { waitUntil: 'networkidle' });
    const obscured = []; let n = 0;
    for (let i = 0; i < 140; i++) { await p.keyboard.press('Tab'); n++;
      const r = await p.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return null; const h = document.querySelector('.ui-header').getBoundingClientRect().bottom; const b = e.getBoundingClientRect(); if (e.closest('.ui-header') || e.classList.contains('skip-link')) return null; return b.bottom > 0 && b.top < h ? (e.getAttribute('aria-label') || e.textContent).trim().slice(0, 30) : null; });
      if (r) obscured.push(r); }
    out.focusNotObscured = { tabStops: n, obscured }; await p.close(); }
  console.log(JSON.stringify(out, null, 1)); await b.close(); srv.close();
})();
