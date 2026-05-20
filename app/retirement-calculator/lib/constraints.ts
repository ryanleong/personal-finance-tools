import type { RetirementInputs } from '../types';

/**
 * Merges `update` into `current` then enforces the invariants:
 *   retirementAge >= currentAge
 *   retirementAge <= endAge
 *   conservativeAge >= currentAge
 *   conservativeAge <= endAge
 */
export function applyInputConstraints(
  current: RetirementInputs,
  update: Partial<RetirementInputs>,
): RetirementInputs {
  const merged: RetirementInputs = { ...current, ...update };

  // Clamp retirementAge into [currentAge, endAge]
  merged.retirementAge = Math.max(merged.retirementAge, merged.currentAge);
  merged.retirementAge = Math.min(merged.retirementAge, merged.endAge);

  // Clamp conservativeAge into [currentAge, endAge]
  merged.conservativeAge = Math.max(merged.conservativeAge, merged.currentAge);
  merged.conservativeAge = Math.min(merged.conservativeAge, merged.endAge);

  return merged;
}
