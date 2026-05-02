import { openDB, type DBSchema } from 'idb';
import type { Transaction } from '../types';

const DB_NAME = 'analytics-db';
const STORE = 'transactions';
const KEY = 'user-transactions';

// Serialised form stored in IndexedDB — Date objects don't survive IDB as-is
interface StoredTransaction extends Omit<Transaction, 'date'> {
  date: string; // ISO 8601
}

interface AnalyticsDB extends DBSchema {
  transactions: {
    key: string;
    value: StoredTransaction[];
  };
}

async function getDB() {
  return openDB<AnalyticsDB>(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE);
    },
  });
}

function serialize(txs: Transaction[]): StoredTransaction[] {
  return txs.map((tx) => ({ ...tx, date: tx.date.toISOString() }));
}

function deserialize(stored: StoredTransaction[]): Transaction[] {
  return stored.map((tx) => ({ ...tx, date: new Date(tx.date) }));
}

export async function loadTransactions(): Promise<Transaction[] | null> {
  if (typeof window === 'undefined') return null;
  try {
    const db = await getDB();
    const stored = await db.get(STORE, KEY);
    return stored ? deserialize(stored) : null;
  } catch {
    return null;
  }
}

export async function saveTransactions(txs: Transaction[]): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const db = await getDB();
    await db.put(STORE, serialize(txs), KEY);
  } catch {
    // Silent fail — storage is a convenience feature, not critical
  }
}

export async function clearTransactions(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const db = await getDB();
    await db.delete(STORE, KEY);
  } catch {
    // Silent fail
  }
}
