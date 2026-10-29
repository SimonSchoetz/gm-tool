import z from 'zod';
import type { LogEntryKind, LogEntryPayload } from '@domain';
import { encounterLogEntryTable } from './schema';

export type EncounterLogEntry = z.infer<
  typeof encounterLogEntryTable.zodSchema
>;
export type CreateEncounterLogEntryInput = {
  encounter_id: string;
  kind: LogEntryKind;
  payload: LogEntryPayload<LogEntryKind>;
};
