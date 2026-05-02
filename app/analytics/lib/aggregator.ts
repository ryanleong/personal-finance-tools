import type { Transaction, DateRange, AnalyticsSummary, CategoryBreakdown } from '../types';
import { classifyTransaction, getExpenseCategoryLabel } from './classifier';

/** Normalise date to midnight and check if it falls within [range.start, range.end] inclusive. */
function dateIsInRange(date: Date, range: DateRange): boolean {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const s = new Date(range.start.getFullYear(), range.start.getMonth(), range.start.getDate()).getTime();
  const e = new Date(range.end.getFullYear(), range.end.getMonth(), range.end.getDate()).getTime();
  return d >= s && d <= e;
}

/**
 * Aggregate a list of transactions into an AnalyticsSummary for the given
 * date range and account filter.
 *
 * @param transactions     - Full transaction list.
 * @param dateRange        - Inclusive date range to filter by.
 * @param selectedAccounts - Accounts to include; empty array means ALL accounts.
 */
export function aggregateTransactions(
  transactions: Transaction[],
  dateRange: DateRange,
  selectedAccounts: string[],
): AnalyticsSummary {
  const accountSet = new Set(selectedAccounts);

  // Step 1 & 2: filter by date range and account
  const filtered = transactions.filter((tx) => {
    if (!dateIsInRange(tx.date, dateRange)) return false;
    if (accountSet.size > 0 && !accountSet.has(tx.account)) return false;
    return true;
  });

  let totalIncome = 0;
  let totalExpenses = 0;

  // Maps: category label → { amount, transactions[] }
  const incomeMap = new Map<string, { amount: number; transactions: Transaction[] }>();
  const expenseMap = new Map<string, { amount: number; transactions: Transaction[] }>();

  for (const tx of filtered) {
    const type = classifyTransaction(tx);
    if (type === 'transfer') continue;

    if (type === 'income') {
      totalIncome += tx.amountSGD;
      const label = tx.category.trim() || tx.category;
      const bucket = incomeMap.get(label) ?? { amount: 0, transactions: [] };
      bucket.amount += tx.amountSGD;
      bucket.transactions.push(tx);
      incomeMap.set(label, bucket);
    } else {
      // expense — signed amount: negative = spent, positive = refund/credit
      const label = getExpenseCategoryLabel(tx);
      const bucket = expenseMap.get(label) ?? { amount: 0, transactions: [] };
      bucket.amount += tx.amountSGD;
      bucket.transactions.push(tx);
      expenseMap.set(label, bucket);
    }
  }

  // Sum signed expense category amounts; negate to get a positive expense total,
  // then clamp at 0 (net-credit categories can push the sum negative).
  let netExpenseSum = 0;
  for (const [, bucket] of expenseMap) {
    netExpenseSum += bucket.amount;
  }
  totalExpenses = Math.max(0, -netExpenseSum);

  const netCashflow = totalIncome - totalExpenses;

  function buildBreakdowns(
    map: Map<string, { amount: number; transactions: Transaction[] }>,
    sectionTotal: number,
  ): CategoryBreakdown[] {
    const breakdowns: CategoryBreakdown[] = Array.from(map.entries()).map(([category, data]) => ({
      category,
      amount: data.amount,
      // Use Math.abs so expense categories (negative amounts) yield positive percentages.
      percentage: sectionTotal > 0 ? (Math.abs(data.amount) / sectionTotal) * 100 : 0,
      transactions: data.transactions,
    }));
    // Sort by magnitude descending so both income and expense categories rank by size.
    breakdowns.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
    return breakdowns;
  }

  return {
    totalIncome,
    totalExpenses,
    netCashflow,
    incomeByCategory: buildBreakdowns(incomeMap, totalIncome),
    expensesByCategory: buildBreakdowns(expenseMap, totalExpenses),
    cashflowChangePct: null,
  };
}
