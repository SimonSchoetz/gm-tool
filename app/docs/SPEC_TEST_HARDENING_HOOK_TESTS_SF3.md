# Sub-feature 3: Tests for the five other autosave hooks

This sub-feature adds the tests `.claude/rules/src-data-access-layer.md` requires of the remaining hooks that call `useAutosaveQueue`: `useAdventure`, `useSessionSteps`, `useBaseEntityContentSections`, `useOwnDevice` and `useUpdateImageFrame`. Each test pins what the hook's deferred save writes and invalidates, and which merge it passes. No hook source changes. Implement after Sub-feature 2, whose harness these tests import. If `app/src/data-access-layer/__tests__/support/renderHookWithQueryClient.ts` does not exist, stop and report.

## Files affected

`Modified:` none

`Deleted:` none

`New:`

- `app/src/data-access-layer/adventures/__tests__/useAdventure.test.ts`
- `app/src/data-access-layer/session-steps/__tests__/useSessionSteps.test.ts`
- `app/src/data-access-layer/base-entity-content-sections/__tests__/useBaseEntityContentSections.test.ts`
- `app/src/data-access-layer/devices/__tests__/useOwnDevice.test.ts`
- `app/src/data-access-layer/images/__tests__/useUpdateImageFrame.test.ts`

`Moved:` none

`Draft:` none

## Layered breakdown

### Data Access Layer

Every file follows the shared shape in Sub-feature 2 (Hook tests — shared shape): typed `vi.hoisted` spies for exactly the service functions named below, `vi.useFakeTimers()`/`vi.useRealTimers()`, `renderHookWithQueryClient`, `await settle(0)` before the first edit, updates inside `act`, and `await settle(AUTOSAVE_DELAY_MS)` before asserting. Invalidation assertions use `toHaveBeenCalledTimes` plus one `toHaveBeenCalledWith` per key (root Key Architectural Decisions — Invalidation assertions are order-insensitive). Which files re-render, and why `useOwnDevice` does not, is the root Key Architectural Decision "A re-render step exists only where a hook parameter could redirect the pending save".

#### `adventures/__tests__/useAdventure.test.ts` (New)

Mocks `getAdventureById` and `updateAdventure` from `'@services/adventureService'`. Renders `useAdventure(adventureId)` with `'adventure-1'`. The re-render goes to `'adventure-2'`.

1. `'writes the scheduled adventure and its data after a re-render for another adventure'`:
   - One edit `{ name: 'n' }`, re-render, settle.
   - Assert `updateAdventure` `toHaveBeenCalledTimes(1)` and `toHaveBeenCalledWith('adventure-1', { name: 'n' })`, two arguments matching `service.updateAdventure(id, data)`.
   - Defect caught: a `mutationFn` that reads the id from the hook's closure.
2. `'invalidates the adventure list and the scheduled adventure after a re-render'`:
   - Same steps.
   - Assert `invalidateQueries` `toHaveBeenCalledTimes(2)`, `toHaveBeenCalledWith({ queryKey: adventureKeys.list() })` and `toHaveBeenCalledWith({ queryKey: adventureKeys.detail('adventure-1') })`.
   - Defect caught: an `onSuccess` that builds the detail key from the hook's parameter.
3. `'keeps an earlier edit's value when a later edit to the same adventure leaves it undefined'`:
   - Edits `{ description: 'kept' }` then `{ name: 'n', description: undefined }`, settle.
   - Assert `toHaveBeenCalledWith('adventure-1', { description: 'kept', name: 'n' })`, once.
   - Defect caught: a spread merge in place of `mergeUpdate`.

#### `session-steps/__tests__/useSessionSteps.test.ts` (New)

Mocks `getStepsBySessionId` and `updateStep` from `'@services/sessionStepService'`. The read spy resolves an array holding one complete `SessionStep` literal. Renders `useSessionSteps(sessionId)` with `'session-1'`. The re-render goes to `'session-2'`. Every edit is `updateStep('step-1', …)`.

1. `'writes the scheduled step and its data after a re-render for another session'`:
   - One edit `{ name: 'n' }`, re-render, settle.
   - Assert `updateStep` `toHaveBeenCalledTimes(1)` and `toHaveBeenCalledWith('step-1', { name: 'n' })`, two arguments matching `service.updateStep(id, data)`.
   - Defect caught: a `write` that dispatches with an id other than the scheduled key.
2. `'invalidates nothing when a step save completes'`:
   - Same steps.
   - Assert `invalidateQueries` `not.toHaveBeenCalled()`.
   - Defect caught: an `onSuccess` added to the update mutation that invalidates a list built from the hook's `sessionId`, which after a re-render names the other session.
3. `'keeps an earlier edit's value when a later edit to the same step leaves it undefined'`:
   - Edits `{ content: 'kept' }` then `{ name: 'n', content: undefined }`, settle.
   - Assert `toHaveBeenCalledWith('step-1', { content: 'kept', name: 'n' })`, once.
   - Defect caught: a spread merge in place of `mergeUpdate`.

#### `base-entity-content-sections/__tests__/useBaseEntityContentSections.test.ts` (New)

Mocks `getSectionsByBaseEntityId` and `updateSection` from `'@services/baseEntityContentSectionService'`. The read spy resolves an array holding one complete `BaseEntityContentSection` literal. Renders `useBaseEntityContentSections(baseEntityId)` with `'entity-1'`. The re-render goes to `'entity-2'`. Every edit is `updateSection('section-1', …)`. Same three tests as `useSessionSteps`, each catching the same defect as its counterpart, with these substitutions:

| `useSessionSteps` test | `useBaseEntityContentSections` test |
| --- | --- |
| `updateStep`, `'step-1'` | `updateSection`, `'section-1'` |
| "another session" | "another base entity" |
| "a step save", "the same step" | "a section save", "the same section" |

#### `devices/__tests__/useOwnDevice.test.ts` (New)

Mocks `getOwnDevice` and `renameOwnDevice` from `'@services/devicesService'`. The read spy resolves `{ id: 'a'.repeat(64), name: 'old' }`. Renders `useOwnDevice()`, with no props and no re-render step.

1. `'writes only the last name scheduled within the delay'`:
   - `renameOwnDevice('first')` then `renameOwnDevice('second')`, settle.
   - Assert `renameOwnDevice` `toHaveBeenCalledTimes(1)` and `toHaveBeenCalledWith('second')`, one argument matching `devicesService.renameOwnDevice(name)`.
   - Defect caught: a merge that keeps the earlier name, or a save that does not debounce.
2. `'invalidates the own-device query after the save'`:
   - One rename, settle.
   - Assert `invalidateQueries` `toHaveBeenCalledTimes(1)` and `toHaveBeenCalledWith({ queryKey: deviceKeys.own() })`.
   - Defect caught: an `onSuccess` that invalidates another key or none.

#### `images/__tests__/useUpdateImageFrame.test.ts` (New)

Mocks `updateImageFrame` from `'@services/imageService'`, the only service function the hook calls; the hook has no query. Renders `useUpdateImageFrame(imageId)` with `'image-1'`. The re-render goes to `'image-2'`. Frames: `{ x: 10, y: 20, zoom: 1.5 }` and `{ x: 30, y: 40, zoom: 2 }`. No `settle(0)` is needed before the first edit.

1. `'writes the scheduled image and its frame after a re-render for another image'`:
   - `updateFrame` with the first frame, re-render, settle.
   - Assert `updateImageFrame` `toHaveBeenCalledTimes(1)` and `toHaveBeenCalledWith('image-1', { x: 10, y: 20, zoom: 1.5 })`, two arguments matching `imageService.updateImageFrame(id, frame)`.
   - Defect caught: a `mutationFn` that reads the image id from the hook's closure.
2. `'writes only the last frame scheduled within the delay'`:
   - Both frames in order, settle.
   - Assert once, with `'image-1'` and the second frame.
   - Defect caught: a merge that keeps the earlier frame.
3. `'invalidates the scheduled image after a re-render for another image'`:
   - Same steps as test 1.
   - Assert `invalidateQueries` `toHaveBeenCalledTimes(1)` and `toHaveBeenCalledWith({ queryKey: imageKeys.detail('image-1') })`.
   - Defect caught: an `onSuccess` that builds the key from the hook's parameter.

#### Proving the tests can fail

For each hook, apply each change below in turn, run its test file, confirm the named test fails, and revert:

- the id read from the hook's parameter in `mutationFn` (every "writes the scheduled…" test that re-renders);
- the detail key built from the hook's parameter (`useAdventure` and `useUpdateImageFrame` invalidation tests);
- an `onSuccess` invalidating `sessionStepKeys.list(sessionId)` in `useSessionSteps` and `baseEntityContentSectionKeys.list(baseEntityId)` in `useBaseEntityContentSections` (the two "invalidates nothing" tests);
- `useOwnDevice`'s `onSuccess` removed (its invalidation test);
- the merge replaced by a spread for the `mergeUpdate` hooks, and by `(pending) => pending` for the latest-wins hooks.

## Checks

From `app/`: `npx vitest run src/data-access-layer`, then the `every check` rows of root `CLAUDE.md` — Tool Use Discipline.
