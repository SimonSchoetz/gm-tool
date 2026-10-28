# Sub-feature 3: Queue data access

Adds the two data-access hooks the screen needs: `useEncounterQueueItems` (the queue, Add, reorder and the encounter-wide pending state) and `useAdventureBaseEntities` (the entities of all six types). SF5's `EncounterQueue` consumes `queueItems`, `loading` and `reorderQueueItems` of the first and the second hook; SF6's `EncounterAddTab` consumes `useAdventureBaseEntities`, and SF6's `EncounterAddRow` consumes `addEntityCombatants` and `isAdding`. The facts about `useIsMutating` and `queryClient.isMutating` this sub-feature relies on are recorded in `.claude/knowledge/tanstack-query.md` (the entries about `useIsMutating`, the `mutationKey` prefix match and `QueryClient.isMutating`); the first came from the verdict section "Facts verified for the knowledge store" of `.claude/cycles/2026-10-28-encounter-queue-lead/02-architect-verdict.md`.

## Files affected

Modified:

- `app/src/data-access-layer/encounters/encounterKeys.ts` — add `queueItems` and `addCombatants`
- `app/src/data-access-layer/encounters/encounterQueryOptions.ts` — add `encounterQueueItemsQueryOptions`
- `app/src/data-access-layer/encounters/index.ts` — explicit export `useEncounterQueueItems`
- `app/src/data-access-layer/base-entities/index.ts` — explicit export `useAdventureBaseEntities`
- `app/src/data-access-layer/index.ts` — the encounters line becomes `export { useEncounters, useEncounter, useEncounterQueueItems } from './encounters';` and the base-entities line `export { useBaseEntities, useBaseEntity, useAdventureBaseEntities } from './base-entities';`

Deleted: none

New:

- `app/src/data-access-layer/encounters/useEncounterQueueItems.ts`, `app/src/data-access-layer/encounters/__tests__/useEncounterQueueItems.test.ts`
- `app/src/data-access-layer/base-entities/useAdventureBaseEntities.ts`

Moved: none

Draft: none

## Layered breakdown

### Data access layer

`encounterKeys` gains `queueItems: (encounterId: string) => ['encounter-queue-items', encounterId] as const` and `addCombatants: (encounterId: string) => ['encounter-add-combatants', encounterId] as const` (a mutation key). Neither key starts with the bare element `'encounter'`, so the `detail` invalidation `['encounter', id]` that every notes autosave runs does not match them. Add a comment above `queueItems` stating that rationale and the failure mode (a key of the form `['encounter', id, …]` would be refetched by every notes save), as `baseEntityKeys.ts` does for its list key.

`encounterQueueItemsQueryOptions(encounterId)` in `encounterQueryOptions.ts`: `queryKey: encounterKeys.queueItems(encounterId)`, `queryFn: () => service.getQueueItems(encounterId)` (service `@services/encounterQueueService`), `enabled: !!encounterId`, `throwOnError: true`, the shape of `sessionStepListQueryOptions`. It stays file-exported only for the hook.

`useEncounterQueueItems.ts`:

```ts
type UseEncounterQueueItemsReturn = {
  queueItems: EncounterQueueItem[];
  loading: boolean;
  addEntityCombatants: (
    entityType: BaseEntityType,
    baseEntityId: string,
    quantity: number,
  ) => Promise<void>;
  isAdding: boolean;
  reorderQueueItems: (orderedIds: string[]) => void;
};
export declare const useEncounterQueueItems: (encounterId: string) => UseEncounterQueueItemsReturn;
```

- `queueItems` and `loading` come from `useQuery(encounterQueueItemsQueryOptions(encounterId))` (`data = []`, `isPending`).
- The add mutation has `mutationKey: encounterKeys.addCombatants(encounterId)`, `mutationFn` taking `{ entityType, baseEntityId, quantity }` and calling `service.addEntityCombatants(encounterId, …)` with `encounterId` closed over (synchronous dispatch, `.claude/rules/src-data-access-layer.md` — Non-negotiable rules), and `onSuccess` invalidating `encounterKeys.queueItems(encounterId)`. The exposed `addEntityCombatants` first returns when `queryClient.isMutating({ mutationKey: encounterKeys.addCombatants(encounterId) }) > 0`, then awaits `mutateAsync`. `isAdding` is `useIsMutating({ mutationKey: encounterKeys.addCombatants(encounterId) }) > 0`. (KADs "Add is disabled for the whole encounter through the mutation cache" and "A second Add call in the same call stack is refused at the source".) Add a comment at these two constructs naming the failure modes: a hook-local `isPending` belongs to one hook instance, so rows would not disable each other, and a `useIsMutating` value read from render state lags the call by a render, so two calls in one call stack would both write and hand out the same `sort_order` and `sequence_number`.
- `reorderQueueItems(orderedIds)` follows `useSessionSteps.bulkReorder`: `setQueryData` on `encounterKeys.queueItems(encounterId)` rewrites the cached list to the ids in the given order with `sort_order` equal to the index, dropping ids not in the cache, then `mutate(orderedIds)` of a mutation whose `mutationFn` calls `service.reorderQueueItems` and whose `onError` invalidates the queue key. [spec-writer_12: ran `npx vitest run` on a scratch test of a scratch hook with these add, `isAdding` and reorder constructs — observed 2 passed; with the `queryClient.isMutating` line removed the cross-instance test failed with the service called 2 times instead of 1]

`useAdventureBaseEntities.ts` exports `useAdventureBaseEntities(adventureId: string): { baseEntities: BaseEntity[]; loading: boolean }`: `useQueries` over `BASE_ENTITY_TYPES.map((entityType) => baseEntityListQueryOptions(entityType, adventureId))` (`BASE_ENTITY_TYPES` from `@domain/entities`, as `baseEntityQueryOptions.ts` imports it), `baseEntities` the flattened `data ?? []` of the results in type order, `loading` true while any result `isPending`. It adds no key and changes no existing mutation. [spec-writer_5: ran `npx tsc --noEmit` and `npx eslint` on two scratch files, one with this hook body and one with the log payload module of the combat schema — observed no type error and only the unused-export lint report]

Test behaviors (`useEncounterQueueItems.test.ts`, `@services/encounterQueueService` mocked with `vi.hoisted` spies, rendered with `renderHookWithQueryClient` and `settle`; the failure case builds its own client from `createQueryClient()` and a wrapper of `ErrorBoundary` (`react-error-boundary`) around `QueryClientProvider` with `renderHook`, because the helper has no wrapper option and a rejected mutation throws from the hook's render (`.claude/knowledge/testing-library.md`, the entry beginning "A mutation that fails under `throwOnError: true`")):

- two hook instances for one encounter: while one `addEntityCombatants` is pending the other instance's `isAdding` is `true`, a hook for another encounter stays `false`, and it is `false` again after the service resolves — catches a per-instance flag and an unscoped mutation key
- a second `addEntityCombatants` called in the same synchronous call stack as the first calls the service once — catches the guard removed
- a resolved add invalidates `encounterKeys.queueItems(encounterId)` — catches a queue that does not show added combatants
- `reorderQueueItems` rewrites the cached list's `sort_order` at once and calls the service with the ordered ids; a rejecting service makes the hook invalidate the queue key — catches a stale optimistic order left after a failed write
