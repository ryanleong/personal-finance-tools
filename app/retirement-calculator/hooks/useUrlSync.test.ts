import { renderHook } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useUrlSync } from './useUrlSync';
import { DEFAULT_INPUTS } from '../types';

const replace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => '/retirement-calculator',
}));

describe('useUrlSync', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    replace.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not call replace before the debounce window elapses', () => {
    renderHook(() => useUrlSync(DEFAULT_INPUTS));
    expect(replace).not.toHaveBeenCalled();
  });

  it('replaces with a bare pathname when inputs match defaults', async () => {
    renderHook(() => useUrlSync(DEFAULT_INPUTS));
    await vi.advanceTimersByTimeAsync(300);
    expect(replace).toHaveBeenCalledWith('/retirement-calculator', { scroll: false });
    expect(replace).toHaveBeenCalledTimes(1);
  });

  it('replaces with a query string reflecting non-default inputs', async () => {
    const inputs = { ...DEFAULT_INPUTS, currentAge: 35 };
    renderHook(() => useUrlSync(inputs));
    await vi.advanceTimersByTimeAsync(300);
    expect(replace).toHaveBeenCalledWith('/retirement-calculator?currentAge=35', { scroll: false });
  });

  it('cancels pending replace when inputs change before the debounce window', async () => {
    const { rerender } = renderHook(({ inputs }) => useUrlSync(inputs), {
      initialProps: { inputs: DEFAULT_INPUTS },
    });
    await vi.advanceTimersByTimeAsync(150);
    const updated = { ...DEFAULT_INPUTS, currentAge: 35 };
    rerender({ inputs: updated });
    expect(replace).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(300);
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith('/retirement-calculator?currentAge=35', { scroll: false });
  });
});
