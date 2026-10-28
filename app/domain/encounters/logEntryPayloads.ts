import { z } from 'zod';

const LOG_ENTRY_PAYLOAD_SCHEMAS = {
  added: z.object({ queueItemIds: z.array(z.string()).min(1) }),
} as const;

export type LogEntryKind = keyof typeof LOG_ENTRY_PAYLOAD_SCHEMAS;
export type LogEntryPayload<K extends LogEntryKind> = z.infer<
  (typeof LOG_ENTRY_PAYLOAD_SCHEMAS)[K]
>;

export const serializeLogEntryPayload = <K extends LogEntryKind>(
  kind: K,
  payload: LogEntryPayload<K>,
): string => JSON.stringify(LOG_ENTRY_PAYLOAD_SCHEMAS[kind].parse(payload));
