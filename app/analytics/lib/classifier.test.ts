import { describe, it, expect } from 'vitest';
import { classifyTransaction, getExpenseCategoryLabel } from './classifier';
import { UNCATEGORISED_LABEL } from '../types';
import type { Transaction } from '../types';

function makeTx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    date: new Date(2025, 0, 1),
    category: '',
    notes: '',
    account: 'DBS',
    amountSGD: -10,
    ...overrides,
  };
}

describe('classifyTransaction', () => {
  // 1. Category 'Salary, Invoices' (mixed case) → 'income'
  it("classifies 'Salary, Invoices' as income", () => {
    expect(classifyTransaction(makeTx({ category: 'Salary, Invoices' }))).toBe('income');
  });

  // 2. SALARY, INVOICES in uppercase → income
  it("classifies 'SALARY, INVOICES' as income (case-insensitive)", () => {
    expect(classifyTransaction(makeTx({ category: 'SALARY, INVOICES' }))).toBe('income');
  });

  // 3. salary, invoices in lowercase → income
  it("classifies 'salary, invoices' as income (lowercase)", () => {
    expect(classifyTransaction(makeTx({ category: 'salary, invoices' }))).toBe('income');
  });

  // 4. All 6 income categories → 'income'
  const incomeCategories = [
    'Salary, Invoices',
    'Income',
    'Sale',
    'Interests, dividends',
    'Refunds (tax, purchase)',
    'Dues & grants',
  ];
  for (const cat of incomeCategories) {
    it(`classifies '${cat}' as income`, () => {
      expect(classifyTransaction(makeTx({ category: cat }))).toBe('income');
    });
  }

  // 5. isTransfer: true → 'transfer' regardless of category
  it('classifies as transfer when isTransfer is true, even with income category', () => {
    expect(
      classifyTransaction(makeTx({ category: 'salary, invoices', isTransfer: true })),
    ).toBe('transfer');
  });

  it('classifies as transfer when isTransfer is true with expense category', () => {
    expect(
      classifyTransaction(makeTx({ category: 'Food', isTransfer: true })),
    ).toBe('transfer');
  });

  // 6. Empty category '' → 'transfer'
  it("classifies empty category '' as transfer", () => {
    expect(classifyTransaction(makeTx({ category: '' }))).toBe('transfer');
  });

  // 7. Whitespace-only category → 'transfer'
  it('classifies whitespace-only category as transfer', () => {
    expect(classifyTransaction(makeTx({ category: '   ' }))).toBe('transfer');
  });

  // 8. isTransfer: false + non-income category → 'expense'
  it('classifies as expense when isTransfer is false and category is not income', () => {
    expect(
      classifyTransaction(makeTx({ category: 'Food', isTransfer: false })),
    ).toBe('expense');
  });

  // 9. Unknown category → 'expense'
  it('classifies unknown category as expense', () => {
    expect(classifyTransaction(makeTx({ category: 'Entertainment' }))).toBe('expense');
  });
});

describe('getExpenseCategoryLabel', () => {
  it('returns UNCATEGORISED_LABEL for empty category', () => {
    expect(getExpenseCategoryLabel(makeTx({ category: '' }))).toBe(UNCATEGORISED_LABEL);
  });

  it('returns UNCATEGORISED_LABEL for whitespace-only category', () => {
    expect(getExpenseCategoryLabel(makeTx({ category: '   ' }))).toBe(UNCATEGORISED_LABEL);
  });

  it('returns the category name as-is for any non-empty category (e.g. Food & Dining)', () => {
    expect(getExpenseCategoryLabel(makeTx({ category: 'Food & Dining' }))).toBe('Food & Dining');
  });

  it('returns the category name as-is for any non-empty category (e.g. Entertainment)', () => {
    expect(getExpenseCategoryLabel(makeTx({ category: 'Entertainment' }))).toBe('Entertainment');
  });

  it('returns the category name as-is even for income-named categories (label only, not classification)', () => {
    expect(getExpenseCategoryLabel(makeTx({ category: 'salary, invoices' }))).toBe('salary, invoices');
  });
});
