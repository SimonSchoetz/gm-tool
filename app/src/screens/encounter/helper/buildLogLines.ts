import type { BaseEntity } from '@db/base-entity';
import type { EncounterLogEntry } from '@db/encounter-log-entry';
import type { EncounterQueueItem } from '@db/encounter-queue-item';
import {
  deriveCombatState,
  isRevertibleLogEntryKind,
  readLogEntry,
  type LogEntryKind,
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
      isRevertible: boolean;
    };

type ReadEntry = NonNullable<ReturnType<typeof readLogEntry>>;
// The Log lists only what reads back a fight: an `added` entry and a `revert` entry are left out whether or not they read, and so is every entry a revert dropped.
const HIDDEN_KINDS = ['added', 'revert'] as const satisfies LogEntryKind[];
type ListedEntry = Exclude<ReadEntry, { kind: (typeof HIDDEN_KINDS)[number] }>;
type AutomaticEntry = Exclude<ListedEntry, { kind: 'message' }>;
type QueueItemNames = ReturnType<typeof nameQueueItems>;

const LABELS = {
  damage: 'Damage',
  heal: 'Heal',
  'temp-hp': 'Temp HP',
  'max-hp': 'Max HP',
  defeated: 'Defeated',
  undefeated: 'Undefeated',
  removed: 'Removed',
} as const satisfies Record<AutomaticEntry['kind'], string>;

const isHiddenKind = (kind: string): boolean =>
  (HIDDEN_KINDS as readonly string[]).includes(kind);

const isListed = (entry: ReadEntry): entry is ListedEntry =>
  !isHiddenKind(entry.kind);

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

  return logEntries.flatMap((raw): LogLine[] => {
    if (revertedEntryIds.has(raw.id)) return [];
    const entry = readLogEntry(raw.kind, raw.payload);
    const base = { id: raw.id, createdAt: raw.created_at };
    if (entry === null) {
      return isHiddenKind(raw.kind) ? [] : [{ kind: 'unreadable', ...base }];
    }
    if (!isListed(entry)) return [];
    if (entry.kind === 'message') {
      return [
        { kind: 'message', ...base, editorState: entry.payload.editorState },
      ];
    }
    return [
      {
        kind: 'automatic',
        ...base,
        parts: describeEntry(entry, names),
        // A Removed line offers no Revert, though the combat state derivation still applies a revert of a removal stored earlier.
        isRevertible:
          isRevertibleLogEntryKind(entry.kind) && entry.kind !== 'removed',
      },
    ];
  });
};
