export type CPFPayoutLevel = 'none' | 'basic' | 'full' | 'enhanced';

export interface RetirementInputs {
  currentAge: number;
  retirementAge: number;
  endAge: number;
  currentInvestedAmount: number;
  monthlyContribution: number;
  annualSpending: number;
  growthRate: number; // percentage, e.g. 7 for 7%
  inflationRate: number; // percentage, e.g. 3 for 3%
  cpfPayoutLevel: CPFPayoutLevel;
}

export interface DataPoint {
  age: number;
  balance: number;
  /** Annual investment contribution for this year (0 during decumulation). */
  contribution: number;
  /** Dollar amount the portfolio grew from investment returns this year. */
  growthAmount: number;
  /** Inflation-adjusted annual expenditure (0 during accumulation). */
  expenditure: number;
  /** Annual CPF payout received this year (0 if not yet 65 or no CPF selected). */
  cpfPayout: number;
}

export interface CalculationResult {
  dataPoints: DataPoint[];
  depletionAge: number | null;
  isSuccessful: boolean;
  /** Number of additional working years needed to make the plan succeed (null if already successful or cap exceeded). */
  additionalYearsToSuccess: number | null;
  /** Proposed retirement age = retirementAge + additionalYearsToSuccess (null if already successful or cap exceeded). */
  proposedRetirementAge: number | null;
  /** True when no solution was found within the 20-year additional-years cap. */
  maxYearsExceeded: boolean;
}

export const CPF_MONTHLY_PAYOUTS: Record<CPFPayoutLevel, number> = {
  none: 0,
  basic: 950,
  full: 1780,
  enhanced: 3440,
};

export const CPF_LABELS: Record<CPFPayoutLevel, string> = {
  none: 'None',
  basic: 'Basic ($950/mo)',
  full: 'Full ($1,780/mo)',
  enhanced: 'Enhanced ($3,440/mo)',
};

export const DEFAULT_INPUTS: RetirementInputs = {
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
