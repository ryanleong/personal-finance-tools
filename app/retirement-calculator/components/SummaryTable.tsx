'use client';

import type { CalculationResult } from '../types';

interface SummaryTableProps {
  result: CalculationResult;
  retirementAge: number;
  endAge: number;
}

function formatBalance(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}K`;
  return `${sign}$${abs.toLocaleString('en-US')}`;
}

const COLOR_SUCCESS = '#00e5a0';
const COLOR_FAIL = '#ff3b5c';

export function SummaryTable({ result, retirementAge, endAge }: SummaryTableProps) {
  const { dataPoints, isSuccessful, depletionAge, additionalYearsToSuccess, proposedRetirementAge, maxYearsExceeded } = result;

  const balanceAtRetirement = dataPoints.find((p) => p.age === retirementAge)?.balance ?? 0;
  const balanceAtDeath = dataPoints.find((p) => p.age === endAge)?.balance ?? 0;

  const statusColor = isSuccessful ? COLOR_SUCCESS : COLOR_FAIL;
  const statusBg = isSuccessful ? 'bg-[#00e5a0]/8 border-[#00e5a0]/25' : 'bg-[#ff3b5c]/8 border-[#ff3b5c]/25';

  return (
    <div className="flex flex-col gap-3">
      {/* Status row */}
      <div className={`flex items-center gap-2.5 px-4 py-2.5 border rounded-xl ${statusBg}`}>
        {isSuccessful ? (
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00e5a0] opacity-50" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00e5a0]" />
          </span>
        ) : (
          <span className="h-2 w-2 shrink-0 rounded-full bg-[#ff3b5c]" />
        )}
        <span className="text-sm font-semibold" style={{ color: statusColor }}>
          {isSuccessful
            ? `Portfolio lasts to age ${endAge} ✓`
            : `Portfolio depleted at age ${depletionAge} ✗`}
        </span>
      </div>

      {/* Summary table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-2.5 text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
                Milestone
              </th>
              <th className="text-right px-4 py-2.5 text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
                Portfolio Value
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border/60">
              <td className="px-4 py-3 text-muted-foreground">
                At retirement
                <span className="ml-1.5 text-[10px] font-mono text-muted-foreground/60">(age {retirementAge})</span>
              </td>
              <td className="px-4 py-3 text-right font-mono font-bold tabular-nums text-foreground">
                {formatBalance(balanceAtRetirement)}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-muted-foreground">
                At end of plan
                <span className="ml-1.5 text-[10px] font-mono text-muted-foreground/60">(age {endAge})</span>
              </td>
              <td
                className="px-4 py-3 text-right font-mono font-bold tabular-nums"
                style={{ color: balanceAtDeath < 0 ? COLOR_FAIL : 'var(--color-foreground)' }}
              >
                {formatBalance(balanceAtDeath)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Failure notice */}
      {!isSuccessful && (
        <div className="flex items-start gap-3 px-4 py-3 bg-[#ffb340]/8 border border-[#ffb340]/25 rounded-xl">
          <span className="text-[#ffb340] text-base leading-tight shrink-0 mt-px">âš </span>
          <p className="text-sm text-[#ffb340] leading-relaxed">
            {maxYearsExceeded ? (
              <>
                <span className="font-semibold">Cannot fix within 20 years â€” </span>
                Even retiring 20 years later does not make this plan successful. Consider
                increasing contributions or reducing spending.
              </>
            ) : (
              <>
                <span className="font-semibold">Suggested fix â€” </span>
                Retire at {proposedRetirementAge} (+{additionalYearsToSuccess} year
                {additionalYearsToSuccess !== 1 ? 's' : ''}) to reach your goal.
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
