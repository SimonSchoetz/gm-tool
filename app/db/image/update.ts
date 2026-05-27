import { getDatabase } from '../database';
import {
  assertValidId,
  assertHasUpdateFields,
  buildUpdateQuery,
} from '../util';
import { imageTable } from './schema';
import type { UpdateImageFrameInput } from './types';

export const update = async (
  id: string,
  data: UpdateImageFrameInput,
): Promise<void> => {
  assertValidId(id, 'image');
  assertHasUpdateFields(data);

  const validated = imageTable.updateSchema.parse(data);
  const db = await getDatabase();
  const { sql, values } = buildUpdateQuery('images', id, validated);

  await db.execute(sql, values);
};
