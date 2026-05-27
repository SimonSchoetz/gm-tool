import { getDatabase } from '../database';
import {
  assertValidId,
  assertHasUpdateFields,
  buildUpdateQuery,
} from '../util';
import { pcTable } from './schema';
import type { UpdatePcInput } from './types';

export const update = async (
  id: string,
  data: UpdatePcInput,
): Promise<void> => {
  assertValidId(id, 'Pc');
  assertHasUpdateFields(data);

  const validated = pcTable.updateSchema.parse(data);
  const db = await getDatabase();
  const { sql, values } = buildUpdateQuery('pcs', id, validated);

  await db.execute(sql, values);
};
