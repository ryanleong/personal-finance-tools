import { createHash } from 'node:crypto';

type Cells = (string | number | undefined)[];

const FINGERPRINT_COLUMN = 7; // H

/** One fingerprint per sheet-layout row (A:E), numbering identical rows 1..n in order. */
export function fingerprintRows(rows: Cells[]): string[] {
  const seen = new Map<string, number>();
  return rows.map(([date = '', , description = '', , amount = '']) => {
    const key = [
      String(date).trim(),
      String(description).trim().replace(/^'/, ''), // toSheetRows' formula-guard quote
      Number.parseFloat(String(amount).replace(/[^\d.-]/g, '')).toFixed(2),
    ].join('|');
    const n = (seen.get(key) ?? 0) + 1;
    seen.set(key, n);
    return createHash('sha256').update(`${key}|${n}`).digest('hex').slice(0, 16);
  });
}

/**
 * Fingerprints already in a tab (A:H rows): the stored value in H, else one computed from A, C, E.
 * shortcut: legacy rows are numbered across the whole tab, not per import, and edited legacy rows won't match; backfill H if that bites.
 */
export function existingFingerprints(sheetRows: Cells[]): Set<string> {
  const computed = fingerprintRows(sheetRows);
  return new Set(sheetRows.map((row, i) => String(row[FINGERPRINT_COLUMN] ?? '').trim() || computed[i]));
}
