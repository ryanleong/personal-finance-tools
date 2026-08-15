import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { RetirementInputs } from '../types';
import { serializeInputsToParams } from '../lib/urlState';

const DEBOUNCE_MS = 300;

/**
 * Debounces writes of the current inputs into the URL's query string via
 * router.replace, so shared links stay in sync without spamming history.
 */
export function useUrlSync(inputs: RetirementInputs): void {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const timer = setTimeout(() => {
      const query = serializeInputsToParams(inputs).toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [inputs, pathname, router]);
}
