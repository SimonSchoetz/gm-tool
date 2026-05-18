# SF3 — Fix `updateMutation` Closure

Capture the entity ID in the `mutationFn` closure for all three update hooks. Remove `id` from `mutationFn` parameters and call sites. Fix `onSuccess` to use closed-over IDs instead of `variables.id`. Add the missing `debounceTimeoutRef.current = null` reset in `useAdventure`.

## Files Affected

Modified:
- `app/src/data-access-layer/npcs/useNpc.ts`
- `app/src/data-access-layer/adventures/useAdventure.ts`
- `app/src/data-access-layer/sessions/useSession.ts`

## DAL Changes

### `app/src/data-access-layer/npcs/useNpc.ts`

**`updateMutation`** — three changes:

1. Change `mutationFn` to close over `npcId`:

   ```ts
   mutationFn: (data: UpdateNpcData) => service.updateNpc(npcId, data),
   ```

2. Update `onSuccess` to use closed-over ids (remove `variables` parameter entirely):

   ```ts
   onSuccess: () => {
     void queryClient.invalidateQueries({ queryKey: npcKeys.detail(npcId) });
     void queryClient.invalidateQueries({ queryKey: npcKeys.list(adventureId) });
   },
   ```

3. In the debounce timeout callback, change the call site from `updateMutation.mutate({ id: npcId, data: updates })` to:

   ```ts
   updateMutation.mutate(updates);
   ```

`debounceTimeoutRef.current = null` is already present after the mutate call in `useNpc`. Verify it is still in place — do not remove it.

### `app/src/data-access-layer/adventures/useAdventure.ts`

**`updateMutation`** — three changes:

1. Change `mutationFn` to close over `adventureId`:

   ```ts
   mutationFn: (data: UpdateAdventureData) => service.updateAdventure(adventureId, data),
   ```

2. Update `onSuccess` to use closed-over ids (remove `variables` parameter entirely):

   ```ts
   onSuccess: () => {
     void queryClient.invalidateQueries({ queryKey: adventureKeys.list() });
     void queryClient.invalidateQueries({ queryKey: adventureKeys.detail(adventureId) });
   },
   ```

3. In the debounce timeout callback:
   - Change the call site from `updateMutation.mutate({ id: adventureId, data: updates })` to `updateMutation.mutate(updates)`
   - Add `debounceTimeoutRef.current = null;` as the last line inside the timeout callback, after the mutate call. This line is present in `useNpc` and `useSession` but missing in `useAdventure`

### `app/src/data-access-layer/sessions/useSession.ts`

**`updateMutation`** — two changes:

1. Change `mutationFn` to close over `sessionId`:

   ```ts
   mutationFn: (data: UpdateSessionInput) => service.updateSession(sessionId, data),
   ```

2. In the debounce timeout callback, change the call site from `updateMutation.mutate({ id: sessionId, data: updates })` to:

   ```ts
   updateMutation.mutate(updates);
   ```

The `onSuccess` in `useSession` already uses closed-over ids (`sessionId`, `adventureId`) — no change needed there. `debounceTimeoutRef.current = null` is already present after the mutate call — do not remove it.

## DB, Services, Frontend

No changes.
