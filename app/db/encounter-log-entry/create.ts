import { serializeLogEntryPayload, type LogEntryKind } from '@domain';
import { getDatabase } from '../database';
import {
  generateId,
  buildCreateQuery,
  generateDbTimestamps,
  assertValidId,
} from '../util';
import type { CreateEncounterLogEntryInput } from './types';

export const create = async <K extends LogEntryKind>(
  data: CreateEncounterLogEntryInput<K>,
): Promise<string> => {
  assertValidId(data.encounter_id, 'Encounter');

  const id = generateId();
  const { created_at, updated_at } = generateDbTimestamps();

  const { sql, values } = buildCreateQuery<{
    encounter_id: string;
    kind: string;
    payload: string;
    created_at: string;
    updated_at: string;
  }>('encounter_log_entries', id, {
    encounter_id: data.encounter_id,
    kind: data.kind,
    payload: serializeLogEntryPayload(data.kind, data.payload),
    created_at,
    updated_at,
  });

  const db = await getDatabase();
  await db.execute(sql, values);
  return id;
};
