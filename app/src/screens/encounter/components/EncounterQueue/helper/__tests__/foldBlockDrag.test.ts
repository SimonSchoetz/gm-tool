import { describe, expect, it } from 'vitest';
import { foldBlockDrag } from '../foldBlockDrag';

describe('foldBlockDrag', () => {
  it('marks a running block drag as folded and keeps its other fields', () => {
    expect(
      foldBlockDrag({ activeId: 'b', otherIds: ['a'], folded: false }),
    ).toEqual({ activeId: 'b', otherIds: ['a'], folded: true });
  });

  it('leaves a missing block drag missing', () => {
    expect(foldBlockDrag(null)).toBeNull();
  });
});
