import { describe, it, expect } from 'vitest';
import { parseSheetRows } from './sheetParser';

const HEADER = ['Date', 'Category', 'Notes', 'Account', 'Amt', 'Is Transfer'];
// 2025-05-06 as a Sheets serial (days since 1899-12-30)
const SERIAL_2025_05_06 = 45783;

describe('parseSheetRows', () => {
  it('converts a serial date to local midnight of the right calendar day, ignoring the time fraction', () => {
    const { transactions } = parseSheetRows([
      HEADER,
      [SERIAL_2025_05_06, 'Food', 'lunch', 'DBS', -12.5, false],
      [SERIAL_2025_05_06 + 0.99, 'Food', '', 'DBS', -1, ''],
    ]);
    for (const tx of transactions) {
      expect(tx.date.getFullYear()).toBe(2025);
      expect(tx.date.getMonth()).toBe(4);
      expect(tx.date.getDate()).toBe(6);
      expect(tx.date.getHours()).toBe(0);
    }
    expect(transactions[0]).toMatchObject({
      category: 'Food',
      notes: 'lunch',
      account: 'DBS',
      amountSGD: -12.5,
      isTransfer: false,
    });
  });

  it('skips and counts rows with a text date or text/missing Amt', () => {
    const { transactions, skippedCount } = parseSheetRows([
      HEADER,
      ['05/06/2025', 'Food', '', 'DBS', -10, ''],
      [SERIAL_2025_05_06, 'Food', '', 'DBS', '(50.00)', ''],
      [SERIAL_2025_05_06, 'Food', '', 'DBS'],
      [SERIAL_2025_05_06, 'Food', '', 'DBS', -5, ''],
    ]);
    expect(transactions).toHaveLength(1);
    expect(skippedCount).toBe(3);
  });

  it('skips and counts rows whose serial date is outside the representable range', () => {
    const { transactions, skippedCount } = parseSheetRows([HEADER, [1e12, 'Food', '', 'DBS', -10, '']]);
    expect(transactions).toHaveLength(0);
    expect(skippedCount).toBe(1);
  });

  it('skips the header and fully blank rows without counting them', () => {
    const { transactions, skippedCount } = parseSheetRows([
      HEADER,
      [],
      ['', '', '', '', '', ''],
      [undefined, '  '],
    ]);
    expect(transactions).toEqual([]);
    expect(skippedCount).toBe(0);
  });

  it('treats the first row as a header even if it looks like data', () => {
    const { transactions, skippedCount } = parseSheetRows([
      [SERIAL_2025_05_06, 'Food', '', 'DBS', -10, ''],
    ]);
    expect(transactions).toEqual([]);
    expect(skippedCount).toBe(0);
  });

  it('reads Is Transfer: true and "true"/"TRUE" are transfers; blank, false and other text are not', () => {
    const flags: (string | boolean | undefined)[] = [true, 'true', 'TRUE', '', false, 'yes', undefined];
    const { transactions } = parseSheetRows([
      HEADER,
      ...flags.map((f) => [SERIAL_2025_05_06, 'Food', '', 'DBS', -1, f]),
    ]);
    expect(transactions.map((t) => t.isTransfer)).toEqual([true, true, true, false, false, false, false]);
  });

  it('trims strings and defaults blank/missing Category, Notes and Account to empty string', () => {
    const { transactions } = parseSheetRows([
      HEADER,
      [SERIAL_2025_05_06, '  Food  ', undefined, '', -3],
      [SERIAL_2025_05_06, '', '', ' DBS ', 3],
    ]);
    expect(transactions[0]).toMatchObject({ category: 'Food', notes: '', account: '' });
    expect(transactions[1]).toMatchObject({ category: '', account: 'DBS', amountSGD: 3 });
  });

  it('returns an empty result for no rows', () => {
    expect(parseSheetRows([])).toEqual({ transactions: [], skippedCount: 0 });
  });
});
