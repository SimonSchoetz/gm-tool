import { describe, it, expect } from 'vitest';
import { parseActionAmount } from '../actionAmount';

describe('parseActionAmount', () => {
  it.each([
    ['0', 0],
    ['25', 25],
    ['1e3', 1000],
  ])('returns the number for %j', (raw, expected) => {
    expect(parseActionAmount(raw)).toBe(expected);
  });

  it.each(['', '   ', '-1', '1.5', 'abc'])('returns null for %j', (raw) => {
    expect(parseActionAmount(raw)).toBeNull();
  });
});
