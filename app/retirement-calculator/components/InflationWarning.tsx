interface InflationWarningProps {
  inflationRate: number;
  growthRate: number;
}

export function InflationWarning({ inflationRate, growthRate }: InflationWarningProps) {
  if (inflationRate <= growthRate) return null;

  return (
    <div className="flex items-start gap-3 px-4 py-3 bg-[#ffb340]/8 border border-[#ffb340]/25 rounded-xl">
      <span className="text-[#ffb340] text-base leading-tight shrink-0 mt-px">⚠</span>
      <p className="text-sm text-[#ffb340] leading-relaxed">
        <span className="font-semibold">Negative real return — </span>
        Inflation ({inflationRate}%) exceeds your growth rate ({growthRate}%). Purchasing power
        is eroding in real terms.
      </p>
    </div>
  );
}
