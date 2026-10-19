import { describe, it, expect } from 'vitest';
import { toSheetRows } from './sheet-rows';

const row = (description: string, amount = 1, date = '25/12/2024') => ({ date, description, amount });

describe('toSheetRows', () => {
  it('returns empty array for empty input', () => {
    expect(toSheetRows([])).toEqual([]);
  });

  it('emits 5 columns with blank Category and Account', () => {
    expect(toSheetRows([row('Coffee', -4.5)])).toEqual([['25/12/2024', '', 'Coffee', '', '-4.50']]);
  });

  it.each(['=SUM(A1)', '+1', '-1', '@cmd'])('prefixes %j with a quote', (d) => {
    expect(toSheetRows([row(d)])[0][2]).toBe(`'${d}`);
  });

  it('trims leading tab/CR so no prefix is needed', () => {
    expect(toSheetRows([row('\tx'), row('\rx')]).map((r) => r[2])).toEqual(['x', 'x']);
  });

  it('still prefixes a formula char exposed by stripping control characters', () => {
    expect(toSheetRows([row('\x00=cmd')])[0][2]).toBe("'=cmd");
  });

  it('removes newlines and control characters', () => {
    expect(toSheetRows([row('a\nb\x00c\x07d')])[0][2]).toBe('a bcd');
  });

  it('formats amounts to 2dp and non-finite to 0.00', () => {
    const out = toSheetRows([row('a', 1), row('b', 1.005 * 100), row('c', NaN), row('d', Infinity)]);
    expect(out.map((r) => r[4])).toEqual(['1.00', '100.50', '0.00', '0.00']);
  });

  it('strips disallowed characters from the date', () => {
    expect(toSheetRows([row('a', 1, '=25/12/2024x')])[0][0]).toBe('25/12/2024');
  });
});
