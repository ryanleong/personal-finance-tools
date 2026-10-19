import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSheetSource } from './useSheetSource';
import * as analyticsActions from '../actions';
import * as formatterActions from '../../csv-formatter/actions';

vi.mock('../actions', () => ({ readTabAction: vi.fn() }));
vi.mock('../../csv-formatter/actions', () => ({ getSheetTargetAction: vi.fn() }));

const readTab = vi.mocked(analyticsActions.readTabAction);
const getTarget = vi.mocked(formatterActions.getSheetTargetAction);

const HEADER = ['Date', 'Category', 'Notes', 'Account', 'Amt', 'Is Transfer'];

function serial(y: number, m: number, d: number): number {
  return (Date.UTC(y, m - 1, d) - Date.UTC(1899, 11, 30)) / 86_400_000;
}

/** Header plus one expense row per account name. */
function sheet(...accounts: string[]) {
  return [HEADER, ...accounts.map((a) => [serial(2025, 5, 15), 'Food', '', a, -10, false])];
}

function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

describe('useSheetSource', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    getTarget.mockResolvedValue({ success: true, tabs: ['Jan', 'Feb'] });
    readTab.mockResolvedValue({ success: true, rows: sheet('DBS') });
  });

  it('loads the tab list and selects nothing when no tab is remembered', async () => {
    const { result } = renderHook(() => useSheetSource());
    expect(result.current.tabsStatus).toBe('loading');
    await waitFor(() => expect(result.current.tabsStatus).toBe('ready'));
    expect(result.current.tabs).toEqual(['Jan', 'Feb']);
    expect(result.current.selectedTab).toBeNull();
    expect(result.current.status).toBe('idle');
    expect(readTab).not.toHaveBeenCalled();
  });

  it('auto-loads the remembered tab', async () => {
    localStorage.setItem('analytics:last-tab', 'Feb');
    const { result } = renderHook(() => useSheetSource());
    await waitFor(() => expect(result.current.status).toBe('loaded'));
    expect(readTab).toHaveBeenCalledWith('Feb');
    expect(result.current.selectedTab).toBe('Feb');
    expect(result.current.transactions).toHaveLength(1);
    expect(result.current.skippedCount).toBe(0);
  });

  it('selects nothing when the remembered tab is not in the list', async () => {
    localStorage.setItem('analytics:last-tab', 'Gone');
    const { result } = renderHook(() => useSheetSource());
    await waitFor(() => expect(result.current.tabsStatus).toBe('ready'));
    expect(result.current.selectedTab).toBeNull();
    expect(result.current.status).toBe('idle');
    expect(readTab).not.toHaveBeenCalled();
  });

  it('does not touch the csv-formatter remembered tab', async () => {
    localStorage.setItem('csv-formatter:last-tab', 'Jan');
    const { result } = renderHook(() => useSheetSource());
    await waitFor(() => expect(result.current.tabsStatus).toBe('ready'));
    expect(result.current.selectedTab).toBeNull();
  });

  it('selectTab remembers the tab, parses rows and counts skipped ones', async () => {
    readTab.mockResolvedValue({
      success: true,
      rows: [...sheet('DBS'), ['not a date', 'Food', '', 'DBS', -5, false]],
    });
    const { result } = renderHook(() => useSheetSource());
    await waitFor(() => expect(result.current.tabsStatus).toBe('ready'));
    await act(async () => {
      result.current.selectTab('Jan');
    });
    await waitFor(() => expect(result.current.status).toBe('loaded'));
    expect(result.current.transactions).toHaveLength(1);
    expect(result.current.skippedCount).toBe(1);
    expect(localStorage.getItem('analytics:last-tab')).toBe('Jan');
  });

  it('clears old data and shows loading while a new tab loads', async () => {
    const { result } = renderHook(() => useSheetSource());
    await waitFor(() => expect(result.current.tabsStatus).toBe('ready'));
    await act(async () => {
      result.current.selectTab('Jan');
    });
    await waitFor(() => expect(result.current.status).toBe('loaded'));

    const pending = deferred<Awaited<ReturnType<typeof readTab>>>();
    readTab.mockReturnValueOnce(pending.promise);
    act(() => {
      result.current.selectTab('Feb');
    });
    expect(result.current.status).toBe('loading');
    expect(result.current.transactions).toEqual([]);
    await act(async () => {
      pending.resolve({ success: true, rows: sheet('UOB') });
    });
    expect(result.current.status).toBe('loaded');
  });

  it('applies only the latest result when tabs are switched quickly', async () => {
    const { result } = renderHook(() => useSheetSource());
    await waitFor(() => expect(result.current.tabsStatus).toBe('ready'));
    const first = deferred<Awaited<ReturnType<typeof readTab>>>();
    const second = deferred<Awaited<ReturnType<typeof readTab>>>();
    readTab.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);

    act(() => {
      result.current.selectTab('Jan');
      result.current.selectTab('Feb');
    });
    await act(async () => {
      second.resolve({ success: true, rows: sheet('FEB') });
    });
    await act(async () => {
      first.resolve({ success: true, rows: sheet('JAN') });
    });
    expect(result.current.selectedTab).toBe('Feb');
    expect(result.current.transactions.map((t) => t.account)).toEqual(['FEB']);
  });

  it('refresh keeps existing data visible until the new data arrives', async () => {
    const { result } = renderHook(() => useSheetSource());
    await waitFor(() => expect(result.current.tabsStatus).toBe('ready'));
    await act(async () => {
      result.current.selectTab('Jan');
    });
    await waitFor(() => expect(result.current.status).toBe('loaded'));

    const pending = deferred<Awaited<ReturnType<typeof readTab>>>();
    readTab.mockReturnValueOnce(pending.promise);
    act(() => {
      result.current.refresh();
    });
    expect(result.current.status).toBe('loading');
    expect(result.current.transactions.map((t) => t.account)).toEqual(['DBS']);
    await act(async () => {
      pending.resolve({ success: true, rows: sheet('DBS', 'UOB') });
    });
    expect(result.current.status).toBe('loaded');
    expect(result.current.transactions).toHaveLength(2);
  });

  it('keeps existing data and sets the error when a refresh fails', async () => {
    const { result } = renderHook(() => useSheetSource());
    await waitFor(() => expect(result.current.tabsStatus).toBe('ready'));
    await act(async () => {
      result.current.selectTab('Jan');
    });
    await waitFor(() => expect(result.current.status).toBe('loaded'));

    readTab.mockResolvedValueOnce({ success: false, error: 'Sheet is busy' });
    await act(async () => {
      result.current.refresh();
    });
    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('Sheet is busy');
    expect(result.current.transactions).toHaveLength(1);
  });

  it('reports an error when the action throws', async () => {
    const { result } = renderHook(() => useSheetSource());
    await waitFor(() => expect(result.current.tabsStatus).toBe('ready'));
    readTab.mockRejectedValueOnce(new Error('network'));
    await act(async () => {
      result.current.selectTab('Jan');
    });
    expect(result.current.status).toBe('error');
    expect(result.current.error).toBeTruthy();
  });

  it('clears the previous error when a new load starts', async () => {
    const { result } = renderHook(() => useSheetSource());
    await waitFor(() => expect(result.current.tabsStatus).toBe('ready'));
    readTab.mockResolvedValueOnce({ success: false, error: 'bad' });
    await act(async () => {
      result.current.selectTab('Jan');
    });
    expect(result.current.error).toBe('bad');
    await act(async () => {
      result.current.selectTab('Feb');
    });
    expect(result.current.error).toBeNull();
    expect(result.current.status).toBe('loaded');
  });

  it('exposes a retryable tab-list failure', async () => {
    getTarget.mockResolvedValueOnce({ success: false, error: 'no sheet' });
    const { result } = renderHook(() => useSheetSource());
    await waitFor(() => expect(result.current.tabsStatus).toBe('error'));
    expect(result.current.tabs).toEqual([]);

    await act(async () => {
      result.current.retryTabs();
    });
    await waitFor(() => expect(result.current.tabsStatus).toBe('ready'));
    expect(result.current.tabs).toEqual(['Jan', 'Feb']);
  });
});
