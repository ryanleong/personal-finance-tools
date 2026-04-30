import type { RetirementInputs, DataPoint, CalculationResult } from '../types';
import { CPF_MONTHLY_PAYOUTS } from '../types';

/** CPF Life payouts always start at this age, regardless of retirement age. */
const CPF_START_AGE = 65;

export function calculate(inputs: RetirementInputs): CalculationResult {
  const {
    currentAge,
    retirementAge,
    currentInvestedAmount,
    monthlyContribution,
    annualSpending,
    growthRate,
    inflationRate,
    cpfPayoutLevel,
  } = inputs;

  const growth = growthRate / 100;
  const inflation = inflationRate / 100;
  const cpfAnnual = CPF_MONTHLY_PAYOUTS[cpfPayoutLevel] * 12;

  const dataPoints: DataPoint[] = [];
  let balance = currentInvestedAmount;
  let depletionAge: number | null = null;

  // Record starting balance
  dataPoints.push({ age: currentAge, balance });

  for (let age = currentAge + 1; age <= 100; age++) {
    if (age <= retirementAge) {
      // Accumulation phase: grow portfolio and add annual contributions
      balance = balance * (1 + growth) + monthlyContribution * 12;
    } else {
      // Decumulation phase: N=0 at first withdrawal year (age = retirementAge + 1)
      const n = age - retirementAge - 1;
      const inflatedSpending = annualSpending * Math.pow(1 + inflation, n);
      // CPF only kicks in at CPF_START_AGE regardless of retirement age
      const cpfPayout = age >= CPF_START_AGE ? cpfAnnual : 0;
      balance = balance * (1 + growth) - inflatedSpending + cpfPayout;

      if (balance <= 0 && depletionAge === null) {
        depletionAge = age;
      }
    }

    dataPoints.push({ age, balance });
  }

  return {
    dataPoints,
    depletionAge,
    isSuccessful: depletionAge === null,
  };
}
