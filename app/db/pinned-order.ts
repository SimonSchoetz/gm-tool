import { isBaseEntityType } from '@domain/entities';
import { getDatabase } from './database';
import { generateDbTimestamps } from './util';

type MaxPinnedOrderRow = {
  max_order: number | null;
};

export const getMaxPinnedOrder = async (
  entityType: string,
  entityId: string,
): Promise<number | null> => {
  const db = await getDatabase();

  if (isBaseEntityType(entityType)) {
    const rows = await db.select<MaxPinnedOrderRow[]>(
      'SELECT MAX(pinned_order) as max_order FROM base_entities WHERE pinned_order IS NOT NULL AND entity_type = $2 AND adventure_id = (SELECT adventure_id FROM base_entities WHERE id = $1)',
      [entityId, entityType],
    );

    return rows[0]?.max_order ?? null;
  }

  // entityType is interpolated directly because SQL does not support parameterized table names. It must only ever receive values from the canonical entity type list, which isEntityType checks in services/pinnedOrderService.ts before calling here, never from user input. Interpolation only ever happens for non-base entity types.
  const rows = await db.select<MaxPinnedOrderRow[]>(
    `SELECT MAX(pinned_order) as max_order FROM ${entityType} WHERE pinned_order IS NOT NULL AND adventure_id = (SELECT adventure_id FROM ${entityType} WHERE id = $1)`,
    [entityId],
  );

  return rows[0]?.max_order ?? null;
};

export const setPinnedOrder = async (
  entityType: string,
  id: string,
  pinnedOrder: number | null,
): Promise<void> => {
  const db = await getDatabase();
  // A pin is an edit like any other: sync keeps the row with the later updated_at and drops an incoming row whose updated_at ties the local one when the sender's device id is the lower (applyUpsert's force flag), so a pin that left it unchanged would not reach the peer from that device.
  const { updated_at: updatedAt } = generateDbTimestamps();

  if (isBaseEntityType(entityType)) {
    await db.execute(
      'UPDATE base_entities SET pinned_order = $1, updated_at = $2 WHERE id = $3',
      [pinnedOrder, updatedAt, id],
    );
    return;
  }

  // entityType is interpolated directly because SQL does not support parameterized table names. It must only ever receive values from the canonical entity type list, which isEntityType checks in services/pinnedOrderService.ts before calling here, never from user input. Interpolation only ever happens for non-base entity types.
  await db.execute(
    `UPDATE ${entityType} SET pinned_order = $1, updated_at = $2 WHERE id = $3`,
    [pinnedOrder, updatedAt, id],
  );
};
