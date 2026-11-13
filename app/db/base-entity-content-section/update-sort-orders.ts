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
    assertValidId(id, 'Base entity content section');
  });

  const { updated_at } = generateDbTimestamps();
  const { sql, values } = buildUpdateSortOrdersQuery(
    'base_entity_content_sections',
    entries,
    updated_at,
  );

  const db = await getDatabase();
  await db.execute(sql, values);
};
