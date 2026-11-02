import type { BaseEntity } from '@db/base-entity';
import type { EncounterLogEntry } from '@db/encounter-log-entry';
import type { EncounterQueueItem } from '@db/encounter-queue-item';
import {
  deriveCombatState,
  isRevertibleLogEntryKind,
  readLogEntry,
} from '@domain';
import { nameQueueItems } from './nameQueueItems';

export type LogLine =
  | { kind: 'unreadable'; id: string; createdAt: string }
  | { kind: 'message'; id: string; createdAt: string; editorState: string }
  | {
      kind: 'automatic';
      id: string;
      createdAt: string;
      text: string;
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

const withTargets = (label: string, targets: string[]): string =>
  targets.length === 0 ? label : `${label}: ${targets.join(', ')}`;

const describeEntry = (
  entry: AutomaticEntry,
  names: QueueItemNames,
): string => {
  // A target with no queue item (a sync race) is left out instead of throwing.
  const shownName = (queueItemId: string): string | null =>
    names.get(queueItemId)?.shownName ?? null;
  const label = LABELS[entry.kind];

  const withFigures = (targets: { queueItemId: string; figure: number }[]) =>
    withTargets(
      label,
      targets.flatMap(({ queueItemId, figure }) => {
        const name = shownName(queueItemId);
        return name === null ? [] : [`${name} (${figure})`];
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
          return name === null ? [] : [name];
        }),
      );
    case 'added': {
      const { queueItemIds } = entry.payload;
      const baseName =
        queueItemIds
          .map((queueItemId) => names.get(queueItemId)?.baseName ?? null)
          .find((name) => name !== null) ?? null;
      const quantity =
        queueItemIds.length > 1 ? ` ×${queueItemIds.length}` : '';
      return baseName === null ? label : `${label}: ${baseName}${quantity}`;
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
        text: `Reverted: ${describeEntry(reverted, names)}`,
        isReverted: false,
        isRevertible: false,
      };
    }
    const isReverted = revertedEntryIds.has(raw.id);
    return {
      kind: 'automatic',
      ...base,
      text: describeEntry(entry, names),
      isReverted,
      isRevertible: isRevertibleLogEntryKind(entry.kind) && !isReverted,
    };
  });
};
