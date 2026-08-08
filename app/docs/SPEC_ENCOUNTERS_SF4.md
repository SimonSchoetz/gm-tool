# SF4 — Data access layer: `data-access-layer/encounters/`

TanStack Query hooks exposing a domain-typed API to the screens. Self-contained and type-checks on its own once SF3 is complete.

## Files affected

New:

- `app/src/data-access-layer/encounters/encounterKeys.ts`
- `app/src/data-access-layer/encounters/useEncounters.ts`
- `app/src/data-access-layer/encounters/useEncounter.ts`
- `app/src/data-access-layer/encounters/index.ts`

Modified:

- `app/src/data-access-layer/index.ts` — add the grouping-barrel export

## Data Access Layer

### `encounterKeys.ts`

```ts
export const encounterKeys = {
  list: (adventureId: string) => ['encounters', adventureId] as const,
  detail: (encounterId: string) => ['encounter', encounterId] as const,
};
```

### `useEncounters.ts`

Pure substitution from `app/src/data-access-layer/foes/useFoes.ts`. Substitution table:

| Foe symbol | Encounter symbol |
| --- | --- |
| `UseFoesReturn` | `UseEncountersReturn` |
| `useFoes` | `useEncounters` |
| `Foe` (type, from `@db/foe`) | `Encounter` (from `@db/encounter`) |
| `foes` (return field, query data) | `encounters` |
| `isLoadingFoes` | `isLoadingEncounters` |
| `foeKeys` | `encounterKeys` |
| `service.getAllFoes` | `service.getAllEncounters` |
| `service.createFoe` | `service.createEncounter` |
| `createFoe` (returned wrapper) | `createEncounter` |
| `@services/foesService` | `@services/encountersService` |

Return type is `{ encounters: Encounter[]; loading: boolean; createEncounter: () => Promise<string> }`. The query carries `enabled: !!adventureId` and `throwOnError: true`; the create mutation invalidates `encounterKeys.list(adventureId)` on success.

### `useEncounter.ts`

Follows `app/src/data-access-layer/foes/useFoe.ts` with the image mutation removed. Substitution follows the same table above plus `useFoe` → `useEncounter`, `foeId` → `encounterId`, `deleteFoe` → `deleteEncounter`, `duplicateFoe` → `duplicateEncounter`.

Two structural deltas from the foe file:

- **No `removeEncounterImageMutation` and no `removeEncounterImage` wrapper.** There is no image to remove, and no service function to call.
- **The update payload is `UpdateEncounterInput`, imported from `@db/encounter`, not a service-owned `UpdateEncounterData` alias.** SF3 declares no such alias (see SF3's rationale). Consequently the optimistic-cache updater passes the payload to `mergeUpdate` unchanged — the foe file's `const { imgFilePath: _imgFilePath, ...patch } = data;` destructure exists only to strip a field that does not exist here:

```ts
queryClient.setQueryData<Encounter>(encounterKeys.detail(encounterId), (old) => {
  if (!old) return old;
  return mergeUpdate(old, data);
});
```

Everything else is carried over unchanged: the `debounceTimeoutRef` / `pendingUpdatesRef` pair with the 500 ms debounce and the `useEffect` cleanup that clears a pending timeout on unmount; the detail query's `staleTime: 0`, `refetchOnMount: 'always'`, `throwOnError: true`; the update mutation invalidating both the detail and list keys; the delete mutation invalidating the list key; and the duplicate mutation invalidating only the list key, carrying over the existing inline comment explaining that the duplicate's detail key holds no cached entry yet.

`UseEncounterReturn` is:

```ts
type UseEncounterReturn = {
  encounter: Encounter | null;
  loading: boolean;
  updateEncounter: (data: UpdateEncounterInput) => void;
  deleteEncounter: () => Promise<void>;
  duplicateEncounter: () => Promise<string>;
};
```

`deleteEncounter` and `duplicateEncounter` are declared as named wrapper functions over `mutateAsync`, never assigned from `mutation.mutateAsync` directly — `app/src/CLAUDE.md` bars exposing TanStack internals on a hook's return type. Both mutations close over `encounterId` and take no arguments.

### `index.ts` (module barrel)

Explicit named exports of the two hooks only: `export { useEncounters } from './useEncounters';` and `export { useEncounter } from './useEncounter';`. `encounterKeys` is deliberately absent — `app/src/CLAUDE.md` states query key factories are internal to the DAL module and never appear in the module barrel's public exports.

### `app/src/data-access-layer/index.ts` (grouping barrel)

Add `export { useEncounters, useEncounter } from './encounters';` directly after the existing `export { useSessions, useSession } from './sessions';` line. Explicit named exports — `export *` is banned in `src/` grouping barrels.

## Tests

None. `app/src/data-access-layer/` has no `__tests__/` convention for domain hooks; its only test directory covers the shared `mergeUpdate` helper.

## Cross-sub-feature wiring

`useEncounters` is consumed by SF5's `EncountersScreen` and SF6's `AdventureStats`. `useEncounter` is consumed by SF5's `EncounterScreen`, `EncounterHeader`, and `EncounterSidebar`, and by SF6's `EncounterCrumb`, `EncounterPopupContent`, and `EncounterDuplicateBtn`. All import from `@/data-access-layer`, which resolves through the grouping barrel modified above.
