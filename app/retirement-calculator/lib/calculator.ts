import type { RetirementInputs, DataPoint, CalculationResult } from '../types';
import { CPF_MONTHLY_PAYOUTS } from '../types';

/** CPF Life payouts always start at this age, regardless of retirement age. */
const CPF_START_AGE = 65;

/** Maximum additional years to search when looking for a viable retirement age. */
const MAX_ADDITIONAL_YEARS = 20;

function runSimulation(inputs: RetirementInputs): { depletionAge: number | null; dataPoints: DataPoint[] } {
  const {
    currentAge,
    retirementAge,
    endAge,
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

  // Record starting balance (no growth/contribution/expenditure for the initial point)
  dataPoints.push({ age: currentAge, balance, contribution: 0, growthAmount: 0, expenditure: 0, cpfPayout: 0 });

  for (let age = currentAge + 1; age <= endAge; age++) {
    const growthAmount = balance * growth;

    if (age <= retirementAge) {
      // Accumulation phase: grow portfolio and add annual contributions
      const contribution = monthlyContribution * 12;
      balance = balance * (1 + growth) + contribution;
      dataPoints.push({ age, balance, contribution, growthAmount, expenditure: 0, cpfPayout: 0 });
    } else {
      // Decumulation phase: N=0 at first withdrawal year (age = retirementAge + 1)
      const n = age - retirementAge - 1;
      const expenditure = annualSpending * Math.pow(1 + inflation, n);
      // CPF only kicks in at CPF_START_AGE regardless of retirement age
      const cpfPayout = age >= CPF_START_AGE ? cpfAnnual : 0;
      balance = balance * (1 + growth) - expenditure + cpfPayout;
      dataPoints.push({ age, balance, contribution: 0, growthAmount, expenditure, cpfPayout });

      if (balance <= 0 && depletionAge === null) {
        depletionAge = age;
      }
    }
  }

  return { depletionAge, dataPoints };
}

export function calculate(inputs: RetirementInputs): CalculationResult {
  const { depletionAge, dataPoints } = runSimulation(inputs);
  const isSuccessful = depletionAge === null;

  if (isSuccessful) {
    return { dataPoints, depletionAge, isSuccessful, additionalYearsToSuccess: null, proposedRetirementAge: null, maxYearsExceeded: false };
  }

  // Search for the minimum additional years needed to make the plan succeed
  for (let extra = 1; extra <= MAX_ADDITIONAL_YEARS; extra++) {
    const { depletionAge: d } = runSimulation({ ...inputs, retirementAge: inputs.retirementAge + extra });
    if (d === null) {
      return {
        dataPoints,
        depletionAge,
        isSuccessful,
        additionalYearsToSuccess: extra,
        proposedRetirementAge: inputs.retirementAge + extra,
        maxYearsExceeded: false,
      };
    }
  }

  // Cap reached — no solution found within MAX_ADDITIONAL_YEARS
  return { dataPoints, depletionAge, isSuccessful, additionalYearsToSuccess: null, proposedRetirementAge: null, maxYearsExceeded: true };
}
