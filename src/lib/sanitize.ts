/**
 * BR-72 allow-list sanitiser (browser). The server sanitises again on every write; this copy protects rendering of
 * any HTML that reaches the client and normalises editor output before it is sent.
 * Allowed: p, br, h2, h3, strong, em, ul, ol, li, a[href=https:|mailto:] (rel/target forced). b→strong, i→em,
 * h1→h2, div→p. Everything else is unwrapped (text kept) or dropped (script/style/iframe…).
 */
const ALLOWED = new Set(['P', 'BR', 'H2', 'H3', 'STRONG', 'EM', 'UL', 'OL', 'LI', 'A']);
const RENAME: Record<string, string> = { B: 'STRONG', I: 'EM', H1: 'H2', DIV: 'P' };
const DROP = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'TEMPLATE', 'SVG', 'MATH', 'NOSCRIPT', 'FORM', 'INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'IMG', 'VIDEO', 'AUDIO']);

export function sanitizeHtml(html: string): string {
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') return escapeText(html.replace(/<[^>]*>/g, ' '));
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
  const out = document.createElement('div');
  const walk = (from: Node, to: Node) => {
    from.childNodes.forEach((n) => {
      if (n.nodeType === Node.TEXT_NODE) return to.appendChild(document.createTextNode(n.textContent ?? ''));
      if (n.nodeType !== Node.ELEMENT_NODE) return;
      const el = n as Element;
      if (DROP.has(el.tagName)) return;
      const tag = RENAME[el.tagName] ?? el.tagName;
      if (!ALLOWED.has(tag)) return walk(el, to);
      const copy = document.createElement(tag.toLowerCase());
      if (tag === 'A') {
        const href = (el.getAttribute('href') ?? '').trim();
        if (!/^(https:\/\/|mailto:)/i.test(href)) return walk(el, to);
        copy.setAttribute('href', href);
        copy.setAttribute('rel', 'nofollow noopener noreferrer');
        copy.setAttribute('target', '_blank');
      }
      to.appendChild(copy);
      walk(el, copy);
    });
  };
  walk(doc.body, out);
  return out.innerHTML.replace(/<p><\/p>/g, '').trim();
}

export const escapeText = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
