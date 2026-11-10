import { describe, it, expect } from 'vitest';
import { LAZY_DM_STEP_KEYS } from '../lazyDmStepKeys';
import { LAZY_DM_STEPS, findLazyDmStep } from '../lazyDmSteps';

describe('findLazyDmStep', () => {
  it.each(LAZY_DM_STEPS)('returns the definition whose key is $key', (step) => {
    expect(findLazyDmStep(step.key)).toBe(step);
  });

  it('returns null for a null key', () => {
    expect(findLazyDmStep(null)).toBeNull();
  });
});

describe('LAZY_DM_STEPS', () => {
  it('defines one step per lazy DM step key, in the key order, since stored steps refer to a step by its key', () => {
    expect(LAZY_DM_STEPS.map((step) => step.key)).toEqual([
      ...LAZY_DM_STEP_KEYS,
    ]);
  });

  it.each(LAZY_DM_STEPS)(
    'gives $key a name, a tooltip and a placeholder to show',
    (step) => {
      expect(step.name).not.toBe('');
      expect(step.tooltip).not.toBe('');
      expect(step.placeholder).not.toBe('');
    },
  );
});
