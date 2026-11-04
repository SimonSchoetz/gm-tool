import type { BaseEntity } from '@db/base-entity';
import type { EncounterLogEntry } from '@db/encounter-log-entry';
import type { EncounterQueueItem } from '@db/encounter-queue-item';
import {
  deriveCombatState,
  isRevertibleLogEntryKind,
  readLogEntry,
} from '@domain';
import { nameQueueItems } from './nameQueueItems';

// A `name` part is an entity name the screen shows on one line, cut at the line's width; a `text` part is the label, a separator or a figure, which stays readable.
// eslint-disable-next-line local/no-unused-exports -- tests type the line parts they join
export type LogLinePart = { kind: 'text' | 'name'; text: string };

export type LogLine =
  | { kind: 'unreadable'; id: string; createdAt: string }
  | { kind: 'message'; id: string; createdAt: string; editorState: string }
  | {
      kind: 'automatic';
      id: string;
      createdAt: string;
      parts: LogLinePart[];
      isReverted: boolean;
      isRevertible: boolean;
    };

type ReadEntry = NonNullable<ReturnType<typeof readLogEntry>>;
type AutomaticEntry = Exclude<ReadEntry, { kind: 'message' | 'revert' }>;
type QueueItemNames = ReturnType<typeof nameQueueItems>;

const LABELS = {
  added: 'Added',
  damage: 'Damage',
  heal: 'Heal',
  'temp-hp': 'Temp HP',
  'max-hp': 'Max HP',
  defeated: 'Defeated',
  undefeated: 'Undefeated',
  removed: 'Removed',
} as const satisfies Record<AutomaticEntry['kind'], string>;

const isAutomatic = (entry: ReadEntry | null): entry is AutomaticEntry =>
  // Only the ids of reverted entries are looked up in the map built with this guard, and those are revertible kinds.
  entry !== null && entry.kind !== 'message' && entry.kind !== 'revert';

const textPart = (text: string): LogLinePart => ({ kind: 'text', text });
const namePart = (text: string): LogLinePart => ({ kind: 'name', text });

const withTargets = (label: string, targets: LogLinePart[][]): LogLinePart[] =>
  targets.length === 0
    ? [textPart(label)]
    : [
        textPart(`${label}: `),
        ...targets.flatMap((target, index) =>
          index === 0 ? target : [textPart(', '), ...target],
        ),
      ];

const describeEntry = (
  entry: AutomaticEntry,
  names: QueueItemNames,
): LogLinePart[] => {
  // A target with no queue item (a sync race) is left out instead of throwing.
  const shownName = (queueItemId: string): string | null =>
    names.get(queueItemId)?.shownName ?? null;
  const label = LABELS[entry.kind];

  const withFigures = (targets: { queueItemId: string; figure: number }[]) =>
    withTargets(
      label,
      targets.flatMap(({ queueItemId, figure }) => {
        const name = shownName(queueItemId);
        return name === null
          ? []
          : [[namePart(name), textPart(` (${figure})`)]];
      }),
    );

  switch (entry.kind) {
    case 'damage':
    case 'heal':
      return withFigures(
        entry.payload.targets.map(({ queueItemId, amount }) => ({
          queueItemId,
          figure: amount,
        })),
      );
    case 'temp-hp':
    case 'max-hp':
      return withFigures(
        entry.payload.targets.map(({ queueItemId, value }) => ({
          queueItemId,
          figure: value,
        })),
      );
    case 'defeated':
    case 'undefeated':
    case 'removed':
      return withTargets(
        label,
        entry.payload.queueItemIds.flatMap((queueItemId) => {
          const name = shownName(queueItemId);
          return name === null ? [] : [[namePart(name)]];
        }),
      );
    case 'added': {
      const { queueItemIds } = entry.payload;
      const baseName =
        queueItemIds
          .map((queueItemId) => names.get(queueItemId)?.baseName ?? null)
          .find((name) => name !== null) ?? null;
      const quantity =
        queueItemIds.length > 1 ? [textPart(` ×${queueItemIds.length}`)] : [];
      return baseName === null
        ? [textPart(label)]
        : [textPart(`${label}: `), namePart(baseName), ...quantity];
    }
  }
};

export const buildLogLines = (
  queueItems: EncounterQueueItem[],
  logEntries: EncounterLogEntry[],
  baseEntities: BaseEntity[],
): LogLine[] => {
  const { items, revertedEntryIds } = deriveCombatState(
    queueItems.map((item) => ({
      id: item.id,
      startingMaxHp: item.starting_max_hp,
    })),
    logEntries,
  );
  const names = nameQueueItems(queueItems, items, baseEntities);
  const readEntries = logEntries.map((raw) =>
    readLogEntry(raw.kind, raw.payload),
  );
  const automaticEntriesById = new Map(
    logEntries.flatMap((raw, index) => {
      const entry = readEntries[index];
      return isAutomatic(entry) ? [[raw.id, entry] as const] : [];
    }),
  );

  return logEntries.map((raw, index): LogLine => {
    const entry = readEntries[index];
    const base = { id: raw.id, createdAt: raw.created_at };
    if (entry === null) {
      return { kind: 'unreadable', ...base };
    }
    if (entry.kind === 'message') {
      return {
        kind: 'message',
        ...base,
        editorState: entry.payload.editorState,
      };
    }
    if (entry.kind === 'revert') {
      const { entryId } = entry.payload;
      // A revert the derivation ignored names no entry that was dropped, so it has no text to repeat.
      const reverted = revertedEntryIds.has(entryId)
        ? (automaticEntriesById.get(entryId) ?? null)
        : null;
      if (reverted === null) {
        return { kind: 'unreadable', ...base };
      }
      return {
        kind: 'automatic',
        ...base,
        parts: [textPart('Reverted: '), ...describeEntry(reverted, names)],
        isReverted: false,
        isRevertible: false,
      };
    }
    const isReverted = revertedEntryIds.has(raw.id);
    return {
      kind: 'automatic',
      ...base,
      parts: describeEntry(entry, names),
      isReverted,
      isRevertible: isRevertibleLogEntryKind(entry.kind) && !isReverted,
    };
  });
};
