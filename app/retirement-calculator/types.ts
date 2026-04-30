export type CPFPayoutLevel = 'none' | 'basic' | 'full' | 'enhanced';

export interface RetirementInputs {
  currentAge: number;
  retirementAge: number;
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
}

export interface CalculationResult {
  dataPoints: DataPoint[];
  depletionAge: number | null;
  isSuccessful: boolean;
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
  currentInvestedAmount: 10000,
  monthlyContribution: 1000,
  annualSpending: 40000,
  growthRate: 7,
  inflationRate: 3,
  cpfPayoutLevel: 'none',
};
