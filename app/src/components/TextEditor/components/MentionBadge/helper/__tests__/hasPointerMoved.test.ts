import { describe, it, expect } from 'vitest';
import { hasPointerMoved, POINTER_MOVE_THRESHOLD_PX } from '../hasPointerMoved';

const ORIGIN = { x: 100, y: 100 };

describe('hasPointerMoved', () => {
  it('does not count a click without a mousedown as a move', () => {
    expect(hasPointerMoved(null, { x: 500, y: 500 })).toBe(false);
  });

  it.each([
    ['x', { x: ORIGIN.x + POINTER_MOVE_THRESHOLD_PX, y: ORIGIN.y }],
    ['y', { x: ORIGIN.x, y: ORIGIN.y - POINTER_MOVE_THRESHOLD_PX }],
  ])('does not count a distance at the threshold on the %s axis', (_, to) => {
    expect(hasPointerMoved(ORIGIN, to)).toBe(false);
  });

  it.each([
    ['x', { x: ORIGIN.x - POINTER_MOVE_THRESHOLD_PX - 1, y: ORIGIN.y }],
    ['y', { x: ORIGIN.x, y: ORIGIN.y + POINTER_MOVE_THRESHOLD_PX + 1 }],
  ])('counts a distance past the threshold on the %s axis', (_, to) => {
    expect(hasPointerMoved(ORIGIN, to)).toBe(true);
  });
});
