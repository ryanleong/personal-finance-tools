import { describe, it, expect } from 'vitest';
import { parseCSV } from './parser';

// Helper to build a CSV string from headers and rows
function buildCSV(headers: string[], rows: string[][]): string {
  const header = headers.join(',');
  const body = rows.map((r) => r.join(',')).join('\n');
  return body.length > 0 ? `${header}\n${body}` : header;
}

const REQUIRED_HEADERS = ['Date', 'Category', 'Notes', 'Account', 'Amt (SGD)'];

describe('parseCSV', () => {
  // 1. Valid CSV with all columns → returns Transaction[] with correct values
  it('parses a valid CSV with all required columns', () => {
    const csv = buildCSV(
      [...REQUIRED_HEADERS, 'Is Transfer'],
      [['01/03/2025', 'Salary', 'March pay', 'DBS', '5000.00', 'FALSE']],
    );
    const result = parseCSV(csv);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const tx = result.transactions[0];
    expect(tx.date).toEqual(new Date(2025, 2, 1)); // month is 0-indexed
    expect(tx.category).toBe('Salary');
    expect(tx.notes).toBe('March pay');
    expect(tx.account).toBe('DBS');
    expect(tx.amountSGD).toBe(5000);
    expect(tx.isTransfer).toBe(false);
  });

  // 2. Missing required column → returns error naming the missing column(s)
  it('returns error when one required column is missing', () => {
    const csv = buildCSV(
      ['Date', 'Category', 'Notes', 'Account'], // missing 'Amt (SGD)'
      [['01/03/2025', 'Salary', 'pay', 'DBS']],
    );
    const result = parseCSV(csv);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toContain('Amt (SGD)');
  });

  // 3. Multiple missing columns → error lists ALL missing columns
  it('lists all missing columns when multiple are absent', () => {
    const csv = buildCSV(
      ['Date', 'Category'], // missing Notes, Account, Amt (SGD)
      [['01/03/2025', 'Salary']],
    );
    const result = parseCSV(csv);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toContain('Notes');
    expect(result.error).toContain('Account');
    expect(result.error).toContain('Amt (SGD)');
  });

  // 4. DD/MM/YYYY date parsing → Date object with correct year/month/day
  it('parses DD/MM/YYYY dates correctly', () => {
    const csv = buildCSV(
      REQUIRED_HEADERS,
      [['15/11/2024', 'Food', 'lunch', 'OCBC', '-12.50']],
    );
    const result = parseCSV(csv);
    expect(result.success).toBe(true);
    if (!result.success) return;
    const tx = result.transactions[0];
    expect(tx.date.getFullYear()).toBe(2024);
    expect(tx.date.getMonth()).toBe(10); // 0-indexed November
    expect(tx.date.getDate()).toBe(15);
  });

  // 5. Missing "Is Transfer" column → accepted silently, isTransfer is undefined
  it('accepts CSV without optional "Is Transfer" column', () => {
    const csv = buildCSV(
      REQUIRED_HEADERS,
      [['01/01/2025', 'Food', 'grocery', 'DBS', '-30.00']],
    );
    const result = parseCSV(csv);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.transactions[0].isTransfer).toBeUndefined();
  });

  // 6. Row with Is Transfer = "TRUE" → isTransfer: true
  it('sets isTransfer to true when column value is TRUE', () => {
    const csv = buildCSV(
      [...REQUIRED_HEADERS, 'Is Transfer'],
      [['05/06/2025', '', 'transfer', 'DBS', '-200.00', 'TRUE']],
    );
    const result = parseCSV(csv);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.transactions[0].isTransfer).toBe(true);
  });

  // 7. Row with Is Transfer = "FALSE" → isTransfer: false
  it('sets isTransfer to false when column value is FALSE', () => {
    const csv = buildCSV(
      [...REQUIRED_HEADERS, 'Is Transfer'],
      [['05/06/2025', 'Food', 'lunch', 'DBS', '-20.00', 'FALSE']],
    );
    const result = parseCSV(csv);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.transactions[0].isTransfer).toBe(false);
  });

  // 8. Row with empty category → category: ''
  it('preserves empty category as empty string', () => {
    const csv = buildCSV(
      REQUIRED_HEADERS,
      [['01/01/2025', '', 'unknown', 'DBS', '-10.00']],
    );
    const result = parseCSV(csv);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.transactions[0].category).toBe('');
  });

  // 9. Amount parsing: positive → positive; negative/parenthesised → negative
  it('parses positive amounts as positive', () => {
    const csv = buildCSV(
      REQUIRED_HEADERS,
      [['01/01/2025', 'Salary', 'pay', 'DBS', '3500.50']],
    );
    const result = parseCSV(csv);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.transactions[0].amountSGD).toBe(3500.5);
  });

  it('parses negative amounts as negative', () => {
    const csv = buildCSV(
      REQUIRED_HEADERS,
      [['01/01/2025', 'Food', 'dinner', 'DBS', '-88.00']],
    );
    const result = parseCSV(csv);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.transactions[0].amountSGD).toBe(-88);
  });

  it('parses amounts with commas correctly', () => {
    const csv = buildCSV(
      REQUIRED_HEADERS,
      [['01/01/2025', 'Salary', 'bonus', 'DBS', '"1,200.00"']],
    );
    const result = parseCSV(csv);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.transactions[0].amountSGD).toBe(1200);
  });

  // 10. Empty CSV (no data rows) → returns [] not an error
  it('returns empty array for CSV with headers but no data rows', () => {
    const csv = REQUIRED_HEADERS.join(',');
    const result = parseCSV(csv);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.transactions).toEqual([]);
  });

  // Bonus: rows with invalid dates are skipped
  it('skips rows with invalid dates', () => {
    const csv = buildCSV(
      REQUIRED_HEADERS,
      [
        ['not-a-date', 'Food', 'lunch', 'DBS', '-10.00'],
        ['01/01/2025', 'Salary', 'pay', 'DBS', '3000.00'],
      ],
    );
    const result = parseCSV(csv);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].category).toBe('Salary');
  });
});
