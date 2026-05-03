'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { CategoryBreakdown } from '../types';
import { TransactionList } from './TransactionList';

interface CategoryTableProps {
  data: CategoryBreakdown[];
  formatAmount: (n: number) => string;
}

export function CategoryTable({ data, formatAmount }: CategoryTableProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border">
          <th className="text-left font-medium opacity-60 pb-2 pr-4">Category</th>
          <th className="text-right font-medium opacity-60 pb-2 pr-4">Amount (SGD)</th>
          <th className="text-right font-medium opacity-60 pb-2">% of Total</th>
        </tr>
      </thead>
      <tbody>
        {data.map((breakdown) => {
          const isExpanded = expandedCategory === breakdown.category;
          return (
            <React.Fragment key={breakdown.category}>
              <tr
                className="border-b border-border cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() =>
                  setExpandedCategory((prev) =>
                    prev === breakdown.category ? null : breakdown.category,
                  )
                }
              >
                <td className="py-2.5 pr-4 flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown size={14} className="flex-shrink-0 opacity-60" />
                  ) : (
                    <ChevronRight size={14} className="flex-shrink-0 opacity-60" />
                  )}
                  {breakdown.category}
                </td>
                <td className="py-2.5 pr-4 text-right tabular-nums">
                  {formatAmount(breakdown.amount)}
                </td>
                <td className="py-2.5 text-right tabular-nums opacity-70">
                  {breakdown.percentage.toFixed(1)}%
                </td>
              </tr>
              {isExpanded && (
                <tr className="bg-white/5">
                  <td colSpan={3} className="py-3 px-4">
                    <TransactionList transactions={breakdown.transactions} />
                  </td>
                </tr>
              )}
            </React.Fragment>
          );
        })}
      </tbody>
    </table>
  );
}
