import { getDatabase } from '../database';
import {
  assertValidId,
  assertHasUpdateFields,
  buildUpdateQuery,
} from '../util';
import { foeTable } from './schema';
import type { UpdateFoeInput } from './types';

export const update = async (
  id: string,
  data: UpdateFoeInput,
): Promise<void> => {
  assertValidId(id, 'Foe');
  assertHasUpdateFields(data);
  const validated = foeTable.updateSchema.parse(data);
  const db = await getDatabase();
  const { sql, values } = buildUpdateQuery('foes', id, validated);
  await db.execute(sql, values);
};
