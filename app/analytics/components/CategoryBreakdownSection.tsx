'use client';

import type { AnalyticsSummary, CategoryBreakdown } from '../types';
import { CategoryTable } from './CategoryTable';
import { CategoryChart } from './CategoryChart';

interface CategoryBreakdownSectionProps {
  summary: AnalyticsSummary;
}

const formatSGD = (amount: number) =>
  new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
    maximumFractionDigits: 2,
  }).format(amount);

interface SectionProps {
  title: string;
  data: CategoryBreakdown[];
  color: string;
  emptyMessage: string;
}

function Section({ title, data, color, emptyMessage }: SectionProps) {
  return (
    <div className="bg-[var(--color-app-surface)] border border-[var(--color-app-border)] rounded-xl p-5 flex flex-col gap-5">
      <h2 className="text-base font-semibold">{title}</h2>
      {data.length === 0 ? (
        <p className="text-sm opacity-50 py-6 text-center">{emptyMessage}</p>
      ) : (
        <>
          <CategoryTable data={data} formatAmount={formatSGD} />
          <CategoryChart data={data} color={color} />
        </>
      )}
    </div>
  );
}

export function CategoryBreakdownSection({ summary }: CategoryBreakdownSectionProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Section
        title="Income"
        data={summary.incomeByCategory}
        color="#00e5a0"
        emptyMessage="No income transactions in this period."
      />
      <Section
        title="Expenses"
        data={summary.expensesByCategory}
        color="#ff3b5c"
        emptyMessage="No expense transactions in this period."
      />
    </div>
  );
}
