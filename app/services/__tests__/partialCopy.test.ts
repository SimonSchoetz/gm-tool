import { describe, it, expect, vi } from 'vitest';
import { writeChildrenOrRemoveParent } from '../partialCopy';

describe('writeChildrenOrRemoveParent', () => {
  it('leaves the parent when the children are written', async () => {
    const removeParent = vi.fn(() => Promise.resolve());

    await writeChildrenOrRemoveParent(() => Promise.resolve(), removeParent);

    expect(removeParent).not.toHaveBeenCalled();
  });

  it('removes the parent once and rejects with the children’s own error when they fail', async () => {
    const childError = new Error('children failed');
    const removeParent = vi.fn(() => Promise.resolve());

    await expect(
      writeChildrenOrRemoveParent(
        () => Promise.reject(childError),
        removeParent,
      ),
    ).rejects.toBe(childError);
    expect(removeParent).toHaveBeenCalledTimes(1);
  });

  it('still rejects with the children’s error, not the removal’s, when the removal fails too', async () => {
    const childError = new Error('children failed');

    await expect(
      writeChildrenOrRemoveParent(
        () => Promise.reject(childError),
        () => Promise.reject(new Error('removal failed')),
      ),
    ).rejects.toBe(childError);
  });
});
