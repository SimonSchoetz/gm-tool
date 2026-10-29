# Sub-feature 4: Log lines: time helper, line builder, lines hook

The log's entries become `LogLine` values with their wording, revert state and time source. The Log tab in sub-feature 6 is the consumer of `useEncounterLogLines`, of the `LogLine` type and of `getTimeString` through `@util`.

## Files affected

Modified:

- `app/util/getDateTimeString.ts` — composes `getDateString` and `getTimeString` instead of repeating both bodies [spec-writer_17: `app/util/getDateTimeString.ts:4-8` and `app/util/getDateString.ts:4-8` — the same `toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })` call]; its existing test needs no edit because its two assertions (the pattern, `Invalid Date Invalid Date`) still hold
- `app/domain/encounters/index.ts` — `isRevertibleLogEntryKind` added to the `./logEntryPayloads` export line (explicit named exports)

New:

- `app/util/getTimeString.ts` and `app/util/__tests__/getTimeString.test.ts`
- `app/src/screens/encounter/helper/buildLogLines.ts` and `__tests__/buildLogLines.test.ts`
- `app/src/screens/encounter/hooks/useEncounterLogLines.ts` and `__tests__/useEncounterLogLines.test.ts`

## Util

`getTimeString(dateString: string): string` formats with `toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })` and is imported by `getDateTimeString` directly. Its barrel line in `util/index.ts` comes in sub-feature 6, with its first outside consumer. An unparsable string gives `Invalid Date`, as its sibling helpers do.

## Frontend

```ts
type LogLine =
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

declare function buildLogLines(
  queueItems: EncounterQueueItem[],
  logEntries: EncounterLogEntry[],
  baseEntities: BaseEntity[],
): LogLine[];

declare function useEncounterLogLines(): {
  lines: LogLine[];
  loading: boolean;
};
```

[spec-writer_18: ran `npx tsc --noEmit` and `npx eslint` from `app/` with this block and the imports `BaseEntity` from `@db/base-entity`, `EncounterLogEntry` from `@db/encounter-log-entry`, `EncounterQueueItem` from `@db/encounter-queue-item` as a scratch `.ts` file in `app/src/screens/encounter/helper/` — tsc exit 0; eslint only the scratch's own `void` references; scratch deleted]

`LogLine` is exported from `buildLogLines.ts` and imported by `useEncounterLogLines` for its return type; the Log tab's components read it in sub-feature 6. `buildLogLines` returns one line per entry in the given order. It calls `deriveCombatState` once and `nameQueueItems` once, and reads names from the latter (`shownName` for a target, `baseName` for `Added`).

- An entry that `readLogEntry` cannot read gives an `unreadable` line; a readable `message` gives a `message` line with its `editorState`.
- Wording is the label, a colon and a space, then the targets comma-separated in payload order: `Damage`, `Heal`, `Temp HP`, `Max HP`, `Defeated`, `Undefeated`, `Removed`, with `(amount)` after each target of `damage` and `heal` and `(value)` after each target of `temp-hp` and `max-hp`; `Added: <baseName of the first resolvable item>` followed by a space and `×<n>` only when n, the number of ids in the payload, is above 1.
- A target with no queue item is left out; a line left with no target is its label alone.
- A `revert` whose `entryId` is in `revertedEntryIds` reads `Reverted:`, a space and the text of the entry it names, built by the same text function; any other `revert` is `unreadable`.
- `isReverted` is membership in `revertedEntryIds`; `isRevertible` is `isRevertibleLogEntryKind(kind) && !isReverted` for a readable entry. The UI recomputes neither.

`useEncounterLogLines` mirrors `useEncounterQueueEntries` without the encounter read: it reads `useParams` for the route's ids, the queue items, the log entries and the adventure's base entities, reports `loading` while any read is pending (with `lines` empty), and otherwise returns `buildLogLines` of the three reads.

## Behaviours and their defect

- `getTimeString.test.ts`: a time formats as hour, minute and AM/PM; an unparsable string fails gracefully. Defect: a date or 24-hour time in the log.
- `buildLogLines.test.ts`: each automatic kind reads its label, names and bracketed amount or value; several targets are comma-separated in order. Defect: a wrong label, a `value` read as `amount`, a lost target.
- `buildLogLines.test.ts`: `Added` shows the base name once and `×n` only above one. Defect: a numbered name or `×1`.
- `buildLogLines.test.ts`: a removed combatant is named as the log's naming helper gives it while the queue shows another name. Defect: the log using the queue's names.
- `buildLogLines.test.ts`: a target with no queue item is left out and a line with none is its label alone. Defect: a thrown error or `undefined` in the text during a sync.
- `buildLogLines.test.ts`: a reverted entry has `isReverted` true and `isRevertible` false, its revert line reads `Reverted: <its text>`, and `added`, `revert` and `message` lines are not revertible. Defect: Revert offered twice or on the wrong kinds.
- `buildLogLines.test.ts`: a revert naming an ignored entry, an unknown kind and invalid JSON are `unreadable`. Defect: a throw or a wrong line on a bad entry.
- `buildLogLines.test.ts`: a message line carries its editor state; a renamed entity changes how earlier lines read. Defect: a lost message, a stale name.
- `useEncounterLogLines.test.ts`: `lines` stay empty while each of the three reads is pending, and the loaded reads produce the lines. Defect: partial lines before every read loaded.

## Verification

After the check rows pass and before the commit, run `pnpm run mutation-check -- app/util/getTimeString.ts app/util/getDateTimeString.ts app/src/screens/encounter/helper/buildLogLines.ts app/src/screens/encounter/hooks/useEncounterLogLines.ts` from the repository root and resolve every survivor.
