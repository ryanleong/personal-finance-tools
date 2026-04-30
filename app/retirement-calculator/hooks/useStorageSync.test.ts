import { renderHook } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useStorageSync } from './useStorageSync';
import { DEFAULT_INPUTS } from '../types';
import * as storage from '../lib/storage';

vi.mock('../lib/storage', () => ({
  loadInputs: vi.fn().mockResolvedValue(null),
  saveInputs: vi.fn().mockResolvedValue(undefined),
}));

describe('useStorageSync', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(storage.saveInputs).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls saveInputs after 300ms', async () => {
    renderHook(() => useStorageSync(DEFAULT_INPUTS));
    expect(storage.saveInputs).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(300);
    expect(storage.saveInputs).toHaveBeenCalledWith(DEFAULT_INPUTS);
    expect(storage.saveInputs).toHaveBeenCalledTimes(1);
  });

  it('cancels pending write when inputs change before 300ms', async () => {
    const { rerender } = renderHook(
      ({ inputs }) => useStorageSync(inputs),
      { initialProps: { inputs: DEFAULT_INPUTS } },
    );
    // Change inputs before 300ms
    await vi.advanceTimersByTimeAsync(150);
    const updatedInputs = { ...DEFAULT_INPUTS, currentAge: 35 };
    rerender({ inputs: updatedInputs });
    // Still should not have saved yet
    expect(storage.saveInputs).not.toHaveBeenCalled();
    // Advance past the new 300ms debounce window
    await vi.advanceTimersByTimeAsync(300);
    expect(storage.saveInputs).toHaveBeenCalledTimes(1);
    expect(storage.saveInputs).toHaveBeenCalledWith(updatedInputs);
  });
});
