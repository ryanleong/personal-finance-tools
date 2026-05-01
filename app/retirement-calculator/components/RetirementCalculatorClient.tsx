'use client';

import type { RetirementInputs } from '../types';
import { useRetirementData } from '../hooks/useRetirementData';
import { InputPanel } from './InputPanel';
import { RetirementChart } from './RetirementChart';
import { SummaryTable } from './SummaryTable';
import { InflationWarning } from './InflationWarning';

interface RetirementCalculatorClientProps {
  initialInputs?: RetirementInputs;
}

export function RetirementCalculatorClient({ initialInputs }: RetirementCalculatorClientProps) {
  const { inputs, setInputs, result } = useRetirementData(initialInputs);

  return (
    <div className="flex flex-col lg:flex-row bg-[var(--color-app-bg)] text-[var(--color-app-text)] min-h-screen lg:h-screen lg:overflow-hidden">
      {/* ── Left sidebar: inputs ── */}
      <aside className="w-full lg:w-85 xl:w-92.5 lg:shrink-0 lg:h-full overflow-y-auto border-b border-[var(--color-app-border)] lg:border-b-0 lg:border-r lg:border-[var(--color-app-border)]">
        <InputPanel inputs={inputs} onChange={setInputs} />

        {/* Summary table: mobile only (below inputs) */}
        <div className="lg:hidden px-5 pb-5">
          <SummaryTable result={result} retirementAge={inputs.retirementAge} endAge={inputs.endAge} />
        </div>
      </aside>

      {/* ── Right area: warnings + chart + summary ── */}
      <main className="flex-1 flex flex-col p-5 lg:p-7 gap-4 min-w-0 overflow-hidden">
        {/* Inflation warning */}
        <div className="shrink-0">
          <InflationWarning
            inflationRate={inputs.inflationRate}
            growthRate={inputs.growthRate}
          />
        </div>

        {/* Chart */}
        <div className="flex-1 min-h-80 lg:min-h-0">
          <RetirementChart
            dataPoints={result.dataPoints}
            isSuccessful={result.isSuccessful}
            retirementAge={inputs.retirementAge}
            currentAge={inputs.currentAge}
            endAge={inputs.endAge}
            cpfPayoutLevel={inputs.cpfPayoutLevel}
          />
        </div>

        {/* Summary table: desktop only (below chart) */}
        <div className="hidden lg:block shrink-0">
          <SummaryTable result={result} retirementAge={inputs.retirementAge} endAge={inputs.endAge} />
        </div>
      </main>
    </div>
  );
}
