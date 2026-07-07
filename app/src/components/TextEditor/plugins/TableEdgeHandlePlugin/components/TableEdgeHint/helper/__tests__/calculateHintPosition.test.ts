import { describe, it, expect } from 'vitest';
import { calculateHintPosition } from '../calculateHintPosition';

const makeRect = () =>
  ({
    left: 100,
    top: 200,
    right: 150,
    bottom: 220,
    width: 50,
    height: 20,
  }) as unknown as DOMRect;

describe('calculateHintPosition', () => {
  it('positions the top hint centered above the cell', () => {
    expect(calculateHintPosition('top', makeRect())).toEqual({
      left: 120,
      top: 199,
    });
  });

  it('positions the bottom hint centered below the cell', () => {
    expect(calculateHintPosition('bottom', makeRect())).toEqual({
      left: 120,
      top: 219,
    });
  });

  it('positions the left hint centered on the left edge of the cell', () => {
    expect(calculateHintPosition('left', makeRect())).toEqual({
      left: 99,
      top: 205,
    });
  });

  it('positions the right hint centered on the right edge of the cell', () => {
    expect(calculateHintPosition('right', makeRect())).toEqual({
      left: 149,
      top: 205,
    });
  });
});
