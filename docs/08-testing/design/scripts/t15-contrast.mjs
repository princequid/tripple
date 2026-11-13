// T-15 v2.1 token contrast validation — identity v2.1 (A-16 + A-17: brightened crimson, white background, tints re-derived, no gradients).
// WCAG 2.x relative luminance. Usage: node t15-contrast.mjs  (exit code 1 if any REQUIRED pair fails)
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const toHex = rgb => '#' + rgb.map(v => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();
const lin = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const lum = rgb => 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const over = (fg, a, bg) => fg.map((v, i) => Math.round(a * v + (1 - a) * bg[i])); // sRGB alpha compositing (browser default)

// ---------- Palette: approved (A-16) + derived/proposed (D-26) — mirrors design-tokens.css ----------
const P = {
  // approved
  'primary': '#DF2F4D', 'primary-deep': '#B3263E', 'primary-hover': '#B3263E', 'primary-light': '#FCEEF1', 'primary-border': '#F5C1CA',
  'bg': '#FFFFFF', 'surface': '#FFFFFF', 'bg2': '#F2F0F0', 'bg3': '#EAE7E8',
  'text': '#252326', 'text-secondary': '#706A70', 'muted': '#969096', 'border': '#E7E1E3',
  'lavender': '#8D7AB8', 'sage': '#829889', 'gold': '#C69A55',
  // derived / proposed (D-26)
  'primary-pressed': '#941D33', 'hover-tint': '#FBE2E6',
  'lavender-subtle': '#EEEBF4', 'sage-subtle': '#ECF0ED', 'gold-subtle': '#F6F0E6',
  'danger': '#9A3412', 'danger-subtle': '#F8EEEA', 'success': '#556359', 'success-subtle': '#ECF0ED',
  'white': '#FFFFFF',
};
const WARM_SHADOW = { rgb: [84, 70, 76], a: 0.16 }; // --color-neu-dark (reference only)

// ---------- Glass: white tint at alpha over the backdrop; modals and drawer over the charcoal scrim ----------
const G = { subtle: 0.80, panel: 0.88, modal: 0.94, scrim: hex(P.text), scrimA: 0.48 };
const backdrops = { 'bg': hex(P.bg), 'white media': [255, 255, 255], 'black media (worst)': [0, 0, 0] };
const S = {};
for (const [n, b] of Object.entries(backdrops)) {
  S[`glass-subtle/${n}`] = over([255, 255, 255], G.subtle, b);
  S[`glass-panel/${n}`] = over([255, 255, 255], G.panel, b);
  const scrimmed = over(G.scrim, G.scrimA, b);
  S[`scrim/${n}`] = scrimmed;
  S[`glass-modal/${n}`] = over([255, 255, 255], G.modal, scrimmed);
  S[`drawer/${n}`] = over([255, 255, 255], G.panel, scrimmed); // panel glass over the scrim (C06)
}
for (const k of Object.keys(P)) if (!S[k]) S[k] = hex(P[k]);
const glassAll = Object.keys(S).filter(k => /^(glass-|drawer)/.test(k));
const subtleW = glassAll.filter(k => k.startsWith('glass-subtle'));
const panelW = glassAll.filter(k => k.startsWith('glass-panel'));
const modalW = glassAll.filter(k => k.startsWith('glass-modal'));
const drawerW = glassAll.filter(k => k.startsWith('drawer'));
const pageSurfaces = ['bg', 'surface', 'bg2', 'primary-light'];

// ---------- Required pairs (kind: text 4.5, large 3 (≥ 24 px), ui 3 (icons, rings, boundaries)) ----------
const pairs = [];
const add = (fg, bgs, kind, use) => bgs.forEach(b => pairs.push({ fg, bg: b, kind, use }));
add('text', [...pageSurfaces, 'bg3', 'hover-tint', 'lavender-subtle', 'sage-subtle', 'gold-subtle', 'danger-subtle', 'success-subtle'], 'text', 'Primary text and labels on every surface and tinted fill');
add('text-secondary', pageSurfaces, 'text', 'Secondary text, metadata, placeholders, hints (not on bg3)');
add('primary-deep', ['bg', 'surface', 'bg2', 'bg3', 'primary-light', 'hover-tint'], 'text', 'Links, selected labels (pills, segments, chips, accent badge): deep crimson');
add('primary', ['bg', 'surface'], 'text', 'Bright crimson heading emphasis on white (4.51)');
add('white', ['primary', 'primary-hover', 'primary-pressed'], 'text', 'Primary button label default / hover / pressed; skip link; notification count');
add('danger', ['bg', 'surface', 'bg2', 'danger-subtle'], 'text', 'Error messages and field errors');
add('success', ['bg', 'surface', 'bg2', 'success-subtle'], 'text', 'Success messages');
// Glass text (permitted content per level)
add('text', glassAll, 'text', 'Primary text on every glass level at worst-case backdrops');
add('primary-deep', [...panelW, ...modalW, ...drawerW], 'text', 'Deep crimson text allowed on panel, modal and drawer glass');
add('text-secondary', modalW, 'text', 'Secondary text in modals only');
add('danger', modalW, 'text', 'Field errors in modals (auth gate)');
// Non-text (WCAG 1.4.11)
add('primary-deep', [...pageSurfaces, 'bg3', ...glassAll], 'ui', 'Focus ring, selected ring, nav underline/bar, check icon, spinner arc, liked heart stroke');
add('primary', ['bg', 'surface', 'bg2', 'primary-light'], 'ui', 'Bright fills vs surface: primary button, switch-on track, radio fill, liked heart fill, notification dot, state icon');
add('text-secondary', ['bg', 'surface', 'bg2', 'bg3'], 'ui', 'Control boundary (radio, switch-off, checkbox), field icons');
add('text-secondary', [...panelW, ...modalW, ...drawerW], 'ui', 'Secondary icons on panel/modal/drawer glass (not on subtle glass)');
add('text', glassAll, 'ui', 'Icons on glass');
add('white', ['primary', 'primary-hover'], 'ui', 'Switch thumb, radio dot, white check icon on primary, busy spinner on primary');
add('danger', ['bg', 'surface', 'bg2', ...panelW, ...modalW], 'ui', 'Error icon, invalid-field ring');
add('success', ['bg', 'surface', 'bg2', ...panelW, ...modalW], 'ui', 'Success icon (toasts, alerts)');
add('lavender', ['bg', 'surface'], 'ui', 'Supporting lavender icon/illustration accent (optional)');
add('sage', ['bg', 'surface'], 'ui', 'Supporting sage icon accent (optional)');

const thr = { text: 4.5, large: 3, ui: 3 };
let fails = 0; const rows = []; const failed = [];
for (const p of pairs) {
  const f = S[p.fg]; const b = S[p.bg]; const r = ratio(f, b); const ok = r >= thr[p.kind];
  if (!ok) { fails++; failed.push(`${p.fg} on ${p.bg} = ${r.toFixed(2)}`); }
  rows.push(`| ${p.fg} \`${toHex(f)}\` | ${p.bg} \`${toHex(b)}\` | ${p.kind} | ${thr[p.kind]} | ${r.toFixed(2)} | ${ok ? 'PASS' : 'FAIL'} | ${p.use} |`);
}

// ---------- Reference pairs: decorative, exempt or FORBIDDEN (documented, not relied on) ----------
const ref = [
  ['border', 'bg', 'Decorative hairline only'], ['primary-border', 'bg', 'Decorative edge of primary-light elements only'],
  ['primary-border', 'primary-light', 'Decorative edge (badge outline)'],
  ['muted', 'bg', 'Disabled text only (WCAG 1.4.3 exempt)'], ['muted', 'bg2', 'Disabled text only (exempt)'],
  ['gold', 'bg', 'FORBIDDEN as text or lone icon: tinted fills only'], ['gold', 'surface', 'FORBIDDEN as text or lone icon'],
  ['lavender', 'bg', 'FORBIDDEN as text (3.67): decorative / icon only'], ['sage', 'bg', 'FORBIDDEN as text (3.02): use success for text'],
  ['text-secondary', 'bg3', 'FORBIDDEN: no secondary text on the tertiary surface'],
  ['text-secondary', 'glass-subtle/black media (worst)', 'FORBIDDEN: no secondary text on subtle glass'],
  ['text-secondary', 'glass-panel/black media (worst)', 'FORBIDDEN as text on panel glass (allowed as icon ≥ 3)'],
  ['text-secondary', 'drawer/black media (worst)', 'FORBIDDEN as text in the drawer (allowed as icon ≥ 3)'],
  ['primary-deep', 'glass-subtle/black media (worst)', 'Deep crimson on subtle glass: indicator only (≥ 3), not text'],
  ['primary', 'glass-subtle/black media (worst)', 'FORBIDDEN: bright crimson on subtle glass (2.81) — indicators use deep crimson'],
  ['primary', 'primary-light', 'FORBIDDEN as text: bright crimson on its tint (selected labels use deep crimson)'],
  ['primary', 'bg2', 'FORBIDDEN as text on soft grey (use deep crimson)'],
  ['white', 'lavender', 'FORBIDDEN: white text on lavender'], ['white', 'gold', 'FORBIDDEN: white text on gold'],
  ['white', 'sage', 'FORBIDDEN: white text on sage'],
  ['danger', 'primary', 'Danger vs crimson: never adjacent as the only difference (icons and wording carry errors)'],
];
const refRows = ref.map(([f, b, u]) => `| ${f} \`${toHex(S[f])}\` | ${b} \`${toHex(S[b])}\` | ${ratio(S[f], S[b]).toFixed(2)} | ${u} |`);
const shadowOn = n => toHex(over(WARM_SHADOW.rgb, WARM_SHADOW.a, hex(P[n])));

const out = [];
out.push(`Run: ${new Date().toISOString()}  node ${process.version}`);
out.push(`Glass: tint #FFFFFF, subtle ${G.subtle}, panel ${G.panel}, modal ${G.modal}; scrim ${toHex(G.scrim)} @ ${G.scrimA}`);
out.push('\n## Effective glass colours\n| Surface / backdrop | Effective colour |\n|---|---|');
for (const k of Object.keys(S).filter(k => k.includes('/'))) out.push(`| ${k} | \`${toHex(S[k])}\` |`);
out.push('\n## Required pairs\n| Foreground | Background | Kind | Min | Ratio | Result | Use |\n|---|---|---|---|---|---|---|');
out.push(...rows);
out.push(`\nREQUIRED PAIRS CHECKED: ${pairs.length}  FAILURES: ${fails}`);
if (failed.length) out.push('FAILED: ' + failed.join('; '));
out.push('\n## Reference pairs (excluded from pass/fail)\n| Foreground | Background | Ratio | Status |\n|---|---|---|---|');
out.push(...refRows);
out.push('\n## Neumorphic shadow edge (reference; never the only cue, F-10)');
for (const n of ['bg', 'bg2']) out.push(`- warm shadow over ${n}: \`${shadowOn(n)}\` = ${ratio(hex(shadowOn(n)), hex(P[n])).toFixed(2)}:1`);
out.push('\n## Palette');
for (const [k, v] of Object.entries(P)) out.push(`- ${k}: \`${v}\` (vs bg ${ratio(hex(v), hex(P.bg)).toFixed(2)}, vs white ${ratio(hex(v), [255, 255, 255]).toFixed(2)})`);
console.log(out.join('\n'));
process.exit(fails ? 1 : 0);
