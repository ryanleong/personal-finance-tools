import { openDB, type DBSchema } from 'idb';
import type { RetirementInputs } from '../types';

const DB_NAME = 'retirement-calculator-db';
const STORE = 'inputs';
const KEY = 'user-inputs';

interface RetirementDB extends DBSchema {
  inputs: {
    key: string;
    value: RetirementInputs;
  };
}

async function getDB() {
  return openDB<RetirementDB>(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE);
    },
  });
}

export async function loadInputs(): Promise<RetirementInputs | null> {
  if (typeof window === 'undefined') return null;
  try {
    const db = await getDB();
    return (await db.get(STORE, KEY)) ?? null;
  } catch {
    return null;
  }
}

export async function saveInputs(inputs: RetirementInputs): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const db = await getDB();
    await db.put(STORE, inputs, KEY);
  } catch {
    // Silent fail — storage is a convenience feature, not critical
  }
}
