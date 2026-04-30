import { useEffect } from 'react';
import type { RetirementInputs } from '../types';
import { saveInputs } from '../lib/storage';

const DEBOUNCE_MS = 300;

/**
 * Debounces writes to IndexedDB. Cancels any pending write if inputs
 * change again within DEBOUNCE_MS milliseconds.
 */
export function useStorageSync(inputs: RetirementInputs): void {
  useEffect(() => {
    const timer = setTimeout(() => {
      saveInputs(inputs);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [inputs]);
}
