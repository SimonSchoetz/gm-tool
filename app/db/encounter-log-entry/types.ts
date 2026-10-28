import type { LogEntryKind, LogEntryPayload } from '@domain';

export type CreateEncounterLogEntryInput = {
  encounter_id: string;
  kind: LogEntryKind;
  payload: LogEntryPayload<LogEntryKind>;
};
