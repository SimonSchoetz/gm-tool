import { describe, it, expect } from 'vitest';
import { LAZY_DM_STEPS, findLazyDmStep } from '../lazyDmSteps';

describe('findLazyDmStep', () => {
  it.each(LAZY_DM_STEPS)('returns the definition whose key is $key', (step) => {
    expect(findLazyDmStep(step.key)).toBe(step);
  });

  it('returns null for a null key', () => {
    expect(findLazyDmStep(null)).toBeNull();
  });
});
