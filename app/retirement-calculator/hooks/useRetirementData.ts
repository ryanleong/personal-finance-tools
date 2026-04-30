'use client';

import { useState, useEffect, useCallback } from 'react';
import type { RetirementInputs, CalculationResult } from '../types';
import { DEFAULT_INPUTS } from '../types';
import { calculate } from '../lib/calculator';
import { loadInputs, saveInputs } from '../lib/storage';

export function useRetirementData() {
  const [inputs, setInputsState] = useState<RetirementInputs>(DEFAULT_INPUTS);
  const [result, setResult] = useState<CalculationResult>(() => calculate(DEFAULT_INPUTS));

  // Load saved inputs from IndexedDB on mount
  useEffect(() => {
    loadInputs().then((saved) => {
      if (saved) setInputsState(saved);
    });
  }, []);

  // Recalculate immediately whenever inputs change
  useEffect(() => {
    setResult(calculate(inputs));
  }, [inputs]);

  // Auto-save to IndexedDB with debounce to avoid excessive writes
  useEffect(() => {
    const timer = setTimeout(() => saveInputs(inputs), 300);
    return () => clearTimeout(timer);
  }, [inputs]);

  const setInputs = useCallback((update: Partial<RetirementInputs>) => {
    setInputsState((prev) => ({ ...prev, ...update }));
  }, []);

  return { inputs, setInputs, result };
}
