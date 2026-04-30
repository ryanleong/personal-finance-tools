import type { RetirementInputs } from '../types';

/**
 * Merges `update` into `current` then enforces the invariants:
 *   retirementAge >= currentAge
 *   retirementAge <= endAge
 */
export function applyInputConstraints(
  current: RetirementInputs,
  update: Partial<RetirementInputs>,
): RetirementInputs {
  const merged: RetirementInputs = { ...current, ...update };

  // Clamp retirementAge into [currentAge, endAge]
  merged.retirementAge = Math.max(merged.retirementAge, merged.currentAge);
  merged.retirementAge = Math.min(merged.retirementAge, merged.endAge);

  return merged;
}
