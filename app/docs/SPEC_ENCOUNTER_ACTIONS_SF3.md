# Sub-feature 3: Recording a log entry

A typed write path for the seven action kinds: one `INSERT` per call, a data-access hook that refuses a second call and stays pending until the new numbers are shown. SF4 is its only caller. Governing Key Architectural Decisions: "Payload shapes", "Typed create", "Pending covers the refetch".

## Files affected

Modified:

- `app/domain/encounters/errors.ts` — `encounterLogRecordError`; `app/domain/encounters/index.ts` — its explicit named export.
- `app/db/encounter-log-entry/types.ts` and `create.ts` — generic over the kind.
- `app/db/encounter-log-entry/__tests__/create.test.ts` — one new case; the existing three stay valid (their `kind: 'added'` literals infer `K`).
- `app/services/encounterLogEntryService.ts` — add `recordLogEntry`.
- `app/src/data-access-layer/encounters/encounterKeys.ts` — key.
- `app/src/data-access-layer/encounters/useEncounterLogEntries.ts` — add the write.

New:

- `app/src/data-access-layer/encounters/__tests__/useEncounterLogEntries.test.ts`.

## Layered breakdown

### Domain

`encounterLogRecordError(cause?)` by the factory pattern of `encounterQueueAddError`, message `Failed to record an encounter log entry: …`. It is consumed by the service below.

### Database

`CreateEncounterLogEntryInput` becomes generic and `create` follows. `encounterQueueService.ts` calls `logEntryDb.create({ kind: 'added', … })` and keeps compiling, since `K` is inferred (no change to that file).

```ts
type CreateEncounterLogEntryInput<K extends LogEntryKind> = {
  encounter_id: string;
  kind: K;
  payload: LogEntryPayload<K>;
};
declare const create: <K extends LogEntryKind>(
  data: CreateEncounterLogEntryInput<K>,
) => Promise<string>;
```

Before this, `kind: 'damage'` with an `added` payload type-checked and failed only in `parse`. [spec-writer_4: ran `npx tsc --noEmit` and `npx eslint <scratch file>` from `app/` on the block as a `declare` in `app/src/screens/encounter/` (with the other blocks of this spec) — tsc reported nothing and eslint reported only `local/no-unused-exports` on the scratch export] Behaviour (`create.test.ts`): a `temp-hp` entry is stored with its `value`-field payload serialized — a kind mapped to the wrong schema.

### Services

```ts
declare const recordLogEntry: <K extends LogEntryKind>(
  encounterId: string,
  kind: K,
  payload: LogEntryPayload<K>,
) => Promise<void>;
```

It calls `logEntryDb.create({ encounter_id: encounterId, kind, payload })` and throws `encounterLogRecordError(err)`. The signature is covered by the same run. A pure delegate-and-wrap: no test file. Its caller is `useEncounterLogEntries`.

### Data Access Layer

`encounterKeys.recordLogEntry(encounterId)` returns `['encounter-record-log-entry', encounterId]`: no `device` prefix and not the bare element `encounter`, and scoped to the encounter, so the mutation-cache filter does not match another encounter's write.

`useEncounterLogEntries` gains the two fields below. The cross-SF consumer is `EncounterCombatantActionsTab.tsx` (SF4), which reads both. [spec-writer_4: ran `npx tsc --noEmit` and `npx eslint <scratch file>` from `app/` on the block, with the body written out in `app/src/data-access-layer/encounters/` against a `declare`d service — tsc reported nothing and eslint reported only `local/no-unused-exports` on the scratch export]

```ts
type UseEncounterLogEntriesReturn = {
  logEntries: EncounterLogEntry[];
  loading: boolean;
  isRecording: boolean;
  recordLogEntry: <K extends LogEntryKind>(
    kind: K,
    payload: LogEntryPayload<K>,
  ) => Promise<boolean>;
};
```

It follows `useEncounterQueueItems.ts`'s Add: a `useMutation` with `mutationKey: encounterKeys.recordLogEntry(encounterId)` and `mutationFn` taking `{ kind, payload }` and calling the service with the hook's `encounterId` (closure-captured, dispatch is synchronous); `isRecording` is `useIsMutating({ mutationKey }) > 0`; `recordLogEntry` returns `false` without calling the service when `queryClient.isMutating({ mutationKey }) > 0`, otherwise awaits `mutateAsync` and returns `true`. Unlike the Add hook, `onSuccess` returns `queryClient.invalidateQueries({ queryKey: encounterKeys.logEntries(encounterId) })` instead of discarding it: `mutateAsync` and the pending state wait for a hook-level `onSuccess` that returns a promise (`.claude/knowledge/tanstack-query.md` — the entry beginning "`mutateAsync` resolves only after"), and the promise settles after the refetch (the entry beginning "`invalidateQueries` returns its refetch's promise"). Add a named code comment at that `onSuccess`: with `void` the buttons would re-enable while the queue still shows the old HP, and a second click would act on stale numbers. Types from `@db/encounter-log-entry` and `@domain/encounters`; the barrels already export the hook (SF1).

Behaviours (`useEncounterLogEntries.test.ts`, `renderHookWithQueryClient` and `settle`, `@services/encounterLogEntryService` mocked with a deferred `recordLogEntry`, the pattern of `useEncounterQueueItems.test.ts`):

- Every hook instance of the encounter reports `isRecording` while a write is pending, another encounter's does not, and all clear after it resolves — a hook-local flag that leaves the other buttons enabled.
- A second call in the same call stack calls the service once and resolves `false` — a double click applying damage twice.
- `isRecording` stays true after the write resolves until the log refetch has resolved (a deferred second `getLogEntries`) — buttons re-enabled on stale HP.
- The log key of the encounter is invalidated after a write — the queue showing old HP.
- A write for another encounter is not refused while this encounter's is pending — a key without the encounter.
