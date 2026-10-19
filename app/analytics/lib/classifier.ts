import { INCOME_CATEGORIES, UNCATEGORISED_LABEL, type Transaction, type TransactionType } from '../types';

export function classifyTransaction(tx: Transaction): TransactionType {
  // Transfer only via the explicit flag; a blank category is an uncategorised expense
  if (tx.isTransfer === true) {
    return 'transfer';
  }

  if (INCOME_CATEGORIES.has(tx.category.trim().toLowerCase())) {
    return 'income';
  }

  return 'expense';
}

/**
 * Returns the display category name for an expense transaction.
 * Non-empty categories are returned as-is (e.g. "Food & Dining" → "Food & Dining").
 * Only truly blank/empty categories fall back to UNCATEGORISED_LABEL.
 */
export function getExpenseCategoryLabel(tx: Transaction): string {
  const trimmed = tx.category.trim();
  if (trimmed === '') return UNCATEGORISED_LABEL;
  return trimmed;
}
