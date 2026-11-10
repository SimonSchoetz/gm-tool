import { describe, it, expect, beforeEach, vi } from 'vitest';
import type * as pinnedOrderDb from '@db/pinned-order';

const getMaxPinnedOrder = vi.hoisted(() =>
  vi.fn<typeof pinnedOrderDb.getMaxPinnedOrder>(),
);
const setPinnedOrder = vi.hoisted(() =>
  vi.fn<typeof pinnedOrderDb.setPinnedOrder>(),
);

vi.mock('@db/pinned-order', () => ({ getMaxPinnedOrder, setPinnedOrder }));

beforeEach(() => {
  vi.resetModules();
  getMaxPinnedOrder.mockReset().mockResolvedValue(null);
  setPinnedOrder.mockReset().mockResolvedValue();
});

describe('pinEntity', () => {
  it('pins the entity after the highest pinned order of its type', async () => {
    const { pinEntity } = await import('../pinnedOrderService');
    getMaxPinnedOrder.mockResolvedValue(4);

    await pinEntity('npcs', 'npc-1');

    expect(getMaxPinnedOrder).toHaveBeenCalledWith('npcs', 'npc-1');
    expect(setPinnedOrder).toHaveBeenCalledWith('npcs', 'npc-1', 5);
  });

  it('gives the first pinned entity the order 0, and an entity pinned at 0 makes the next one 1', async () => {
    const { pinEntity } = await import('../pinnedOrderService');

    await pinEntity('npcs', 'npc-1');

    expect(setPinnedOrder).toHaveBeenLastCalledWith('npcs', 'npc-1', 0);

    getMaxPinnedOrder.mockResolvedValue(0);
    await pinEntity('npcs', 'npc-2');

    expect(setPinnedOrder).toHaveBeenLastCalledWith('npcs', 'npc-2', 1);
  });

  it('rejects as PinnedOrderError, naming the type, and touches nothing for a type that is no entity type', async () => {
    const { pinEntity } = await import('../pinnedOrderService');

    await expect(pinEntity('widgets', 'w-1')).rejects.toMatchObject({
      name: 'PinnedOrderError',
      message: 'Failed to update pinned order: Unknown entity type: widgets',
    });
    expect(getMaxPinnedOrder).not.toHaveBeenCalled();
    expect(setPinnedOrder).not.toHaveBeenCalled();
  });

  it('rejects as PinnedOrderError, setting nothing, when the highest order cannot be read, and when the order cannot be set', async () => {
    const { pinEntity } = await import('../pinnedOrderService');
    getMaxPinnedOrder.mockRejectedValueOnce(new Error('disk'));

    await expect(pinEntity('npcs', 'npc-1')).rejects.toMatchObject({
      name: 'PinnedOrderError',
    });
    expect(setPinnedOrder).not.toHaveBeenCalled();

    setPinnedOrder.mockRejectedValueOnce(new Error('disk'));

    await expect(pinEntity('npcs', 'npc-1')).rejects.toMatchObject({
      name: 'PinnedOrderError',
    });
  });
});

describe('unpinEntity', () => {
  it('clears the pinned order of the entity', async () => {
    const { unpinEntity } = await import('../pinnedOrderService');

    await unpinEntity('foes', 'foe-1');

    expect(setPinnedOrder).toHaveBeenCalledWith('foes', 'foe-1', null);
  });

  it('rejects as PinnedOrderError, naming the type, and touches nothing for a type that is no entity type', async () => {
    const { unpinEntity } = await import('../pinnedOrderService');

    await expect(unpinEntity('widgets', 'w-1')).rejects.toMatchObject({
      name: 'PinnedOrderError',
      message: 'Failed to update pinned order: Unknown entity type: widgets',
    });
    expect(setPinnedOrder).not.toHaveBeenCalled();
  });

  it('rejects as PinnedOrderError when the order cannot be cleared', async () => {
    const { unpinEntity } = await import('../pinnedOrderService');
    setPinnedOrder.mockRejectedValue(new Error('disk'));

    await expect(unpinEntity('foes', 'foe-1')).rejects.toMatchObject({
      name: 'PinnedOrderError',
    });
  });
});
