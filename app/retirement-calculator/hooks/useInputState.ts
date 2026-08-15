import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { DEFAULT_INPUTS, type RetirementInputs } from '../types';
import { applyInputConstraints } from '../lib/constraints';
import { parseInputsFromParams } from '../lib/urlState';

interface UseInputStateReturn {
  inputs: RetirementInputs;
  setInputs: (update: Partial<RetirementInputs>) => void;
}

export function useInputState(initialInputs?: RetirementInputs): UseInputStateReturn {
  const searchParams = useSearchParams();
  const [inputs, setInputsState] = useState<RetirementInputs>(() =>
    initialInputs ?? applyInputConstraints(DEFAULT_INPUTS, parseInputsFromParams(searchParams)),
  );

  function setInputs(update: Partial<RetirementInputs>) {
    setInputsState((current) => applyInputConstraints(current, update));
  }

  return { inputs, setInputs };
}
