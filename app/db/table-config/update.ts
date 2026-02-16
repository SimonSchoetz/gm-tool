import { getDatabase } from '../database';
import { assertValidId, assertHasUpdateFields, buildUpdateQuery } from '../util';
import { tableConfigTable } from './schema';
import type { UpdateTableConfigInput } from './types';

export const update = async (
  id: string,
  data: UpdateTableConfigInput
): Promise<void> => {
  assertValidId(id, 'table config');
  assertHasUpdateFields(data);

  const validated = tableConfigTable.updateSchema.parse(data);
  const db = await getDatabase();
  const { sql, values } = buildUpdateQuery('table_config', id, validated);

  await db.execute(sql, values);
};
