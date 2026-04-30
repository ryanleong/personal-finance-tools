import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useInputState } from './useInputState';
import { DEFAULT_INPUTS, type RetirementInputs } from '../types';
import * as storage from '../lib/storage';

vi.mock('../lib/storage', () => ({
  loadInputs: vi.fn().mockResolvedValue(null),
  saveInputs: vi.fn().mockResolvedValue(undefined),
}));

const savedInputs: RetirementInputs = {
  ...DEFAULT_INPUTS,
  currentAge: 40,
  retirementAge: 65,
};

describe('useInputState', () => {
  beforeEach(() => {
    vi.mocked(storage.loadInputs).mockResolvedValue(null);
  });

  it('starts with DEFAULT_INPUTS before async load', () => {
    const { result } = renderHook(() => useInputState());
    expect(result.current.inputs).toEqual(DEFAULT_INPUTS);
  });

  it('replaces state with IndexedDB value on mount', async () => {
    vi.mocked(storage.loadInputs).mockResolvedValue(savedInputs);
    const { result } = renderHook(() => useInputState());
    expect(result.current.inputs).toEqual(DEFAULT_INPUTS);
    await act(async () => {});
    expect(result.current.inputs).toEqual(savedInputs);
  });

  it('setInputs applies applyInputConstraints', async () => {
    const { result } = renderHook(() => useInputState());
    await act(async () => {});
    act(() => {
      result.current.setInputs({ currentAge: 50, retirementAge: 40 });
    });
    expect(result.current.inputs.retirementAge).toBe(50);
  });

  it('accepts initialInputs override as starting value', () => {
    const custom: RetirementInputs = { ...DEFAULT_INPUTS, currentAge: 45 };
    const { result } = renderHook(() => useInputState(custom));
    expect(result.current.inputs.currentAge).toBe(45);
  });
});
