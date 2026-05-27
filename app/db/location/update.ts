import { getDatabase } from '../database';
import {
  assertValidId,
  assertHasUpdateFields,
  buildUpdateQuery,
} from '../util';
import { locationTable } from './schema';
import type { UpdateLocationInput } from './types';

export const update = async (
  id: string,
  data: UpdateLocationInput,
): Promise<void> => {
  assertValidId(id, 'Location');
  assertHasUpdateFields(data);

  const validated = locationTable.updateSchema.parse(data);
  const db = await getDatabase();
  const { sql, values } = buildUpdateQuery('locations', id, validated);

  await db.execute(sql, values);
};
