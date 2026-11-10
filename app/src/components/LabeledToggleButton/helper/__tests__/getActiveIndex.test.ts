import { describe, expect, it } from 'vitest';
import { getActiveIndex } from '../getActiveIndex';

describe('getActiveIndex', () => {
  const options: [{ value: string }, { value: string }] = [
    { value: 'prep' },
    { value: 'play' },
  ];

  it('is 0 when the value is the first option', () => {
    expect(getActiveIndex(options, 'prep')).toBe(0);
  });

  it('is 1 when the value is the second option', () => {
    expect(getActiveIndex(options, 'play')).toBe(1);
  });
});
