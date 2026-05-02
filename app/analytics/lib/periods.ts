import type { TimePeriod, DateRange } from '../types';

/** Subtract n days from date and return a midnight-normalised Date. */
function subtractDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - n);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Normalise a Date to local midnight (strips time component). */
function normalise(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Resolve a TimePeriod + optional customRange to a concrete DateRange.
 *
 * @param period       - The selected time period key.
 * @param customRange  - Required when period === 'custom'; ignored otherwise.
 * @param today        - Injectable for testing; defaults to new Date().
 */
export function resolveDateRange(
  period: TimePeriod,
  customRange?: DateRange | null,
  today?: Date,
): DateRange {
  const base = normalise(today ?? new Date());

  switch (period) {
    case 'last30':
      return { start: subtractDays(base, 30), end: base };

    case 'prev30':
      return { start: subtractDays(base, 60), end: subtractDays(base, 31) };

    case 'currentMonth':
      return {
        start: new Date(base.getFullYear(), base.getMonth(), 1),
        end: base,
      };

    case 'prevMonth': {
      const year = base.getMonth() === 0 ? base.getFullYear() - 1 : base.getFullYear();
      const month = base.getMonth() === 0 ? 11 : base.getMonth() - 1;
      const start = new Date(year, month, 1);
      // Last day of prevMonth: day 0 of the current month
      const end = new Date(base.getFullYear(), base.getMonth(), 0);
      return { start, end };
    }

    case 'ytd':
      return {
        start: new Date(base.getFullYear(), 0, 1),
        end: base,
      };

    case 'custom':
      if (customRange == null) {
        throw new Error("resolveDateRange: customRange must be provided when period is 'custom'");
      }
      return customRange;
  }
}

/**
 * Given the current TimePeriod and its resolved DateRange, returns the DateRange
 * for the equivalent prior period.
 *
 * @param period       - The selected time period key.
 * @param currentRange - The already-resolved range for that period.
 * @param today        - Injectable for testing; defaults to new Date().
 */
export function resolvePreviousPeriodRange(
  period: TimePeriod,
  currentRange: DateRange,
  today?: Date,
): DateRange {
  const base = normalise(today ?? new Date());

  switch (period) {
    case 'last30':
      return { start: subtractDays(base, 60), end: subtractDays(base, 31) };

    case 'prev30':
      return { start: subtractDays(base, 90), end: subtractDays(base, 61) };

    case 'currentMonth': {
      const curStart = normalise(currentRange.start);
      const prevYear = curStart.getMonth() === 0 ? curStart.getFullYear() - 1 : curStart.getFullYear();
      const prevMonth = curStart.getMonth() === 0 ? 11 : curStart.getMonth() - 1;
      return {
        start: new Date(prevYear, prevMonth, 1),
        // day 0 of curStart's month = last day of previous month
        end: new Date(curStart.getFullYear(), curStart.getMonth(), 0),
      };
    }

    case 'prevMonth': {
      // currentRange.start is the 1st of prevMonth; go back one more month
      const prevStart = normalise(currentRange.start);
      const twoAgoYear = prevStart.getMonth() === 0 ? prevStart.getFullYear() - 1 : prevStart.getFullYear();
      const twoAgoMonth = prevStart.getMonth() === 0 ? 11 : prevStart.getMonth() - 1;
      return {
        start: new Date(twoAgoYear, twoAgoMonth, 1),
        end: new Date(prevStart.getFullYear(), prevStart.getMonth(), 0),
      };
    }

    case 'ytd': {
      const prevYear = base.getFullYear() - 1;
      return {
        start: new Date(prevYear, 0, 1),
        end: new Date(prevYear, base.getMonth(), base.getDate()),
      };
    }

    case 'custom': {
      const start = normalise(currentRange.start);
      const end = normalise(currentRange.end);
      const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const prevEnd = subtractDays(start, 1);
      const prevStart = subtractDays(prevEnd, duration - 1);
      return { start: prevStart, end: prevEnd };
    }
  }
}
