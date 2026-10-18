import { describe, it, expect } from 'vitest';
import { findLazyDmStep } from '../lazyDmSteps';

describe('findLazyDmStep', () => {
  it('returns the definition for a known key', () => {
    expect(findLazyDmStep('strong_start')?.name).toBe('Strong Start');
  });

  it('returns null for a null key', () => {
    expect(findLazyDmStep(null)).toBeNull();
  });
});
