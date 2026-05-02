// Amount sign convention: positive Amt (SGD) = income, negative = expense
export const INCOME_IS_POSITIVE = true;

// Label used for transactions with no recognised category
export const UNCATEGORISED_LABEL = 'Uncategorised';

export const INCOME_CATEGORIES: ReadonlySet<string> = new Set([
  'salary, invoices',        // CSV: "Salary, Invoices" — single combined category
  'income',
  'sale',
  'interests, dividends',    // CSV: "Interests, dividends" — comma-space, not slash
  'refunds (tax, purchase)', // CSV: "Refunds (tax, purchase)" — comma-space, not slash
  'dues & grants',
]);

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  date: Date;
  category: string;    // raw value from CSV; empty string if blank
  notes: string;
  account: string;
  amountSGD: number;  // positive = income, negative = expense
  isTransfer?: boolean; // from optional "Is Transfer" column
}

export type TimePeriod = 'last30' | 'prev30' | 'currentMonth' | 'prevMonth' | 'ytd' | 'custom';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface CategoryBreakdown {
  category: string;
  // Signed for expense categories: negative = net expense, positive = net credit.
  // Always positive for income categories.
  amount: number;
  percentage: number;  // 0–100
  transactions: Transaction[];
}

export interface AnalyticsSummary {
  totalIncome: number;
  totalExpenses: number;  // always positive (absolute value)
  netCashflow: number;    // totalIncome - totalExpenses (can be negative)
  incomeByCategory: CategoryBreakdown[];
  expensesByCategory: CategoryBreakdown[];
  cashflowChangePct: number | null;  // null = N/A (zero prior cashflow or no prior data)
}
