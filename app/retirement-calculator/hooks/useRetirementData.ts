import { useMemo } from 'react';
import type { RetirementInputs } from '../types';
import { calculate } from '../lib/calculator';
import { useInputState } from './useInputState';
import { useUrlSync } from './useUrlSync';

export function useRetirementData(initialInputs?: RetirementInputs) {
  const { inputs, setInputs } = useInputState(initialInputs);

  useUrlSync(inputs);

  const result = useMemo(() => calculate(inputs), [inputs]);

  return { inputs, setInputs, result };
}
