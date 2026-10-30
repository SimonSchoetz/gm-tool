# Sub-feature 4: Data access layer: one add mutation for three kinds

`useEncounterQueueItems` adds entity combatants, random combatants and events through one mutation on one key, refuses a second add of any kind while one is pending, and keeps every Add button disabled until the queue and the log have refetched.

## Files affected

Modified:

- `app/src/data-access-layer/encounters/encounterKeys.ts` — `addCombatants` is renamed `addQueueItems`, key `['encounter-add-queue-items', encounterId] as const` (the key covers every add, so it is named for what it covers, as `writeLogEntry` is)
- `app/src/data-access-layer/encounters/useEncounterQueueItems.ts` — see Data Access Layer
- `app/src/data-access-layer/encounters/__tests__/useEncounterQueueItems.test.ts` — the `vi.mock` factory of `@services/encounterQueueService` gains hoisted `addRandomCombatants` and `addEvent` spies typed against the real exports, re-armed in `beforeEach`; `withDeferredAdd` takes the spy it defers; the assertion of `invalidates the queue of the encounter once an add resolved` (`toHaveBeenCalledWith` the queue key) stays true and the test gains the log key; new cases below

No change: `app/src/data-access-layer/encounters/index.ts` and `app/src/data-access-layer/index.ts` — they export `useEncounterQueueItems` by name and the key factory is not exported (`.claude/rules/src-data-access-layer.md` — Query keys are internal to the module).

## Data Access Layer

[spec-writer_1: scratch tsc and eslint run, see sub-feature 1]

```ts
type AddQueueItemsVariables =
  | {
      kind: 'entity';
      entityType: BaseEntityType;
      baseEntityId: string;
      quantity: number;
    }
  | {
      kind: 'random';
      name: string;
      startingMaxHp: number | null;
      quantity: number;
    }
  | { kind: 'event'; name: string };

// added to UseEncounterQueueItemsReturn; addEntityCombatants and isAdding keep their signatures
type AddFunctions = {
  addRandomCombatants: (
    name: string,
    startingMaxHp: number | null,
    quantity: number,
  ) => Promise<boolean>;
  addEvent: (name: string) => Promise<boolean>;
};
```

- One `useMutation` (KAD "Every add shares one key, refreshes the log and stays pending until both refetch") with `mutationKey: encounterKeys.addQueueItems(encounterId)` and `mutationFn` taking `AddQueueItemsVariables`, switching on `kind` to call `service.addEntityCombatants`, `service.addRandomCombatants` or `service.addEvent` with the encounter id the hook closed over (synchronous dispatch, so the id is not a variable: `.claude/rules/src-data-access-layer.md` — Non-negotiable rules). `isAdding` reads the same key through `useIsMutating`.
- One private function `add(variables)` (KAD "One append path with three entry points") holds the call-time refusal (`queryClient.isMutating({ mutationKey }) > 0` returns `false`) and then `await addMutation.mutateAsync(variables)` and `return true`; the three returned functions each call it with their own variables, so no add skips the refusal. The comment above `isAdding` is reworded to name all three adds.
- `onSuccess` returns `Promise.all` of `invalidateQueries` for `encounterKeys.queueItems(encounterId)` and for `encounterKeys.logEntries(encounterId)`. `mutateAsync` resolves, and the mutation stays pending, until that promise settles, so every Add button stays disabled until the queue and the log have refetched (`.claude/knowledge/tanstack-query.md` — the entry beginning "`mutateAsync` resolves only after the hook-level `onSuccess` has settled"). The log is refetched because the entity Add's `added` line did not show in the Log tab before, and the Add criterion needs it to.
- The rename of an event runs through the existing `updateQueueItem` and its autosave queue unchanged; only `UpdateQueueItemData` (sub-feature 3) is wider.

The three adds read and change the same pending state:

| Writer | Trigger | State read | State changed | No-op when |
| --- | --- | --- | --- | --- |
| `addEntityCombatants` | Add on an entity row | mutations pending under the key | one add mutation pending, then the queue and the log refetched | any add mutation of the encounter is pending (resolves `false`) |
| `addRandomCombatants` | Add, or Enter, in the random combatant form | mutations pending under the key | one add mutation pending, then the queue and the log refetched | any add mutation of the encounter is pending (resolves `false`) |
| `addEvent` | Add, or Enter, in the event form | mutations pending under the key | one add mutation pending, then the queue and the log refetched | any add mutation of the encounter is pending (resolves `false`) |

Cross-sub-feature wiring: `addRandomCombatants` is called by `EncounterAddRandomCombatant` and `addEvent` by `EncounterAddEvent`, both in sub-feature 7.

## Behaviours and their defect

- `useEncounterQueueItems.test.ts`: each of the three adds, called twice in one call stack, calls its service function once with the encounter id and its variables, and the second call resolves `false`. Defect: a double click adding twice, or a kind that skips the shared refusal.
- `useEncounterQueueItems.test.ts`: while an add of one kind is pending, an add of each other kind is refused with `false`, and a hook instance of the same encounter reports `isAdding`, one of another encounter does not. Defect: separate keys per kind, which let an event Add run beside an entity Add and hand out one `sort_order` twice.
- `useEncounterQueueItems.test.ts`: a resolved add invalidates both the queue key and the log key of its encounter. Defect: an `added` line missing from the open Log tab.
- `useEncounterQueueItems.test.ts`: `isAdding` stays true after the service resolved until the invalidations have settled (a deferred `invalidateQueries`). Defect: `void` instead of a returned promise, which re-enables Add buttons while the queue shows old rows.
- `useEncounterQueueItems.test.ts`: `updateQueueItem('a', { name: 'Lair' })` writes `name` into the cached item at once and schedules the service call with `{ name: 'Lair' }` for that id. Defect: an event rename dropped by the merge, or written to another item.

## Verification

After the check rows pass and before the commit, run `pnpm run mutation-check -- app/src/data-access-layer/encounters/useEncounterQueueItems.ts` from the repository root and resolve every survivor.
