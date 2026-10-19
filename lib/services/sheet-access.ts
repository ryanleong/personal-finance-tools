/**
 * Shared guards for server actions that touch a sheet tab.
 * Plain module (not 'use server') so it can export constants and sync helpers.
 */

import { headers } from 'next/headers';
import { getClientIP } from '@/lib/rate-limiter';
import { TimeoutError } from '@/lib/timeout';
import { createSheetsGateway, filterAllowedTabs, SheetsError, type SheetsErrorKind } from '@/lib/services/sheets';

const MAX_APPEND_ROWS = 10000;

export const SHEET_ERRORS: Record<SheetsErrorKind, string> = {
  forbidden:
    "The service account can't access this spreadsheet. Check it is shared with the service account as Editor.",
  'not-found': "That tab wasn't found. Reload the list and pick another.",
  'rate-limited': 'Google rate limit hit. Wait a minute and try again.',
  unavailable: 'Google is unavailable. Try again.',
  timeout:
    'The request timed out. Check the sheet before retrying, the rows may already have been added.',
  'not-configured': "Google Sheets isn't configured on the server.",
};

export const READ_TIMEOUT_MESSAGE = 'Timed out reading the sheet. Try again.';

// Fixed messages only, so no raw error text (or sheet ID) reaches the client.
export function sheetErrorMessage(error: unknown, timeoutMessage = SHEET_ERRORS.timeout): string {
  if (error instanceof SheetsError) return error.kind === 'timeout' ? timeoutMessage : SHEET_ERRORS[error.kind];
  if (error instanceof TimeoutError) return timeoutMessage;
  return SHEET_ERRORS.unavailable;
}

type TabAccess = { error: string } | { gateway: ReturnType<typeof createSheetsGateway> };

interface Limiter {
  isAllowed(id: string): boolean;
  getRetryAfter(id: string): number;
}

/** Rate limit, optional row cap (only when `rowCount` is given), whitelisted tab. */
export async function openTab(tab: string, limiter: Limiter, rowCount?: number): Promise<TabAccess> {
  const clientIP = getClientIP(await headers());
  if (!limiter.isAllowed(clientIP)) {
    return { error: `Rate limit exceeded. Please try again in ${limiter.getRetryAfter(clientIP)} seconds.` };
  }
  if (rowCount !== undefined && rowCount > MAX_APPEND_ROWS) {
    return { error: `Too many rows (${rowCount}). The limit is 10,000 rows per append.` };
  }
  const gateway = createSheetsGateway();
  const { tabs } = await gateway.listTabs();
  if (!filterAllowedTabs(tabs, process.env.GOOGLE_SHEET_ALLOWED_TABS).includes(tab)) {
    return { error: SHEET_ERRORS['not-found'] };
  }
  return { gateway };
}
