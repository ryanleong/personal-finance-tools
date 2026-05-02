import { describe, it, expect } from 'vitest';
import { aggregateTransactions } from './aggregator';
import type { Transaction, DateRange } from '../types';

// Helper: build a midnight-normalised Date
function d(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day);
}

// Default date range that covers all test transactions unless specified
const WIDE_RANGE: DateRange = { start: d(2020, 1, 1), end: d(2030, 12, 31) };

function makeTx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    date: d(2025, 5, 15),
    category: 'Food',
    notes: '',
    account: 'DBS',
    amountSGD: -50,
    ...overrides,
  };
}

describe('aggregateTransactions', () => {
  // 1. Transfer excluded: single transfer tx → summary with all zeros
  it('excludes transfer transactions (isTransfer: true)', () => {
    const txs = [makeTx({ isTransfer: true, amountSGD: -100 })];
    const result = aggregateTransactions(txs, WIDE_RANGE, []);
    expect(result.totalIncome).toBe(0);
    expect(result.totalExpenses).toBe(0);
    expect(result.netCashflow).toBe(0);
    expect(result.incomeByCategory).toHaveLength(0);
    expect(result.expensesByCategory).toHaveLength(0);
  });

  // 2. Date range filtering: tx before range → excluded; in range → included; after → excluded
  it('excludes transactions outside the date range', () => {
    const range: DateRange = { start: d(2025, 5, 1), end: d(2025, 5, 31) };
    const before = makeTx({ date: d(2025, 4, 30), amountSGD: -100, category: 'Food' });
    const inside = makeTx({ date: d(2025, 5, 15), amountSGD: -50, category: 'Food' });
    const after = makeTx({ date: d(2025, 6, 1), amountSGD: -200, category: 'Food' });
    const result = aggregateTransactions([before, inside, after], range, []);
    expect(result.totalExpenses).toBe(50);
  });

  // 3. Account filtering: 'DBS' excludes tx on account 'UOB'
  it('excludes transactions not in selectedAccounts when selectedAccounts is non-empty', () => {
    const txs = [
      makeTx({ account: 'DBS', amountSGD: -100, category: 'Food' }),
      makeTx({ account: 'UOB', amountSGD: -200, category: 'Food' }),
    ];
    const result = aggregateTransactions(txs, WIDE_RANGE, ['DBS']);
    expect(result.totalExpenses).toBe(100);
  });

  // 4. Account filtering: empty selectedAccounts → includes ALL accounts
  it('includes all accounts when selectedAccounts is empty', () => {
    const txs = [
      makeTx({ account: 'DBS', amountSGD: -100, category: 'Food' }),
      makeTx({ account: 'UOB', amountSGD: -200, category: 'Food' }),
    ];
    const result = aggregateTransactions(txs, WIDE_RANGE, []);
    expect(result.totalExpenses).toBe(300);
  });

  // 5. Correct totalIncome: two income txs of 1000 and 500 → 1500
  it('sums income correctly', () => {
    const txs = [
      makeTx({ category: 'salary, invoices', amountSGD: 1000 }),
      makeTx({ category: 'salary, invoices', amountSGD: 500 }),
    ];
    const result = aggregateTransactions(txs, WIDE_RANGE, []);
    expect(result.totalIncome).toBe(1500);
  });

  // 6. Correct totalExpenses: two expense txs of -300 and -200 → 500 (positive)
  it('sums expenses as a positive number', () => {
    const txs = [
      makeTx({ category: 'Food', amountSGD: -300 }),
      makeTx({ category: 'Food', amountSGD: -200 }),
    ];
    const result = aggregateTransactions(txs, WIDE_RANGE, []);
    expect(result.totalExpenses).toBe(500);
  });

  // 7. netCashflow = totalIncome - totalExpenses
  it('calculates netCashflow as totalIncome minus totalExpenses', () => {
    const txs = [
      makeTx({ category: 'salary, invoices', amountSGD: 2000 }),
      makeTx({ category: 'Food', amountSGD: -800 }),
    ];
    const result = aggregateTransactions(txs, WIDE_RANGE, []);
    expect(result.netCashflow).toBe(1200);
  });

  // 8. Category grouping: two txs with same category → one CategoryBreakdown with combined signed amount
  it('groups expenses by category into a single breakdown', () => {
    const txs = [
      makeTx({ category: 'Food', amountSGD: -100 }),
      makeTx({ category: 'Food', amountSGD: -150 }),
    ];
    const result = aggregateTransactions(txs, WIDE_RANGE, []);
    expect(result.expensesByCategory).toHaveLength(1);
    expect(result.expensesByCategory[0].category).toBe('Food');
    // Signed sum: -100 + -150 = -250 (net expense shown as negative)
    expect(result.expensesByCategory[0].amount).toBe(-250);
  });

  // 9. Category sorting: category A=1000, B=500, C=200 → sorted descending
  it('sorts expense categories by amount descending', () => {
    const txs = [
      makeTx({ category: 'C', amountSGD: -200 }),
      makeTx({ category: 'A', amountSGD: -1000 }),
      makeTx({ category: 'B', amountSGD: -500 }),
    ];
    const result = aggregateTransactions(txs, WIDE_RANGE, []);
    const labels = result.expensesByCategory.map((c) => c.category);
    expect(labels).toEqual(['A', 'B', 'C']);
  });

  // 10. Percentage: category A=300, B=100 → A=75%, B=25%
  it('calculates per-category percentages correctly', () => {
    const txs = [
      makeTx({ category: 'A', amountSGD: -300 }),
      makeTx({ category: 'B', amountSGD: -100 }),
    ];
    const result = aggregateTransactions(txs, WIDE_RANGE, []);
    const a = result.expensesByCategory.find((c) => c.category === 'A')!;
    const b = result.expensesByCategory.find((c) => c.category === 'B')!;
    expect(a.percentage).toBe(75);
    expect(b.percentage).toBe(25);
  });

  // 11. Empty result: no matching txs → all zeros, empty arrays
  it('returns zeroed summary when no transactions match', () => {
    const result = aggregateTransactions([], WIDE_RANGE, []);
    expect(result.totalIncome).toBe(0);
    expect(result.totalExpenses).toBe(0);
    expect(result.netCashflow).toBe(0);
    expect(result.incomeByCategory).toHaveLength(0);
    expect(result.expensesByCategory).toHaveLength(0);
  });

  // 12. CategoryBreakdown carries the raw transactions
  it('attaches raw transactions to each CategoryBreakdown', () => {
    const tx1 = makeTx({ category: 'Food', amountSGD: -50 });
    const tx2 = makeTx({ category: 'Food', amountSGD: -75 });
    const result = aggregateTransactions([tx1, tx2], WIDE_RANGE, []);
    expect(result.expensesByCategory[0].transactions).toEqual([tx1, tx2]);
  });

  // 13. Percentage is 0 when total is 0 (defensive)
  it('returns 0 percentage when the section total is 0', () => {
    // All transactions are transfers → totalExpenses = 0
    const txs = [makeTx({ isTransfer: true, amountSGD: -100 })];
    const result = aggregateTransactions(txs, WIDE_RANGE, []);
    expect(result.expensesByCategory).toHaveLength(0);
  });

  // 14. Date range boundary: tx exactly on start and end dates is included
  it('includes transactions on the exact start and end dates of the range', () => {
    const range: DateRange = { start: d(2025, 5, 1), end: d(2025, 5, 31) };
    const onStart = makeTx({ date: d(2025, 5, 1), amountSGD: -10, category: 'Food' });
    const onEnd = makeTx({ date: d(2025, 5, 31), amountSGD: -20, category: 'Food' });
    const result = aggregateTransactions([onStart, onEnd], range, []);
    expect(result.totalExpenses).toBe(30);
  });

  // 15. Mixed expense + refund: signed sum offsets expense with refund
  it('offsets category amount with refund (signed sum: -20 + 8 = -12)', () => {
    const txs = [
      makeTx({ category: 'Food', amountSGD: -20 }),
      makeTx({ category: 'Food', amountSGD: 8 }),
    ];
    const result = aggregateTransactions(txs, WIDE_RANGE, []);
    expect(result.expensesByCategory[0].amount).toBe(-12);
  });

  // 16. Net credit: refunds exceed spending → positive category amount
  it('produces a positive category amount when refunds exceed expenses (net credit)', () => {
    const txs = [
      makeTx({ category: 'Food', amountSGD: -5 }),
      makeTx({ category: 'Food', amountSGD: 20 }),
    ];
    const result = aggregateTransactions(txs, WIDE_RANGE, []);
    expect(result.expensesByCategory[0].amount).toBe(15);
  });

  // 17. totalExpenses accounts for net-credit categories reducing the total
  it('reduces totalExpenses when a net-credit category offsets a net-expense category', () => {
    const txs = [
      makeTx({ category: 'Food', amountSGD: -30 }),       // net -30
      makeTx({ category: 'Shopping', amountSGD: -5 }),    // net +15 combined
      makeTx({ category: 'Shopping', amountSGD: 20 }),
    ];
    const result = aggregateTransactions(txs, WIDE_RANGE, []);
    // netExpenseSum = -30 + 15 = -15 → totalExpenses = 15
    expect(result.totalExpenses).toBe(15);
  });

  // 18. totalExpenses clamped at 0 when all expense categories are net credit
  it('clamps totalExpenses at 0 when all expense categories are net credit', () => {
    const txs = [
      makeTx({ category: 'Food', amountSGD: -5 }),
      makeTx({ category: 'Food', amountSGD: 20 }),
    ];
    const result = aggregateTransactions(txs, WIDE_RANGE, []);
    // netExpenseSum = +15 → totalExpenses = Math.max(0, -15) = 0
    expect(result.totalExpenses).toBe(0);
  });
});
