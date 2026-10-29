# Sub-feature 3: Delete path for messages: db remove, service, hook

A typed message can be deleted through a db delete limited to `kind = 'message'`, a service function and a hook wrapper that shares the record mutation's pending guard. The hook's `deleteLogMessage` has no UI reader yet: `EncounterLogEntry` calls it in sub-feature 6.

## Files affected

Modified:

- `app/domain/encounters/errors.ts` — `encounterLogDeleteError`
- `app/domain/encounters/index.ts` — `export { encounterLogDeleteError } from './errors';` after `encounterLogRecordError` (explicit, one name per line as the file does for errors)
- `app/db/encounter-log-entry/index.ts` — `export { remove } from './remove';` (explicit named export, as its siblings)
- `app/services/encounterLogEntryService.ts` — `deleteLogMessage`
- `app/src/data-access-layer/encounters/useEncounterLogEntries.ts` — `deleteLogMessage` and the shared guard
- `app/src/data-access-layer/encounters/__tests__/useEncounterLogEntries.test.ts` — the `vi.mock` factory of `@services/encounterLogEntryService` gains a hoisted `deleteLogMessage` spy; no existing assertion goes stale

No change: `app/src/data-access-layer/encounters/index.ts` and the `@/data-access-layer` barrel, which already export `useEncounterLogEntries`; its return type gains a field and no export changes.

New:

- `app/db/encounter-log-entry/remove.ts`
- `app/db/encounter-log-entry/__tests__/remove.test.ts`

## Domain

`encounterLogDeleteError(id: string, cause?: unknown)` follows `encounterUpdateError` in the same file. Substitutions: the module-private type `EncounterLogDeleteError`, the factory name, `error.name = 'EncounterLogDeleteError'`, and the message `Failed to delete the encounter log entry ${id}: ${String(cause)}`. An error factory needs no test (`app/domain/CLAUDE.md` — Testing).

## Database

`remove(id: string): Promise<void>` calls `assertValidId(id, 'Log entry')` and executes `DELETE FROM encounter_log_entries WHERE id = $1 AND kind = 'message'` with the id bound. One comment at the statement says the `kind` clause is the module's guarantee that only messages are ever deleted from an otherwise append-only log. Sync needs no change: the table has a delete trigger and its deletes travel as tombstones [spec-writer_14: `app/db/_migrations/1793213621920_add_encounter_queue_and_log.ts:38,48` — `SYNCED_TABLE_NAMES` lists `encounter_log_entries` and the frozen `buildTriggerSQL` creates `trg_sync_${tableName}_delete`; `app/db/_sync/apply-delete.ts` — found]. The literal in the `WHERE` clause follows the constants already inline in `_sync/apply-delete.ts:16`.

## Services

`deleteLogMessage(entryId: string): Promise<void>` calls `logEntryDb.remove(entryId)` in a try/catch that throws `encounterLogDeleteError(entryId, err)`, like `recordLogEntry` beside it. It needs no test: it only delegates and wraps (`app/services/CLAUDE.md` — Testing), and no test file exists for this service [spec-writer_15: `ls app/services/__tests__` — `encounterQueueService.test.ts`, `syncService.test.ts`, `support`].

## Data Access Layer

`UseEncounterLogEntriesReturn` gains `deleteLogMessage: (entryId: string) => Promise<boolean>`, resolving `false` when refused.

```ts
type UseEncounterLogEntriesReturn = {
  logEntries: EncounterLogEntry[];
  loading: boolean;
  isRecording: boolean;
  recordLogEntry: <K extends LogEntryKind>(
    kind: K,
    payload: LogEntryPayload<K>,
  ) => Promise<boolean>;
  deleteLogMessage: (entryId: string) => Promise<boolean>;
};
```

[spec-writer_16: ran `npx tsc --noEmit` and `npx eslint` from `app/` with this block and its imports as a scratch `.ts` file in `app/src/data-access-layer/encounters/` — tsc exit 0; eslint only the scratch's own `void` reference; scratch deleted]

The delete is a second `useMutation` with `mutationFn: (entryId: string) => service.deleteLogMessage(entryId)` (the id is per-call data, not a construction-time argument) and the same `mutationKey` as the record mutation. [Shared key: see the root file's "Delete shares the record mutation's key".] Because the key, the post-write invalidation and the pending check would each otherwise appear twice, the hook holds the key in one local constant, the invalidation in one local function returned from both mutations' `onSuccess` (so each stays pending until the log refetch resolves, as today), and the call-time check `queryClient.isMutating({ mutationKey }) > 0` in one local function that `recordLogEntry` and `deleteLogMessage` both call before `mutateAsync`. A comment at the key says it is shared by the two mutations on purpose, so that `isRecording` and the refusal cover both. The key constant is declared right after `queryClient`, before the first `useMutation` and `useIsMutating` call, because those read it while the hook body runs.

The two writers read and change the same pending state:

| Writer | Trigger | State read | State changed | No-op when |
| --- | --- | --- | --- | --- |
| `recordLogEntry` | an action button, Revert, a send | mutations pending under the key | one record mutation pending, then the log refetched | any mutation under the key is pending (resolves `false`) |
| `deleteLogMessage` | Delete on a message | mutations pending under the key | one delete mutation pending, then the log refetched | any mutation under the key is pending (resolves `false`) |

## Behaviours and their defect

- `remove.test.ts`: a message row is deleted and the encounter's other rows (a `damage` row, another message) stay; rows are read from the database directly. Defect: a delete without the id clause.
- `remove.test.ts`: a row of another kind is not deleted when its id is passed. Defect: the missing `kind` clause, which lets the UI path erase the append-only record.
- `remove.test.ts`: an empty id rejects and deletes nothing. Defect: a missing id guard.
- `useEncounterLogEntries.test.ts`: a delete calls the service once with the entry id and invalidates the log key. Defect: a stale list after a delete, or the wrong id.
- `useEncounterLogEntries.test.ts`: two deletes in one call stack call the service once and the second resolves `false`. Defect: a double click deleting twice.
- `useEncounterLogEntries.test.ts`: a delete during a pending record, and a record during a pending delete, are refused with `false`, and a sibling instance reports `isRecording` while a delete is pending until the refetch resolves. Defect: separate keys, which leave Revert and send enabled during a delete.

## Verification

After the check rows pass and before the commit, run `pnpm run mutation-check -- app/db/encounter-log-entry/remove.ts app/src/data-access-layer/encounters/useEncounterLogEntries.ts` from the repository root and resolve every survivor.
