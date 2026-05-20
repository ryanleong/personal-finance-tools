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
  conservativeAge: 55,
  conservativeGrowthRate: 4,
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

describe('applyInputConstraints: conservativeAge clamping', () => {
  it('no-op: returns conservativeAge unchanged when within [currentAge, endAge]', () => {
    const result = applyInputConstraints(base, { conservativeAge: 55 });
    expect(result.conservativeAge).toBe(55);
  });

  it('conservativeAge set below currentAge: clamps up to currentAge', () => {
    const result = applyInputConstraints(base, { conservativeAge: 20 });
    expect(result.conservativeAge).toBe(base.currentAge);
  });

  it('conservativeAge set above endAge: clamps down to endAge', () => {
    const result = applyInputConstraints(base, { conservativeAge: 120 });
    expect(result.conservativeAge).toBe(base.endAge);
  });

  it('currentAge raised beyond conservativeAge: conservativeAge clamps up to new currentAge', () => {
    // conservativeAge=55 but currentAge jumps to 60 → conservativeAge must clamp to 60
    const result = applyInputConstraints(base, { currentAge: 60 });
    expect(result.conservativeAge).toBe(60);
  });

  it('endAge lowered below conservativeAge: conservativeAge clamps down to new endAge', () => {
    // conservativeAge=55 but endAge drops to 50 → conservativeAge must clamp to 50
    const result = applyInputConstraints(base, { endAge: 50 });
    expect(result.conservativeAge).toBe(50);
  });
});
