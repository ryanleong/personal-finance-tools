import { useState, useEffect } from 'react';
import { DEFAULT_INPUTS, type RetirementInputs } from '../types';
import { applyInputConstraints } from '../lib/constraints';
import { loadInputs } from '../lib/storage';

interface UseInputStateReturn {
  inputs: RetirementInputs;
  setInputs: (update: Partial<RetirementInputs>) => void;
}

export function useInputState(initialInputs?: RetirementInputs): UseInputStateReturn {
  const [inputs, setInputsState] = useState<RetirementInputs>(initialInputs ?? DEFAULT_INPUTS);

  useEffect(() => {
    loadInputs().then((saved) => {
      if (saved !== null) {
        setInputsState(saved);
      }
    });
  }, []);

  function setInputs(update: Partial<RetirementInputs>) {
    setInputsState((current) => applyInputConstraints(current, update));
  }

  return { inputs, setInputs };
}
