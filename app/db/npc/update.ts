import { getDatabase } from '../database';
import { assertValidId, assertHasUpdateFields, buildUpdateQuery } from '../util';
import { npcTable } from './schema';
import type { UpdateNpcInput } from './types';

export const update = async (
  id: string,
  data: UpdateNpcInput
): Promise<void> => {
  assertValidId(id, 'NPC');
  assertHasUpdateFields(data);

  const validated = npcTable.updateSchema.parse(data);
  const db = await getDatabase();
  const { sql, values } = buildUpdateQuery('npcs', id, validated);

  await db.execute(sql, values);
};
