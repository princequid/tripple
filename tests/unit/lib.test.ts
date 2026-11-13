import { describe, expect, it } from 'vitest';
import { formatCount } from '@/lib/format';
import { slugify, parseShotSegment, tagSlug, shotPath } from '@/lib/slug';
import { normaliseSearchTerm, toFtsQuery, searchPath, termFromSegment } from '@/lib/search-term';
import { safeReturnTo, parseIntent } from '@/lib/return-to';
import { checkUsernameShape, usernameBaseFromEmail, checkDisplayName } from '@/lib/username';

describe('BR-28 formatCount (truncated, never rounded up)', () => {
  it.each([
    [0, '0'], [999, '999'], [1_000, '1k'], [1_099, '1k'], [1_999, '1.9k'], [9_999, '9.9k'],
    [10_000, '10k'], [999_999, '999k'], [1_000_000, '1m'], [1_990_000, '1.9m'], [12_345_678, '12m'], [-5, '0'],
  ])('%i → %s', (n, want) => expect(formatCount(n)).toBe(want));
});

describe('BR-42 shot slugs and segments', () => {
  it('slugifies titles', () => {
    expect(slugify('  Banking Dashboard — Dark Mode! ')).toBe('banking-dashboard-dark-mode');
    expect(slugify('Café UI')).toBe('cafe-ui');
    expect(slugify('!!!')).toBe('shot');
    expect(slugify('a'.repeat(120)).length).toBeLessThanOrEqual(80);
  });
  it('parses /shots/:id-:slug segments', () => {
    expect(parseShotSegment('42-banking-app')).toEqual({ id: 42, slug: 'banking-app' });
    expect(parseShotSegment('42')).toEqual({ id: 42, slug: '' });
    expect(parseShotSegment('abc-x')).toBeNull();
    expect(parseShotSegment('0-x')).toBeNull();
    expect(shotPath(7, 'x-y')).toBe('/shots/7-x-y');
  });
  it('BR-40 tag slugs', () => expect(tagSlug('  Mobile  App ')).toBe('mobile-app'));
});

describe('BR-38/39 search term handling', () => {
  it('normalises', () => {
    expect(normaliseSearchTerm('  Mobile%20APP   ux ')).toBe('mobile app ux');
    expect(normaliseSearchTerm('x'.repeat(150)).length).toBe(100);
  });
  it('path round trip', () => {
    expect(searchPath('mobile app')).toBe('/search/mobile-app');
    expect(termFromSegment('mobile-app')).toBe('mobile app');
  });
  it('quotes every token so FTS operators are plain text (ADR-001)', () => {
    expect(toFtsQuery('dash')).toBe('"dash"*');
    expect(toFtsQuery('a OR b')).toBe('"a" "OR" "b"');
    expect(toFtsQuery('title:x NEAR(y) "z')).toBe('"title" "x" "NEAR" "y" "z"');
    expect(toFtsQuery('---')).toBeNull();
  });
});

describe('BR-14 returnTo allow-list and BR-15 intents', () => {
  it.each([
    ['/shots/1-x', '/shots/1-x'],
    ['/search/a?x=1', '/search/a?x=1'],
    ['https://evil.example', '/'],
    ['//evil.example', '/'],
    ['/\\evil', '/'],
    ['/login', '/'],
    ['/onboarding?x', '/'],
    ['/api/auth/x', '/'],
    [null, '/'],
    ['%2F%2Fevil.example', '/'],
  ])('%s → %s', (raw, want) => expect(safeReturnTo(raw as string | null)).toBe(want));
  it('intents', () => {
    expect(parseIntent('like-shot')).toBe('like-shot');
    expect(parseIntent('drop-tables')).toBeNull();
  });
});

describe('BR-18…22 usernames and display names', () => {
  it.each([
    ['ann', null], ['ann-lee_2', null], ['ab', 'invalid'], ['12345', 'invalid'], ['-ann', 'invalid'], ['ann--x', 'invalid'],
    ['Ann', 'invalid'], ['shots', 'reserved'], ['login', 'reserved'], ['design-jobs-in-paris', 'reserved'],
  ])('%s → %s', (name, want) => expect(checkUsernameShape(name)).toBe(want));
  it('suggests a base from the email local part (BR-21)', () => {
    expect(usernameBaseFromEmail('Ann.Lee+x@example.test')).toBe('annleex');
    expect(usernameBaseFromEmail('12@x.test')).toBe('12d'); // padded to 3, already not all digits
    expect(usernameBaseFromEmail('12345@x.test')).toBe('u12345'); // all digits get a letter prefix
    expect(checkUsernameShape(usernameBaseFromEmail('12345@x.test'))).toBeNull();
    expect(checkUsernameShape(usernameBaseFromEmail('a@x.test'))).toBeNull();
  });
  it('display names', () => {
    expect(checkDisplayName('  Ann  ')).toBeNull();
    expect(checkDisplayName('   ')).not.toBeNull();
    expect(checkDisplayName('x'.repeat(51))).not.toBeNull();
    expect(checkDisplayName('a\u0007b')).not.toBeNull();
  });
});
