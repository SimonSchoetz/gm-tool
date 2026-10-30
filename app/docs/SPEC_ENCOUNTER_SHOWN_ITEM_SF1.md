# Sub-feature 1: Shown name and queue-item write path

The shown name honours a stored rename, and a queue item's `custom_name` and `notes` can be written and saved through the autosave queue. Nothing in this sub-feature renders: `updateQueueItem` is consumed by sub-feature 4 (name field) and sub-feature 6 (notes), and the entry field `automaticName` by sub-feature 4.

## Files affected

Modified:

- `app/domain/encounters/shownCombatantNames.ts` — `NamedItem` gains `customName`; the return value changes shape.
- `app/domain/encounters/__tests__/shownCombatantNames.test.ts` — every assertion that compares a value read with `.get(…)` to a string goes stale, because the map now holds `{ shownName, automaticName }`; the `item` builder gains `customName: null`.
- `app/domain/encounters/errors.ts` — add `encounterQueueUpdateError`.
- `app/domain/encounters/index.ts` — add `export { encounterQueueUpdateError } from './errors';` as one more explicit line beside its neighbours; the `shownCombatantNames` export line is unchanged.
- `app/db/encounter-queue-item/index.ts` — add `UpdateEncounterQueueItemInput` to the explicit `export type { … } from './types'` line (a file outside the folder may import only `index.ts`; `local/no-import-past-index` rejects `…/types` [spec-writer_7: ran `npx eslint` on a scratch module importing `../../../db/encounter-queue-item/types` from `app/src/data-access-layer/encounters/` — observed `local/no-import-past-index`]).
- `app/db/encounter-queue-item/__tests__/update.test.ts` — one new case; the existing assertions are unchanged.
- `app/services/encounterQueueService.ts` — add `updateQueueItem`.
- `app/services/__tests__/encounterQueueService.test.ts` — new `describe` for `updateQueueItem`; the existing `vi.mock('@db/encounter-queue-item')` factory already stubs `update`.
- `app/src/data-access-layer/encounters/useEncounterQueueItems.ts` — add `updateQueueItem`.
- `app/src/data-access-layer/encounters/__tests__/useEncounterQueueItems.test.ts` — the `vi.mock('@services/encounterQueueService')` factory gains a hoisted `updateQueueItem` stub; new cases.
- `app/src/screens/encounter/helper/nameQueueItems.ts` and `…/__tests__/nameQueueItems.test.ts`.
- `app/src/screens/encounter/helper/buildQueueEntries.ts` and `…/__tests__/buildQueueEntries.test.ts`.
- `app/src/screens/encounter/helper/__tests__/buildLogLines.test.ts` — new cases; `buildLogLines.ts` needs no change, it reads only `shownName` and `baseName` from `nameQueueItems` [spec-writer_8: `app/src/screens/encounter/helper/buildLogLines.ts:50,90-98` — as of 1cbf2b90].

## Domain

`shownCombatantNames` contract (`customName` never enters the numbering key, so a renamed item still counts for its siblings' numbers) [spec-writer_23: ran `npx tsc --noEmit` from `app/` with this block in a scratch module beside `shownCombatantNames.ts` — exit 0; `npx eslint` on it reported only `local/no-unused-exports` on the declared export]:

```ts
type NamedItem = {
  id: string;
  baseEntityId: string | null;
  name: string | null;
  customName: string | null;
  sequenceNumber: number | null;
};
export declare const shownCombatantNames: (
  items: NamedItem[],
  entityNamesById: Map<string, string | null>,
) => Map<string, { shownName: string; automaticName: string }>;
```

`automaticName` is today's value (entity name or stored name, plus the number while two or more kept siblings share the key). `shownName` is the trimmed `customName` when that is non-empty, else `automaticName`. `shownCombatantBaseName` keeps ignoring `customName` and takes the same `NamedItem`.

`encounterQueueUpdateError(cause?: unknown)` is a factory in `errors.ts` shaped like `encounterQueueReorderError`, with the error name `EncounterQueueUpdateError` and the message `Failed to update the encounter queue item: ${String(cause)}`. An error factory needs no test (`app/domain/CLAUDE.md` — Testing).

## Database

The `update.test.ts` case writes `{ custom_name: 'Boss', notes: 'n' }` and then `{ custom_name: null }` to one of two rows. It asserts `custom_name` is null, `notes` is still `'n'`, and the other row is untouched. `buildUpdateQuery` skips only `undefined` and `assertHasUpdateFields` rejects only `undefined`, so null is written [spec-writer_9: `app/db/util/build-update-query.ts:17-21`, `app/db/util/validation.ts:7-13` — as of 1cbf2b90]; the test confirms the zod parse accepts it.

## Services

`updateQueueItem(id: string, data: UpdateEncounterQueueItemInput): Promise<void>` wraps `queueItemDb.update(id, data)` in try/catch and throws `encounterQueueUpdateError(err)`. Import the input type on the file's existing `@db/encounter-queue-item` type import.

## Data access layer

`useEncounterQueueItems` returns one more member, `updateQueueItem: (id: string, data: UpdateEncounterQueueItemInput) => void`, named in `UseEncounterQueueItemsReturn` with a concrete signature rather than a TanStack primitive.

- It holds `useAutosaveQueue` with `mergeScopedEdit` over an edit of `{ encounterId: string; data: UpdateEncounterQueueItemInput }`, keyed by the queue item id, written through a `useMutation` whose `mutationFn` takes `{ id, encounterId, data }` and calls `service.updateQueueItem(id, data)`; `write` passes the scheduled `encounterId` through `mutate()`'s variables (`.claude/rules/src-data-access-layer.md` — the deferred-save rules).
- `updateQueueItem` first writes the cache with `setQueryData` on `encounterKeys.queueItems(encounterId)`, merging `data` into the matching item with `mergeUpdate` and returning `old` unchanged when no entry is cached, then schedules the edit, so every reader of the cache shows the change instantly and the database write follows after the autosave delay of about 0.5 s (the user's decision, row 23). `mergeUpdate` skips only `undefined`, so a `null` rename merges [spec-writer_10: `app/src/data-access-layer/mergeUpdate.ts:5-9` — as of 1cbf2b90]; the call type-checks [spec-writer_11: ran `npx tsc --noEmit` from `app/` with a scratch module calling `useAutosaveQueue<{ encounterId: string; data: UpdateEncounterQueueItemInput }>(mergeScopedEdit, …)` and `mergeUpdate(item, data)` — exit 0].
- The mutation's `onError` invalidates `encounterKeys.queueItems(scheduledEncounterId)`, read from the mutation variables. There is no `onSuccess` invalidation.

## Frontend helpers

- `nameQueueItems.ts`: `toNamedItem` passes `customName: item.custom_name`; each returned record gains `automaticName` beside `shownName` and `baseName`, taken from the same two merged passes so a removed item keeps its all-items values; `baseName` is unchanged.
- `buildQueueEntries.ts`: each entry gains `automaticName`, read from the same `nameQueueItems` record as `name`; keep each existing Stryker disable comment directly above the line it describes. No change is needed in `EncounterQueue.tsx`: it spreads `{...entry}` into `EncounterQueueEntry`, which destructures its listed props only, and the type-check accepts the extra fields [spec-writer_27: ran `npx tsc --noEmit` from `app/` with a scratch component spreading an object with `automaticName` and `entity` into `EncounterQueueEntry` — exit 0].

## Tests — behaviours and the defect each catches

- `shownCombatantNames.test.ts`: a renamed item shows its trimmed name with no number while its sibling keeps its number (catches a rename that is numbered, or drops out of the sibling count); a stored name of spaces falls back to the automatic name (catches an empty queue entry); `automaticName` ignores the rename (catches the name field comparing a typed name against the rename); `shownCombatantBaseName` ignores `customName` (catches an `Added` line renamed after one combatant).
- `update.test.ts`: the case above (catches a null skipped, and other columns or rows overwritten).
- `encounterQueueService.test.ts`: `updateQueueItem` calls `update` with the id and data (catches swapped arguments) and rejects as `EncounterQueueUpdateError` when `update` fails (catches a raw database error reaching callers).
- `useEncounterQueueItems.test.ts`: the cache holds the edit at once (catches a refetch-dependent display); the service receives the scheduled id and data after a re-render for another encounter id (catches the repointed write); a failed write invalidates the scheduled encounter's queue key, not the re-rendered one (catches the repointed invalidation); two edits to one item reach the service as one merged write (catches a lost first edit); a `null` rename after text reaches the service as null (catches a merge that skips null); a successful save invalidates nothing (catches the refetch that overwrites a pending keystroke).
- `nameQueueItems.test.ts`: a renamed kept item shows its name and keeps its siblings' numbering; a renamed removed item shows its name; a removed item's `automaticName` comes from the all-items pass (catches a rename dropped for removed items, and a sibling renumbered).
- `buildQueueEntries.test.ts`: an entry's `name` is the rename and its `automaticName` the numbered automatic name (catches a queue that ignores the rename).
- `buildLogLines.test.ts`: a Damage line names the renamed combatant; an `Added` line for a batch whose first item is renamed still reads the entity name with `×N` (catches the rename leaking into the base name).

## Verification step

After the check rows pass and before the commit, run `pnpm run mutation-check -- app/domain/encounters/shownCombatantNames.ts app/services/encounterQueueService.ts app/src/data-access-layer/encounters/useEncounterQueueItems.ts app/src/screens/encounter/helper/nameQueueItems.ts app/src/screens/encounter/helper/buildQueueEntries.ts` and resolve every survivor.
