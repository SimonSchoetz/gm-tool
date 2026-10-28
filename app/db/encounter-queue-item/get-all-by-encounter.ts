import { getDatabase } from '../database';
import { assertValidId } from '../util';
import type { EncounterQueueItem } from './types';

export const getAllByEncounter = async (
  encounterId: string,
): Promise<EncounterQueueItem[]> => {
  assertValidId(encounterId, 'Encounter');
  const db = await getDatabase();
  return db.select<EncounterQueueItem[]>(
    'SELECT * FROM encounter_queue_items WHERE encounter_id = $1 ORDER BY sort_order ASC, id ASC',
    [encounterId],
  );
};
