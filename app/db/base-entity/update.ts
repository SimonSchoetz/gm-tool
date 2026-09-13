import { getDatabase } from '../database';
import {
  assertValidId,
  assertHasUpdateFields,
  buildUpdateQuery,
} from '../util';
import { baseEntityTable } from './schema';
import type { UpdateBaseEntityInput } from './types';

export const update = async (
  id: string,
  data: UpdateBaseEntityInput,
): Promise<void> => {
  assertValidId(id, 'Base entity');
  assertHasUpdateFields(data);

  const validated = baseEntityTable.updateSchema.parse(data);
  const db = await getDatabase();
  const { sql, values } = buildUpdateQuery('base_entities', id, validated);

  await db.execute(sql, values);
};
