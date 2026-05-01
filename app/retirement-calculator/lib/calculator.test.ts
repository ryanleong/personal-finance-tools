import { describe, it, expect } from 'vitest';
import { calculate } from './calculator';
import type { RetirementInputs } from '../types';

// Slice 1: dataPoints array length

describe('dataPoints length', () => {
  it('equals (endAge - currentAge + 1)', () => {
    const inputs: RetirementInputs = {
      currentAge: 30,
      retirementAge: 65,
      endAge: 35,
      currentInvestedAmount: 10000,
      monthlyContribution: 1000,
      annualSpending: 0,
      growthRate: 7,
      inflationRate: 3,
      cpfPayoutLevel: 'none',
    };
    const { dataPoints } = calculate(inputs);
    expect(dataPoints).toHaveLength(35 - 30 + 1); // 6: ages 30–35
  });
});

// Slice 2: accumulation phase
describe('accumulation phase', () => {
  it('grows balance by (balance * (1 + growth)) + (monthlyContribution * 12) each year', () => {
    // growthRate=10 → growth=0.1, monthlyContribution=500 → annual=6000
    // Age 30: 10000
    // Age 31: 10000 * 1.1 + 6000 = 17000
    // Age 32: 17000 * 1.1 + 6000 = 24700
    const inputs: RetirementInputs = {
      currentAge: 30,
      retirementAge: 32,
      endAge: 32,
      currentInvestedAmount: 10000,
      monthlyContribution: 500,
      annualSpending: 0,
      growthRate: 10,
      inflationRate: 3,
      cpfPayoutLevel: 'none',
    };
    const { dataPoints } = calculate(inputs);
    expect(dataPoints[0]).toMatchObject({ age: 30, balance: 10000 });
    expect(dataPoints[1].balance).toBeCloseTo(17000);
    expect(dataPoints[2].balance).toBeCloseTo(24700);
  });

  it('records the starting balance as the first dataPoint without modification', () => {
    const inputs: RetirementInputs = {
      currentAge: 45,
      retirementAge: 65,
      endAge: 46,
      currentInvestedAmount: 250000,
      monthlyContribution: 2000,
      annualSpending: 0,
      growthRate: 5,
      inflationRate: 2,
      cpfPayoutLevel: 'none',
    };
    const { dataPoints } = calculate(inputs);
    expect(dataPoints[0]).toMatchObject({ age: 45, balance: 250000 });
  });
});

// Slice 3: decumulation phase
describe('decumulation phase', () => {
  it('subtracts non-inflated spending in the first withdrawal year (n=0)', () => {
    // n = age - retirementAge - 1; first year: n=0, inflatedSpending = annualSpending * 1^0 = annualSpending
    // growthRate=0 so no compounding; balance = 500000 - 20000 = 480000
    const inputs: RetirementInputs = {
      currentAge: 60,
      retirementAge: 60,
      endAge: 61,
      currentInvestedAmount: 500000,
      monthlyContribution: 0,
      annualSpending: 20000,
      growthRate: 0,
      inflationRate: 0,
      cpfPayoutLevel: 'none',
    };
    const { dataPoints } = calculate(inputs);
    expect(dataPoints[1].balance).toBeCloseTo(480000);
  });

  it('inflation-adjusts spending each subsequent year', () => {
    // n=0 → 20000 * 1.1^0 = 20000; balance = 480000
    // n=1 → 20000 * 1.1^1 = 22000; balance = 458000
    const inputs: RetirementInputs = {
      currentAge: 60,
      retirementAge: 60,
      endAge: 62,
      currentInvestedAmount: 500000,
      monthlyContribution: 0,
      annualSpending: 20000,
      growthRate: 0,
      inflationRate: 10,
      cpfPayoutLevel: 'none',
    };
    const { dataPoints } = calculate(inputs);
    expect(dataPoints[1].balance).toBeCloseTo(480000); // 500000 - 20000*(1.1^0)
    expect(dataPoints[2].balance).toBeCloseTo(458000); // 480000 - 20000*(1.1^1)
  });

  it('also applies portfolio growth during decumulation', () => {
    // growthRate=10, annualSpending=10000, n=0
    // balance = 100000 * 1.1 - 10000 = 100000
    const inputs: RetirementInputs = {
      currentAge: 60,
      retirementAge: 60,
      endAge: 61,
      currentInvestedAmount: 100000,
      monthlyContribution: 0,
      annualSpending: 10000,
      growthRate: 10,
      inflationRate: 0,
      cpfPayoutLevel: 'none',
    };
    const { dataPoints } = calculate(inputs);
    expect(dataPoints[1].balance).toBeCloseTo(100000); // 100000*1.1 - 10000 = 100000
  });
});

// Slice 4: CPF payout gating
describe('CPF payouts', () => {
  // growthRate=0, inflationRate=0, annualSpending=0 isolates CPF effect
  const cpfBase: RetirementInputs = {
    currentAge: 60,
    retirementAge: 60,
    endAge: 66,
    currentInvestedAmount: 1_000_000,
    monthlyContribution: 0,
    annualSpending: 0,
    growthRate: 0,
    inflationRate: 0,
    cpfPayoutLevel: 'full', // full = 1780/mo = 21360/yr
  };

  it('adds 0 CPF payout before age 65', () => {
    const { dataPoints } = calculate(cpfBase);
    // ages 61–64 are in decumulation but below CPF_START_AGE
    expect(dataPoints[1].balance).toBeCloseTo(1_000_000); // age 61
    expect(dataPoints[4].balance).toBeCloseTo(1_000_000); // age 64
  });

  it('adds CPF annual payout from age 65 onward', () => {
    const { dataPoints } = calculate(cpfBase);
    // age 65 → 1000000 + 21360 = 1021360
    // age 66 → 1021360 + 21360 = 1042720
    expect(dataPoints[5].balance).toBeCloseTo(1_021_360); // age 65
    expect(dataPoints[6].balance).toBeCloseTo(1_042_720); // age 66
  });

  it('applies correct annual amount for each CPF level', () => {
    const levels: Array<[RetirementInputs['cpfPayoutLevel'], number]> = [
      ['none', 0],
      ['basic', 950 * 12],    // 11400
      ['full', 1780 * 12],    // 21360
      ['enhanced', 3440 * 12], // 41280
    ];
    for (const [level, expectedAnnual] of levels) {
      const { dataPoints } = calculate({ ...cpfBase, endAge: 65, cpfPayoutLevel: level });
      // age 65, no spending/growth: balance = 1000000 + expectedAnnual
      expect(dataPoints[5].balance).toBeCloseTo(1_000_000 + expectedAnnual);
    }
  });

  it('does not apply CPF during accumulation phase even if age >= 65', () => {
    // retirementAge=70 means ages 61–70 are accumulation, no CPF branch runs
    // At age 65, we're in accumulation: balance grows by 0 (growthRate=0) + 0 (monthlyContribution=0)
    const inputs: RetirementInputs = {
      ...cpfBase,
      retirementAge: 70,
      endAge: 71,
    };
    const { dataPoints } = calculate(inputs);
    // ages 61–70 accumulation: balance stays at 1000000 (growth=0, contribution=0)
    const age65Point = dataPoints.find((p) => p.age === 65);
    expect(age65Point?.balance).toBeCloseTo(1_000_000);
    // age 71 enters decumulation AND is >= 65, so CPF applies
    const age71Point = dataPoints.find((p) => p.age === 71);
    expect(age71Point?.balance).toBeCloseTo(1_000_000 + 1780 * 12);
  });
});

// Slice 5: isSuccessful and depletionAge
describe('isSuccessful and depletionAge', () => {
  it('returns isSuccessful=true and depletionAge=null when balance stays positive', () => {
    // 1000000 balance, only 100/yr spending, 2 years → always positive
    const inputs: RetirementInputs = {
      currentAge: 60,
      retirementAge: 60,
      endAge: 62,
      currentInvestedAmount: 1_000_000,
      monthlyContribution: 0,
      annualSpending: 100,
      growthRate: 0,
      inflationRate: 0,
      cpfPayoutLevel: 'none',
    };
    const result = calculate(inputs);
    expect(result.isSuccessful).toBe(true);
    expect(result.depletionAge).toBeNull();
  });

  it('sets depletionAge to the first age balance drops to 0 or below', () => {
    // balance=15000, spending=10000/yr, growthRate=0, inflationRate=0
    // age 60 → 15000
    // age 61 (n=0) → 15000 - 10000 = 5000
    // age 62 (n=1) → 5000 - 10000 = -5000  ← depleted here
    const inputs: RetirementInputs = {
      currentAge: 60,
      retirementAge: 60,
      endAge: 65,
      currentInvestedAmount: 15000,
      monthlyContribution: 0,
      annualSpending: 10000,
      growthRate: 0,
      inflationRate: 0,
      cpfPayoutLevel: 'none',
    };
    const result = calculate(inputs);
    expect(result.depletionAge).toBe(62);
    expect(result.isSuccessful).toBe(false);
  });

  it('records only the first depletion age even when balance stays negative', () => {
    // Same as above: depletionAge must be 62, not updated again at 63, 64, 65
    const inputs: RetirementInputs = {
      currentAge: 60,
      retirementAge: 60,
      endAge: 65,
      currentInvestedAmount: 15000,
      monthlyContribution: 0,
      annualSpending: 10000,
      growthRate: 0,
      inflationRate: 0,
      cpfPayoutLevel: 'none',
    };
    const { depletionAge } = calculate(inputs);
    expect(depletionAge).toBe(62);
  });
});

// Issue 1: per-year breakdown fields on DataPoint
describe('per-year breakdown fields', () => {
  // Base inputs: growthRate=10, no inflation, no CPF, retire at 65
  const base: RetirementInputs = {
    currentAge: 64,
    retirementAge: 65,
    endAge: 67,
    currentInvestedAmount: 100_000,
    monthlyContribution: 500,
    annualSpending: 20_000,
    growthRate: 10,
    inflationRate: 5,
    cpfPayoutLevel: 'none',
  };

  it('accumulation year: contribution equals monthlyContribution * 12', () => {
    const { dataPoints } = calculate(base);
    // age 65 is the last accumulation year (age <= retirementAge)
    const age65 = dataPoints.find((p) => p.age === 65)!;
    expect(age65.contribution).toBeCloseTo(500 * 12);
  });

  it('accumulation year: expenditure is 0', () => {
    const { dataPoints } = calculate(base);
    const age65 = dataPoints.find((p) => p.age === 65)!;
    expect(age65.expenditure).toBe(0);
  });

  it('accumulation year: growthAmount equals start-of-year balance * growthRate', () => {
    const { dataPoints } = calculate(base);
    // age 65 growth: 100_000 * 0.10 = 10_000
    const age65 = dataPoints.find((p) => p.age === 65)!;
    expect(age65.growthAmount).toBeCloseTo(100_000 * 0.10);
  });

  it('decumulation year: contribution is 0', () => {
    const { dataPoints } = calculate(base);
    // age 66 is first decumulation year
    const age66 = dataPoints.find((p) => p.age === 66)!;
    expect(age66.contribution).toBe(0);
  });

  it('decumulation year: expenditure equals inflated spending (n=0 for first year)', () => {
    const { dataPoints } = calculate(base);
    // n = age - retirementAge - 1 = 66 - 65 - 1 = 0 → spending * (1.05)^0 = 20000
    const age66 = dataPoints.find((p) => p.age === 66)!;
    expect(age66.expenditure).toBeCloseTo(20_000 * Math.pow(1.05, 0));
  });

  it('decumulation year: expenditure inflates in subsequent years', () => {
    const { dataPoints } = calculate(base);
    // age 67: n=1 → 20000 * 1.05^1 = 21000
    const age67 = dataPoints.find((p) => p.age === 67)!;
    expect(age67.expenditure).toBeCloseTo(20_000 * Math.pow(1.05, 1));
  });

  it('decumulation year: growthAmount equals start-of-year balance * growthRate', () => {
    const { dataPoints } = calculate(base);
    // age 65 balance (after accumulation): 100_000 * 1.10 + 500*12 = 116_000
    // age 66 growth: 116_000 * 0.10 = 11_600
    const age65 = dataPoints.find((p) => p.age === 65)!;
    const age66 = dataPoints.find((p) => p.age === 66)!;
    expect(age66.growthAmount).toBeCloseTo(age65.balance * 0.10);
  });

  it('cpfPayout is 0 during accumulation even if age >= 65', () => {
    // retirementAge=70 means age 65 is in accumulation
    const inputs: RetirementInputs = {
      ...base,
      retirementAge: 70,
      endAge: 70,
      cpfPayoutLevel: 'full',
    };
    const { dataPoints } = calculate(inputs);
    const age65 = dataPoints.find((p) => p.age === 65)!;
    expect(age65.cpfPayout).toBe(0);
  });

  it('cpfPayout is 0 before age 65 in decumulation with CPF selected', () => {
    // retire at 60, full CPF, age 64 should have 0 payout
    const inputs: RetirementInputs = {
      currentAge: 60,
      retirementAge: 60,
      endAge: 66,
      currentInvestedAmount: 1_000_000,
      monthlyContribution: 0,
      annualSpending: 0,
      growthRate: 0,
      inflationRate: 0,
      cpfPayoutLevel: 'full',
    };
    const { dataPoints } = calculate(inputs);
    const age64 = dataPoints.find((p) => p.age === 64)!;
    expect(age64.cpfPayout).toBe(0);
  });

  it('cpfPayout equals annual CPF amount from age 65 onward in decumulation', () => {
    const inputs: RetirementInputs = {
      currentAge: 60,
      retirementAge: 60,
      endAge: 66,
      currentInvestedAmount: 1_000_000,
      monthlyContribution: 0,
      annualSpending: 0,
      growthRate: 0,
      inflationRate: 0,
      cpfPayoutLevel: 'full', // 1780/mo * 12 = 21360/yr
    };
    const { dataPoints } = calculate(inputs);
    const age65 = dataPoints.find((p) => p.age === 65)!;
    expect(age65.cpfPayout).toBeCloseTo(1780 * 12);
  });
});

// Issue 2: additional years to success
describe('additionalYearsToSuccess', () => {
  // A plan that is already successful
  const successInputs: RetirementInputs = {
    currentAge: 30,
    retirementAge: 65,
    endAge: 90,
    currentInvestedAmount: 500_000,
    monthlyContribution: 2000,
    annualSpending: 30_000,
    growthRate: 7,
    inflationRate: 3,
    cpfPayoutLevel: 'none',
  };

  // A plan that fails with retirementAge=55 but can be fixed within 20 years
  // Portfolio of ~1.3M at 55 but spending 100K/yr (7.7% withdrawal) — will deplete
  // But at retirementAge ~65+ the larger portfolio makes it viable
  const failInputs: RetirementInputs = {
    currentAge: 30,
    retirementAge: 55,
    endAge: 90,
    currentInvestedAmount: 100_000,
    monthlyContribution: 1000,
    annualSpending: 100_000,
    growthRate: 7,
    inflationRate: 3,
    cpfPayoutLevel: 'none',
  };

  it('returns additionalYearsToSuccess=null when plan is already successful', () => {
    const result = calculate(successInputs);
    expect(result.additionalYearsToSuccess).toBeNull();
  });

  it('returns proposedRetirementAge=null when plan is already successful', () => {
    const result = calculate(successInputs);
    expect(result.proposedRetirementAge).toBeNull();
  });

  it('returns maxYearsExceeded=false when plan is already successful', () => {
    const result = calculate(successInputs);
    expect(result.maxYearsExceeded).toBe(false);
  });

  it('returns a positive additionalYearsToSuccess when plan fails but fix is within 20 years', () => {
    const result = calculate(failInputs);
    expect(result.additionalYearsToSuccess).not.toBeNull();
    expect(result.additionalYearsToSuccess!).toBeGreaterThan(0);
    expect(result.additionalYearsToSuccess!).toBeLessThanOrEqual(20);
  });

  it('proposedRetirementAge equals retirementAge + additionalYearsToSuccess', () => {
    const result = calculate(failInputs);
    expect(result.proposedRetirementAge).toBe(
      failInputs.retirementAge + result.additionalYearsToSuccess!
    );
  });

  it('the plan IS successful when re-run at proposedRetirementAge', () => {
    const result = calculate(failInputs);
    const fixedResult = calculate({
      ...failInputs,
      retirementAge: result.proposedRetirementAge!,
    });
    expect(fixedResult.isSuccessful).toBe(true);
  });

  it('sets maxYearsExceeded=true and additionalYearsToSuccess=null when 20-year cap is reached', () => {
    // Extreme failure: near-zero savings, massive spending → cannot be fixed in 20 years
    const impossibleInputs: RetirementInputs = {
      currentAge: 30,
      retirementAge: 35,
      endAge: 90,
      currentInvestedAmount: 1_000,
      monthlyContribution: 10,
      annualSpending: 200_000,
      growthRate: 3,
      inflationRate: 3,
      cpfPayoutLevel: 'none',
    };
    const result = calculate(impossibleInputs);
    expect(result.maxYearsExceeded).toBe(true);
    expect(result.additionalYearsToSuccess).toBeNull();
    expect(result.proposedRetirementAge).toBeNull();
  });

  it('sets maxYearsExceeded=false when a solution is found within 20 years', () => {
    const result = calculate(failInputs);
    expect(result.maxYearsExceeded).toBe(false);
  });
});
