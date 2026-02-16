import { getDatabase } from '../database';
import { assertValidId, assertHasUpdateFields, buildUpdateQuery } from '../util';
import { adventureTable } from './schema';
import type { UpdateAdventureInput } from './types';

export const update = async (
  id: string,
  data: UpdateAdventureInput
): Promise<void> => {
  assertValidId(id, 'adventure');
  assertHasUpdateFields(data);

  const validated = adventureTable.updateSchema.parse(data);
  const db = await getDatabase();
  const { sql, values } = buildUpdateQuery('adventures', id, validated);

  await db.execute(sql, values);
};
