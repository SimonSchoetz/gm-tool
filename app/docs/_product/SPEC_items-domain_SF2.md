# SF2: Domain Layer

Create the `domain/items/` module and register Item errors in the grouping barrel.

## Files Affected

```
New:
  app/domain/items/errors.ts
  app/domain/items/index.ts

Modified:
  app/domain/index.ts — add Item error type and factory exports
```

## Domain Layer

All files are pure name substitution from the NPC reference. Follow
`domain/npcs/errors.ts` and `domain/npcs/index.ts` exactly, substituting
`Item`/`items` for `Npc`/`npcs`.

Error message templates (substitution anchors for verification):

| Factory | Message |
|---|---|
| `itemNotFoundError(id)` | `'Item with id ${id} not found'` |
| `itemLoadError(cause?)` | `'Failed to load Items: ${String(cause)}'` |
| `itemCreateError(cause?)` | `'Failed to create Item: ${String(cause)}'` |
| `itemUpdateError(id, cause?)` | `'Failed to update Item ${id}: ${String(cause)}'` |
| `itemDeleteError(id, cause?)` | `'Failed to delete Item ${id}: ${String(cause)}'` |

### `app/domain/index.ts` changes

Add the following block after the Foe block (after the line exporting `foeDeleteError`):

```ts
export type {
  ItemNotFoundError,
  ItemLoadError,
  ItemCreateError,
  ItemUpdateError,
  ItemDeleteError,
} from './items';
export {
  itemNotFoundError,
  itemLoadError,
  itemCreateError,
  itemUpdateError,
  itemDeleteError,
} from './items';
```
