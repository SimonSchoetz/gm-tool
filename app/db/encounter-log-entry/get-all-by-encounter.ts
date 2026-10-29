import { getDatabase } from '../database';
import { assertValidId } from '../util';
import type { EncounterLogEntry } from './types';

export const getAllByEncounter = async (
  encounterId: string,
): Promise<EncounterLogEntry[]> => {
  assertValidId(encounterId, 'Encounter');
  const db = await getDatabase();
  return db.select<EncounterLogEntry[]>(
    'SELECT * FROM encounter_log_entries WHERE encounter_id = $1 ORDER BY created_at ASC, rowid ASC',
    [encounterId],
  );
};
