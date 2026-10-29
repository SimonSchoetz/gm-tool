import { z } from 'zod';

const count = z.int().min(0);
const queueItemIds = z.object({ queueItemIds: z.array(z.string()).min(1) });
const amountTargets = z.object({
  targets: z.array(z.object({ queueItemId: z.string(), amount: count })).min(1),
});
const valueTargets = z.object({
  targets: z.array(z.object({ queueItemId: z.string(), value: count })).min(1),
});

const LOG_ENTRY_PAYLOAD_SCHEMAS = {
  added: queueItemIds,
  damage: amountTargets,
  heal: amountTargets,
  'temp-hp': valueTargets,
  'max-hp': valueTargets,
  defeated: queueItemIds,
  undefeated: queueItemIds,
  removed: queueItemIds,
} as const;

export type LogEntryKind = keyof typeof LOG_ENTRY_PAYLOAD_SCHEMAS;
export type LogEntryPayload<K extends LogEntryKind> = z.infer<
  (typeof LOG_ENTRY_PAYLOAD_SCHEMAS)[K]
>;

type ReadLogEntry = {
  [K in LogEntryKind]: { kind: K; payload: LogEntryPayload<K> };
}[LogEntryKind];

export const serializeLogEntryPayload = <K extends LogEntryKind>(
  kind: K,
  payload: LogEntryPayload<K>,
): string => JSON.stringify(LOG_ENTRY_PAYLOAD_SCHEMAS[kind].parse(payload));

export const readLogEntry = (
  kind: string,
  payload: string,
): ReadLogEntry | null => {
  // Object.hasOwn, not `in`: an inherited name such as `constructor` is not a kind.
  if (!Object.hasOwn(LOG_ENTRY_PAYLOAD_SCHEMAS, kind)) {
    return null;
  }
  try {
    const knownKind = kind as LogEntryKind;
    const parsed = LOG_ENTRY_PAYLOAD_SCHEMAS[knownKind].safeParse(
      JSON.parse(payload),
    );
    return parsed.success
      ? ({ kind: knownKind, payload: parsed.data } as ReadLogEntry)
      : null;
  } catch {
    return null;
  }
};
