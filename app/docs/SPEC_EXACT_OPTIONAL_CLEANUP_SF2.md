# SF2 — DAL hook casts and return types

Replace `as T` casts in `setQueryData` callbacks with `mergeUpdate`. Change `T | undefined` return types to `T | null` in hook return types. Requires SF1 to be complete first.

## Files Affected

**Modified:**

- `app/src/data-access-layer/adventures/useAdventure.ts`
- `app/src/data-access-layer/npcs/useNpc.ts`
- `app/src/data-access-layer/sessions/useSession.ts`
- `app/src/data-access-layer/session-steps/useSessionSteps.ts`

## Data Access Layer

### `app/src/data-access-layer/adventures/useAdventure.ts`

**Import:** Add `import { mergeUpdate } from '../mergeUpdate';` after the existing imports.

**Return type — `UseAdventureReturn`:** Change `adventure: Adventure | undefined` to `adventure: Adventure | null`.

**`useQuery` destructure:** The current destructure is `const { data: adventure, isPending: loading }`. Rename the destructured binding to avoid shadowing the return value: `const { data: adventureData, isPending: loading }`.

**`setQueryData` callback in `updateAdventure`:** Replace the current body:

```ts
if (!old) return old;
return { ...old, ...data } as Adventure;
```

with:

```ts
if (!old) return old;
const { imgFilePath: _imgFilePath, ...patch } = data;
return mergeUpdate(old, patch);
```

**Return statement:** Change `adventure` to `adventure: adventureData ?? null`.

No other changes.

---

### `app/src/data-access-layer/npcs/useNpc.ts`

**Import:** Add `import { mergeUpdate } from '../mergeUpdate';` after the existing imports.

**Return type — `UseNpcReturn`:** Change `npc: Npc | undefined` to `npc: Npc | null`.

**`useQuery` destructure:** The current destructure is `const { data: npc, isPending: isLoadingNpc }`. Rename: `const { data: npcData, isPending: isLoadingNpc }`.

**`setQueryData` callback in `updateNpc`:** Replace the current body:

```ts
if (!old) return old;
return { ...old, ...data } as Npc;
```

with:

```ts
if (!old) return old;
const { imgFilePath: _imgFilePath, ...patch } = data;
return mergeUpdate(old, patch);
```

**`updateNpc` guard:** The guard `if (!npc) return;` references `npc`. After renaming the destructured binding to `npcData`, update the guard to `if (!npcData) return;`.

**Return statement:** Change `npc` to `npc: npcData ?? null`.

No other changes.

---

### `app/src/data-access-layer/sessions/useSession.ts`

**Import:** Add `import { mergeUpdate } from '../mergeUpdate';` after the existing imports.

**Return type — `UseSessionReturn`:** Change `session: Session | undefined` to `session: Session | null`.

**`useQuery` destructure:** The current destructure is `const { data: session, isPending: loading }`. Rename: `const { data: sessionData, isPending: loading }`.

**`setQueryData` callback in `updateSession`:** Replace the current body:

```ts
if (!old) return old;
return { ...old, ...data } as Session;
```

with:

```ts
if (!old) return old;
return mergeUpdate(old, data);
```

`UpdateSessionInput` contains no `imgFilePath` field — no destructure-and-strip is needed.

**`updateSession` guard:** The guard `if (!session) return;` references `session`. After renaming to `sessionData`, update to `if (!sessionData) return;`.

**`pendingUpdatesRef` accumulation:** The line `pendingUpdatesRef.current = { ...pendingUpdatesRef.current, ...data }` still refers to `data` directly — no change needed.

**Return statement:** Change `session` to `session: sessionData ?? null`.

No other changes.

---

### `app/src/data-access-layer/session-steps/useSessionSteps.ts`

**Import:** Add `import { mergeUpdate } from '../mergeUpdate';` after the existing imports.

**No return type change:** `steps: SessionStep[]` already uses the `[]` default in the `useQuery` destructure — no `T | undefined` to fix.

**`setQueryData` callback in `updateStep`:** Inside the `.map()`, replace:

```ts
step.id === stepId ? { ...step, ...data } as SessionStep : step
```

with:

```ts
step.id === stepId ? mergeUpdate(step, data) : step
```

No other changes.
