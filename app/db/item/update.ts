import { getDatabase } from '../database';
import {
  assertValidId,
  assertHasUpdateFields,
  buildUpdateQuery,
} from '../util';
import { itemTable } from './schema';
import type { UpdateItemInput } from './types';

export const update = async (
  id: string,
  data: UpdateItemInput,
): Promise<void> => {
  assertValidId(id, 'Item');
  assertHasUpdateFields(data);

  const validated = itemTable.updateSchema.parse(data);
  const db = await getDatabase();
  const { sql, values } = buildUpdateQuery('items', id, validated);

  await db.execute(sql, values);
};
