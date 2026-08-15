import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useInputState } from './useInputState';
import { DEFAULT_INPUTS, type RetirementInputs } from '../types';

const mockSearchParams = { current: new URLSearchParams() };

vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams.current,
}));

describe('useInputState', () => {
  beforeEach(() => {
    mockSearchParams.current = new URLSearchParams();
  });

  it('starts with DEFAULT_INPUTS when the URL has no params', () => {
    const { result } = renderHook(() => useInputState());
    expect(result.current.inputs).toEqual(DEFAULT_INPUTS);
  });

  it('hydrates from URL search params on mount', () => {
    mockSearchParams.current = new URLSearchParams('currentAge=40&retirementAge=65');
    const { result } = renderHook(() => useInputState());
    expect(result.current.inputs).toEqual({ ...DEFAULT_INPUTS, currentAge: 40, retirementAge: 65 });
  });

  it('applies constraints to values hydrated from the URL', () => {
    mockSearchParams.current = new URLSearchParams('currentAge=70');
    const { result } = renderHook(() => useInputState());
    // retirementAge default (65) is below currentAge (70) → must clamp up
    expect(result.current.inputs.retirementAge).toBe(70);
  });

  it('setInputs applies applyInputConstraints', () => {
    const { result } = renderHook(() => useInputState());
    act(() => {
      result.current.setInputs({ currentAge: 50, retirementAge: 40 });
    });
    expect(result.current.inputs.retirementAge).toBe(50);
  });

  it('accepts initialInputs override as starting value, ignoring the URL', () => {
    mockSearchParams.current = new URLSearchParams('currentAge=99');
    const custom: RetirementInputs = { ...DEFAULT_INPUTS, currentAge: 45 };
    const { result } = renderHook(() => useInputState(custom));
    expect(result.current.inputs.currentAge).toBe(45);
  });
});
