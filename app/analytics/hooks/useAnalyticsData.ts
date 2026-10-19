import { useMemo } from 'react';
import type { Transaction, AnalyticsSummary } from '../types';
import { useSheetSource, type UseSheetSourceReturn } from './useSheetSource';
import { useFilterState, type FilterState } from './useFilterState';
import { resolveDateRange, resolvePreviousPeriodRange } from '../lib/periods';
import { aggregateTransactions } from '../lib/aggregator';

export interface UseAnalyticsDataReturn extends UseSheetSourceReturn {
  filterState: FilterState;
  setFilter: (update: Partial<FilterState>) => void;
  availableAccounts: string[];
  summary: AnalyticsSummary;
}

export function useAnalyticsData(initialTransactions?: Transaction[]): UseAnalyticsDataReturn {
  const source = useSheetSource(initialTransactions);
  const { transactions } = source;
  const { filterState, setFilter } = useFilterState();

  // A different tab means different accounts; period and custom range persist.
  function selectTab(tab: string) {
    setFilter({ selectedAccounts: [] });
    source.selectTab(tab);
  }

  const availableAccounts = useMemo(
    () => [...new Set(transactions.map((t) => t.account))].sort(),
    [transactions],
  );

  const dateRange = useMemo(() => {
    // If period is 'custom' but no customDateRange is set, fall back to 'last30'
    if (filterState.selectedPeriod === 'custom' && filterState.customDateRange == null) {
      return resolveDateRange('last30');
    }
    return resolveDateRange(filterState.selectedPeriod, filterState.customDateRange);
  }, [filterState]);

  const summary = useMemo(
    () => aggregateTransactions(transactions, dateRange, filterState.selectedAccounts),
    [transactions, dateRange, filterState.selectedAccounts],
  );

  const previousDateRange = useMemo(() => {
    if (filterState.selectedPeriod === 'custom' && filterState.customDateRange == null) {
      return resolvePreviousPeriodRange('last30', resolveDateRange('last30'));
    }
    return resolvePreviousPeriodRange(filterState.selectedPeriod, dateRange);
  }, [filterState, dateRange]);

  const previousSummary = useMemo(
    () => aggregateTransactions(transactions, previousDateRange, filterState.selectedAccounts),
    [transactions, previousDateRange, filterState.selectedAccounts],
  );

  const cashflowChangePct = useMemo((): number | null => {
    const prev = previousSummary.netCashflow;
    const hasNoPriorData = previousSummary.totalIncome === 0 && previousSummary.totalExpenses === 0;
    if (hasNoPriorData || prev === 0) return null;
    return ((summary.netCashflow - prev) / Math.abs(prev)) * 100;
  }, [summary, previousSummary]);

  const summaryWithChange = useMemo(
    () => ({ ...summary, cashflowChangePct }),
    [summary, cashflowChangePct],
  );

  return {
    ...source,
    selectTab,
    filterState,
    setFilter,
    availableAccounts,
    summary: summaryWithChange,
  };
}
