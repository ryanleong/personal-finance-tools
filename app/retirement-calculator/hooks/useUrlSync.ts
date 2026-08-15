import { useEffect } from 'react';
import type { RetirementInputs } from '../types';
import { serializeInputsToParams } from '../lib/urlState';

const DEBOUNCE_MS = 300;

/**
 * Debounces writes of the current inputs into the URL's query string via
 * history.replaceState, so shared links stay in sync without spamming history.
 *
 * Uses the native History API rather than next/navigation's router.replace:
 * on a statically-prerendered page whose initial hard load already carries
 * search params, the App Router's client-side canonical-URL tracking is
 * seeded without those params, which causes replace() calls that only
 * change the query string to be silently dropped. Bypassing the router
 * avoids that desync entirely — this is a pure cosmetic URL sync, not a
 * navigation, so there's nothing the router needs to reconcile.
 */
export function useUrlSync(inputs: RetirementInputs): void {
  useEffect(() => {
    const timer = setTimeout(() => {
      const query = serializeInputsToParams(inputs).toString();
      const href = query ? `${window.location.pathname}?${query}` : window.location.pathname;
      window.history.replaceState(null, '', href);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [inputs]);
}
