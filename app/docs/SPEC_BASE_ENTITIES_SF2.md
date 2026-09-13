# SF2 — Base entity domain vocabulary

Add the base-entity type list, its predicate, two type-keyed accessors, and the shared error factories. Purely additive: the six per-type `domain/<plural>/` modules stay until SF7.

## Files affected

Modified:

- `app/domain/entities/entityTypes.ts` — add `BASE_ENTITY_TYPES`, `BaseEntityType`, `isBaseEntityType`; build `ENTITY_TYPES` from `BASE_ENTITY_TYPES`
- `app/domain/entities/index.ts` — add the new explicit named exports
- `app/domain/index.ts` — add `export * from './base-entities';`

New:

- `app/domain/entities/baseEntitySearchHints.ts`
- `app/domain/entities/buildBaseEntityListPath.ts`
- `app/domain/entities/__tests__/entityTypes.test.ts`
- `app/domain/entities/__tests__/baseEntitySearchHints.test.ts`
- `app/domain/entities/__tests__/buildBaseEntityListPath.test.ts`
- `app/domain/base-entities/errors.ts`
- `app/domain/base-entities/index.ts`

Moved: none

Draft: none

## Domain

### `entityTypes.ts`

Final exported shape (KAD: `BASE_ENTITY_TYPES` is declared first and `ENTITY_TYPES` is built from it):

```ts
export const BASE_ENTITY_TYPES = [
  'npcs',
  'foes',
  'pcs',
  'factions',
  'locations',
  'items',
] as const;

export type BaseEntityType = (typeof BASE_ENTITY_TYPES)[number];

export const isBaseEntityType = (value: string): value is BaseEntityType =>
  (BASE_ENTITY_TYPES as readonly string[]).includes(value);

export const ENTITY_TYPES = [
  ...BASE_ENTITY_TYPES,
  'sessions',
  'encounters',
  'adventures',
] as const;
```

`EntityType` and `isEntityType` are unchanged. The resulting `ENTITY_TYPES` order is identical to today's.

### `baseEntitySearchHints.ts`

Module-private `BASE_ENTITY_SEARCH_HINTS: Record<BaseEntityType, string>` — the one type-specific word each list screen shows in its search placeholder today: `npcs: 'profession'`, `foes: 'type'`, `pcs: 'faction'`, `factions: 'leader'`, `locations: 'region'`, `items: 'type'`. Exported accessor: `baseEntitySearchHint = (entityType: BaseEntityType): string`. Import `BaseEntityType` from `./entityTypes`. Placement follows `app/domain/CLAUDE.md` — What Belongs Here (a lookup table keyed by a domain type, wrapped by an exported accessor).

### `buildBaseEntityListPath.ts`

`buildBaseEntityListPath = (entityType: BaseEntityType, adventureId: string): string` returning `` `/adventure/${adventureId}/${entityType}` `` — each base entity type's plural is also its list route segment (`/adventure/$adventureId/npcs`, …). Import `BaseEntityType` from `./entityTypes`.

### `entities/index.ts`

Explicit named exports only. Change the `./entityTypes` line to `export { ENTITY_TYPES, BASE_ENTITY_TYPES, isEntityType, isBaseEntityType, type EntityType, type BaseEntityType } from './entityTypes';` and add:

- `export { baseEntitySearchHint } from './baseEntitySearchHints';`
- `export { buildBaseEntityListPath } from './buildBaseEntityListPath';`

### `base-entities/errors.ts`

Six factories following `app/CLAUDE.md`'s error factory pattern. Reference: `app/domain/npcs/errors.ts` (validated: factory functions, `Error & { name: … }` types, no classes). Each factory takes `entityType: BaseEntityType` as its first parameter and builds its message with `label = entityTypeLabel(entityType)`, imported with `BaseEntityType` from `'../entities'` (a sibling module barrel, as `domain/mentions/mentionEntityType.ts` already does).

| Type / `name` | Factory | Message |
| --- | --- | --- |
| `BaseEntityNotFoundError` | `baseEntityNotFoundError(entityType, id)` | `` `${label} with id ${id} not found` `` |
| `BaseEntityLoadError` | `baseEntityLoadError(entityType, cause?)` | `` `Failed to load ${label}s: ${String(cause)}` `` |
| `BaseEntityCreateError` | `baseEntityCreateError(entityType, cause?)` | `` `Failed to create ${label}: ${String(cause)}` `` |
| `BaseEntityUpdateError` | `baseEntityUpdateError(entityType, id, cause?)` | `` `Failed to update ${label} ${id}: ${String(cause)}` `` |
| `BaseEntityDeleteError` | `baseEntityDeleteError(entityType, id, cause?)` | `` `Failed to delete ${label} ${id}: ${String(cause)}` `` |
| `BaseEntityDuplicateError` | `baseEntityDuplicateError(entityType, id, cause?)` | `` `Failed to duplicate ${label} ${id}: ${String(cause)}` `` |

`${label}s` produces `NPCs`, `PCs`, `Foes`, `Factions`, `Locations`, `Items` — the same plurals the per-type load errors use today.

### `base-entities/index.ts`

Explicit named exports, one `export type { … }` and one `export { … }` line per error pair, following `app/domain/npcs/index.ts`: all six types and all six factories.

### `domain/index.ts`

Add `export * from './base-entities';` directly after `export * from './adventures';`. `export *` is permitted here: `app/domain/CLAUDE.md` — Imports documents both `@domain` and `@domain/<subdomain>` as sanctioned import paths, which is the dual-path exception in `app/CLAUDE.md` — Directory Structure. The six per-type lines stay until SF7.

### Tests

Domain has no stated test-scope rule; the existing `domain/entities/__tests__/` convention (one test file per accessor module) is followed.

`entityTypes.test.ts`:

- `isBaseEntityType` returns `true` for each of `'npcs'`, `'foes'`, `'pcs'`, `'factions'`, `'locations'`, `'items'`
- `isBaseEntityType` returns `false` for `'sessions'`, `'encounters'`, `'adventures'`, and `'stories'`
- `ENTITY_TYPES` equals `['npcs', 'foes', 'pcs', 'factions', 'locations', 'items', 'sessions', 'encounters', 'adventures']` (`toEqual`, order-sensitive)

`baseEntitySearchHints.test.ts`:

- returns `'profession'` for `'npcs'`, `'type'` for `'foes'`, `'faction'` for `'pcs'`, `'leader'` for `'factions'`, `'region'` for `'locations'`, `'type'` for `'items'`

`buildBaseEntityListPath.test.ts`:

- `buildBaseEntityListPath('npcs', 'adv-1')` returns `'/adventure/adv-1/npcs'`
- `buildBaseEntityListPath('items', 'adv-1')` returns `'/adventure/adv-1/items'`

### Cross-SF consumers

- `BASE_ENTITY_TYPES` — SF3 `app/db/base-entity/schema.ts` (`import { BASE_ENTITY_TYPES } from '@domain'`)
- `BaseEntityType` — SF3 db module, SF4 service, SF5 DAL, SF6 components
- `isBaseEntityType` — SF3 `app/db/mention-search.ts` and `app/db/pinned-order.ts`; SF6 `MentionPopupContent.tsx`
- `baseEntitySearchHint` — SF6 `app/src/screens/base-entities/BaseEntitiesScreen.tsx` (`from '@domain'`)
- `buildBaseEntityListPath` — SF6 `app/src/screens/base-entity/components/BaseEntitySidebar/BaseEntitySidebar.tsx` (`from '@domain'`)
- the six error factories — SF4 `app/services/baseEntityService.ts` (`from '@domain/base-entities'`)

### Modified-file scan

`entityTypes.ts`, `entities/index.ts`, and `domain/index.ts` contain no JSX and no `void`-context `return null`; no other violation found.
