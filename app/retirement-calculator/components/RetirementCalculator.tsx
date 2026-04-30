'use client';

import { useRetirementData } from '../hooks/useRetirementData';
import { InputPanel } from './InputPanel';
import { RetirementChart } from './RetirementChart';
import { StatusBadge } from './StatusBadge';
import { InflationWarning } from './InflationWarning';

export function RetirementCalculator() {
  const { inputs, setInputs, result } = useRetirementData();

  return (
    <div className="flex flex-col lg:flex-row bg-[#080810] text-[#f0f0f8] min-h-screen lg:h-screen lg:overflow-hidden">
      {/* ── Left sidebar: inputs ── */}
      <aside className="w-full lg:w-85 xl:w-92.5 lg:shrink-0 lg:h-full overflow-y-auto border-b border-[#14142a] lg:border-b-0 lg:border-r lg:border-[#14142a]">
        <InputPanel inputs={inputs} onChange={setInputs} />
      </aside>

      {/* ── Right area: status + chart ── */}
      <main className="flex-1 flex flex-col p-5 lg:p-7 gap-4 min-w-0 overflow-hidden">
        {/* Status indicator and warnings */}
        <div className="flex flex-col gap-2 shrink-0">
          <StatusBadge result={result} />
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
            cpfPayoutLevel={inputs.cpfPayoutLevel}
          />
        </div>
      </main>
    </div>
  );
}
