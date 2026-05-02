import { useEffect } from 'react';
import type { Transaction } from '../types';
import type { TransactionStatus } from './useTransactionState';
import { saveTransactions } from '../lib/storage';

const DEBOUNCE_MS = 300;

/**
 * Debounced write of transactions to IndexedDB.
 * Only writes when status === 'loaded' to avoid overwriting IDB with
 * the initial empty array during the mount hydration phase.
 */
export function useTransactionSync(
  transactions: Transaction[],
  status: TransactionStatus,
): void {
  useEffect(() => {
    if (status !== 'loaded') return;

    const timer = setTimeout(() => {
      saveTransactions(transactions);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [transactions, status]);
}
