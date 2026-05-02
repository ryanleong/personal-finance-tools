import { useState } from 'react';
import type { TimePeriod, DateRange } from '../types';

export interface FilterState {
  selectedPeriod: TimePeriod;
  customDateRange: DateRange | null;
  selectedAccounts: string[]; // empty = all accounts
}

const DEFAULT_FILTER: FilterState = {
  selectedPeriod: 'last30',
  customDateRange: null,
  selectedAccounts: [],
};

export function useFilterState(): {
  filterState: FilterState;
  setFilter: (update: Partial<FilterState>) => void;
} {
  const [filterState, setFilterState] = useState<FilterState>(DEFAULT_FILTER);

  function setFilter(update: Partial<FilterState>) {
    setFilterState((prev) => ({ ...prev, ...update }));
  }

  return { filterState, setFilter };
}
