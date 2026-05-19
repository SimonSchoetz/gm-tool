# SF2: Domain Layer

Create the `domain/pcs/` module and register Pc errors in the grouping barrel.

## Files Affected

```
New:
  app/domain/pcs/errors.ts
  app/domain/pcs/index.ts

Modified:
  app/domain/index.ts — add Pc error type and factory exports
```

## Domain Layer

All files are pure name substitution from the NPC reference. Follow
`domain/npcs/errors.ts` and `domain/npcs/index.ts` exactly, substituting
`Pc`/`pcs`/`PcNotFoundError`/etc. for `Npc`/`npcs`/`NpcNotFoundError`/etc.

Error message templates (substitution anchors for verification):

| Factory | Message |
|---|---|
| `pcNotFoundError(id)` | `'Pc with id ${id} not found'` |
| `pcLoadError(cause?)` | `'Failed to load Pcs: ${String(cause)}'` |
| `pcCreateError(cause?)` | `'Failed to create Pc: ${String(cause)}'` |
| `pcUpdateError(id, cause?)` | `'Failed to update Pc ${id}: ${String(cause)}'` |
| `pcDeleteError(id, cause?)` | `'Failed to delete Pc ${id}: ${String(cause)}'` |

### `app/domain/index.ts` changes

Add the following block after the Foe block (after the line exporting `foeDeleteError`):

```ts
export type {
  PcNotFoundError,
  PcLoadError,
  PcCreateError,
  PcUpdateError,
  PcDeleteError,
} from './pcs';
export {
  pcNotFoundError,
  pcLoadError,
  pcCreateError,
  pcUpdateError,
  pcDeleteError,
} from './pcs';
```
