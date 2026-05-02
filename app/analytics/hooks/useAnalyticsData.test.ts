import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAnalyticsData } from './useAnalyticsData';
import type { Transaction } from '../types';

// Mock storage so IDB doesn't run in jsdom
vi.mock('../lib/storage', () => ({
  loadTransactions: vi.fn().mockResolvedValue(null),
  saveTransactions: vi.fn().mockResolvedValue(undefined),
  clearTransactions: vi.fn().mockResolvedValue(undefined),
}));

function d(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day);
}

/** Returns a midnight-normalised date N days before today. */
function daysAgo(n: number): Date {
  const base = new Date();
  base.setDate(base.getDate() - n);
  return new Date(base.getFullYear(), base.getMonth(), base.getDate());
}

function makeTx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    date: d(2025, 5, 15),
    category: 'salary, invoices',
    notes: '',
    account: 'DBS',
    amountSGD: 1000,
    ...overrides,
  };
}

describe('useAnalyticsData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. status starts as 'empty'
  it("status starts as 'empty'", () => {
    const { result } = renderHook(() => useAnalyticsData());
    expect(result.current.status).toBe('empty');
  });

  // 2. After setTransactions([...]), status becomes 'loaded'
  it("status becomes 'loaded' after setTransactions is called", () => {
    const { result } = renderHook(() => useAnalyticsData());
    act(() => {
      result.current.setTransactions([makeTx()]);
    });
    expect(result.current.status).toBe('loaded');
  });

  // 3. availableAccounts is derived from loaded transactions (sorted, deduplicated)
  it('derives availableAccounts sorted and deduplicated from transactions', () => {
    const { result } = renderHook(() => useAnalyticsData());
    act(() => {
      result.current.setTransactions([
        makeTx({ account: 'UOB' }),
        makeTx({ account: 'DBS' }),
        makeTx({ account: 'DBS' }), // duplicate
        makeTx({ account: 'OCBC' }),
      ]);
    });
    expect(result.current.availableAccounts).toEqual(['DBS', 'OCBC', 'UOB']);
  });

  // 4. summary.totalIncome updates when setFilter changes the period
  it('updates summary.totalIncome when filter period changes', () => {
    // Income tx on 2025-01-15 (inside ytd but inside last30 only if today is nearby)
    // We use a date that is definitely in 'ytd' but NOT in 'last30' relative to today
    // Today in tests is whatever real today is, so use a far-past date
    const pastTx = makeTx({ date: d(2023, 6, 1), category: 'salary, invoices', amountSGD: 999 });
    const { result } = renderHook(() => useAnalyticsData());
    act(() => {
      result.current.setTransactions([pastTx]);
    });

    // With default 'last30', the 2023 tx is outside range → totalIncome = 0
    expect(result.current.summary.totalIncome).toBe(0);

    // Switch to 'ytd' — still won't include 2023 in 2025-ytd, so let's use 'custom' with wide range
    act(() => {
      result.current.setFilter({
        selectedPeriod: 'custom',
        customDateRange: { start: d(2020, 1, 1), end: d(2030, 12, 31) },
      });
    });
    expect(result.current.summary.totalIncome).toBe(999);
  });

  // 5. summary.netCashflow is correct
  it('calculates netCashflow correctly', () => {
    const incomeTx = makeTx({ category: 'salary, invoices', amountSGD: 3000 });
    const expenseTx = makeTx({ category: 'Food', amountSGD: -1200 });
    const { result } = renderHook(() => useAnalyticsData());
    act(() => {
      result.current.setTransactions([incomeTx, expenseTx]);
      result.current.setFilter({
        selectedPeriod: 'custom',
        customDateRange: { start: d(2020, 1, 1), end: d(2030, 12, 31) },
      });
    });
    expect(result.current.summary.netCashflow).toBe(1800);
  });

  // 6. filterState and setFilter are exposed
  it('exposes filterState and setFilter', () => {
    const { result } = renderHook(() => useAnalyticsData());
    expect(result.current.filterState.selectedPeriod).toBe('last30');
    act(() => {
      result.current.setFilter({ selectedPeriod: 'ytd' });
    });
    expect(result.current.filterState.selectedPeriod).toBe('ytd');
  });

  // 7. custom period with null customDateRange falls back to last30 range (no throw)
  it("does not throw when period is 'custom' but customDateRange is null (falls back to last30)", () => {
    const { result } = renderHook(() => useAnalyticsData());
    expect(() => {
      act(() => {
        result.current.setFilter({ selectedPeriod: 'custom', customDateRange: null });
      });
    }).not.toThrow();
  });

  // 8. cashflowChangePct is a number when both current and previous periods have cashflow
  it('cashflowChangePct is a number when both periods have cashflow', () => {
    const { result } = renderHook(() => useAnalyticsData());
    act(() => {
      result.current.setTransactions([
        makeTx({ date: daysAgo(5), category: 'salary, invoices', amountSGD: 2000 }),
        makeTx({ date: daysAgo(40), category: 'salary, invoices', amountSGD: 1000 }),
      ]);
      result.current.setFilter({ selectedPeriod: 'last30' });
    });
    expect(typeof result.current.summary.cashflowChangePct).toBe('number');
  });

  // 9. cashflowChangePct is null when previous period has no transactions
  it('cashflowChangePct is null when previous period has no transactions', () => {
    const { result } = renderHook(() => useAnalyticsData());
    act(() => {
      result.current.setTransactions([
        makeTx({ date: daysAgo(5), category: 'salary, invoices', amountSGD: 1000 }),
        // no transactions in days 31-60
      ]);
      result.current.setFilter({ selectedPeriod: 'last30' });
    });
    expect(result.current.summary.cashflowChangePct).toBeNull();
  });

  // 10. cashflowChangePct is null when previous period has zero net cashflow (income == expenses)
  it('cashflowChangePct is null when previous period net cashflow is zero', () => {
    const { result } = renderHook(() => useAnalyticsData());
    act(() => {
      result.current.setTransactions([
        makeTx({ date: daysAgo(5), category: 'salary, invoices', amountSGD: 1000 }),
        // Previous period: income 500, expense -500 → netCashflow = 0
        makeTx({ date: daysAgo(40), category: 'salary, invoices', amountSGD: 500 }),
        makeTx({ date: daysAgo(40), category: 'Food', amountSGD: -500 }),
      ]);
      result.current.setFilter({ selectedPeriod: 'last30' });
    });
    expect(result.current.summary.cashflowChangePct).toBeNull();
  });

  // 11. cashflowChangePct is positive when current cashflow > previous
  it('cashflowChangePct is positive when current cashflow exceeds previous', () => {
    // current: +2000, previous: +1000 → (2000-1000)/1000*100 = +100%
    const { result } = renderHook(() => useAnalyticsData());
    act(() => {
      result.current.setTransactions([
        makeTx({ date: daysAgo(5), category: 'salary, invoices', amountSGD: 2000 }),
        makeTx({ date: daysAgo(40), category: 'salary, invoices', amountSGD: 1000 }),
      ]);
      result.current.setFilter({ selectedPeriod: 'last30' });
    });
    expect(result.current.summary.cashflowChangePct).toBeCloseTo(100);
  });

  // 12. cashflowChangePct is negative when current cashflow < previous
  it('cashflowChangePct is negative when current cashflow is less than previous', () => {
    // current: +500, previous: +1000 → (500-1000)/1000*100 = -50%
    const { result } = renderHook(() => useAnalyticsData());
    act(() => {
      result.current.setTransactions([
        makeTx({ date: daysAgo(5), category: 'salary, invoices', amountSGD: 500 }),
        makeTx({ date: daysAgo(40), category: 'salary, invoices', amountSGD: 1000 }),
      ]);
      result.current.setFilter({ selectedPeriod: 'last30' });
    });
    expect(result.current.summary.cashflowChangePct).toBeCloseTo(-50);
  });
});
