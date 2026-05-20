# SF4: DAL

Create the `data-access-layer/locations/` module. Depends on SF1 (`@db/location`) and SF3
(`@services/locationsService`). Consumed by SF5 (screens).

## Files Affected

```
New:
  app/src/data-access-layer/locations/locationKeys.ts
  app/src/data-access-layer/locations/useLocations.ts
  app/src/data-access-layer/locations/useLocation.ts
  app/src/data-access-layer/locations/index.ts
```

`data-access-layer/index.ts` is updated in SF6 once screens confirm the public API.

## Data Access Layer

### `app/src/data-access-layer/locations/locationKeys.ts`

```ts
export const locationKeys = {
  list: (adventureId: string) => ['locations', adventureId] as const,
  detail: (locationId: string) => ['location', locationId] as const,
};
```

### `app/src/data-access-layer/locations/useLocations.ts` and `useLocation.ts`

Follow `data-access-layer/npcs/useNpcs.ts` and `useNpc.ts` exactly, substituting
`location`/`Location`/`locations`/`Locations`/`locationKeys`/`locationsService` for
`npc`/`Npc`/`npcs`/`Npcs`/`npcKeys`/`npcsService`.

Before using the NPC hooks as a reference, verify that `deleteNpc` and `removeNpcImage`
on `useNpc`'s return type are declared as named wrapper functions — not direct
`mutateAsync` assignments. Fix before copying if not already correct.

### `app/src/data-access-layer/locations/index.ts`

```ts
export { useLocations } from './useLocations';
export { useLocation } from './useLocation';
export { locationKeys } from './locationKeys';
```
