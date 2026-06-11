import { describe, it, expect } from 'vitest';
import { extractColorTriplet } from '../extractColorTriplet';

describe('extractColorTriplet', () => {
  it('extracts triplet from a valid rgb() string', () => {
    expect(extractColorTriplet('rgb(65, 105, 225)')).toBe('65, 105, 225');
  });

  it('returns null when fewer than three digit groups are present', () => {
    expect(extractColorTriplet('rgb(65, 105)')).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(extractColorTriplet('')).toBeNull();
  });

  it('returns null for a plain color name with no digits', () => {
    expect(extractColorTriplet('red')).toBeNull();
  });
});
