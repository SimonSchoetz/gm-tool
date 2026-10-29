import { describe, expect, it } from 'vitest';
import { describeActionRowHp } from '../describeActionRowHp';

describe('describeActionRowHp', () => {
  it('returns the HP text when HP is tracked', () => {
    expect(describeActionRowHp({ text: '5 / 10' })).toBe('5 / 10');
  });

  it('points to Set max HP when HP is not tracked', () => {
    expect(describeActionRowHp(null)).toBe(
      'HP is not set. Set max HP to track it.',
    );
  });
});
