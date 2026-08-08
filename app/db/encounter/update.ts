import { getDatabase } from '../database';
import {
  assertValidId,
  assertHasUpdateFields,
  buildUpdateQuery,
} from '../util';
import { encounterTable } from './schema';
import type { UpdateEncounterInput } from './types';

export const update = async (
  id: string,
  data: UpdateEncounterInput,
): Promise<void> => {
  assertValidId(id, 'Encounter');
  assertHasUpdateFields(data);
  const validated = encounterTable.updateSchema.parse(data);
  const db = await getDatabase();
  const { sql, values } = buildUpdateQuery('encounters', id, validated);
  await db.execute(sql, values);
};
