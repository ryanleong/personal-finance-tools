import type { DateRange } from '../types';

export type AverageUnit = 'day' | 'month' | 'year';

export interface AveragingBasis {
  unit: AverageUnit;
  /** How many `unit`s the range spans; divide a total by this to get the average. */
  count: number;
}

const MS_PER_DAY = 86_400_000;
const DAYS_PER_MONTH = 30.4375; // 365.25 / 12, only for the leftover part-month

function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / MS_PER_DAY);
}

/**
 * Pick the unit an average is expressed in: per day under 2 calendar months,
 * per month from 2 months, per year from 12 months. Range ends are inclusive.
 */
export function getAveragingBasis(range: DateRange): AveragingBasis {
  const start = new Date(range.start.getFullYear(), range.start.getMonth(), range.start.getDate());
  const endExclusive = new Date(range.end.getFullYear(), range.end.getMonth(), range.end.getDate() + 1);

  const wholeMonths =
    (endExclusive.getFullYear() - start.getFullYear()) * 12 +
    (endExclusive.getMonth() - start.getMonth()) -
    (endExclusive.getDate() < start.getDate() ? 1 : 0);

  if (wholeMonths < 2) return { unit: 'day', count: daysBetween(start, endExclusive) };

  // Anchor = start + wholeMonths, clamped so e.g. 31 Jan + 1 month is 28 Feb, not 3 Mar.
  const lastDayOfAnchorMonth = new Date(start.getFullYear(), start.getMonth() + wholeMonths + 1, 0).getDate();
  const anchor = new Date(
    start.getFullYear(),
    start.getMonth() + wholeMonths,
    Math.min(start.getDate(), lastDayOfAnchorMonth),
  );
  const months = wholeMonths + daysBetween(anchor, endExclusive) / DAYS_PER_MONTH;

  return wholeMonths >= 12 ? { unit: 'year', count: months / 12 } : { unit: 'month', count: months };
}
