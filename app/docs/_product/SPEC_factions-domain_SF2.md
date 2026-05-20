# SF2: Domain Layer

Create the `domain/factions/` module and register Faction errors in the grouping barrel.

## Files Affected

```
New:
  app/domain/factions/errors.ts
  app/domain/factions/index.ts

Modified:
  app/domain/index.ts — add Faction error type and factory exports
```

## Domain Layer

All files are pure name substitution from the NPC reference. Follow
`domain/npcs/errors.ts` and `domain/npcs/index.ts` exactly, substituting
`Faction`/`factions` for `Npc`/`npcs`.

Error message templates (substitution anchors for verification):

| Factory | Message |
|---|---|
| `factionNotFoundError(id)` | `'Faction with id ${id} not found'` |
| `factionLoadError(cause?)` | `'Failed to load Factions: ${String(cause)}'` |
| `factionCreateError(cause?)` | `'Failed to create Faction: ${String(cause)}'` |
| `factionUpdateError(id, cause?)` | `'Failed to update Faction ${id}: ${String(cause)}'` |
| `factionDeleteError(id, cause?)` | `'Failed to delete Faction ${id}: ${String(cause)}'` |

### `app/domain/index.ts` changes

Add the following block after the Foe block (after the line exporting `foeDeleteError`):

```ts
export type {
  FactionNotFoundError,
  FactionLoadError,
  FactionCreateError,
  FactionUpdateError,
  FactionDeleteError,
} from './factions';
export {
  factionNotFoundError,
  factionLoadError,
  factionCreateError,
  factionUpdateError,
  factionDeleteError,
} from './factions';
```
