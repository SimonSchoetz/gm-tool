import { getDatabase } from '../database';
import {
  generateId,
  buildCreateManyQuery,
  generateDbTimestamps,
  assertValidId,
} from '../util';
import type {
  CreateEncounterQueueItemInput,
  SharedEncounterQueueItemFields,
} from './types';

export const createMany = async (
  rows: CreateEncounterQueueItemInput[],
  shared: SharedEncounterQueueItemFields,
): Promise<string[]> => {
  rows.forEach((row) => {
    assertValidId(row.encounter_id, 'Encounter');
    if ('base_entity_id' in row) {
      assertValidId(row.base_entity_id, 'Base entity');
    }
  });

  const { created_at, updated_at } = generateDbTimestamps();

  const ids = rows.map(() => generateId());
  const { sql, values } = buildCreateManyQuery<{
    encounter_id: string;
    kind: string;
    base_entity_id?: string;
    sequence_number?: number;
    sort_order: number;
    created_at: string;
    updated_at: string;
  }>(
    'encounter_queue_items',
    rows.map((row, index) => ({
      id: ids[index],
      data: {
        encounter_id: row.encounter_id,
        kind: row.kind,
        ...('base_entity_id' in row
          ? { base_entity_id: row.base_entity_id }
          : {}),
        ...('sequence_number' in row
          ? { sequence_number: row.sequence_number }
          : {}),
        sort_order: row.sort_order,
        created_at,
        updated_at,
        ...(shared.name !== undefined ? { name: shared.name } : {}),
        ...(shared.starting_max_hp !== undefined
          ? { starting_max_hp: shared.starting_max_hp }
          : {}),
      },
    })),
  );

  const db = await getDatabase();
  await db.execute(sql, values);
  return ids;
};
