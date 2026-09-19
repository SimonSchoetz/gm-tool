# SF8 — Autosave queue

Edits made through the seven debounced data-access hooks in the last half-second before leaving a screen are saved instead of lost, and switching from one entity to another on the same screen can no longer write the first entity's edits into the second. The seven hooks replace their own debounce code with one tested helper.

## Files affected

- New: `app/src/data-access-layer/createAutosaveQueue.ts` — the keyed debounce queue and `AUTOSAVE_DELAY_MS`.
- New: `app/src/data-access-layer/__tests__/createAutosaveQueue.test.ts`.
- Modified: `app/src/data-access-layer/adventures/useAdventure.ts`
- Modified: `app/src/data-access-layer/encounters/useEncounter.ts`
- Modified: `app/src/data-access-layer/sessions/useSession.ts`
- Modified: `app/src/data-access-layer/base-entities/useBaseEntity.ts`
- Modified: `app/src/data-access-layer/base-entity-content-sections/useBaseEntityContentSections.ts`
- Modified: `app/src/data-access-layer/session-steps/useSessionSteps.ts`
- Modified: `app/src/data-access-layer/devices/useOwnDevice.ts`
- Modified: `.claude/knowledge/tanstack-query.md` — in the entry headed "`useMutation`'s returned `mutate`/`mutateAsync` always dispatches through one `MutationObserver` instance…", delete the clause that starts with the dash before "see" and names `app/src/data-access-layer/session-steps/useSessionSteps.ts:42-45,96-101` as the canonical example of the shape, up to "collection-scoped id", keeping the closing parenthesis: this SF removes that code, and the store records external facts, not locations in this repository's files (`.claude/knowledge/CLAUDE.md`).

No data-access-layer barrel changes: every hook keeps its name, signature and return type, and `createAutosaveQueue` is internal to the layer like `mergeUpdate.ts`, which no barrel exports either.

## Data Access Layer

### `app/src/data-access-layer/createAutosaveQueue.ts`

Placement per the root KAD "Debounced saves go through one keyed queue that flushes on unmount": the DAL root, beside `mergeUpdate.ts`; the hooks import it with `import { createAutosaveQueue } from '../createAutosaveQueue';`, as they import `mergeUpdate`.

```ts
export const AUTOSAVE_DELAY_MS = 500;

type AutosaveQueue<Patch> = {
  schedule: (key: string, patch: Patch) => void;
  flushAll: () => void;
};

export const createAutosaveQueue = <Patch>(
  merge: (pending: Patch, patch: Patch) => Patch,
  write: (key: string, pending: Patch) => void,
): AutosaveQueue<Patch> => { … };
```

`AutosaveQueue` is not exported: the hooks get the type through `useState`'s inference and nothing names it.

Doc comment on `createAutosaveQueue`, the one place the hooks' usage rationale is written (the hooks carry no copy of it):

- it keeps one pending patch and one timer per key, so edits to different entities never merge or hold back each other's save;
- `write` receives the key the edit was scheduled under, and a hook passes it through `mutate()`'s call-time variables — the deferred-dispatch carve-out in `.claude/rules/src-data-access-layer.md` — because the hook may already show another entity when the timer fires;
- a hook holds the queue in `useState`'s lazy initializer, which runs once per hook instance and gives the queue a non-null type; `useMemo` would have to list the hook's mutation object (`updateMutation`, or `renameMutation` in `useOwnDevice`) in its dependencies, and `useMutation` returns a new object on every render, so the queue would be rebuilt — and flushed by the unmount effect — on every render;
- a hook calls `flushAll()` from an unmount effect so edits made just before leaving a screen are saved, and a save flushed there that fails is not reported, because the component that would surface the error is gone.

The `useMemo` clause rests on two checks: `useMutation` builds its return value as a fresh object literal on each call [spec-writer_54: app/node_modules/.pnpm/@tanstack+react-query@5.103.1_react@19.3.0/node_modules/@tanstack/react-query/build/modern/useMutation.js:189-193 — `return { ...result, mutate, … }`], and `react-hooks/exhaustive-deps` requires `updateMutation` in the dependencies of a `useMemo` whose callback calls `updateMutation.mutate` [spec-writer_55: ran `npx eslint` on a scratch copy of the rewritten `useAdventure.ts` with the queue in `useMemo` — observed "React Hook useMemo has a missing dependency: 'updateMutation'" with `[]`, and no finding with `[updateMutation]`].

Behavior, over a private `Map<string, { pending: Patch; timer: ReturnType<typeof setTimeout> }>`:

- `schedule(key, patch)`: when the key has an entry, clear its timer and update that entry object in place — `pending` becomes `merge(entry.pending, patch)` and `timer` the new timer; otherwise add an entry whose `pending` is `patch`. The new timer runs `AUTOSAVE_DELAY_MS` later: it deletes the key's entry, then calls `write(key, pending)` with the entry's current `pending`. Keys never share a timer or a pending patch.
- `flushAll()`: take a snapshot array of the current entries; for each, clear its timer, delete the entry, then call `write(key, pending)`. The snapshot keeps an entry that a `write` schedules during the flush on its own timer, instead of flushing it again in the same pass.

### `app/src/data-access-layer/__tests__/createAutosaveQueue.test.ts`

Uses `vi.useFakeTimers()` and `vi.advanceTimersByTime`, computing every duration from the imported `AUTOSAVE_DELAY_MS`, never the literal `500`, so the tests keep checking the delay the hooks actually use when it changes. `write` is a `vi.fn()` and `merge` spreads (`(pending, patch) => ({ ...pending, ...patch })`). Patches that must merge set different fields, so a lost patch shows.

| Test | Defect it catches |
| --- | --- |
| scheduling `{ name: 'a' }` for key `'x'`, advancing half a delay, then scheduling `{ description: 'b' }`: no write after a further `AUTOSAVE_DELAY_MS - 1`, then exactly one write, `('x', { name: 'a', description: 'b' })`, after 1 more | writing on every keystroke, keeping the first timer instead of re-arming it, or losing the first patch |
| scheduling `{ name: 'a' }` for `'x'`: no write after `AUTOSAVE_DELAY_MS - 1`, then exactly one write, `('x', { name: 'a' })`, after 1 more | writing before the user stops typing, or a delay shorter than the one the hooks use |
| scheduling `'a'` at 0 and `'b'` at half a delay: at one delay only `'a'` has been written, and `'b'` is written at one and a half delays | one timer shared across keys, so one entity's edits hold back another's save |
| schedules for keys `'a'` and `'b'` within one delay produce one write per key, each carrying only its own patch | one pending patch shared across entities — the bug that wrote one entity's edits to another |
| `flushAll()` writes every pending patch at once, and advancing past the delay afterwards writes nothing more | pending edits discarded on unmount, or written twice |
| `flushAll()` with nothing pending writes nothing | spurious writes when StrictMode mounts, unmounts and remounts a hook |
| after `'x'` is written with `{ name: 'a' }`, scheduling `{ description: 'b' }` for `'x'` writes exactly `('x', { description: 'b' })` | a written entry kept, so its old patch is merged into the next write |
| with a `write` that schedules `{ description: 'b' }` for its own key on its first call: scheduling `{ name: 'a' }` for `'x'` and calling `flushAll()` writes exactly once, `('x', { name: 'a' })`, and after a further `AUTOSAVE_DELAY_MS` a second write, `('x', { description: 'b' })`, follows | `flushAll` iterating the live map, so an entry a `write` re-schedules is flushed again in the same pass, or forever |

### The seven hooks

In each hook: delete the debounce state and its unmount effect as listed below, create the queue once per hook instance with `useState` after the mutation it writes through, flush it on unmount, and replace the debounce block in the update function with one `schedule` call. The optimistic `setQueryData` updates (including `useSession`'s list-cache update and the `imgFilePath` stripping in `useAdventure` and `useBaseEntity`), the data guards and every other mutation stay exactly as they are; the patch passed to `schedule` is the same `data` the old pending merge received. `useRef` becomes unused in all seven and is removed from their `react` import; `useState` is added to it.

| Hook | Removed | Patch type | `merge` | `write` | `schedule` call (in the update function) |
| --- | --- | --- | --- | --- | --- |
| `useAdventure` | timer ref, pending ref, their effect (:20-29) | `UpdateAdventureData` | `(pending, patch) => ({ ...pending, ...patch })` | `(id, data) => { updateMutation.mutate({ id, data }); }` | `saveQueue.schedule(adventureId, data)` |
| `useEncounter` | timer ref, pending ref, their effect (:23-32) | `UpdateEncounterInput` | `(pending, patch) => ({ ...pending, ...patch })` | `(id, data) => { updateMutation.mutate({ id, data }); }` | `saveQueue.schedule(encounterId, data)` |
| `useSession` | timer ref, pending ref, their effect (:23-32) | `UpdateSessionInput` | `(pending, patch) => ({ ...pending, ...patch })` | `(id, data) => { updateMutation.mutate({ id, data }); }` | `saveQueue.schedule(sessionId, data)` |
| `useBaseEntity` | timer ref, pending ref, their effect (:27-36) | `{ entityType: BaseEntityType; data: UpdateBaseEntityData }` | `(pending, patch) => ({ entityType: patch.entityType, data: { ...pending.data, ...patch.data } })` | `(id, pending) => { updateMutation.mutate({ entityType: pending.entityType, id, data: pending.data }); }` | `saveQueue.schedule(baseEntityId, { entityType, data })` |
| `useBaseEntityContentSections` | the `DebounceEntry` type (:29-32), `debounceMapRef` and its effect (:39-48) | `UpdateBaseEntityContentSectionInput` | `(pending, patch) => ({ ...pending, ...patch })` | `(id, data) => { updateMutation.mutate({ id, data }); }` | `saveQueue.schedule(sectionId, data)` |
| `useSessionSteps` | the `DebounceEntry` type (:19-22), `debounceMapRef` and its effect (:27-36) | `UpdateSessionStepInput` | `(pending, patch) => ({ ...pending, ...patch })` | `(id, data) => { updateMutation.mutate({ id, data }); }` | `saveQueue.schedule(stepId, data)` |
| `useOwnDevice` | timer ref and its effect (:14-22) | `string` | `(_pending, name) => name` | `(_key, name) => { renameMutation.mutate(name); }` | `saveQueue.schedule('own-device', name)` |

Every `write` uses a block body: an expression body returning `mutate`'s `void` fails `@typescript-eslint/no-confusing-void-expression` [spec-writer_44: ran `npx eslint` on a scratch copy of `useOwnDevice.ts` with the expression-bodied `write` — observed that rule's error; the block-bodied form and the other six hooks passed tsc, eslint and prettier]. In `useOwnDevice` the queue has a single fixed key because there is one own device; its `write` and `merge` parameters that go unused are prefixed with `_`, which the lint configuration allows. In the two list hooks the queue replaces a map that was already keyed by item id, so their only behavior change is the unmount flush.

Shape, shown for `useAdventure`:

```ts
const [saveQueue] = useState(() =>
  createAutosaveQueue<UpdateAdventureData>(
    (pending, patch) => ({ ...pending, ...patch }),
    (id, data) => {
      updateMutation.mutate({ id, data });
    },
  ),
);

useEffect(() => {
  return () => {
    saveQueue.flushAll();
  };
}, [saveQueue]);
```

The queue keeps the first render's `updateMutation.mutate`, which is the same stable callback on every render and still runs after unmount (root KAD, `.claude/knowledge/tanstack-query.md`). Neither the `useState` line nor the unmount effect carries a comment: their rationale is `createAutosaveQueue`'s doc comment, and the missing rule for how a DAL hook holds and flushes the queue is in the root's CLAUDE.md impact. Holding the queue in `useState` departs from `.claude/rules/src-react-hooks.md` — State is reserved for values with no synchronous source, which sends a value computable at render time to `useMemo`: the queue is not a derived value but a mutable object whose identity must survive every render, which `useMemo` does not give here (doc comment above), and it has no setter that could drift from a derivation. The same impact entry records the departure. The deferred-dispatch comment the four single-entity hooks carry today (for example useAdventure.ts:89) is deleted with the debounce block it sits in; its content — the id is the key captured when the edit was scheduled and travels through `mutate()`'s call-time variables — is in the same doc comment. `useBaseEntity`'s `write` keeps its own one-line comment for what is specific to it (useBaseEntity.ts:114): `entityType` travels in the pending patch, taken from the most recent `schedule` for that id, and is passed through `mutate()` because it selects the error label and both invalidated keys.

Modified-file scan over the seven hooks (inline sub-components; `return null`/`return undefined` in a void context): none found. The `if (!old) return old;` lines in the `setQueryData` updaters return the updater's value, not from a void function.

Two component timers of the same kind keep their behavior and are waived here, left for a follow-up. `ImagePreviewFramingOverlay.tsx` keeps its own 600 ms debounced frame save, which also discards its last edit on unmount (ImagePreviewFramingOverlay.tsx:14, :40-51): a component-local timer in a `.tsx` file, outside the data access layer this SF changes. `LabeledToggleButton.tsx` delays its `onChange` until the slider's transition ends (:59-68; the slider's `left` transition is `--transition-fast` at LabeledToggleButton.css:22, 0.2 s at app/src/styles/variables/transition-variables.css:5) and cancels it on unmount (:39-44), so a session view toggle (`ToggleSessionViewBtn.tsx:20-22` calls `updateSession({ active_view })` from it) followed by navigation within 200 ms is not saved: its timer is tied to an animation inside a generic component outside the data access layer.
