import { describe, it, expect } from 'vitest';
import { LAZY_DM_STEPS } from '../lazyDmSteps';
import { sessionStepName } from '../sessionStepName';

describe('sessionStepName', () => {
  it.each(LAZY_DM_STEPS)(
    "returns the custom name over the default step's name for $key",
    (step) => {
      expect(sessionStepName('Ambush', step.key)).toBe('Ambush');
    },
  );

  it.each(LAZY_DM_STEPS)(
    "returns the default step's name for $key when the step has no custom name",
    (step) => {
      expect(sessionStepName(null, step.key)).toBe(step.name);
    },
  );

  it("returns 'Untitled Step' when the step has neither a name nor a default key", () => {
    expect(sessionStepName(null, null)).toBe('Untitled Step');
  });

  it('keeps an empty custom name', () => {
    expect(sessionStepName('', 'strong_start')).toBe('');
  });
});
