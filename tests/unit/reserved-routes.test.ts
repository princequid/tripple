import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { RESERVED_USERNAMES } from '@/lib/username';

/**
 * BR-20 / FRONTEND_ARCHITECTURE §4: profiles live at `/:username`, so every first-level route segment must be a
 * reserved username, or a user could claim a name that shadows (or is shadowed by) a page.
 */
function firstLevelSegments(dir: string): string[] {
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory() || e.name.startsWith('_') || e.name.startsWith('[')) continue;
    if (/^\(.+\)$/.test(e.name)) out.push(...firstLevelSegments(path.join(dir, e.name))); // route groups are transparent
    else out.push(e.name);
  }
  return out;
}

describe('reserved usernames cover every top-level route (BR-20)', () => {
  const segments = firstLevelSegments(path.join(process.cwd(), 'src', 'app'));

  it('finds the R1 routes', () => {
    expect(segments).toEqual(expect.arrayContaining(['api', 'shots', 'search', 'tags', 'login', 'signup', 'onboarding', 'terms', 'about']));
  });

  it.each(segments)('"%s" is reserved', (seg) => {
    expect(RESERVED_USERNAMES.has(seg)).toBe(true);
  });
});
