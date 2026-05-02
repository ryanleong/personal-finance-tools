import { describe, it, expect } from 'vitest';
import { resolveDateRange, resolvePreviousPeriodRange } from './periods';
import type { DateRange } from '../types';

// Helper: build a midnight-normalised Date
function d(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day);
}

// Convenience to compare two Date objects by value
function expectDate(actual: Date, expected: Date) {
  expect(actual.getTime()).toBe(expected.getTime());
}

const TODAY = d(2025, 5, 15); // 2025-05-15

describe('resolveDateRange', () => {
  // 1. 'last30' with today 2025-05-15 → start = 2025-04-15, end = 2025-05-15
  it("'last30': start is 30 days before today, end is today", () => {
    const range = resolveDateRange('last30', null, TODAY);
    expectDate(range.start, d(2025, 4, 15));
    expectDate(range.end, d(2025, 5, 15));
  });

  // 2. 'prev30' with today 2025-05-15 → start = 2025-03-16, end = 2025-04-14
  it("'prev30': start is 60 days before today, end is 31 days before today", () => {
    const range = resolveDateRange('prev30', null, TODAY);
    expectDate(range.start, d(2025, 3, 16));
    expectDate(range.end, d(2025, 4, 14));
  });

  // 3. 'currentMonth' with today 2025-05-15 → start = 2025-05-01, end = 2025-05-15
  it("'currentMonth': start is first of current month, end is today", () => {
    const range = resolveDateRange('currentMonth', null, TODAY);
    expectDate(range.start, d(2025, 5, 1));
    expectDate(range.end, d(2025, 5, 15));
  });

  // 4. 'prevMonth' with today 2025-05-15 → start = 2025-04-01, end = 2025-04-30
  it("'prevMonth': start is first of prev month, end is last of prev month", () => {
    const range = resolveDateRange('prevMonth', null, TODAY);
    expectDate(range.start, d(2025, 4, 1));
    expectDate(range.end, d(2025, 4, 30));
  });

  // 5. 'ytd' with today 2025-05-15 → start = 2025-01-01, end = 2025-05-15
  it("'ytd': start is Jan 1 of current year, end is today", () => {
    const range = resolveDateRange('ytd', null, TODAY);
    expectDate(range.start, d(2025, 1, 1));
    expectDate(range.end, d(2025, 5, 15));
  });

  // 6. 'custom' with a provided range → returns that range unchanged
  it("'custom': returns the provided customRange unchanged", () => {
    const customRange: DateRange = { start: d(2025, 2, 1), end: d(2025, 2, 28) };
    const range = resolveDateRange('custom', customRange, TODAY);
    expect(range).toBe(customRange); // same reference
  });

  // 7. Edge: 'currentMonth' on the first day of the month → start = end = that day
  it("'currentMonth': on first day of month, start equals end", () => {
    const firstOfMay = d(2025, 5, 1);
    const range = resolveDateRange('currentMonth', null, firstOfMay);
    expectDate(range.start, d(2025, 5, 1));
    expectDate(range.end, d(2025, 5, 1));
  });

  // 8. Edge: 'prevMonth' when today is 2025-01-05 → start = 2024-12-01, end = 2024-12-31
  it("'prevMonth': when today is Jan 5 wraps back to December of previous year", () => {
    const jan5 = d(2025, 1, 5);
    const range = resolveDateRange('prevMonth', null, jan5);
    expectDate(range.start, d(2024, 12, 1));
    expectDate(range.end, d(2024, 12, 31));
  });

  // 9. Edge: 'ytd' on Jan 1 → start = end = 2025-01-01
  it("'ytd': on Jan 1 start equals end", () => {
    const jan1 = d(2025, 1, 1);
    const range = resolveDateRange('ytd', null, jan1);
    expectDate(range.start, d(2025, 1, 1));
    expectDate(range.end, d(2025, 1, 1));
  });

  // 10. 'custom' with null/undefined customRange → throws
  it("'custom': throws when customRange is null", () => {
    expect(() => resolveDateRange('custom', null, TODAY)).toThrow();
  });

  it("'custom': throws when customRange is undefined", () => {
    expect(() => resolveDateRange('custom', undefined, TODAY)).toThrow();
  });
});

describe('resolvePreviousPeriodRange', () => {
  // 1. 'last30': previous range is days 60–31 before today
  it("'last30': previous range starts 60 days before today and ends 31 days before today", () => {
    const currentRange = resolveDateRange('last30', null, TODAY);
    const prev = resolvePreviousPeriodRange('last30', currentRange, TODAY);
    expectDate(prev.start, d(2025, 3, 16)); // 60 days before May 15
    expectDate(prev.end,   d(2025, 4, 14)); // 31 days before May 15
  });

  // 2. 'prev30': previous range is days 90–61 before today
  it("'prev30': previous range starts 90 days before today and ends 61 days before today", () => {
    const currentRange = resolveDateRange('prev30', null, TODAY);
    const prev = resolvePreviousPeriodRange('prev30', currentRange, TODAY);
    expectDate(prev.start, d(2025, 2, 14)); // 90 days before May 15
    expectDate(prev.end,   d(2025, 3, 15)); // 61 days before May 15
  });

  // 3. 'currentMonth': previous range is the previous calendar month
  it("'currentMonth': previous range is the full previous calendar month", () => {
    const currentRange = resolveDateRange('currentMonth', null, TODAY);
    const prev = resolvePreviousPeriodRange('currentMonth', currentRange, TODAY);
    expectDate(prev.start, d(2025, 4, 1));
    expectDate(prev.end,   d(2025, 4, 30));
  });

  // 3b. Edge: 'currentMonth' when current month is January → wraps to Dec of prior year
  it("'currentMonth': wraps to December of previous year when today is January", () => {
    const jan5 = d(2025, 1, 5);
    const currentRange = resolveDateRange('currentMonth', null, jan5);
    const prev = resolvePreviousPeriodRange('currentMonth', currentRange, jan5);
    expectDate(prev.start, d(2024, 12, 1));
    expectDate(prev.end,   d(2024, 12, 31));
  });

  // 4. 'prevMonth': previous range is two calendar months ago
  it("'prevMonth': previous range is two calendar months ago", () => {
    const currentRange = resolveDateRange('prevMonth', null, TODAY);
    const prev = resolvePreviousPeriodRange('prevMonth', currentRange, TODAY);
    expectDate(prev.start, d(2025, 3, 1));
    expectDate(prev.end,   d(2025, 3, 31));
  });

  // 5. 'ytd': previous range is Jan 1 to same day in prior year
  it("'ytd': previous range is Jan 1 to same calendar day in prior year", () => {
    const currentRange = resolveDateRange('ytd', null, TODAY);
    const prev = resolvePreviousPeriodRange('ytd', currentRange, TODAY);
    expectDate(prev.start, d(2024, 1, 1));
    expectDate(prev.end,   d(2024, 5, 15));
  });

  // 6. 'custom': equal-length window immediately before currentRange.start
  it("'custom': previous range is equal-length window immediately before current range", () => {
    const customRange: DateRange = { start: d(2025, 4, 1), end: d(2025, 4, 30) }; // 30 days
    const prev = resolvePreviousPeriodRange('custom', customRange, TODAY);
    expectDate(prev.start, d(2025, 3, 2));  // Mar 2 (30 days before Apr 1)
    expectDate(prev.end,   d(2025, 3, 31)); // Mar 31 (day before Apr 1)
  });

  // 6b. Edge: 'custom' single-day range → previous is the day before
  it("'custom': single-day range → previous is the day before", () => {
    const customRange: DateRange = { start: d(2025, 5, 10), end: d(2025, 5, 10) };
    const prev = resolvePreviousPeriodRange('custom', customRange, TODAY);
    expectDate(prev.start, d(2025, 5, 9));
    expectDate(prev.end,   d(2025, 5, 9));
  });
});
