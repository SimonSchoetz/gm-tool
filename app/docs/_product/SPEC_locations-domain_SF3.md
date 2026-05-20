# SF3: Service Layer

Create `services/locationsService.ts`. Depends on SF1 (`@db/location`) and SF2
(`@domain/locations`).

## Files Affected

```
New:
  app/services/locationsService.ts
```

## Services Layer

Follow `services/npcsService.ts` exactly, substituting `Location`/`locations`/`location` for
`Npc`/`npcs`/`npc` and `@db/location`/`@domain/locations` for `@db/npc`/`@domain/npcs`.

Before using `npcsService.ts` as a reference, verify that `deleteNpc` and `removeNpcImage`
are declared as named wrapper functions — not `mutation.mutateAsync` assigned directly.
Fix before copying if not already correct.

Domain-specific identifiers after substitution:

| Source (NPC) | Target (Location) |
|---|---|
| `getAllNpcs` | `getAllLocations` |
| `getNpcById` | `getLocationById` |
| `createNpc` | `createLocation` |
| `updateNpc` | `updateLocation` |
| `removeNpcImage` | `removeLocationImage` |
| `deleteNpc` | `deleteLocation` |
| `UpdateNpcData` | `UpdateLocationData` |
| `npcNotFoundError` | `locationNotFoundError` |
| `npcLoadError` | `locationLoadError` |
| `npcCreateError` | `locationCreateError` |
| `npcUpdateError` | `locationUpdateError` |
| `npcDeleteError` | `locationDeleteError` |
