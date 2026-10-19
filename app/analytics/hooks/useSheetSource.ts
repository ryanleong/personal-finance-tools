import { useState, useEffect, useCallback, useRef } from 'react';
import type { Transaction } from '../types';
import { readTabAction } from '../actions';
import { getSheetTargetAction } from '../../csv-formatter/actions';
import { useLastTab } from '../../csv-formatter/hooks/useLastTab';
import { parseSheetRows } from '../lib/sheetParser';

export type SheetSourceStatus = 'idle' | 'loading' | 'loaded' | 'error';
export type TabsStatus = 'loading' | 'ready' | 'error';

export interface UseSheetSourceReturn {
  tabs: string[];
  tabsStatus: TabsStatus;
  selectedTab: string | null;
  status: SheetSourceStatus;
  transactions: Transaction[];
  skippedCount: number;
  error: string | null;
  selectTab: (tab: string) => void;
  refresh: () => void;
  retryTabs: () => void;
}

const READ_FAILED = 'Could not read the sheet. Try again.';

export function useSheetSource(initialTransactions?: Transaction[]): UseSheetSourceReturn {
  const { readLastTab, saveLastTab } = useLastTab('analytics:last-tab');
  const [tabs, setTabs] = useState<string[]>([]);
  const [tabsStatus, setTabsStatus] = useState<TabsStatus>('loading');
  const [tabsAttempt, setTabsAttempt] = useState(0);
  const [selectedTab, setSelectedTab] = useState<string | null>(null);
  const [status, setStatus] = useState<SheetSourceStatus>(initialTransactions ? 'loaded' : 'idle');
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions ?? []);
  const [skippedCount, setSkippedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const latestRequest = useRef(0);
  const selectedTabRef = useRef<string | null>(null);

  // `keepData` = refresh: leave the rows on screen until the new ones arrive.
  const load = useCallback(async (tab: string, keepData: boolean) => {
    const id = ++latestRequest.current;
    selectedTabRef.current = tab;
    setSelectedTab(tab);
    setStatus('loading');
    setError(null);
    if (!keepData) {
      setTransactions([]);
      setSkippedCount(0);
    }
    let rows;
    let failure: string | null = null;
    try {
      const result = await readTabAction(tab);
      if (result.success && result.rows) rows = result.rows;
      else failure = result.error ?? READ_FAILED;
    } catch {
      failure = READ_FAILED;
    }
    if (id !== latestRequest.current) return;
    if (rows) {
      const parsed = parseSheetRows(rows);
      setTransactions(parsed.transactions);
      setSkippedCount(parsed.skippedCount);
      setStatus('loaded');
    } else {
      setError(failure);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    getSheetTargetAction()
      .then((result) => {
        if (cancelled) return;
        if (!result.success || !result.tabs) {
          setTabsStatus('error');
          return;
        }
        setTabs(result.tabs);
        setTabsStatus('ready');
        const last = readLastTab();
        if (last && result.tabs.includes(last) && selectedTabRef.current === null) load(last, false);
      })
      .catch(() => {
        if (!cancelled) setTabsStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [readLastTab, load, tabsAttempt]);

  const selectTab = useCallback(
    (tab: string) => {
      saveLastTab(tab);
      load(tab, false);
    },
    [saveLastTab, load],
  );

  const refresh = useCallback(() => {
    if (selectedTabRef.current) load(selectedTabRef.current, true);
  }, [load]);

  const retryTabs = useCallback(() => {
    setTabsStatus('loading');
    setTabsAttempt((n) => n + 1);
  }, []);

  return { tabs, tabsStatus, selectedTab, status, transactions, skippedCount, error, selectTab, refresh, retryTabs };
}
