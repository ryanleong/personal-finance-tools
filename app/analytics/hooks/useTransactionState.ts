import { useState, useEffect } from 'react';
import type { Transaction } from '../types';
import { loadTransactions } from '../lib/storage';

export type TransactionStatus = 'empty' | 'loaded';

interface UseTransactionStateReturn {
  transactions: Transaction[];
  status: TransactionStatus;
  setTransactions: (txs: Transaction[]) => void;
}

export function useTransactionState(
  initialTransactions?: Transaction[],
): UseTransactionStateReturn {
  const [transactions, setTransactionsState] = useState<Transaction[]>(
    initialTransactions ?? [],
  );
  const [status, setStatus] = useState<TransactionStatus>('empty');

  // Hydrate from IndexedDB on mount
  useEffect(() => {
    loadTransactions().then((saved) => {
      if (saved !== null && saved.length > 0) {
        setTransactionsState(saved);
        setStatus('loaded');
      }
    });
  }, []);

  function setTransactions(txs: Transaction[]) {
    setTransactionsState(txs);
    setStatus('loaded');
  }

  return { transactions, status, setTransactions };
}
