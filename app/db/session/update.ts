import { getDatabase } from '../database';
import { assertValidId, assertHasUpdateFields, buildUpdateQuery } from '../util';
import { sessionTable } from './schema';
import type { UpdateSessionInput } from './types';

export const update = async (
  id: string,
  data: UpdateSessionInput
): Promise<void> => {
  assertValidId(id, 'session');
  assertHasUpdateFields(data);

  const validated = sessionTable.updateSchema.parse(data);
  const db = await getDatabase();
  const { sql, values } = buildUpdateQuery('sessions', id, validated);

  await db.execute(sql, values);
};
