# SF4 — List route loaders

Resolve collection data before list screens mount, so no list screen renders its pending branch on arrival.

## Files affected

- `Modified:` `app/src/routes/adventures.tsx`
- `Modified:` `app/src/routes/adventure.$adventureId.encounters.tsx`
- `Modified:` `app/src/routes/adventure.$adventureId.factions.tsx`
- `Modified:` `app/src/routes/adventure.$adventureId.foes.tsx`
- `Modified:` `app/src/routes/adventure.$adventureId.items.tsx`
- `Modified:` `app/src/routes/adventure.$adventureId.locations.tsx`
- `Modified:` `app/src/routes/adventure.$adventureId.npcs.tsx`
- `Modified:` `app/src/routes/adventure.$adventureId.pcs.tsx`
- `Modified:` `app/src/routes/adventure.$adventureId.sessions.tsx`

`app/src/routes/adventure.$adventureId.tsx` is **not** modified. It renders only `<Outlet />` and owns no data.

`app/src/routes/settings.tsx` is **not** modified — see the root spec's Out of scope.

## Frontend

### Loader contract

A loader warms the cache; it does not return data. Screens continue to read through their existing hooks, which find the cache warm and report `isPending: false` on their first render. No screen is modified in this sub-feature, and no screen reads `Route.useLoaderData()`.

Each loader awaits every query its screen's hooks request. The seven entity list screens each call two hooks — the collection hook and `useTableConfigs` — so both must be awaited; awaiting only the collection leaves `configsLoading` true on first render and the spinner still appears.

Images are deliberately not touched here. SF3 makes a pending image hold its box, so a list row's avatar can resolve at any time without moving anything. Awaiting one image query per row would stall navigation past the 1000 ms `defaultPendingMs` threshold on a long list and trade the flicker for a visible delay.

### Reference implementation

`app/src/routes/adventure.$adventureId.foes.tsx` is the reference:

```ts
import { createFileRoute } from '@tanstack/react-router';
import { FoesScreen } from '@/screens';
import { foeListQueryOptions, tableConfigListQueryOptions } from '@/data-access-layer';

export const Route = createFileRoute('/adventure/$adventureId/foes')({
  component: FoesScreen,
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(foeListQueryOptions(params.adventureId)),
      context.queryClient.ensureQueryData(tableConfigListQueryOptions()),
    ]);
  },
});
```

`Promise.all` rather than sequential awaits: the two queries are independent, and sequencing them doubles the resolution time for no benefit.

### Substitution table

Each row substitutes into the reference. Every entity row is otherwise identical, including the `tableConfigListQueryOptions()` entry.

| Route file | Screen | Collection factory |
| --- | --- | --- |
| `adventure.$adventureId.encounters.tsx` | `EncountersScreen` | `encounterListQueryOptions(params.adventureId)` |
| `adventure.$adventureId.factions.tsx` | `FactionsScreen` | `factionListQueryOptions(params.adventureId)` |
| `adventure.$adventureId.foes.tsx` | `FoesScreen` | `foeListQueryOptions(params.adventureId)` |
| `adventure.$adventureId.items.tsx` | `ItemsScreen` | `itemListQueryOptions(params.adventureId)` |
| `adventure.$adventureId.locations.tsx` | `LocationsScreen` | `locationListQueryOptions(params.adventureId)` |
| `adventure.$adventureId.npcs.tsx` | `NpcsScreen` | `npcListQueryOptions(params.adventureId)` |
| `adventure.$adventureId.pcs.tsx` | `PcsScreen` | `pcListQueryOptions(params.adventureId)` |
| `adventure.$adventureId.sessions.tsx` | `SessionsScreen` | `sessionListQueryOptions(params.adventureId)` |

### `adventures.tsx` — the exception

`AdventuresScreen` calls only `useAdventures`; it does not call `useTableConfigs`. Its loader awaits one query and takes no route params:

```ts
loader: ({ context }) =>
  context.queryClient.ensureQueryData(adventureListQueryOptions()),
```

Returning the promise directly rather than wrapping it in an `async` function with `Promise.all` is correct for a single query — the router awaits the returned promise.

## Verification

`npx tsc --noEmit`, `npx eslint .`, and `prettier --check .` from `app/`.

Behavioral check under `npm run dev` — `npm run web` cannot reach the database and cannot exercise any of this. Navigate from the sidebar into each of the eight list screens and confirm no spinner frame appears. The reliable way to see a regression is a screen that still flashes `LoadingIcon`: that means one of its two queries was not awaited.
