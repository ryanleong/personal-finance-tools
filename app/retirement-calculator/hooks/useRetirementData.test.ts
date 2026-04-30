import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useRetirementData } from './useRetirementData';
import { DEFAULT_INPUTS } from '../types';
import * as storage from '../lib/storage';

vi.mock('../lib/storage', () => ({
  loadInputs: vi.fn().mockResolvedValue(null),
  saveInputs: vi.fn().mockResolvedValue(undefined),
}));

describe('useRetirementData', () => {
  beforeEach(() => {
    vi.mocked(storage.loadInputs).mockResolvedValue(null);
  });

  it('returns inputs, setInputs, result shape', () => {
    const { result } = renderHook(() => useRetirementData());
    expect(result.current).toHaveProperty('inputs');
    expect(result.current).toHaveProperty('setInputs');
    expect(result.current).toHaveProperty('result');
    expect(typeof result.current.setInputs).toBe('function');
  });

  it('result.dataPoints is an array with correct length', () => {
    const { result } = renderHook(() => useRetirementData());
    const { result: calcResult, inputs } = result.current;
    expect(Array.isArray(calcResult.dataPoints)).toBe(true);
    // one entry per age from currentAge to endAge (inclusive)
    expect(calcResult.dataPoints.length).toBe(inputs.endAge - inputs.currentAge + 1);
  });

  it('result updates when setInputs changes inputs', () => {
    const { result } = renderHook(() => useRetirementData());
    const initialDataPoints = result.current.result.dataPoints;

    act(() => {
      result.current.setInputs({ annualSpending: 1 });
    });

    // With very low spending, the result should differ from default
    expect(result.current.result.dataPoints).not.toBe(initialDataPoints);
    expect(result.current.result.dataPoints.length).toBeGreaterThan(0);
  });

  it('result.isSuccessful is boolean', () => {
    const { result } = renderHook(() => useRetirementData());
    expect(typeof result.current.result.isSuccessful).toBe('boolean');
  });

  it('forwards initialInputs to useInputState', () => {
    const custom = { ...DEFAULT_INPUTS, currentAge: 45 };
    const { result } = renderHook(() => useRetirementData(custom));
    expect(result.current.inputs.currentAge).toBe(45);
  });

  it('result.depletionAge is null or number', () => {
    const { result } = renderHook(() => useRetirementData());
    const { depletionAge } = result.current.result;
    expect(depletionAge === null || typeof depletionAge === 'number').toBe(true);
  });
});
