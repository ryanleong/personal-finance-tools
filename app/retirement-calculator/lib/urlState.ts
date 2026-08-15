import { CPF_LABELS, DEFAULT_INPUTS, type CPFPayoutLevel, type RetirementInputs } from '../types';

const NUMERIC_KEYS = [
  'currentAge',
  'retirementAge',
  'endAge',
  'currentInvestedAmount',
  'monthlyContribution',
  'annualSpending',
  'growthRate',
  'inflationRate',
  'conservativeAge',
  'conservativeGrowthRate',
] as const satisfies readonly (keyof RetirementInputs)[];

const CPF_PAYOUT_LEVELS = Object.keys(CPF_LABELS) as CPFPayoutLevel[];

export function parseInputsFromParams(params: URLSearchParams): Partial<RetirementInputs> {
  const result: Partial<RetirementInputs> = {};

  for (const key of NUMERIC_KEYS) {
    const raw = params.get(key);
    if (raw === null) continue;
    const value = Number(raw);
    if (Number.isFinite(value)) {
      result[key] = value;
    }
  }

  const cpfRaw = params.get('cpfPayoutLevel');
  if (cpfRaw !== null && CPF_PAYOUT_LEVELS.includes(cpfRaw as CPFPayoutLevel)) {
    result.cpfPayoutLevel = cpfRaw as CPFPayoutLevel;
  }

  return result;
}

export function serializeInputsToParams(inputs: RetirementInputs): URLSearchParams {
  const params = new URLSearchParams();

  for (const key of NUMERIC_KEYS) {
    if (inputs[key] !== DEFAULT_INPUTS[key]) {
      params.set(key, String(inputs[key]));
    }
  }

  if (inputs.cpfPayoutLevel !== DEFAULT_INPUTS.cpfPayoutLevel) {
    params.set('cpfPayoutLevel', inputs.cpfPayoutLevel);
  }

  return params;
}
