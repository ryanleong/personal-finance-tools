import { useCallback } from 'react';

const KEY = 'csv-formatter:last-tab';

export function useLastTab() {
  const readLastTab = useCallback((): string | null => {
    try {
      return localStorage.getItem(KEY);
    } catch {
      return null;
    }
  }, []);

  const saveLastTab = useCallback((tab: string): void => {
    try {
      localStorage.setItem(KEY, tab);
    } catch {
      // storage unavailable; the preference just isn't remembered
    }
  }, []);

  return { readLastTab, saveLastTab };
}
