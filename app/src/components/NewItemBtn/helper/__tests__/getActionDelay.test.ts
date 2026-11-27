import { describe, it, expect } from 'vitest';
import { ANIMATION_DURATION } from '../../NewItemBtn.constants';
import { getActionDelay } from '../getActionDelay';

describe('getActionDelay', () => {
  it('delays the action by the animation duration when the animation plays', () => {
    expect(getActionDelay(false)).toBe(ANIMATION_DURATION);
  });

  it('runs the action without delay when the animation is suppressed', () => {
    expect(getActionDelay(true)).toBe(0);
  });
});
