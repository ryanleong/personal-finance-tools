import { describe, it, expect } from 'vitest';
import { passwordMatches, signSession, verifySession } from './auth';

const SECRET = 'test-secret';
const NOW = 1_000_000;

describe('passwordMatches', () => {
  it('accepts the exact password', () => {
    expect(passwordMatches('hunter2', 'hunter2')).toBe(true);
  });

  it('rejects a wrong password, a different length, and empty values', () => {
    expect(passwordMatches('hunter3', 'hunter2')).toBe(false);
    expect(passwordMatches('hunter', 'hunter2')).toBe(false);
    expect(passwordMatches('', '')).toBe(false);
    expect(passwordMatches('x', undefined)).toBe(false);
  });
});

describe('session token', () => {
  it('verifies a freshly signed token', async () => {
    const token = await signSession(SECRET, NOW + 1000);
    expect(await verifySession(SECRET, token, NOW)).toBe(true);
  });

  it('rejects an expired token', async () => {
    const token = await signSession(SECRET, NOW - 1);
    expect(await verifySession(SECRET, token, NOW)).toBe(false);
  });

  it('rejects a tampered expiry or wrong secret', async () => {
    const token = await signSession(SECRET, NOW + 1000);
    const [, sig] = token.split('.');
    expect(await verifySession(SECRET, `${NOW + 999999}.${sig}`, NOW)).toBe(false);
    expect(await verifySession('other', token, NOW)).toBe(false);
  });

  it('rejects garbage, missing token, and missing secret', async () => {
    expect(await verifySession(SECRET, 'garbage', NOW)).toBe(false);
    expect(await verifySession(SECRET, undefined, NOW)).toBe(false);
    const token = await signSession(SECRET, NOW + 1000);
    expect(await verifySession(undefined, token, NOW)).toBe(false);
  });
});
