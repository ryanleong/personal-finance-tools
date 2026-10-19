import { useState, useEffect, useCallback } from 'react';
import type { FormattedRow } from '../../../lib/services/formatter';
import { checkDuplicatesAction } from '../actions';

export type DuplicateCheckStatus = 'idle' | 'checking' | 'ready' | 'error';

interface Result {
  tab: string;
  rows: FormattedRow[];
  duplicates: boolean[] | null;
  error: string | null;
}

/** Flags rows already in `tab`; duplicates start excluded and can be re-included per row. */
export function useDuplicateCheck(tab: string | null, rows: FormattedRow[]) {
  const [result, setResult] = useState<Result | null>(null);
  const [excluded, setExcluded] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!tab || rows.length === 0) return;
    let cancelled = false;
    const finish = (duplicates: boolean[] | null, error: string | null) => {
      if (cancelled) return;
      setResult({ tab, rows, duplicates, error });
      setExcluded(new Set((duplicates ?? []).flatMap((d, i) => (d ? [i] : []))));
    };
    checkDuplicatesAction(tab, rows)
      .then((r) =>
        r.success && r.duplicates
          ? finish(r.duplicates, null)
          : finish(null, r.error || 'Could not check for duplicates')
      )
      .catch(() => finish(null, 'Could not check for duplicates'));
    return () => {
      cancelled = true;
    };
  }, [tab, rows]);

  const current = result && result.tab === tab && result.rows === rows ? result : null;
  const status: DuplicateCheckStatus = !tab
    ? 'idle'
    : !current
      ? 'checking'
      : current.duplicates
        ? 'ready'
        : 'error';

  const toggleRow = useCallback((index: number) => {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (!next.delete(index)) next.add(index);
      return next;
    });
  }, []);

  return {
    status,
    error: current?.error ?? null,
    duplicates: current?.duplicates ?? [],
    excluded,
    toggleRow,
  };
}
