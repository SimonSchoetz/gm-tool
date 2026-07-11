import { getDatabase } from '../database';
import {
  assertValidId,
  assertHasUpdateFields,
  buildUpdateQuery,
} from '../util';
import { pairedDeviceTable } from './schema';
import type { UpdatePairedDeviceInput } from './types';

export const update = async (
  id: string,
  data: UpdatePairedDeviceInput,
): Promise<void> => {
  assertValidId(id, 'paired device');
  assertHasUpdateFields(data);

  const validated = pairedDeviceTable.updateSchema.parse(data);
  const db = await getDatabase();
  const { sql, values } = buildUpdateQuery('paired_devices', id, validated);

  await db.execute(sql, values);
};
