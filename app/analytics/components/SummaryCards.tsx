import type { AnalyticsSummary } from '../types';

interface SummaryCardsProps {
  summary: AnalyticsSummary;
}

function formatSGD(amount: number): string {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
    maximumFractionDigits: 2,
  }).format(amount);
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const { totalIncome, totalExpenses, netCashflow, cashflowChangePct } = summary;
  const netIsPositive = netCashflow >= 0;

  return (
    <div className="flex flex-row flex-wrap gap-4">
      {/* Total Income */}
      <div className="flex-1 min-w-[200px] bg-card border border-border rounded-xl p-5">
        <p className="text-xs font-medium uppercase tracking-wide opacity-60 mb-1">Total Income</p>
        <p className="text-2xl font-semibold text-green-500">{formatSGD(totalIncome)}</p>
      </div>

      {/* Total Expenses */}
      <div className="flex-1 min-w-[200px] bg-card border border-border rounded-xl p-5">
        <p className="text-xs font-medium uppercase tracking-wide opacity-60 mb-1">Total Expenses</p>
        <p className="text-2xl font-semibold text-red-500">{formatSGD(totalExpenses)}</p>
      </div>

      {/* Net Cashflow */}
      <div className="flex-1 min-w-[200px] bg-card border border-border rounded-xl p-5">
        <p className="text-xs font-medium uppercase tracking-wide opacity-60 mb-1">Net Cashflow</p>
        <p className={`text-2xl font-semibold ${netIsPositive ? 'text-green-500' : 'text-red-500'}`}>
          {formatSGD(netCashflow)}
        </p>
        <div className="mt-2 flex items-center gap-1 text-xs">
          {cashflowChangePct === null ? (
            <span className="opacity-50">— vs prior period</span>
          ) : cashflowChangePct >= 0 ? (
            <>
              <span className="text-green-500">↑ {cashflowChangePct.toFixed(1)}%</span>
              <span className="opacity-50">vs prior period</span>
            </>
          ) : (
            <>
              <span className="text-red-500">↓ {Math.abs(cashflowChangePct).toFixed(1)}%</span>
              <span className="opacity-50">vs prior period</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
