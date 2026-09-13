# SF7 — Remove per-type stacks

Delete the six per-type db, domain, service, and DAL stacks that nothing imports after SF6, remove their grouping-barrel exports, and rewrite the domain scaffold for base entity types.

## Files affected

Modified:

- `app/domain/index.ts` — remove `export * from './factions';`, `'./foes'`, `'./items'`, `'./locations'`, `'./npcs'`, `'./pcs'`
- `app/src/data-access-layer/index.ts` — remove the twelve per-type lines (`useNpcs`/`useNpc` through `pcListQueryOptions`/`pcQueryOptions`)
- `app/docs/_product/domain-scaffold.md` — rewrite for adding a base entity type (section changes below)
- `app/db/npc/create.ts` — delete this file
- `app/db/npc/duplicate.ts` — delete this file
- `app/db/npc/get-all.ts` — delete this file
- `app/db/npc/get.ts` — delete this file
- `app/db/npc/index.ts` — delete this file
- `app/db/npc/remove.ts` — delete this file
- `app/db/npc/schema.ts` — delete this file
- `app/db/npc/types.ts` — delete this file
- `app/db/npc/update.ts` — delete this file
- `app/db/npc/__tests__/create.test.ts` — delete this file
- `app/db/npc/__tests__/duplicate.test.ts` — delete this file
- `app/db/npc/__tests__/get-all.test.ts` — delete this file
- `app/db/npc/__tests__/get.test.ts` — delete this file
- `app/db/npc/__tests__/remove.test.ts` — delete this file
- `app/db/npc/__tests__/update.test.ts` — delete this file
- `app/db/pc/create.ts` — delete this file
- `app/db/pc/duplicate.ts` — delete this file
- `app/db/pc/get-all.ts` — delete this file
- `app/db/pc/get.ts` — delete this file
- `app/db/pc/index.ts` — delete this file
- `app/db/pc/remove.ts` — delete this file
- `app/db/pc/schema.ts` — delete this file
- `app/db/pc/types.ts` — delete this file
- `app/db/pc/update.ts` — delete this file
- `app/db/pc/__tests__/create.test.ts` — delete this file
- `app/db/pc/__tests__/duplicate.test.ts` — delete this file
- `app/db/pc/__tests__/get-all.test.ts` — delete this file
- `app/db/pc/__tests__/get.test.ts` — delete this file
- `app/db/pc/__tests__/remove.test.ts` — delete this file
- `app/db/pc/__tests__/update.test.ts` — delete this file
- `app/db/foe/create.ts` — delete this file
- `app/db/foe/duplicate.ts` — delete this file
- `app/db/foe/get-all.ts` — delete this file
- `app/db/foe/get.ts` — delete this file
- `app/db/foe/index.ts` — delete this file
- `app/db/foe/remove.ts` — delete this file
- `app/db/foe/schema.ts` — delete this file
- `app/db/foe/types.ts` — delete this file
- `app/db/foe/update.ts` — delete this file
- `app/db/foe/__tests__/create.test.ts` — delete this file
- `app/db/foe/__tests__/duplicate.test.ts` — delete this file
- `app/db/foe/__tests__/get-all.test.ts` — delete this file
- `app/db/foe/__tests__/get.test.ts` — delete this file
- `app/db/foe/__tests__/remove.test.ts` — delete this file
- `app/db/foe/__tests__/update.test.ts` — delete this file
- `app/db/faction/create.ts` — delete this file
- `app/db/faction/duplicate.ts` — delete this file
- `app/db/faction/get-all.ts` — delete this file
- `app/db/faction/get.ts` — delete this file
- `app/db/faction/index.ts` — delete this file
- `app/db/faction/remove.ts` — delete this file
- `app/db/faction/schema.ts` — delete this file
- `app/db/faction/types.ts` — delete this file
- `app/db/faction/update.ts` — delete this file
- `app/db/faction/__tests__/create.test.ts` — delete this file
- `app/db/faction/__tests__/duplicate.test.ts` — delete this file
- `app/db/faction/__tests__/get-all.test.ts` — delete this file
- `app/db/faction/__tests__/get.test.ts` — delete this file
- `app/db/faction/__tests__/remove.test.ts` — delete this file
- `app/db/faction/__tests__/update.test.ts` — delete this file
- `app/db/location/create.ts` — delete this file
- `app/db/location/duplicate.ts` — delete this file
- `app/db/location/get-all.ts` — delete this file
- `app/db/location/get.ts` — delete this file
- `app/db/location/index.ts` — delete this file
- `app/db/location/remove.ts` — delete this file
- `app/db/location/schema.ts` — delete this file
- `app/db/location/types.ts` — delete this file
- `app/db/location/update.ts` — delete this file
- `app/db/location/__tests__/create.test.ts` — delete this file
- `app/db/location/__tests__/duplicate.test.ts` — delete this file
- `app/db/location/__tests__/get-all.test.ts` — delete this file
- `app/db/location/__tests__/get.test.ts` — delete this file
- `app/db/location/__tests__/remove.test.ts` — delete this file
- `app/db/location/__tests__/update.test.ts` — delete this file
- `app/db/item/create.ts` — delete this file
- `app/db/item/duplicate.ts` — delete this file
- `app/db/item/get-all.ts` — delete this file
- `app/db/item/get.ts` — delete this file
- `app/db/item/index.ts` — delete this file
- `app/db/item/remove.ts` — delete this file
- `app/db/item/schema.ts` — delete this file
- `app/db/item/types.ts` — delete this file
- `app/db/item/update.ts` — delete this file
- `app/db/item/__tests__/create.test.ts` — delete this file
- `app/db/item/__tests__/duplicate.test.ts` — delete this file
- `app/db/item/__tests__/get-all.test.ts` — delete this file
- `app/db/item/__tests__/get.test.ts` — delete this file
- `app/db/item/__tests__/remove.test.ts` — delete this file
- `app/db/item/__tests__/update.test.ts` — delete this file
- `app/domain/npcs/errors.ts` — delete this file
- `app/domain/npcs/index.ts` — delete this file
- `app/domain/pcs/errors.ts` — delete this file
- `app/domain/pcs/index.ts` — delete this file
- `app/domain/foes/errors.ts` — delete this file
- `app/domain/foes/index.ts` — delete this file
- `app/domain/factions/errors.ts` — delete this file
- `app/domain/factions/index.ts` — delete this file
- `app/domain/locations/errors.ts` — delete this file
- `app/domain/locations/index.ts` — delete this file
- `app/domain/items/errors.ts` — delete this file
- `app/domain/items/index.ts` — delete this file
- `app/services/npcsService.ts` — delete this file
- `app/services/pcsService.ts` — delete this file
- `app/services/foesService.ts` — delete this file
- `app/services/factionsService.ts` — delete this file
- `app/services/locationsService.ts` — delete this file
- `app/services/itemsService.ts` — delete this file
- `app/src/data-access-layer/npcs/index.ts` — delete this file
- `app/src/data-access-layer/npcs/npcKeys.ts` — delete this file
- `app/src/data-access-layer/npcs/npcQueryOptions.ts` — delete this file
- `app/src/data-access-layer/npcs/useNpc.ts` — delete this file
- `app/src/data-access-layer/npcs/useNpcs.ts` — delete this file
- `app/src/data-access-layer/pcs/index.ts` — delete this file
- `app/src/data-access-layer/pcs/pcKeys.ts` — delete this file
- `app/src/data-access-layer/pcs/pcQueryOptions.ts` — delete this file
- `app/src/data-access-layer/pcs/usePc.ts` — delete this file
- `app/src/data-access-layer/pcs/usePcs.ts` — delete this file
- `app/src/data-access-layer/foes/index.ts` — delete this file
- `app/src/data-access-layer/foes/foeKeys.ts` — delete this file
- `app/src/data-access-layer/foes/foeQueryOptions.ts` — delete this file
- `app/src/data-access-layer/foes/useFoe.ts` — delete this file
- `app/src/data-access-layer/foes/useFoes.ts` — delete this file
- `app/src/data-access-layer/factions/index.ts` — delete this file
- `app/src/data-access-layer/factions/factionKeys.ts` — delete this file
- `app/src/data-access-layer/factions/factionQueryOptions.ts` — delete this file
- `app/src/data-access-layer/factions/useFaction.ts` — delete this file
- `app/src/data-access-layer/factions/useFactions.ts` — delete this file
- `app/src/data-access-layer/locations/index.ts` — delete this file
- `app/src/data-access-layer/locations/locationKeys.ts` — delete this file
- `app/src/data-access-layer/locations/locationQueryOptions.ts` — delete this file
- `app/src/data-access-layer/locations/useLocation.ts` — delete this file
- `app/src/data-access-layer/locations/useLocations.ts` — delete this file
- `app/src/data-access-layer/items/index.ts` — delete this file
- `app/src/data-access-layer/items/itemKeys.ts` — delete this file
- `app/src/data-access-layer/items/itemQueryOptions.ts` — delete this file
- `app/src/data-access-layer/items/useItem.ts` — delete this file
- `app/src/data-access-layer/items/useItems.ts` — delete this file

New: none

Moved: none

Draft: none

Before deleting, grep `app/` (excluding `node_modules`) for each removed module's import specifier (`@db/npc`, `@domain/npcs`, `@services/npcsService`, `'./npcs'` in the DAL grouping barrel, and the same for the other five types). After SF3–SF6, the only hits must be inside the files being deleted and the two grouping barrels changed here.

## Domain

`app/domain/index.ts`: remove the six per-type `export *` lines; `export * from './base-entities';` (added in SF2) stays.

## Database

Delete the ninety `app/db/<type>/` files listed above. `app/db/_sync/registry.ts` (SF3) and `app/db/_migrations/1779321600000_initial_schema.ts` (SF1) no longer import any of them.

## Services

Delete the six per-type service files listed above.

## Data Access Layer

`app/src/data-access-layer/index.ts`: remove lines 9–20 (the `npcs`, `foes`, `items`, `locations`, `factions`, `pcs` hook and query-options exports). The `base-entities` lines added in SF5 stay. Delete the thirty per-type DAL files listed above.

## Reference document — `app/docs/_product/domain-scaffold.md`

The document stops describing a per-table, per-layer scaffold for "standard domain entities" and instead describes adding a new base entity type to the shared stack. Sessions, Encounters, and Adventures remain standalone domains with their own stacks; state in the introduction that this document does not scaffold new standalone domains. Section changes:

- **Introduction and Usage** — the `/write-specs` prompt template asks for a new base entity type: singular/plural pair, display label, summary template lines, table config color, search hint word, `tagging_enabled`, and `scope`. Remove "Custom columns beyond base schema".
- **Naming Conventions** — replace the per-type identifier table with two tables:
  - per-type values: entity type (plural lowercase, a `BASE_ENTITY_TYPES` member, equal to `table_config.table_name`), route segment (singular lowercase), list route file (`adventure.$adventureId.[plural].tsx`), detail route file (`adventure.$adventureId.[singular].$baseEntityId.tsx`), URL id param (always `baseEntityId`), display label, and breadcrumb kind
  - the shared modules every type uses: `db/base-entity/`, `domain/base-entities/`, `services/baseEntityService.ts`, `data-access-layer/base-entities/`, `screens/base-entities/BaseEntitiesScreen.tsx`, `screens/base-entity/BaseEntityScreen.tsx` with `components/BaseEntitySidebar/`, `BaseEntityPopupContent`, `BaseEntityDuplicateBtn`, `BaseEntityCrumb`
  Remove the `textEditorId` prefix row and every per-type db, domain, service, DAL, hook, screen, sidebar, and crumb row.
- **Base Schema** — rename the heading to **Shared Columns** and describe `base_entities`: the same columns plus `entity_type TEXT NOT NULL` (`z.enum(BASE_ENTITY_TYPES)`). Every nullable column's Zod is `.nullable()`; fix the `image_id` row, which today prescribes `.nullable().optional()`. Remove the grandfathered-`.optional()` paragraph, which no base entity schema is subject to.
- **Implementation Notes** — keep "Validate reference implementations before replicating" and the `routeTree.gen.ts` note (it still applies to new route files); remove "SF coupling: screens + barrel registrations", since a new type adds no per-type hooks.
- **Layer Patterns** — replace all per-type subsections (DB Layer, Sync Registration, Domain Layer, Service Layer, DAL, Frontend list and detail screens, Duplication, Entity Type Registration, Seed Config) with one registration checklist for a new base entity type, grouped by layer in `app/docs/CLAUDE.md` order:
  - **Domain** — add the plural to `BASE_ENTITY_TYPES` (`domain/entities/entityTypes.ts`); add an entry to `ENTITY_SEGMENT` (`buildEntityPath.ts`), `ENTITY_TYPE_LABELS` (`entityTypeLabels.ts`), and `BASE_ENTITY_SEARCH_HINTS` (`baseEntitySearchHints.ts`), plus its test assertion in each accessor's test file
  - **Database** — add a `SUMMARY_TEMPLATES` entry in `db/base-entity/create.ts`; add a migration that inserts only the new `table_config` row (the `WHERE NOT EXISTS` form of `db/_migrations/1780099200000_seed_table_config.ts`, with its layout block) — no table, no triggers, and no sync registry change
  - **Data Access Layer** — add a `prefetchBaseEntity('[plural]')` entry to `mentionPrefetchByType.ts`, which `tsc` requires
  - **Frontend** — the two route files in the SF6 shapes; the two `buildBreadcrumbs.ts` cases and their tests; the grouped case label in `ScreensDuplicateBtn.tsx` and in `BreadcrumbListEntry.tsx`; the `SideBarNav.tsx` button; the `AdventureStats.tsx` hook call and `statsMap` entry
  - **Needs no change** — `MentionPopupContent.tsx` (dispatches through `isBaseEntityType`), the shared screens, sidebar, popup, duplicate button, crumb, service, and db CRUD
- **Detail-screen exceptions** — keep the two notes that `screens/session/` and `screens/encounter/` deliberately deviate from the `ScreensTextEditorLayout` composition, now placed after a short description of `BaseEntityScreen`'s composition, which is that pattern's reference implementation.
- **Popup content paragraph** — remove the paragraph about `NpcPopupContent.css` and six zero-byte popup stylesheets; none of those files exists (the popup content directories hold only `.tsx` files).
- **Customization Points** — rows: summary template lines (`db/base-entity/create.ts`), table config color, `tagging_enabled`, and `scope` (the new migration), display label (`domain/entities/entityTypeLabels.ts`), search hint word (`domain/entities/baseEntitySearchHints.ts`). Remove "Custom schema columns".

The rewritten document must comply with `.markdownlint.json` (first line H1, languages on fenced blocks, blank lines around fences).

### Modified-file scan

`domain/index.ts` and `data-access-layer/index.ts` contain no JSX and no `void`-context `return null`; after the removals both keep their explicit-export and dual-path conventions. No other violation found.
