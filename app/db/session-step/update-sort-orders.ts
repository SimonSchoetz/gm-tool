import { getDatabase } from '../database';
import {
  assertValidId,
  buildUpdateSortOrdersQuery,
  generateDbTimestamps,
  type SortOrderEntry,
} from '../util';

export const updateSortOrders = async (
  entries: SortOrderEntry[],
): Promise<void> => {
  if (entries.length === 0) return;
  entries.forEach(({ id }) => {
    assertValidId(id, 'SessionStep');
  });

  const { updated_at } = generateDbTimestamps();
  const { sql, values } = buildUpdateSortOrdersQuery(
    'session_steps',
    entries,
    updated_at,
  );

  const db = await getDatabase();
  await db.execute(sql, values);
};
