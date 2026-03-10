import { getDatabase } from '../database';
import { assertValidId, assertHasUpdateFields, buildUpdateQuery } from '../util';
import { sessionStepTable } from './schema';
import type { UpdateSessionStepInput } from './types';

export const update = async (id: string, data: UpdateSessionStepInput): Promise<void> => {
  assertValidId(id, 'SessionStep');
  assertHasUpdateFields(data);

  const validated = sessionStepTable.updateSchema.parse(data);
  const db = await getDatabase();
  const { sql, values } = buildUpdateQuery('session_steps', id, validated);

  await db.execute(sql, values);
};
