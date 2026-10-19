import { describe, it, expect } from 'vitest';
import { fingerprintRows, existingFingerprints } from './fingerprint';

const row = (date: string, description: string, amount: string) => [date, '', description, '', amount];

describe('fingerprintRows', () => {
  it('gives identical rows in one file different fingerprints', () => {
    const [a, b] = fingerprintRows([row('05/01/2024', 'Coffee', '-4.50'), row('05/01/2024', 'Coffee', '-4.50')]);
    expect(a).not.toBe(b);
  });

  it('is stable for the same row and its occurrence number', () => {
    const first = fingerprintRows([row('05/01/2024', 'Coffee', '-4.50')]);
    const again = fingerprintRows([row('06/01/2024', 'Lunch', '-9.00'), row('05/01/2024', 'Coffee', '-4.50')]);
    expect(again[1]).toBe(first[0]);
  });

  it('ignores category/account cells and amount formatting', () => {
    const [a] = fingerprintRows([['05/01/2024', 'Food', 'Coffee', 'Visa', '-4.50']]);
    const [b] = fingerprintRows([['05/01/2024', '', 'Coffee', '', -4.5]]);
    expect(a).toBe(b);
  });

  it('returns 16 hex characters', () => {
    expect(fingerprintRows([row('05/01/2024', 'Coffee', '-4.50')])[0]).toMatch(/^[0-9a-f]{16}$/);
  });
});

describe('existingFingerprints', () => {
  it('uses the stored fingerprint when column H is set', () => {
    const set = existingFingerprints([[...row('05/01/2024', 'Coffee', '-4.50'), '', '', 'abc123']]);
    expect(set.has('abc123')).toBe(true);
  });

  it('computes one for legacy rows without column H', () => {
    const [fp] = fingerprintRows([row('05/01/2024', 'Coffee', '-4.50')]);
    expect(existingFingerprints([row('05/01/2024', 'Coffee', '-4.5')]).has(fp)).toBe(true);
  });

  it('flags a re-imported file as duplicates but a third coffee as new', () => {
    const file = [row('05/01/2024', 'Coffee', '-4.50'), row('05/01/2024', 'Coffee', '-4.50')];
    const stored = fingerprintRows(file).map((fp, i) => [...file[i], '', '', fp]);
    const existing = existingFingerprints(stored);
    const next = fingerprintRows([...file, row('05/01/2024', 'Coffee', '-4.50')]);
    expect(next.map((fp) => existing.has(fp))).toEqual([true, true, false]);
  });
});
