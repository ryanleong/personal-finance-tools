import type { Transaction } from '../types';

export type SheetCell = string | number | boolean | undefined;

export interface ParseSheetResult {
  transactions: Transaction[];
  skippedCount: number;
}

const SHEETS_EPOCH_UTC = Date.UTC(1899, 11, 30);
const MS_PER_DAY = 86_400_000;

function text(cell: SheetCell): string {
  return cell === undefined ? '' : String(cell).trim();
}

/** Serial day number -> local-midnight Date (UTC math for y/m/d, so the machine time zone cannot shift the day). */
function serialToDate(serial: number): Date {
  const utc = new Date(SHEETS_EPOCH_UTC + Math.floor(serial) * MS_PER_DAY);
  return new Date(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate());
}

/** Rows are unformatted Sheet values, columns A-F: Date, Category, Notes, Account, Amt, Is Transfer. Row 0 is the header. */
export function parseSheetRows(rows: SheetCell[][]): ParseSheetResult {
  const transactions: Transaction[] = [];
  let skippedCount = 0;

  for (const row of rows.slice(1)) {
    if (row.every((c) => text(c) === '')) continue;

    const [date, category, notes, account, amt, isTransfer] = row;
    if (typeof date !== 'number' || !Number.isFinite(date) || typeof amt !== 'number' || !Number.isFinite(amt)) {
      skippedCount++;
      continue;
    }

    const parsedDate = serialToDate(date);
    if (Number.isNaN(parsedDate.getTime())) {
      skippedCount++;
      continue;
    }

    transactions.push({
      date: parsedDate,
      category: text(category),
      notes: text(notes),
      account: text(account),
      amountSGD: amt,
      isTransfer: isTransfer === true || text(isTransfer).toUpperCase() === 'TRUE',
    });
  }

  return { transactions, skippedCount };
}
