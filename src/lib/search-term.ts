/**
 * BR-38: the search term is URL-decoded, trimmed, whitespace collapsed, lower-cased and truncated to 100.
 * Operator syntax is treated as plain text. The canonical URL uses this normalised form.
 */
export function normaliseSearchTerm(raw: string): string {
  let v = raw;
  try {
    v = decodeURIComponent(raw);
  } catch {
    /* keep raw */
  }
  return v.replace(/\s+/g, ' ').trim().toLowerCase().slice(0, 100).trim();
}

export const searchPath = (term: string) => `/search/${encodeURIComponent(term).replace(/%20/g, '-')}`;

/** Path segments use "-" for spaces (readable URLs); hyphenated words still search as words. */
export function termFromSegment(segment: string): string {
  let v = segment;
  try {
    v = decodeURIComponent(segment);
  } catch {
    /* keep */
  }
  return normaliseSearchTerm(v.replace(/-/g, ' '));
}

/**
 * Builds a safe FTS5 MATCH expression (ADR-001 rule 5): every token is double-quoted (quotes inside are
 * doubled), so operators and syntax characters are plain text. The last token gets a prefix `*` when it has
 * at least 2 characters (BR-39). Returns null when nothing searchable remains.
 */
export function toFtsQuery(term: string): string | null {
  const tokens = term
    .split(/[^\p{L}\p{N}]+/u)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 12);
  if (tokens.length === 0) return null;
  return tokens
    .map((t, i) => {
      const quoted = `"${t.replace(/"/g, '""')}"`;
      return i === tokens.length - 1 && t.length >= 2 ? `${quoted}*` : quoted;
    })
    .join(' ');
}
