import { describe, it, expect } from 'vitest';
import { stepSectionElementId } from '../stepSectionElementId';

describe('stepSectionElementId', () => {
  it("returns the step section's element id", () => {
    expect(stepSectionElementId('abc')).toBe('step-section-abc');
  });
});
