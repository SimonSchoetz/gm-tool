import { describe, expect, it } from 'vitest';
import { countOtherDragged } from '../countOtherDragged';

describe('countOtherDragged', () => {
  it('counts the other ids of the block on the dragged entry', () => {
    expect(
      countOtherDragged('b', { activeId: 'b', otherIds: ['a', 'c'] }),
    ).toBe(2);
  });

  it('counts nothing on an entry that is not the dragged one', () => {
    expect(
      countOtherDragged('a', { activeId: 'b', otherIds: ['a', 'c'] }),
    ).toBe(0);
  });

  it('counts nothing when no block drag is running', () => {
    expect(countOtherDragged('a', null)).toBe(0);
  });
});
