'use client';

import type { RetirementInputs } from '../types';
import { SliderInput } from './SliderInput';
import { CurrencyInput } from './CurrencyInput';
import { CPFSelect } from './CPFSelect';

interface InputPanelProps {
  inputs: RetirementInputs;
  onChange: (update: Partial<RetirementInputs>) => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-[#1c1c2e]" />
        <span className="text-[9px] font-bold tracking-[0.25em] uppercase text-[#ff2d78]">
          {title}
        </span>
        <div className="h-px flex-1 bg-[#1c1c2e]" />
      </div>
      <div className="flex flex-col gap-5">{children}</div>
    </div>
  );
}

export function InputPanel({ inputs, onChange }: InputPanelProps) {
  return (
    <div className="flex flex-col gap-7 p-6">
      {/* Header */}
      <div className="pt-2">
        <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-[#ff2d78] mb-1.5">
          Plan Your
        </p>
        <h1
          className="text-[28px] font-extrabold leading-none text-[#f0f0f8]"
          style={{ fontFamily: 'var(--font-syne, sans-serif)' }}
        >
          Retirement
        </h1>
        <p className="text-xs text-[#40405a] mt-1.5">
          Will your money last until age {inputs.endAge}?
        </p>
      </div>

      <Section title="Timeline">
        <SliderInput
          label="Current Age"
          value={inputs.currentAge}
          min={18}
          max={99}
          onChange={(v) =>
            onChange({
              currentAge: v,
              retirementAge: Math.max(inputs.retirementAge, v),
            })
          }
        />
        <SliderInput
          label="Retirement Age"
          value={inputs.retirementAge}
          min={inputs.currentAge}
          max={inputs.endAge}
          onChange={(v) => onChange({ retirementAge: v })}
        />
        <SliderInput
          label="End Age"
          value={inputs.endAge}
          min={Math.max(inputs.retirementAge, inputs.currentAge + 1)}
          max={150}
          onChange={(v) =>
            onChange({
              endAge: v,
              retirementAge: Math.min(inputs.retirementAge, v),
            })
          }
        />
      </Section>

      <Section title="Portfolio">
        <CurrencyInput
          label="Current Invested Amount"
          value={inputs.currentInvestedAmount}
          onChange={(v) => onChange({ currentInvestedAmount: v })}
        />
        <CurrencyInput
          label="Monthly Contribution"
          value={inputs.monthlyContribution}
          onChange={(v) => onChange({ monthlyContribution: v })}
        />
      </Section>

      <Section title="Spending">
        <CurrencyInput
          label="Annual Spending (Net)"
          value={inputs.annualSpending}
          onChange={(v) => onChange({ annualSpending: v })}
        />
        <CPFSelect
          value={inputs.cpfPayoutLevel}
          onChange={(v) => onChange({ cpfPayoutLevel: v })}
        />
      </Section>

      <Section title="Rates">
        <SliderInput
          label="Investment Growth Rate"
          value={inputs.growthRate}
          min={0}
          max={40}
          step={0.5}
          format={(v) => `${v.toFixed(1)}%`}
          onChange={(v) => onChange({ growthRate: v })}
        />
        <SliderInput
          label="Inflation Rate"
          value={inputs.inflationRate}
          min={0}
          max={15}
          step={0.5}
          format={(v) => `${v.toFixed(1)}%`}
          onChange={(v) => onChange({ inflationRate: v })}
        />
      </Section>
    </div>
  );
}
