# SF6 — DAL duplication hooks

Exposes a `duplicate<Entity>` operation on each of the seven item hooks, returning the new record's id so the caller can navigate to it.

The functions added here have no consumer within this sub-feature. **SF7 wires all seven** — each is called by its matching leaf component in `src/screens/components/ScreensDuplicateBtn/components/`.

## Files affected

**Modified:**

- `app/src/data-access-layer/npcs/useNpc.ts`
- `app/src/data-access-layer/pcs/usePc.ts`
- `app/src/data-access-layer/foes/useFoe.ts`
- `app/src/data-access-layer/factions/useFaction.ts`
- `app/src/data-access-layer/locations/useLocation.ts`
- `app/src/data-access-layer/items/useItem.ts`
- `app/src/data-access-layer/sessions/useSession.ts`

**No change needed:**

- The seven module barrels (`app/src/data-access-layer/<plural>/index.ts`) and the grouping barrel (`app/src/data-access-layer/index.ts`). Verified against `app/src/CLAUDE.md` — Barrel Files: each module barrel already exports its hooks by explicit name, the grouping barrel already re-exports them, and this sub-feature adds no new hook. The key factories stay unexported, which the same rule requires.

## Substitution table

`useNpc.ts` is the reference implementation. Every other hook is a pure name substitution.

| Token | NPC | PC | Foe | Faction | Location | Item | Session |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Hook file | `npcs/useNpc.ts` | `pcs/usePc.ts` | `foes/useFoe.ts` | `factions/useFaction.ts` | `locations/useLocation.ts` | `items/useItem.ts` | `sessions/useSession.ts` |
| Return type | `UseNpcReturn` | `UsePcReturn` | `UseFoeReturn` | `UseFactionReturn` | `UseLocationReturn` | `UseItemReturn` | `UseSessionReturn` |
| Key factory | `npcKeys` | `pcKeys` | `foeKeys` | `factionKeys` | `locationKeys` | `itemKeys` | `sessionKeys` |
| Service fn | `duplicateNpc` | `duplicatePc` | `duplicateFoe` | `duplicateFaction` | `duplicateLocation` | `duplicateItem` | `duplicateSession` |
| Returned fn | `duplicateNpc` | `duplicatePc` | `duplicateFoe` | `duplicateFaction` | `duplicateLocation` | `duplicateItem` | `duplicateSession` |

All seven key factories share the same shape — `list: (adventureId: string)` and `detail: (entityId: string)` — so the invalidation call is identical across the seven files apart from the factory's name.

## Data Access Layer

### `use<Entity>.ts`

Add one mutation and one named wrapper, and one field to the hook's return type.

The mutation mirrors the file's existing `deleteMutation` — it takes no arguments and closes over the entity id already captured by the hook, per `app/src/CLAUDE.md`'s rule that mutations close over construction-time arguments rather than accepting them at call time:

```ts
const duplicateMutation = useMutation({
  mutationFn: () => service.duplicateNpc(npcId),
  onSuccess: () => {
    void queryClient.invalidateQueries({ queryKey: npcKeys.list(adventureId) });
  },
});
```

Only the list key is invalidated. The duplicate's own detail key holds no cached entry yet — the destination screen's `useQuery` fetches it on mount — so invalidating a detail key here would be a no-op.

The wrapper is required by `app/src/CLAUDE.md`'s rule that hook return functions are typed to the caller's contract and never re-export a TanStack primitive. It returns the new id:

```ts
const duplicateNpc = async (): Promise<string> => duplicateMutation.mutateAsync();
```

Add `duplicateNpc: () => Promise<string>` to `UseNpcReturn` and include it in the returned object.

No try/catch anywhere in this layer — `app/src/CLAUDE.md` bars it, and the service functions from SF4 and SF5 already throw typed domain errors that reach the Error Boundary through the QueryClient's `throwOnError` default.

## Tests

None. `app/src/data-access-layer/` has no `__tests__/` convention in this codebase, and the duplication logic under test lives in the DB layer, which SF3, SF4, and SF5 cover.
