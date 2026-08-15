import { describe, it, expect } from 'vitest';
import { parseInputsFromParams, serializeInputsToParams } from './urlState';
import { DEFAULT_INPUTS, type RetirementInputs } from '../types';

describe('parseInputsFromParams', () => {
  it('returns an empty object when there are no params', () => {
    expect(parseInputsFromParams(new URLSearchParams())).toEqual({});
  });

  it('parses valid numeric fields', () => {
    const params = new URLSearchParams('currentAge=40&retirementAge=67&growthRate=8.5');
    expect(parseInputsFromParams(params)).toEqual({
      currentAge: 40,
      retirementAge: 67,
      growthRate: 8.5,
    });
  });

  it('skips numeric fields with non-numeric values', () => {
    const params = new URLSearchParams('currentAge=not-a-number');
    expect(parseInputsFromParams(params)).toEqual({});
  });

  it('parses a valid cpfPayoutLevel', () => {
    const params = new URLSearchParams('cpfPayoutLevel=full');
    expect(parseInputsFromParams(params)).toEqual({ cpfPayoutLevel: 'full' });
  });

  it('ignores an invalid cpfPayoutLevel', () => {
    const params = new URLSearchParams('cpfPayoutLevel=bogus');
    expect(parseInputsFromParams(params)).toEqual({});
  });

  it('ignores unknown keys', () => {
    const params = new URLSearchParams('utm_source=newsletter');
    expect(parseInputsFromParams(params)).toEqual({});
  });
});

describe('serializeInputsToParams', () => {
  it('omits fields equal to DEFAULT_INPUTS', () => {
    const params = serializeInputsToParams(DEFAULT_INPUTS);
    expect(params.toString()).toBe('');
  });

  it('includes only fields that differ from defaults', () => {
    const inputs: RetirementInputs = { ...DEFAULT_INPUTS, currentAge: 35, growthRate: 8 };
    const params = serializeInputsToParams(inputs);
    expect(params.get('currentAge')).toBe('35');
    expect(params.get('growthRate')).toBe('8');
    expect(params.has('retirementAge')).toBe(false);
  });

  it('includes cpfPayoutLevel when non-default', () => {
    const inputs: RetirementInputs = { ...DEFAULT_INPUTS, cpfPayoutLevel: 'enhanced' };
    const params = serializeInputsToParams(inputs);
    expect(params.get('cpfPayoutLevel')).toBe('enhanced');
  });

  it('round-trips non-default values through parse', () => {
    const inputs: RetirementInputs = {
      ...DEFAULT_INPUTS,
      currentAge: 42,
      monthlyContribution: 2500,
      cpfPayoutLevel: 'basic',
    };
    const parsed = parseInputsFromParams(serializeInputsToParams(inputs));
    expect({ ...DEFAULT_INPUTS, ...parsed }).toEqual(inputs);
  });
});
