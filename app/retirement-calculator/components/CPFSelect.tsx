'use client';

import type { CPFPayoutLevel } from '../types';
import { CPF_LABELS } from '../types';

interface CPFSelectProps {
  value: CPFPayoutLevel;
  onChange: (v: CPFPayoutLevel) => void;
}

export function CPFSelect({ value, onChange }: CPFSelectProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <label className="text-[11px] font-semibold tracking-[0.15em] uppercase text-[#5a5a80]">
        CPF Life Payout
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as CPFPayoutLevel)}
          className="w-full bg-[#0c0c18] border border-[#222238] rounded-lg px-3 py-2.5 pr-8 text-sm text-[#f0f0f8] focus:outline-none focus:border-[#ff2d78] focus:ring-1 focus:ring-[#ff2d78]/20 transition-colors duration-150 appearance-none cursor-pointer"
        >
          {(Object.keys(CPF_LABELS) as CPFPayoutLevel[]).map((level) => (
            <option key={level} value={level} className="bg-[#14141f]">
              {CPF_LABELS[level]}
            </option>
          ))}
        </select>
        {/* Custom dropdown arrow */}
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#5a5a80]">
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}
