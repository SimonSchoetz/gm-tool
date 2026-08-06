import { getDatabase } from './database';

type MaxPinnedOrderRow = {
  max_order: number | null;
};

export const getMaxPinnedOrder = async (
  tableName: string,
  entityId: string,
): Promise<number | null> => {
  const db = await getDatabase();

  // tableName is interpolated directly because SQL does not support parameterized table names. It must only ever receive values from the canonical entity type list, validated at the service layer, never from user input.
  const rows = await db.select<MaxPinnedOrderRow[]>(
    `SELECT MAX(pinned_order) as max_order FROM ${tableName} WHERE pinned_order IS NOT NULL AND adventure_id = (SELECT adventure_id FROM ${tableName} WHERE id = $1)`,
    [entityId],
  );

  return rows[0]?.max_order ?? null;
};

export const setPinnedOrder = async (
  tableName: string,
  id: string,
  pinnedOrder: number | null,
): Promise<void> => {
  const db = await getDatabase();

  // tableName is interpolated directly because SQL does not support parameterized table names. It must only ever receive values from the canonical entity type list, validated at the service layer, never from user input.
  await db.execute(`UPDATE ${tableName} SET pinned_order = $1 WHERE id = $2`, [
    pinnedOrder,
    id,
  ]);
};
