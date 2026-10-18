import { describe, it, expect } from 'vitest';
import { sessionStepName } from '../sessionStepName';

describe('sessionStepName', () => {
  it("returns the custom name over the default step's name", () => {
    expect(sessionStepName('Ambush', 'strong_start')).toBe('Ambush');
  });

  it("returns the default step's name when the step has no custom name", () => {
    expect(sessionStepName(null, 'strong_start')).toBe('Strong Start');
  });

  it("returns 'Untitled Step' when the step has neither a name nor a default key", () => {
    expect(sessionStepName(null, null)).toBe('Untitled Step');
  });

  it('keeps an empty custom name', () => {
    expect(sessionStepName('', 'strong_start')).toBe('');
  });
});
