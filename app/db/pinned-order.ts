import { isBaseEntityType } from '@domain/entities';
import { getDatabase } from './database';

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

  // entityType is interpolated directly because SQL does not support parameterized table names. It must only ever receive values from the canonical entity type list, validated at the service layer, never from user input. Interpolation only ever happens for non-base entity types.
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

  if (isBaseEntityType(entityType)) {
    await db.execute(
      'UPDATE base_entities SET pinned_order = $1 WHERE id = $2',
      [pinnedOrder, id],
    );
    return;
  }

  // entityType is interpolated directly because SQL does not support parameterized table names. It must only ever receive values from the canonical entity type list, validated at the service layer, never from user input. Interpolation only ever happens for non-base entity types.
  await db.execute(`UPDATE ${entityType} SET pinned_order = $1 WHERE id = $2`, [
    pinnedOrder,
    id,
  ]);
};
