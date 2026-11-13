/**
 * BR-28: counts are abbreviated and truncated (never rounded up).
 * 0–999 as is · 1,000–9,999 one decimal + k · 10,000–999,999 whole k · 1m–9.99m one decimal + m · above: whole m.
 */
export function formatCount(n: number): string {
  const v = Math.max(0, Math.floor(n));
  const trunc1 = (x: number) => {
    const t = Math.floor(x * 10) / 10;
    return Number.isInteger(t) ? String(t) : t.toFixed(1);
  };
  if (v < 1_000) return String(v);
  if (v < 10_000) return `${trunc1(v / 1_000)}k`;
  if (v < 1_000_000) return `${Math.floor(v / 1_000)}k`;
  if (v < 10_000_000) return `${trunc1(v / 1_000_000)}m`;
  return `${Math.floor(v / 1_000_000)}m`;
}

/** Full number for assistive technology (BR-28). */
export const formatCountLong = (n: number) => new Intl.NumberFormat('en-US').format(Math.max(0, Math.floor(n)));

export function formatDate(d: Date | string | number): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(d),
  );
}

export function formatMonthYear(d: Date | string | number): string {
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(d));
}
