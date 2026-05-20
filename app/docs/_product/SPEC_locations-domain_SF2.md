# SF2: Domain Layer

Create the `domain/locations/` module and register Location errors in the grouping barrel.

## Files Affected

```
New:
  app/domain/locations/errors.ts
  app/domain/locations/index.ts

Modified:
  app/domain/index.ts — add Location error type and factory exports
```

## Domain Layer

All files are pure name substitution from the NPC reference. Follow
`domain/npcs/errors.ts` and `domain/npcs/index.ts` exactly, substituting
`Location`/`locations` for `Npc`/`npcs`.

Error message templates (substitution anchors for verification):

| Factory | Message |
|---|---|
| `locationNotFoundError(id)` | `'Location with id ${id} not found'` |
| `locationLoadError(cause?)` | `'Failed to load Locations: ${String(cause)}'` |
| `locationCreateError(cause?)` | `'Failed to create Location: ${String(cause)}'` |
| `locationUpdateError(id, cause?)` | `'Failed to update Location ${id}: ${String(cause)}'` |
| `locationDeleteError(id, cause?)` | `'Failed to delete Location ${id}: ${String(cause)}'` |

### `app/domain/index.ts` changes

Add the following block after the Foe block (after the line exporting `foeDeleteError`):

```ts
export type {
  LocationNotFoundError,
  LocationLoadError,
  LocationCreateError,
  LocationUpdateError,
  LocationDeleteError,
} from './locations';
export {
  locationNotFoundError,
  locationLoadError,
  locationCreateError,
  locationUpdateError,
  locationDeleteError,
} from './locations';
```
