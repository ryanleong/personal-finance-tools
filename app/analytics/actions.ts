'use server';

import { readRateLimiter } from '@/lib/rate-limiter';
import { withTimeout } from '@/lib/timeout';
import { openTab, sheetErrorMessage, READ_TIMEOUT_MESSAGE } from '@/lib/services/sheet-access';

export interface ReadTabResult {
  success: boolean;
  rows?: (string | number | boolean)[][];
  error?: string;
}

const READ_TIMEOUT_MS = 30000;

/** Read a whitelisted tab's raw A:F cells for analytics. */
export async function readTabAction(tab: string): Promise<ReadTabResult> {
  try {
    const access = await openTab(tab, readRateLimiter);
    if ('error' in access) return { success: false, error: access.error };
    const rows = await withTimeout(access.gateway.readTransactionRows(tab), READ_TIMEOUT_MS, READ_TIMEOUT_MESSAGE);
    return { success: true, rows };
  } catch (error) {
    return { success: false, error: sheetErrorMessage(error, READ_TIMEOUT_MESSAGE) };
  }
}
