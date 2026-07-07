import { describe, it, expect } from 'vitest';
import { calculateHintPosition } from '../calculateHintPosition';
import {
  TABLE_HINT_WIDTH,
  TABLE_HINT_THICKNESS,
} from '../../../../tableEdgeHandlePlugin.constants';

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
    const rect = makeRect();
    expect(calculateHintPosition('top', rect)).toEqual({
      left: rect.left + rect.width / 2 - TABLE_HINT_WIDTH / 2,
      top: rect.top - TABLE_HINT_THICKNESS,
    });
  });

  it('positions the bottom hint centered below the cell', () => {
    const rect = makeRect();
    expect(calculateHintPosition('bottom', rect)).toEqual({
      left: rect.left + rect.width / 2 - TABLE_HINT_WIDTH / 2,
      top: rect.bottom - TABLE_HINT_THICKNESS,
    });
  });

  it('positions the left hint centered on the left edge of the cell', () => {
    const rect = makeRect();
    expect(calculateHintPosition('left', rect)).toEqual({
      left: rect.left - TABLE_HINT_THICKNESS,
      top: rect.top + rect.height / 2 - TABLE_HINT_WIDTH / 2,
    });
  });

  it('positions the right hint centered on the right edge of the cell', () => {
    const rect = makeRect();
    expect(calculateHintPosition('right', rect)).toEqual({
      left: rect.right - TABLE_HINT_THICKNESS,
      top: rect.top + rect.height / 2 - TABLE_HINT_WIDTH / 2,
    });
  });
});
