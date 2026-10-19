import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAnalyticsData } from './useAnalyticsData';
import type { Transaction } from '../types';
import * as analyticsActions from '../actions';
import * as formatterActions from '../../csv-formatter/actions';

vi.mock('../actions', () => ({ readTabAction: vi.fn() }));
vi.mock('../../csv-formatter/actions', () => ({ getSheetTargetAction: vi.fn() }));

const readTab = vi.mocked(analyticsActions.readTabAction);
const getTarget = vi.mocked(formatterActions.getSheetTargetAction);

const HEADER = ['Date', 'Category', 'Notes', 'Account', 'Amt', 'Is Transfer'];

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

/** Local calendar date -> Google Sheets serial day number. */
function serial(date: Date): number {
  return (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(1899, 11, 30)) / 86_400_000;
}

function sheetRows(txs: Transaction[]) {
  return [
    HEADER,
    ...txs.map((t) => [serial(t.date), t.category, t.notes, t.account, t.amountSGD, false]),
  ];
}

/** Render the hook and load the given transactions through the mocked sheet actions. */
async function renderLoaded(txs: Transaction[]) {
  readTab.mockResolvedValue({ success: true, rows: sheetRows(txs) });
  const hook = renderHook(() => useAnalyticsData());
  await waitFor(() => expect(hook.result.current.tabsStatus).toBe('ready'));
  await act(async () => {
    hook.result.current.selectTab('Jan');
  });
  await waitFor(() => expect(hook.result.current.status).toBe('loaded'));
  return hook;
}

const WIDE_RANGE = { start: d(2020, 1, 1), end: d(2030, 12, 31) };

describe('useAnalyticsData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    getTarget.mockResolvedValue({ success: true, tabs: ['Jan', 'Feb'] });
  });

  it("status starts as 'idle' with no tab selected", async () => {
    const { result } = renderHook(() => useAnalyticsData());
    expect(result.current.status).toBe('idle');
    await waitFor(() => expect(result.current.tabsStatus).toBe('ready'));
    expect(result.current.selectedTab).toBeNull();
  });

  it("status becomes 'loaded' once a tab is selected and read", async () => {
    const { result } = await renderLoaded([makeTx()]);
    expect(result.current.status).toBe('loaded');
    expect(result.current.selectedTab).toBe('Jan');
    expect(result.current.transactions).toHaveLength(1);
  });

  it('derives availableAccounts sorted and deduplicated from transactions', async () => {
    const { result } = await renderLoaded([
      makeTx({ account: 'UOB' }),
      makeTx({ account: 'DBS' }),
      makeTx({ account: 'DBS' }), // duplicate
      makeTx({ account: 'OCBC' }),
    ]);
    expect(result.current.availableAccounts).toEqual(['DBS', 'OCBC', 'UOB']);
  });

  it('updates summary.totalIncome when filter period changes', async () => {
    const { result } = await renderLoaded([makeTx({ date: d(2023, 6, 1), amountSGD: 999 })]);

    // Default 'last30' excludes the 2023 transaction
    expect(result.current.summary.totalIncome).toBe(0);

    act(() => {
      result.current.setFilter({ selectedPeriod: 'custom', customDateRange: WIDE_RANGE });
    });
    expect(result.current.summary.totalIncome).toBe(999);
  });

  it('calculates netCashflow correctly', async () => {
    const { result } = await renderLoaded([
      makeTx({ category: 'salary, invoices', amountSGD: 3000 }),
      makeTx({ category: 'Food', amountSGD: -1200 }),
    ]);
    act(() => {
      result.current.setFilter({ selectedPeriod: 'custom', customDateRange: WIDE_RANGE });
    });
    expect(result.current.summary.netCashflow).toBe(1800);
  });

  it('exposes filterState and setFilter', () => {
    const { result } = renderHook(() => useAnalyticsData());
    expect(result.current.filterState.selectedPeriod).toBe('last30');
    act(() => {
      result.current.setFilter({ selectedPeriod: 'ytd' });
    });
    expect(result.current.filterState.selectedPeriod).toBe('ytd');
  });

  it("does not throw when period is 'custom' but customDateRange is null (falls back to last30)", () => {
    const { result } = renderHook(() => useAnalyticsData());
    expect(() => {
      act(() => {
        result.current.setFilter({ selectedPeriod: 'custom', customDateRange: null });
      });
    }).not.toThrow();
  });

  it('cashflowChangePct is a number when both periods have cashflow', async () => {
    const { result } = await renderLoaded([
      makeTx({ date: daysAgo(5), amountSGD: 2000 }),
      makeTx({ date: daysAgo(40), amountSGD: 1000 }),
    ]);
    expect(typeof result.current.summary.cashflowChangePct).toBe('number');
  });

  it('cashflowChangePct is null when previous period has no transactions', async () => {
    const { result } = await renderLoaded([makeTx({ date: daysAgo(5), amountSGD: 1000 })]);
    expect(result.current.summary.cashflowChangePct).toBeNull();
  });

  it('cashflowChangePct is null when previous period net cashflow is zero', async () => {
    const { result } = await renderLoaded([
      makeTx({ date: daysAgo(5), amountSGD: 1000 }),
      // Previous period: income 500, expense -500 -> netCashflow = 0
      makeTx({ date: daysAgo(40), amountSGD: 500 }),
      makeTx({ date: daysAgo(40), category: 'Food', amountSGD: -500 }),
    ]);
    expect(result.current.summary.cashflowChangePct).toBeNull();
  });

  it('cashflowChangePct is positive when current cashflow exceeds previous', async () => {
    // current: +2000, previous: +1000 -> +100%
    const { result } = await renderLoaded([
      makeTx({ date: daysAgo(5), amountSGD: 2000 }),
      makeTx({ date: daysAgo(40), amountSGD: 1000 }),
    ]);
    expect(result.current.summary.cashflowChangePct).toBeCloseTo(100);
  });

  it('cashflowChangePct is negative when current cashflow is less than previous', async () => {
    // current: +500, previous: +1000 -> -50%
    const { result } = await renderLoaded([
      makeTx({ date: daysAgo(5), amountSGD: 500 }),
      makeTx({ date: daysAgo(40), amountSGD: 1000 }),
    ]);
    expect(result.current.summary.cashflowChangePct).toBeCloseTo(-50);
  });

  describe('filters across tab changes and refresh', () => {
    it('selectTab resets selected accounts but keeps period and custom range', async () => {
      const { result } = await renderLoaded([makeTx({ account: 'DBS' }), makeTx({ account: 'UOB' })]);
      act(() => {
        result.current.setFilter({
          selectedPeriod: 'custom',
          customDateRange: WIDE_RANGE,
          selectedAccounts: ['DBS'],
        });
      });
      await act(async () => {
        result.current.selectTab('Feb');
      });
      await waitFor(() => expect(result.current.status).toBe('loaded'));
      expect(result.current.filterState.selectedAccounts).toEqual([]);
      expect(result.current.filterState.selectedPeriod).toBe('custom');
      expect(result.current.filterState.customDateRange).toEqual(WIDE_RANGE);
    });

    it('refresh keeps all filters', async () => {
      const { result } = await renderLoaded([makeTx({ account: 'DBS' }), makeTx({ account: 'UOB' })]);
      act(() => {
        result.current.setFilter({ selectedPeriod: 'ytd', selectedAccounts: ['DBS'] });
      });
      await act(async () => {
        result.current.refresh();
      });
      await waitFor(() => expect(result.current.status).toBe('loaded'));
      expect(result.current.filterState.selectedAccounts).toEqual(['DBS']);
      expect(result.current.filterState.selectedPeriod).toBe('ytd');
    });
  });
});
