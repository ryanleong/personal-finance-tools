import { describe, it, expect } from 'vitest';
import { applyInputConstraints } from './constraints';
import type { RetirementInputs } from '../types';

const base: RetirementInputs = {
  currentAge: 30,
  retirementAge: 65,
  endAge: 100,
  currentInvestedAmount: 10000,
  monthlyContribution: 1000,
  annualSpending: 40000,
  growthRate: 7,
  inflationRate: 3,
  cpfPayoutLevel: 'none',
};

describe('applyInputConstraints', () => {
  it('no-op: returns merged state when no constraint is violated', () => {
    const result = applyInputConstraints(base, { monthlyContribution: 2000 });
    expect(result).toEqual({ ...base, monthlyContribution: 2000 });
  });

  it('currentAge raised above retirementAge: clamps retirementAge up to currentAge', () => {
    // currentAge jumps to 70, retirementAge was 65 → must clamp to 70
    const result = applyInputConstraints(base, { currentAge: 70 });
    expect(result.retirementAge).toBe(70);
    expect(result.currentAge).toBe(70);
  });

  it('endAge lowered below retirementAge: clamps retirementAge down to endAge', () => {
    // endAge drops to 60, retirementAge was 65 → must clamp to 60
    const result = applyInputConstraints(base, { endAge: 60 });
    expect(result.retirementAge).toBe(60);
    expect(result.endAge).toBe(60);
  });

  it('retirementAge set directly below currentAge: clamps up to currentAge', () => {
    // retirementAge explicitly set to 20, currentAge is 30 → must clamp to 30
    const result = applyInputConstraints(base, { retirementAge: 20 });
    expect(result.retirementAge).toBe(30);
  });

  it('retirementAge set directly above endAge: clamps down to endAge', () => {
    // retirementAge explicitly set to 110, endAge is 100 → must clamp to 100
    const result = applyInputConstraints(base, { retirementAge: 110 });
    expect(result.retirementAge).toBe(100);
  });
});
