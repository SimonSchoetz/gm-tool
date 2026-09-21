# Sub-feature 4: Shared autosave-queue hook and pending-edit merges

Three changes to the hooks with a debounced save. The queue holder and its flush-on-unmount move into one tested hook. Pending edits merge the way the optimistic cache already merges them. A deferred save invalidates the list of the adventure it was scheduled for, not the one the reused screen shows when the save finishes. What each hook returns to its callers does not change.

## Files affected

`Modified:`

- `app/src/data-access-layer/createAutosaveQueue.ts` — exports the `AutosaveQueue` type; doc comment updated; no behaviour change
- `app/src/data-access-layer/adventures/useAdventure.ts` — `useAutosaveQueue`, merge `mergeUpdate`
- `app/src/data-access-layer/session-steps/useSessionSteps.ts` — `useAutosaveQueue`, merge `mergeUpdate`
- `app/src/data-access-layer/base-entity-content-sections/useBaseEntityContentSections.ts` — `useAutosaveQueue`, merge `mergeUpdate`
- `app/src/data-access-layer/devices/useOwnDevice.ts` — `useAutosaveQueue`; merge unchanged
- `app/src/data-access-layer/sessions/useSession.ts` — `useAutosaveQueue`, pending edit carries `adventureId`, merge `mergeScopedEdit`, list invalidation from the mutation variables
- `app/src/data-access-layer/encounters/useEncounter.ts` — same as `useSession`
- `app/src/data-access-layer/base-entities/useBaseEntity.ts` — same as `useSession`, beside the existing `entityType`

`Deleted:` none

`New:`

- `app/src/data-access-layer/useAutosaveQueue.ts`
- `app/src/data-access-layer/mergeScopedEdit.ts`
- `app/src/data-access-layer/__tests__/useAutosaveQueue.test.ts`
- `app/src/data-access-layer/__tests__/mergeScopedEdit.test.ts`

`Moved:` none

`Draft:` none

Barrels: `app/src/data-access-layer/index.ts` needs no change. It uses explicit named exports only, as `app/src/CLAUDE.md` — Barrel Files requires, and exports neither `createAutosaveQueue` nor `mergeUpdate`. `useAutosaveQueue` and `mergeScopedEdit` are internal to the layer in the same way, imported by sibling modules through direct relative paths (`app/CLAUDE.md` — Directory Structure: a file inside a grouping folder never imports a sibling through that folder's own barrel).

## Layered breakdown

### Data Access Layer

Placement of both new files: the layer root, because several data-access-layer modules consume them and nothing outside the layer does (`app/src/CLAUDE.md` — Util vs. Helper Placement, rung 2). Neither name collides with an existing file there (`TanstackQueryClientProvider.tsx`, `createAutosaveQueue.ts`, `index.ts`, `mergeUpdate.ts`, `queryClient.ts`, `useDuplicateMutation.ts`).

#### `createAutosaveQueue.ts`

- `type AutosaveQueue<Patch>` becomes `export type AutosaveQueue<Patch>`; its consumer is `useAutosaveQueue.ts`.
- Doc comment (lines 13-19):
  - The second bullet says "`write` receives the key the edit was scheduled under, and a hook passes it through `mutate()`'s call-time variables…". `useOwnDevice` ignores the key, so narrow it to a hook whose mutation is keyed by an entity id.
  - Delete the third bullet (the `useState`-versus-`useMemo` holder) and the fourth bullet (the unmount flush).
  - Add one bullet: hooks hold the queue through `useAutosaveQueue` (`useAutosaveQueue.ts`), which creates it once per hook instance and flushes it on unmount.
  - The first bullet and the summary line stay. Every bullet is one line.
- The queue's code does not change, so `__tests__/createAutosaveQueue.test.ts` stays as it is.

#### `useAutosaveQueue.ts` (New)

- Export exactly `useAutosaveQueue = <Patch>(merge: (pending: Patch, patch: Patch) => Patch, write: (key: string, pending: Patch) => void): AutosaveQueue<Patch>`, imported as `import { createAutosaveQueue, type AutosaveQueue } from './createAutosaveQueue';`.
- Body: `const [saveQueue] = useState(() => createAutosaveQueue(merge, write));`, then `useEffect` with cleanup `() => { saveQueue.flushAll(); }` and dependencies `[saveQueue]`, then `return saveQueue;`.
- Two single-line comments, each directly above the statement it explains (root Key Architectural Decisions — One hook holds every autosave queue):
  - Above the `useState` line: the queue is created in `useState`'s lazy initializer, never `useMemo`, because every caller passes `write` as an inline closure that is new on each render, so a memo keyed on it would rebuild the queue, and the unmount effect would flush its pending edits, on every render; and React treats a memoized value as a cache it may discard.
  - Above the `useEffect`: flushing on unmount saves an edit made just before the screen closes, and a save that fails there reaches no Error Boundary, because the component that would surface it is gone.
- Only data-access-layer hooks call it. It is not exported from `app/src/data-access-layer/index.ts`.

#### `mergeScopedEdit.ts` (New)

Export exactly `mergeScopedEdit = <Edit extends { data: object }>(pending: Edit, patch: Edit): Edit => ({ ...patch, data: mergeUpdate(pending.data, patch.data) })`, importing `mergeUpdate` from `./mergeUpdate`. This signature and body type-check and lint as the merge for the three scoped edits below (root Key Architectural Decisions — Scope fields travel with the pending edit and merge through one helper). Only data-access-layer hooks call it.

#### The seven hooks

In each hook:

- Replace `const [saveQueue] = useState(() => createAutosaveQueue<…>(merge, write));` and the `useEffect` that calls `saveQueue.flushAll()` with `const saveQueue = useAutosaveQueue<Patch>(merge, write);` in the same position, after the update mutation it writes through.
- Replace the `createAutosaveQueue` import with `import { useAutosaveQueue } from '../useAutosaveQueue';`.
- Delete `import { useEffect, useState } from 'react';`: none of the seven uses either hook anywhere else.
- `schedule` calls and the returned API stay as they are except where the table says otherwise.

| Hook | `Patch` | `merge` | `write` | `schedule` call |
| --- | --- | --- | --- | --- |
| `useAdventure` | `UpdateAdventureData` | `mergeUpdate` | unchanged | unchanged |
| `useSessionSteps` | `UpdateSessionStepInput` | `mergeUpdate` | unchanged | unchanged |
| `useBaseEntityContentSections` | `UpdateBaseEntityContentSectionInput` | `mergeUpdate` | unchanged | unchanged |
| `useOwnDevice` | `string` | `(_pending, name) => name`, unchanged (root Key Architectural Decisions — A latest-wins merge stays inline) | unchanged | unchanged |
| `useSession` | `{ adventureId: string; data: UpdateSessionInput }` | `mergeScopedEdit` | `(id, { adventureId: scheduledAdventureId, data }) => { updateMutation.mutate({ id, adventureId: scheduledAdventureId, data }); }` | `saveQueue.schedule(sessionId, { adventureId, data })` |
| `useEncounter` | `{ adventureId: string; data: UpdateEncounterInput }` | `mergeScopedEdit` | as `useSession` | `saveQueue.schedule(encounterId, { adventureId, data })` |
| `useBaseEntity` | `{ entityType: BaseEntityType; adventureId: string; data: UpdateBaseEntityData }` | `mergeScopedEdit` | `(id, pending) => { updateMutation.mutate({ entityType: pending.entityType, adventureId: pending.adventureId, id, data: pending.data }); }` | `saveQueue.schedule(baseEntityId, { entityType, adventureId, data })` |

In `useAdventure`, `useSessionSteps` and `useBaseEntityContentSections`, the `mergeUpdate` import already exists and is now used twice; in `useSession`, `useEncounter` and `useBaseEntity` it stays for the cache update, and `import { mergeScopedEdit } from '../mergeScopedEdit';` is added (root Key Architectural Decisions — Pending edits merge the way the cache merges).

Update mutations in `useSession`, `useEncounter` and `useBaseEntity` (root Key Architectural Decisions — Scope fields travel with the pending edit and merge through one helper):

- `mutationFn`'s parameter type gains `adventureId: string`. `mutationFn` itself still reads only `id`, `data` and, in `useBaseEntity`, `entityType`.
- `onSuccess` destructures `adventureId: scheduledAdventureId` from its second parameter, beside `id` (and `entityType: scheduledType` in `useBaseEntity`). It invalidates `sessionKeys.list(scheduledAdventureId)` in `useSession`, `encounterKeys.list(scheduledAdventureId)` in `useEncounter`, and `baseEntityKeys.list(scheduledType, scheduledAdventureId)` in `useBaseEntity`. The hook's `adventureId` parameter no longer appears in the update mutation.
- The hooks' other mutations (delete, duplicate, remove image) still dispatch synchronously and keep reading `adventureId` from the hook's closure, as the carve-out's synchronous case requires.
- `useBaseEntity`'s comment above `write` becomes one line. It says that `entityType` and `adventureId` travel in the pending edit, taken from the most recent `schedule` for that id, and go through `mutate()` because `entityType` selects the error label and both invalidated keys and `adventureId` selects the invalidated list key. `useSession` and `useEncounter` get no such comment: `.claude/rules/src-data-access-layer.md` — Non-negotiable rules, the deferred-dispatch carve-out, already states why the value travels.

`useSessionSteps` and `useBaseEntityContentSections` have no `onSuccess` on their update mutation and invalidate no list after a save, so the `adventureId` change does not apply to them.

The layer's conventions were checked in all seven hooks: every `useQuery` runs through a `queryOptions` factory that sets `throwOnError: true`, or sets it directly (`useOwnDevice`); none has a `try`/`catch`; each returns named wrapper functions. Nothing further to fix.

## Tests

`app/src/data-access-layer/__tests__/useAutosaveQueue.test.ts` (New, named after the file it tests per `.claude/rules/src-unit-tests.md` — Testing Policy):

- Pattern: `renderHook` from `@testing-library/react`, as `app/src/hooks/__tests__/useDraggable.test.ts` uses it.
- `vi.useFakeTimers()` in `beforeEach` and `vi.useRealTimers()` in `afterEach`, as `__tests__/createAutosaveQueue.test.ts` does, so the queue's timer never fires during a test.
- `type Patch = { name?: string };`, merge `mergeUpdate` from `../mergeUpdate`, and one `const write = vi.fn<(key: string, pending: Patch) => void>();`.
- Every render passes a new inline `write` closure that forwards to the spy: `renderHook(() => useAutosaveQueue<Patch>(mergeUpdate, (key, pending) => { write(key, pending); }))`. This is required: with a stable `write`, a `useMemo` holder keyed on it would never rebuild, and the first test would pass on a broken holder.

1. `'keeps one queue across re-renders and writes nothing on a re-render'`:
   - Call `result.current.schedule('entity-1', { name: 'a' })`, keep `const queueBeforeRerender = result.current;`, then call `rerender()`.
   - Assert `expect(result.current).toBe(queueBeforeRerender)` and `expect(write).not.toHaveBeenCalled()`.
   - Defect caught: a holder that rebuilds the queue per render, such as `useMemo(() => createAutosaveQueue(merge, write), [merge, write])`, replaces the queue, and its unmount effect flushes the pending edit on the re-render.
   - Prove it can fail: build the holder that way in `useAutosaveQueue.ts`, confirm this test fails, then revert.
2. `'writes the pending edit once when the hook unmounts'`:
   - Call `result.current.schedule('entity-1', { name: 'a' })`, then `unmount()`.
   - Assert `expect(write).toHaveBeenCalledTimes(1)` and `expect(write).toHaveBeenCalledWith('entity-1', { name: 'a' })`, two arguments matching `write(key, pending)`.
   - Defect caught: a cleanup that does not call `flushAll()` loses the edit; one that flushes twice writes it twice.

`app/src/data-access-layer/__tests__/mergeScopedEdit.test.ts` (New, required for a helper at the layer root by `.claude/rules/src-unit-tests.md` — Testing Policy). Fixture type: `type Edit = { adventureId: string; data: { name?: string; description?: string } };`. Every call passes it explicitly, as `mergeScopedEdit<Edit>(…)`: two object literals whose `data` differ in shape would otherwise infer `Edit` from the first argument and reject the second.

1. `'takes every field but data from the later edit'`:
   - `mergeScopedEdit<Edit>({ adventureId: 'adventure-a', data: { name: 'x' } }, { adventureId: 'adventure-b', data: {} })`.
   - Assert the result's `adventureId` is `'adventure-b'`.
   - Defect caught: keeping the earlier edit's scope fields.
2. `'merges the data of both edits, the later value winning per key'`:
   - `mergeScopedEdit<Edit>({ adventureId: 'adventure-a', data: { name: 'x', description: 'd' } }, { adventureId: 'adventure-a', data: { name: 'y' } })`.
   - Assert the result's `data` equals `{ name: 'y', description: 'd' }`.
   - Defect caught: replacing `data` with the later edit's `data` (drops `description`); keeping the earlier edit's `name`.
   - The `undefined`-skip is `mergeUpdate`'s own behaviour, already asserted by `__tests__/mergeUpdate.test.ts` ("skips keys where patch value is undefined"), and is not re-checked here.

No test covers which merge a hook passes to `useAutosaveQueue`, or which `adventureId` a hook's `onSuccess` reads. Data-access-layer hooks are outside the test-obligated scope, and that scope gap is recorded under CLAUDE.md impact.

## Checks

From `app/`: `npx vitest run src/data-access-layer`, then the `every check` rows of root `CLAUDE.md` — Tool Use Discipline.
