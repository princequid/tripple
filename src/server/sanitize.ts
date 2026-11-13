import 'server-only';
import sanitizeHtml from 'sanitize-html';

/**
 * BR-72 job descriptions: server-side allow-list sanitising on every write. Allowed: p, br, h2, h3, strong,
 * em, ul, ol, li, a (href https: or mailto: only; rel and target forced). The editor's "H1" maps to h2 (one
 * h1 per page); b/i map to strong/em. Everything else — scripts, styles, attributes, images — is removed.
 */
export function sanitizeJobHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ['p', 'br', 'h2', 'h3', 'strong', 'em', 'ul', 'ol', 'li', 'a'],
    allowedAttributes: { a: ['href', 'rel', 'target'] },
    allowedSchemes: ['https', 'mailto'],
    allowedSchemesAppliedToAttributes: ['href'],
    allowProtocolRelative: false,
    disallowedTagsMode: 'discard',
    transformTags: {
      h1: 'h2',
      h4: 'h3',
      h5: 'h3',
      h6: 'h3',
      b: 'strong',
      i: 'em',
      div: 'p',
      a: sanitizeHtml.simpleTransform('a', { rel: 'nofollow noopener noreferrer', target: '_blank' }),
    },
    exclusiveFilter: (frame) => frame.tag === 'a' && !frame.attribs.href,
  }).trim();
}

/** Plain text of (already sanitised) HTML: for the 50–20,000 character rule (BR-71) and keyword search (BR-75). */
export function htmlToText(html: string): string {
  return sanitizeHtml(html.replace(/<\/(p|h2|h3|li)>|<br\s*\/?>/gi, '$& '), { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
