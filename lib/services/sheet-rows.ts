import type { FormattedRow } from './formatter';

// Sanitises and formats formatted rows for Sheets (formula-injection safe).
export function toSheetRows(rows: FormattedRow[]): (string | number)[][] {
  return rows.map((row) => {
    let description = row.description
      .slice(0, 10000)
      .replace(/[\r\n]+/g, ' ')
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
      .trim();
    // Prefix check runs last so stripped control chars can't hide a leading formula char.
    if (/^[=+\-@]/.test(description)) description = `'${description}`;

    const amount = Number.isFinite(row.amount) ? row.amount.toFixed(2) : '0.00';
    const date = row.date.replace(/[^\d/\-.\s]/g, '');

    return [date, '', description, '', amount];
  });
}
