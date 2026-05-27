import { getDatabase } from '../database';
import {
  assertValidId,
  assertHasUpdateFields,
  buildUpdateQuery,
} from '../util';
import { factionTable } from './schema';
import type { UpdateFactionInput } from './types';

export const update = async (
  id: string,
  data: UpdateFactionInput,
): Promise<void> => {
  assertValidId(id, 'Faction');
  assertHasUpdateFields(data);

  const validated = factionTable.updateSchema.parse(data);
  const db = await getDatabase();
  const { sql, values } = buildUpdateQuery('factions', id, validated);

  await db.execute(sql, values);
};
