import { useCallback } from 'react';

const DEFAULT_KEY = 'csv-formatter:last-tab';

export function useLastTab(key: string = DEFAULT_KEY) {
  const readLastTab = useCallback((): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }, [key]);

  const saveLastTab = useCallback((tab: string): void => {
    try {
      localStorage.setItem(key, tab);
    } catch {
      // storage unavailable; the preference just isn't remembered
    }
  }, [key]);

  return { readLastTab, saveLastTab };
}
