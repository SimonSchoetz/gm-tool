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
  message: z.object({ editorState: z.string().min(1) }),
  revert: z.object({ entryId: z.string().min(1) }),
} as const;

const REVERTIBLE_LOG_ENTRY_KINDS: ReadonlySet<string> = new Set([
  'damage',
  'heal',
  'temp-hp',
  'max-hp',
  'defeated',
  'undefeated',
  'removed',
]);

export const isRevertibleLogEntryKind = (kind: string): boolean =>
  REVERTIBLE_LOG_ENTRY_KINDS.has(kind);

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

// Stryker disable BlockStatement: a payload that is not JSON reaches the schema as null or as undefined, which fails it either way, so no input observes a difference between the catch block and an empty one
const parseJson = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};
// Stryker restore BlockStatement

export const readLogEntry = (
  kind: string,
  payload: string,
): ReadLogEntry | null => {
  // Object.hasOwn, not `in`: an inherited name such as `constructor` is not a kind.
  if (!Object.hasOwn(LOG_ENTRY_PAYLOAD_SCHEMAS, kind)) {
    return null;
  }
  const knownKind = kind as LogEntryKind;
  const parsed = LOG_ENTRY_PAYLOAD_SCHEMAS[knownKind].safeParse(
    parseJson(payload),
  );
  return parsed.success
    ? ({ kind: knownKind, payload: parsed.data } as ReadLogEntry)
    : null;
};
