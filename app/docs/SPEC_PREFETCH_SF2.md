# SF2 — Query options extraction

Give each domain a `queryOptions`-built factory consumed by both its React hook and, from SF4/SF5 onward, its route loader. No loader is added here; this sub-feature only relocates query definitions so a single definition exists per query.

## Files affected

- `New:` `app/src/data-access-layer/<domain>/<domain>QueryOptions.ts` — one per domain listed in the substitution tables below
- `Modified:` `app/src/data-access-layer/<domain>/use<Entity>.ts` and `use<Entity>s.ts` — consume the factory instead of declaring `queryKey`/`queryFn` inline
- `Modified:` `app/src/data-access-layer/<domain>/index.ts` — barrel gains the factory exports
- `Modified:` `app/src/data-access-layer/index.ts` — grouping barrel gains the factory exports

Domains in scope: `adventures`, `encounters`, `factions`, `foes`, `items`, `locations`, `npcs`, `pcs`, `sessions`, `session-steps`, `table-config`, `images`.

## Data Access Layer

### Reference implementation

`app/src/data-access-layer/foes/foeQueryOptions.ts` is the reference. Every other domain is a name substitution from it per the tables below.

```ts
import { queryOptions } from '@tanstack/react-query';
import * as service from '@services/foesService';
import { foeKeys } from './foeKeys';

export const foeListQueryOptions = (adventureId: string) =>
  queryOptions({
    queryKey: foeKeys.list(adventureId),
    queryFn: () => service.getAllFoes(adventureId),
    enabled: !!adventureId,
    throwOnError: true,
  });

export const foeQueryOptions = (foeId: string) =>
  queryOptions({
    queryKey: foeKeys.detail(foeId),
    queryFn: () => service.getFoeById(foeId),
    enabled: !!foeId,
    staleTime: 0,
    refetchOnMount: 'always',
    throwOnError: true,
  });
```

The factory must be built with `queryOptions()`. A bare object literal does not satisfy the barrel carve-out in `app/src/CLAUDE.md` and must not be used. The key factory stays internal to the module and is never exported from either barrel.

**Who may import a factory.** Route files under `app/src/routes/` and files within `app/src/data-access-layer/` may import these factories. Files under `app/src/screens/` and `app/src/components/` may not: a component importing a factory and passing it to `useQuery` directly would bypass the wrapping hook and place async logic in the component, which `app/src/CLAUDE.md`'s TanStack Query pattern prohibits. Components remain hook-only consumers, unchanged by this sub-feature. No compiler or lint check enforces this boundary today, so it holds by convention — do not treat the absence of an error as permission.

### Hook rewrite

Each hook spreads its factory into `useQuery` in place of the inline `queryKey`/`queryFn`/`enabled`/`staleTime`/`refetchOnMount`/`throwOnError` properties. In `useFoes`:

```ts
const { data: foes = [], isPending: isLoadingFoes } = useQuery(
  foeListQueryOptions(adventureId),
);
```

Everything else in each hook is untouched — mutations, debounce refs, `mergeUpdate` calls, `setQueryData` optimistic writes, the returned object shape, and every `invalidateQueries` call continue to use the key factory directly.

### List query substitution table

| Domain | Factory name | Parameter | Key | `queryFn` | Notes |
| --- | --- | --- | --- | --- | --- |
| `adventures` | `adventureListQueryOptions` | none | `adventureKeys.list()` | `service.getAllAdventures` | no `enabled` guard — takes no argument |
| `encounters` | `encounterListQueryOptions` | `adventureId: string` | `encounterKeys.list(adventureId)` | `() => service.getAllEncounters(adventureId)` | |
| `factions` | `factionListQueryOptions` | `adventureId: string` | `factionKeys.list(adventureId)` | `() => service.getAllFactions(adventureId)` | |
| `foes` | `foeListQueryOptions` | `adventureId: string` | `foeKeys.list(adventureId)` | `() => service.getAllFoes(adventureId)` | reference |
| `items` | `itemListQueryOptions` | `adventureId: string` | `itemKeys.list(adventureId)` | `() => service.getAllItems(adventureId)` | |
| `locations` | `locationListQueryOptions` | `adventureId: string` | `locationKeys.list(adventureId)` | `() => service.getAllLocations(adventureId)` | |
| `npcs` | `npcListQueryOptions` | `adventureId: string` | `npcKeys.list(adventureId)` | `() => service.getAllNpcs(adventureId)` | |
| `pcs` | `pcListQueryOptions` | `adventureId: string` | `pcKeys.list(adventureId)` | `() => service.getAllPcs(adventureId)` | |
| `sessions` | `sessionListQueryOptions` | `adventureId: string` | `sessionKeys.list(adventureId)` | `() => service.getAllSessions(adventureId)` | |
| `session-steps` | `sessionStepListQueryOptions` | `sessionId: string` | `sessionStepKeys.list(sessionId)` | `() => service.getStepsBySessionId(sessionId)` | `enabled: !!sessionId` |
| `table-config` | `tableConfigListQueryOptions` | none | `tableConfigKeys.all()` | `service.getAllTableConfigs` | no `enabled` guard — takes no argument |

Every list factory uses the `QueryClient` default `staleTime` — do not add a `staleTime` property to any of them.

### Detail query substitution table

| Domain | Factory name | Parameter | Key | `queryFn` | Freshness overrides |
| --- | --- | --- | --- | --- | --- |
| `adventures` | `adventureQueryOptions` | `adventureId: string` | `adventureKeys.detail(adventureId)` | `() => service.getAdventureById(adventureId)` | `staleTime: 0`, `refetchOnMount: 'always'` |
| `encounters` | `encounterQueryOptions` | `encounterId: string` | `encounterKeys.detail(encounterId)` | `() => service.getEncounterById(encounterId)` | `staleTime: 0`, `refetchOnMount: 'always'` |
| `factions` | `factionQueryOptions` | `factionId: string` | `factionKeys.detail(factionId)` | `() => service.getFactionById(factionId)` | `staleTime: 0`, `refetchOnMount: 'always'` |
| `foes` | `foeQueryOptions` | `foeId: string` | `foeKeys.detail(foeId)` | `() => service.getFoeById(foeId)` | `staleTime: 0`, `refetchOnMount: 'always'` |
| `items` | `itemQueryOptions` | `itemId: string` | `itemKeys.detail(itemId)` | `() => service.getItemById(itemId)` | `staleTime: 0`, `refetchOnMount: 'always'` |
| `locations` | `locationQueryOptions` | `locationId: string` | `locationKeys.detail(locationId)` | `() => service.getLocationById(locationId)` | `staleTime: 0`, `refetchOnMount: 'always'` |
| `npcs` | `npcQueryOptions` | `npcId: string` | `npcKeys.detail(npcId)` | `() => service.getNpcById(npcId)` | `staleTime: 0`, `refetchOnMount: 'always'` |
| `pcs` | `pcQueryOptions` | `pcId: string` | `pcKeys.detail(pcId)` | `() => service.getPcById(pcId)` | `staleTime: 0`, `refetchOnMount: 'always'` |
| `sessions` | `sessionQueryOptions` | `sessionId: string` | `sessionKeys.detail(sessionId)` | `() => service.getSessionById(sessionId)` | **none** — this domain deliberately differs |

`sessions` is the exception: its detail query carries no `staleTime` or `refetchOnMount` override today and must not gain one. Adding the overrides "for consistency" changes refetch behavior on the session screen and is a defect.

Every detail factory carries `enabled: !!<idParam>` and `throwOnError: true`.

### Images

`app/src/data-access-layer/images/imageQueryOptions.ts` exports `imageQueryOptions(imageId: string)`. Its `queryFn` is the existing async body from `useImage` moved across unchanged — it calls `imageService.getImageById`, then `imageService.getImageUrl(image.id, image.file_extension)`, builds the frame object, runs the `assertIsFrame` narrowing, and returns `{ url, frame }`. Move `assertIsFrame` into this file alongside it; it is a private helper of that query and has no other consumer.

The factory takes a non-nullable `imageId: string` and carries `throwOnError: true`. The existing `useImage(imageId: string | null)` signature is unchanged and keeps its own null handling: it passes `imageId ?? ''` into the factory and retains `enabled: imageId !== null` at the hook level, so the hook's nullable contract stays a hook concern and the factory stays loader-friendly. The hook's returned shape (`imageUrl`, `frame`, `loading`) is unchanged.

### Barrels

Each domain's `index.ts` gains explicit named exports for its factories, e.g. `export { foeListQueryOptions, foeQueryOptions } from './foeQueryOptions';`. `app/src/data-access-layer/index.ts` re-exports the same names, appended to the existing explicit export list. `export *` is banned in the grouping barrel and must not be introduced. The `*Keys` factories remain unexported from both levels.

## Verification

`npx tsc --noEmit`, `npx eslint .`, and `prettier --check .` from `app/`. Behavior is unchanged in this sub-feature — every screen still fetches exactly as before, because the hooks now consume the same definitions they previously declared inline.
