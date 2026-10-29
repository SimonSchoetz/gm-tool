import type { EncounterLogEntry } from '@db/encounter-log-entry';
import {
  serializeLogEntryPayload,
  type LogEntryKind,
  type LogEntryPayload,
} from '@domain';

export const buildEncounterLogEntry = <K extends LogEntryKind>(
  kind: K,
  payload: LogEntryPayload<K>,
  overrides: Partial<EncounterLogEntry> = {},
): EncounterLogEntry => ({
  id: 'log-entry-1',
  encounter_id: 'encounter-1',
  kind,
  payload: serializeLogEntryPayload(kind, payload),
  created_at: '',
  updated_at: '',
  ...overrides,
});
