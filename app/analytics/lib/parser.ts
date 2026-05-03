import Papa from 'papaparse';
import type { Transaction } from '../types';

export type ParseCSVResult =
  | { success: true; transactions: Transaction[] }
  | { success: false; error: string };

const REQUIRED_COLUMNS = ['Date', 'Category', 'Notes', 'Account', 'Amt'] as const;

function parseDate(value: string): Date | null {
  // Expects DD/MM/YYYY
  const parts = value.split('/');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  const d = new Date(year, month - 1, day);
  // Validate that the parsed date matches the input values (catches e.g. 32/01/2025)
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
  return d;
}

function parseAmount(value: unknown): number {
  return parseFloat(String(value).replace(/[^0-9.-]/g, ''));
}

export function parseCSV(csvText: string): ParseCSVResult {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  // Check for required columns
  const headers = parsed.meta.fields ?? [];
  const missing = REQUIRED_COLUMNS.filter((col) => !headers.includes(col));
  if (missing.length > 0) {
    return { success: false, error: `Missing required columns: ${missing.join(', ')}` };
  }

  const hasIsTransfer = headers.includes('Is Transfer');

  const transactions: Transaction[] = [];

  for (const row of parsed.data) {
    const date = parseDate(String(row['Date'] ?? '').trim());
    if (!date || isNaN(date.getTime())) continue;

    const amountSGD = parseAmount(row['Amt']);
    if (isNaN(amountSGD)) continue;

    const isTransfer: boolean | undefined = hasIsTransfer
      ? row['Is Transfer']?.toString().toUpperCase() === 'TRUE'
      : undefined;

    transactions.push({
      date,
      category: String(row['Category'] ?? '').trim(),
      notes: String(row['Notes'] ?? '').trim(),
      account: String(row['Account'] ?? '').trim(),
      amountSGD,
      isTransfer,
    });
  }

  return { success: true, transactions };
}
