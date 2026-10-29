import * as logEntryDb from '@db/encounter-log-entry';
import type { EncounterLogEntry } from '@db/encounter-log-entry';
import { encounterLogLoadError } from '@domain';

export const getLogEntries = async (
  encounterId: string,
): Promise<EncounterLogEntry[]> => {
  try {
    return await logEntryDb.getAllByEncounter(encounterId);
  } catch (err) {
    throw encounterLogLoadError(err);
  }
};
