import type { CalculationResult } from '../types';

interface StatusBadgeProps {
  result: CalculationResult;
}

export function StatusBadge({ result }: StatusBadgeProps) {
  if (result.isSuccessful) {
    return (
      <div className="flex items-center gap-2.5 px-4 py-2.5 bg-[#00e5a0]/8 border border-[#00e5a0]/25 rounded-xl">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00e5a0] opacity-50" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00e5a0]" />
        </span>
        <span className="text-sm font-semibold text-[#00e5a0]">
          Portfolio lasts to age 100 ✓
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5 px-4 py-2.5 bg-[#ff3b5c]/8 border border-[#ff3b5c]/25 rounded-xl">
      <span className="h-2 w-2 shrink-0 rounded-full bg-[#ff3b5c]" />
      <span className="text-sm font-semibold text-[#ff3b5c]">
        Portfolio depleted at age {result.depletionAge} ✗
      </span>
    </div>
  );
}
