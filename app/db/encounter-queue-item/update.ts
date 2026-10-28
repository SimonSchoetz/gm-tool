import { getDatabase } from '../database';
import {
  assertValidId,
  assertHasUpdateFields,
  buildUpdateQuery,
} from '../util';
import { encounterQueueItemTable } from './schema';
import type { UpdateEncounterQueueItemInput } from './types';

export const update = async (
  id: string,
  data: UpdateEncounterQueueItemInput,
): Promise<void> => {
  assertValidId(id, 'Encounter queue item');
  assertHasUpdateFields(data);

  const validated = encounterQueueItemTable.updateSchema.parse(data);
  const db = await getDatabase();
  const { sql, values } = buildUpdateQuery(
    'encounter_queue_items',
    id,
    validated,
  );

  await db.execute(sql, values);
};
