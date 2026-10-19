import { describe, it, expect } from 'vitest';
import { getAveragingBasis } from './averaging';

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);

describe('getAveragingBasis', () => {
  it('uses days, counted inclusively, for ranges under 2 months', () => {
    expect(getAveragingBasis({ start: d(2025, 5, 1), end: d(2025, 5, 31) })).toEqual({ unit: 'day', count: 31 });
    expect(getAveragingBasis({ start: d(2025, 5, 6), end: d(2025, 5, 6) })).toEqual({ unit: 'day', count: 1 });
  });

  it('stays on days just short of 2 calendar months', () => {
    // 1 Jan to 31 Jan + 28 days of Feb is still under 2 months
    expect(getAveragingBasis({ start: d(2025, 1, 1), end: d(2025, 2, 27) })).toEqual({ unit: 'day', count: 58 });
  });

  it('switches to months at exactly 2 calendar months', () => {
    expect(getAveragingBasis({ start: d(2025, 1, 1), end: d(2025, 2, 28) })).toEqual({ unit: 'month', count: 2 });
    expect(getAveragingBasis({ start: d(2025, 1, 1), end: d(2025, 3, 31) })).toEqual({ unit: 'month', count: 3 });
  });

  it('adds a fractional month for leftover days', () => {
    const basis = getAveragingBasis({ start: d(2025, 1, 1), end: d(2025, 3, 15) });
    expect(basis.unit).toBe('month');
    expect(basis.count).toBeCloseTo(2 + 15 / 30.4375, 5);
  });

  it('handles a start day that does not exist in a later month', () => {
    const basis = getAveragingBasis({ start: d(2025, 1, 31), end: d(2025, 4, 30) });
    expect(basis.unit).toBe('month');
    expect(basis.count).toBeCloseTo(3, 0);
  });

  it('switches to years at 12 calendar months', () => {
    expect(getAveragingBasis({ start: d(2025, 1, 1), end: d(2025, 12, 31) })).toEqual({ unit: 'year', count: 1 });
    expect(getAveragingBasis({ start: d(2024, 1, 1), end: d(2025, 12, 31) })).toEqual({ unit: 'year', count: 2 });
  });

  it('stays on months just short of a year', () => {
    expect(getAveragingBasis({ start: d(2025, 1, 1), end: d(2025, 11, 30) }).unit).toBe('month');
  });
});
