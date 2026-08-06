import * as pinnedOrder from '@db/pinned-order';
import { isEntityType } from '@domain/entities';
import { pinnedOrderError } from '@domain/pinned-order';

export const pinEntity = async (
  entityType: string,
  entityId: string,
): Promise<void> => {
  if (!isEntityType(entityType)) {
    throw pinnedOrderError(`Unknown entity type: ${entityType}`);
  }

  try {
    const max = await pinnedOrder.getMaxPinnedOrder(entityType, entityId);
    await pinnedOrder.setPinnedOrder(entityType, entityId, (max ?? -1) + 1);
  } catch (err) {
    throw pinnedOrderError(err);
  }
};

export const unpinEntity = async (
  entityType: string,
  entityId: string,
): Promise<void> => {
  if (!isEntityType(entityType)) {
    throw pinnedOrderError(`Unknown entity type: ${entityType}`);
  }

  try {
    await pinnedOrder.setPinnedOrder(entityType, entityId, null);
  } catch (err) {
    throw pinnedOrderError(err);
  }
};
