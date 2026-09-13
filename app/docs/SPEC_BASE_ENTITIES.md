# Base Entities Consolidation

NPCs, PCs, Foes, Factions, Locations, and Items move from six identical tables and six identical per-layer stacks into one `base_entities` table with an `entity_type` discriminator and one shared stack per layer. User-visible behavior is unchanged: same URLs, same screens, same data. Sessions, Adventures, and Encounters are out of scope and keep their own tables and stacks.

## Progress tracker

- Sub-feature 1: Freeze migration schema SQL — replace live schema-module imports in two applied migrations with frozen SQL literals, so the per-type schema files can be deleted later
- Sub-feature 2: Base entity domain vocabulary — `BASE_ENTITY_TYPES`, search hints, list path, base-entity error factories
- Sub-feature 3: `base_entities` table — db module, data-moving migration, sync registry, cross-table queries
- Sub-feature 4: Base entity service — one service replacing six
- Sub-feature 5: Base entity data access — shared hooks, query options, mention prefetch
- Sub-feature 6: Frontend switch-over — shared screens, sidebar, popup, duplicate button, crumb, route rewiring, removal of per-type frontend files
- Sub-feature 7: Remove per-type stacks — delete the six db/domain/service/DAL stacks and update the domain scaffold

## Sub-feature files

- [SF1 — Freeze migration schema SQL](SPEC_BASE_ENTITIES_SF1.md)
- [SF2 — Base entity domain vocabulary](SPEC_BASE_ENTITIES_SF2.md)
- [SF3 — base_entities table](SPEC_BASE_ENTITIES_SF3.md)
- [SF4 — Base entity service](SPEC_BASE_ENTITIES_SF4.md)
- [SF5 — Base entity data access](SPEC_BASE_ENTITIES_SF5.md)
- [SF6 — Frontend switch-over](SPEC_BASE_ENTITIES_SF6.md)
- [SF7 — Remove per-type stacks](SPEC_BASE_ENTITIES_SF7.md)

Every sub-feature leaves the type-check, lint, and format rows passing on its own when the preceding sub-features are in place; no sub-feature is a Foundation SF. Between SF3 and SF6 the app's runtime is inconsistent (the migration drops the six tables while the old screens still query them) — do not treat an intermediate `pnpm run dev` session as a regression signal; runtime verification happens after SF6.

## Key Architectural Decisions

### One table, discriminated by the existing entity-type strings

`base_entities` holds every NPC, PC, Foe, Faction, Location, and Item row, with `entity_type TEXT NOT NULL` storing exactly `'npcs'`, `'pcs'`, `'foes'`, `'factions'`, `'locations'`, or `'items'`. These are the same strings already persisted in two places that must keep resolving without a data rewrite: every mention node inside rich-text JSON stores `entityType` [spec-writer_6: app/src/components/TextEditor/nodes/MentionNode.tsx:116], and every `table_config.table_name` row names its list by the same string [spec-writer_7: app/db/_migrations/1780099200000_seed_table_config.ts:6,21,37,59,81,103,125,147; app/db/_migrations/1786186021664_add_encounters.ts:6]. The six per-type stacks are the same concern: a whitespace-insensitive comparison of every per-type file against its NPC counterpart differs only in label strings, the summary template text, one search-placeholder word, and the `textEditorId` prefix [spec-writer_24: ran normalized whitespace-insensitive diff of 16 per-type file kinds for pc, foe, faction, location, item against npc — observed only those differences].

### `BASE_ENTITY_TYPES` is declared first and `ENTITY_TYPES` is built from it

`domain/entities/entityTypes.ts` declares `BASE_ENTITY_TYPES` and then `ENTITY_TYPES = [...BASE_ENTITY_TYPES, 'sessions', 'encounters', 'adventures'] as const`, keeping the current member order. "Base" means building block, not supertype: base entities are a subset of entity types, and building the superset from the subset makes that relationship structural rather than a naming convention a reader must infer. The spread form keeps the exact literal union [spec-writer_4: ran `npx tsc --noEmit` from `app/` with a disposable file spreading one `as const` tuple into another — observed exit code 0, 0 errors].

### Entity type is the first argument at every layer

Every db read, every service function, and every DAL hook and query-options factory takes `entityType: BaseEntityType` as its first parameter, and every shared component receives it as its `entityType` prop, matching the existing `(entityType, entityId, …)` order of `buildEntityPath` and `getMentionEntityData`. No layer re-derives the type from a row it has not yet fetched.

### Reads filter by entity type; writes address the row by id

`get`, `getAll`, `duplicate`'s source fetch, mention search, and the pinned-order maximum all add `entity_type = $n`. `update`, `remove`, and `setPinnedOrder` address the row by `id` alone, since `id` is the primary key. The read filter preserves today's per-table behavior: an id of one type never resolves under another type's route (a Faction id in an NPC URL still yields a not-found), and pinned positions stay numbered per list rather than across all six lists.

### The schema follows the current `zodSchema` rule, so `BaseEntity` fields are required-but-nullable

`db/base-entity/schema.ts` uses `.nullable()` without `.optional()` on every nullable column, as `app/db/CLAUDE.md` requires for a deliberate schema migration. `BaseEntity.name`, `summary`, `description`, and `image_id` are therefore `string | null`, never possibly-absent. Consumers pass these values directly where the receiving type already accepts `string | null` (`EntityPopupBody`, `UploadImgBtn`, `ensureImagePainted`), and drop the old `?? null` normalizations that only existed because the grandfathered schemas typed them as optional.

### Summary templates live in the db create module

The six Lexical-JSON summary templates move verbatim into a module-private `Record<BaseEntityType, string>` in `db/base-entity/create.ts`. `app/db/CLAUDE.md` — Default Placement Hierarchy names `create.ts` as the owner of stringified-JSON defaults, which is the rule this follows; `app/domain/CLAUDE.md` — What Belongs Here also claims constant tables keyed by a domain type, and no rule states which wins [spec-writer_18: app/db/CLAUDE.md:65-67; app/domain/CLAUDE.md:15]. The conflict is recorded under CLAUDE.md impact.

### Labels derive from `entityTypeLabel`

Default names (`New ${label} …`), screen placeholders, the delete button, and domain error messages all read `entityTypeLabel(entityType)`. One observable change results: a newly created PC is named `New PC …` instead of today's `New Pc …` [spec-writer_19: grep `` `New [A-Za-z]+ `` app/db/**/create.ts — found `New Pc` in db/pc/create.ts:19 and `New NPC` in db/npc/create.ts:19]; existing rows keep their stored names. db-layer id assertions use the fixed label `'Base entity'` (`Valid Base entity ID is required`); the adventure-id assertions keep their current labels (`'adventure'` in `create`, `'Adventure'` in `getAll`). `textEditorId` values change prefix (`npcs_<id>_summary` instead of `NPC_<id>_summary`); they are only a Lexical namespace and React key and are never persisted [spec-writer_16: app/src/components/TextEditor/TextEditor.tsx:96,135].

### Migrations never import live schema modules

`1779321600000_initial_schema.ts` executes `xTable.createTableSQL` from eleven live schema modules [spec-writer_13: app/db/_migrations/1779321600000_initial_schema.ts:2-25 — as of 0e51e922], and `1786186021664_add_encounters.ts` does the same for `encounterTable`. Deleting `db/npc/schema.ts` and its five siblings would break the first one, and any later schema edit would silently change what a fresh install creates. SF1 replaces every such import with a frozen SQL literal equal to what the schema module generates today, so fresh installs keep producing exactly today's schema and already-applied installs are unaffected.

### The data-moving migration: triggers first, then per legacy table copy, carry tombstones, drop, clean up

`{timestamp}_add_base_entities.ts` creates `base_entities` and its three sync triggers before copying any rows, so every copied row gets a `base_entities:<id>` change record through the insert trigger — the old per-table change records are deleted by this migration, and a row without a change record never reaches a paired device [spec-writer_11: app/db/_migrations/1784896762609_backfill_sync_changes.ts:26]. For each legacy table, in order:

1. Copy rows only when the table still exists (`sqlite_master` guard [spec-writer_2: https://www.sqlite.org/schematab.html]), with `INSERT … SELECT … WHERE true ON CONFLICT(id) DO NOTHING` — the `WHERE true` is required to disambiguate the upsert clause [spec-writer_1: https://www.sqlite.org/lang_upsert.html].
2. Re-key deletion tombstones (`deleted = 1`) from `<table>:<id>` to `base_entities:<id>`, keeping their original `seq`: a peer that already passed that `seq` already applied the deletion; a peer that had not still has a cursor below it and receives it.
3. `DROP TABLE IF EXISTS <table>`.
4. Delete every `_sync_changes` row whose `table_name` is the legacy table — after the drop, so no change record the drop could emit survives.

Every statement is safe to re-issue after a partial failure, as `app/db/CLAUDE.md` — Migrations requires. Sync only runs between peers with equal migration heads [spec-writer_9: app/services/syncService.ts:311], so both devices run this migration before exchanging rows; each device then re-sends every base entity once, and the receiver skips rows whose `updated_at` is not newer [spec-writer_10: app/db/_sync/apply-upsert.ts:19-26].

### The `table_config` sync gate checks entity types, not synced table names

`applyTableConfigUpsert` currently accepts a peer's `table_config` row only when its `table_name` is in `SYNCED_TABLE_NAMES` [spec-writer_8: app/db/_sync/apply-upsert.ts:61]. After this spec, six valid `table_name` values are no longer table names, so the check becomes `isEntityType(tableName)`. For every seeded config (`adventures`, `sessions`, the six base entity types, `encounters`) the accepted set is unchanged, and a non-entity string is still skipped before any query.

### Cross-table modules resolve base entity types to `base_entities`

`db/mention-search.ts` and `db/pinned-order.ts` receive an entity type and today interpolate it as a table name. Each function now has two code paths: a base entity type queries `base_entities` with `entity_type` as a bound parameter; every other entity type keeps the existing interpolated-table query. The tests enumerate both paths per function.

### The base-entity list query key keeps `[entityType, adventureId]`

`RowActionsMenu` pins and unpins through `useSetPinnedOrder(config.table_name, itemId)`, which invalidates the prefix key `[entityType]` [spec-writer_12: app/src/data-access-layer/pinned-order/useSetPinnedOrder.ts:18,25; app/src/components/SortableList/components/SortableListItem/components/RowActionsMenu/RowActionsMenu.tsx:37-40]. The shared list key stays exactly `[entityType, adventureId]` so that invalidation still refreshes the list. The detail key is `['base-entity', entityType, baseEntityId]`; it includes the type because the detail read is type-filtered.

### Detail routes rename their id param to `$baseEntityId`; route files pass the entity type to shared screens

The six detail route files keep their URL segment (`/adventure/$adventureId/npc/…`) but rename the id param from `$npcId` (and siblings) to `$baseEntityId`, so every shared component reads the same param name through `useParams({ strict: false })`, the form `NpcCrumb` already uses [spec-writer_21: app/src/components/Header/components/BreadcrumbList/components/NpcCrumb.tsx:5]. URLs, `buildEntityPath`, and links in saved content are unchanged. Each of the twelve route files supplies the static entity type through `component: () => <SharedScreen entityType='…' />`. The entity type is not a URL param, so passing it as a prop does not relay framework context; ids and `adventureId` are still read by each component itself through `useParams`, as `.claude/rules/src-components.md` — Framework context is not a prop requires. The inline arrow is route configuration, not a function declared inside a component body, so the no-inline-sub-components rule does not apply, and the lint configuration accepts it [spec-writer_3: ran `npx eslint` from `app/` against a disposable route file with `component: () => <NpcsScreen />` — observed exit code 0]. A shared crumb links with a runtime-built string in `to` [spec-writer_4: ran `npx tsc --noEmit` from `app/` with a disposable `<Link to={to}>` where `to: string` and no `params` — observed exit code 0].

### Dispatch sites route all base entity types through one branch and keep compile-time coverage for the rest

`ScreensDuplicateBtn` documents its switch as the single declaration of what can be duplicated, and `MentionPopupContent` and `mentionPrefetchByType` key their maps by `MentionEntityType` so a missing mentionable type fails to compile [spec-writer_23: app/src/screens/components/ScreensDuplicateBtn/ScreensDuplicateBtn.tsx:16; app/src/components/MentionPopup/components/MentionPopupContent/MentionPopupContent.tsx:25-26; app/src/data-access-layer/mentions/mentionPrefetchByType.ts:18-19]. Both intents survive: `ScreensDuplicateBtn` and `BreadcrumbListEntry` list the six types as grouped case labels sharing one body (narrowing through grouped cases verified [spec-writer_4]); `mentionPrefetchByType` keeps its full `Record<MentionEntityType, …>` with the six base entries built by one factory; `MentionPopupContent` dispatches base types through `isBaseEntityType` and keys its remaining map by `Exclude<MentionEntityType, BaseEntityType>`.

### Service file is singular: `baseEntityService.ts`

`app/services/CLAUDE.md` gives singular service file names (`adventureService.ts`, `sessionService.ts`), while the domain scaffold prescribed plural names for entity services [spec-writer_20: app/services/CLAUDE.md:8; app/docs/_product/domain-scaffold.md:35]. The instruction file wins over the reference document; SF7 corrects the scaffold.

### Error factories take the entity type and use one `BaseEntity*` name per operation

`domain/base-entities/errors.ts` defines one factory per operation, each taking `entityType` first so the message keeps the per-type label. Nothing in the app narrows errors by the per-type names being removed [spec-writer_14: grep `(Npc|Pc|Foe|Faction|Location|Item)(NotFound|Load|Create|Update|Delete|Duplicate)Error|\.name === '` app/ excluding the six domain directories — found only device, updater, sync, and `item.name` checks]. `deleteNpc`'s optional second parameter (a pre-fetched row) has no caller that passes it [spec-writer_15: grep `delete(Npc|Pc|Foe|Faction|Location|Item)\(` app/ — found only single-argument calls], so `deleteBaseEntity` drops it.

## CLAUDE.md impact

- `app/CLAUDE.md` — Domain Glossary describes itself as "grounded in the actual database schema (`db/*/schema.ts`)" and its Image row says images are referenced "across Adventures, NPCs, PCs, Foes, Factions, Locations, and Items" [spec-writer_25: app/CLAUDE.md:79,86-93]. After this spec, NPCs, PCs, Foes, Factions, Locations, and Items are rows of `base_entities` (`db/base-entity/schema.ts`) distinguished by `entity_type`, no `db/npc/schema.ts`-style file exists for them, and no glossary row defines "Base entity" as the building-block subset of entity types rather than a supertype — a reader grounding vocabulary in the schema files finds no schema for six of the glossary's terms.
- `app/db/CLAUDE.md` — the Naming consistency example (`npcs.name`), both INSERT Best Practice examples (`INSERT INTO npcs …`), and the Duplication section's reference (`db/npc/duplicate.ts`, `buildDuplicateQuery('npcs', …)`) name a table and a path this spec removes [spec-writer_26: app/db/CLAUDE.md:36,83,89,112,114]; a reader following the Duplication reference finds no file.
- `app/db/CLAUDE.md` — Migrations' frozen-copy rule names "a shared registry, a shared helper function, or any other value that can change" and cites registry and trigger-helper precedents, but never names a schema module's `createTableSQL` as a live source; two applied migrations imported live schema modules until SF1 froze them [spec-writer_13; spec-writer_27: app/db/_migrations/1786186021664_add_encounters.ts:2,22 — as of 0e51e922]. A future migration author reading only the rule's named examples can repeat the live-import form.
- `app/db/CLAUDE.md` — Default Placement Hierarchy and `app/domain/CLAUDE.md` — What Belongs Here both claim a constant `Record<BaseEntityType, string>` of rich-text summary templates; this spec places it in `db/base-entity/create.ts` under the db rule, and neither file states which rule governs a column default keyed by a domain type [spec-writer_18].
- `app/services/CLAUDE.md` — Conventions' owning-service example (`npcsService.removeNpcImage(npcId)`) names a service this spec removes, and the file gives only singular example file names with no explicit naming rule while the long-living scaffold prescribed plural names until SF7 [spec-writer_20; spec-writer_28: app/services/CLAUDE.md:23-25].
- `app/src/CLAUDE.md` — Barrel Files examples cite `data-access-layer/npcs/index.ts`, `export { useNpcs, useNpc } from './npcs'`, and `npcKeys` [spec-writer_29: app/src/CLAUDE.md:39-42]; the module and every named symbol are removed, so the examples illustrate the barrel rule with code that no longer exists.
- `.claude/rules/src-data-access-layer.md` — Query keys and Non-negotiable rules examples name `data-access-layer/domainA/index.ts` exporting `useNpc`/`useNpcs`, `npcKeys`, `useDeleteNpc`, `deleteNpc`, `updateNpc`, and `createNpc` [spec-writer_30: .claude/rules/src-data-access-layer.md:11-14,27-37]; after this spec the shared hooks are `useBaseEntity`/`useBaseEntities` with `baseEntityKeys`, so the non-illustrative examples point at no current code.
- `.claude/rules/src-components.md` — Controlled inputs example (`npc?.name`, `updateNpc`) and `.claude/rules/src-react-hooks.md`'s matching carve-out (`npc?.name`) use identifiers this spec removes [spec-writer_31: .claude/rules/src-components.md:107-108; .claude/rules/src-react-hooks.md:33].
- `app/src/CLAUDE.md` — Structure states route files "own data resolution via a `loader`" and no convention covers a route file supplying a static prop to a shared screen through an inline `component` arrow, which SF6 introduces for twelve route files [spec-writer_32: app/src/CLAUDE.md:17]; a future reader adding a route has no stated rule for when that form is correct.
