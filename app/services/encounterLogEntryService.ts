import * as logEntryDb from '@db/encounter-log-entry';
import type { EncounterLogEntry } from '@db/encounter-log-entry';
import {
  encounterLogLoadError,
  encounterLogRecordError,
  type LogEntryKind,
  type LogEntryPayload,
} from '@domain';

export const getLogEntries = async (
  encounterId: string,
): Promise<EncounterLogEntry[]> => {
  try {
    return await logEntryDb.getAllByEncounter(encounterId);
  } catch (err) {
    throw encounterLogLoadError(err);
  }
};

export const recordLogEntry = async <K extends LogEntryKind>(
  encounterId: string,
  kind: K,
  payload: LogEntryPayload<K>,
): Promise<void> => {
  try {
    await logEntryDb.create({ encounter_id: encounterId, kind, payload });
  } catch (err) {
    throw encounterLogRecordError(err);
  }
};
