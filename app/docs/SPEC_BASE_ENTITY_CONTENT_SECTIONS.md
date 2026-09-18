# Spec: Base Entity Content Sections

Base entities (NPCs, PCs, Foes, Factions, Locations, Items) stop storing their summary in `base_entities.summary`. Each summary becomes one row of a new ordered, typed child table, `base_entity_content_sections`, which later work will use to let the user add and arrange multiple sections per entity (like session steps on a session). This spec builds the table with its full create/read/update/delete/reorder stack, migrates every existing summary into it, drops `base_entities.summary`, and rewires the base entity screen and the mention popup to read the summary from the new table. The visible UI does not change.

## Progress tracker

- Sub-feature 1: Content section data model — domain vocabulary, `db/base-entity-content-section/` module, sync registration
- Sub-feature 2: Content section service and data access — `baseEntityContentSectionService` and the `useBaseEntityContentSections` hook
- Sub-feature 3: Summary cutover — migration that moves summaries and drops the column, base-entity cleanup, duplication, screen and popup rewiring

## Files

- [SF1 — Content section data model](SPEC_BASE_ENTITY_CONTENT_SECTIONS_SF1.md)
- [SF2 — Content section service and data access](SPEC_BASE_ENTITY_CONTENT_SECTIONS_SF2.md)
- [SF3 — Summary cutover](SPEC_BASE_ENTITY_CONTENT_SECTIONS_SF3.md)

## Key Architectural Decisions

### Content sections are a base-entity-scoped child table, not a shared concept

`base_entity_content_sections` has a real foreign key `base_entity_id → base_entities(id) ON DELETE CASCADE`. Sessions keep their own `sessions.summary` column; nothing about sessions or encounters changes. A polymorphic owner column would lose the foreign key and the cascade.

### The foreign key column is `base_entity_id`

Every child table in this schema names its foreign key after the parent table in singular form (`session_steps.session_id → sessions`, `base_entities.adventure_id → adventures`). The parent is `base_entities`, so the column is `base_entity_id`. `entity_id` would also blur the distinction between base entities and the broader entity-type vocabulary in `domain/entities/`.

### Column set and nullability

Columns: `id`, `base_entity_id`, `name`, `type`, `content`, `checked`, `sort_order`, `created_at`, `updated_at` — no others (`app/db/CLAUDE.md` — No unrequested schema columns). `name` and `content` are user-editable text, so they are nullable in SQL and `.nullable()` in the Zod schema (`app/db/CLAUDE.md` — User-editable text columns are nullable). `type`, `sort_order`, and `base_entity_id` are set programmatically and are `NOT NULL`. `checked` means what it means on `session_steps`: `INTEGER NOT NULL DEFAULT 0`, stored and updatable, with no UI reading or writing it in this spec. No `zodSchema` field carries `.optional()` (`app/db/CLAUDE.md` — No `zodSchema` field carries `.optional()`).

### Section types are a closed domain vocabulary

`BASE_ENTITY_CONTENT_SECTION_TYPES = ['text', '5e-stat-block'] as const` lives in `domain/base-entity-content-sections/contentSectionTypes.ts`, with `BaseEntityContentSectionType` derived from it, mirroring `BASE_ENTITY_TYPES` in `domain/entities/entityTypes.ts`. The `type` column's Zod schema is `z.enum(BASE_ENTITY_CONTENT_SECTION_TYPES)`, so `update` rejects any other string. The strings are persisted and synced to paired devices; renaming one later requires a data migration. Only `'text'` has a renderer in this spec; `'5e-stat-block'` rows can be created through the API but nothing renders them yet.

### Full CRUD surface ahead of its UI

The db, service, and data-access layers expose create, read-all, update, delete, and bulk reorder now, although only read-all and update have a UI caller after SF3. The add/arrange-sections UI is the immediately following feature and builds on this surface. The service functions and hook return fields `createSection`, `deleteSection`, and `bulkReorder` are therefore intentionally unconsumed by any screen when this spec lands — they are not dead code to remove. Reordering is exposed only as bulk reorder (one call covers both drag-and-drop and up/down moves); there is no swap-with-neighbour operation. There is no single-row `get` in the db module: no layer needs one.

### New base entities get no content section

`db/base-entity/create.ts` no longer writes a summary and `SUMMARY_TEMPLATES` is deleted; `createBaseEntity` creates no content section. The per-type summary templates (e.g. "Pronouns | Ancestry | Age") are removed deliberately — the upcoming add-section UI replaces them.

### The summary is the first `text` section; no text section hides the summary panel

`useBaseEntityContentSections` exposes `summarySection`: the first section in the (already `sort_order`-ascending) list whose `type` is `'text'`, or `null`. The derivation lives in the hook so the base entity screen and the mention popup share one definition. When `summarySection` is `null`, `BaseEntityScreen` passes `header={null}` to `ScreensTextEditorLayout` (whose `header` prop is typed `JSX.Element | null`) and the summary panel is not rendered; the mention popup passes `summary={null}` to `EntityPopupBody`, which already omits its summary block for `null`. Two paths exist and each has its own verification item: a base entity with a text section (migrated entity) renders the summary editor unchanged; a base entity with none (every newly created entity) renders no summary panel.

### Migrated sections reuse the base entity's id as their own id

Each device runs the migration independently against its own database. If each device generated a fresh nanoid per migrated section, two paired devices would hold two different section rows for the same summary and sync would deliver each device's copy to the other, doubling every summary. The copy therefore inserts `id = base_entities.id`, `base_entity_id = base_entities.id`, `name = 'Summary'`, `type = 'text'`, `content = summary`, `sort_order = 0`, and the base entity's own `created_at`/`updated_at`, so every device produces an identical row and sync converges on one. The ids cannot collide: they are primary keys of a different table, and `_sync_changes` ids are prefixed with the table name. The same determinism makes the insert idempotent through `ON CONFLICT(id) DO NOTHING` (`app/db/CLAUDE.md` — Migrations: row inserts keyed on a real unique column, never a freshly generated `id`). Only rows with a non-`NULL` summary are copied; an entity whose summary is `NULL` gets no section and shows no summary panel.

### Migration order and resumability

The migration runs, in order: (1) `CREATE TABLE IF NOT EXISTS base_entity_content_sections`; (2) its three sync triggers (`CREATE TRIGGER IF NOT EXISTS`), created before any row is inserted so every copied row gets a `_sync_changes` record; (3) a `PRAGMA table_info(base_entities)` read deciding whether `summary` still exists; (4) only when it exists: the summary copy, then `ALTER TABLE base_entities DROP COLUMN summary`; (5) unconditionally: removal of `'summary'` from the `searchable_columns` of the six base-entity `table_config` rows, rewriting only rows that still list it. `DROP COLUMN` has no `IF EXISTS` form, so the PRAGMA check is what makes a resumed run safe; the copy runs before the drop so a failure between them leaves the data recoverable on resume. SQLite supports `DROP COLUMN` since 3.35.0 and this app bundles 3.46.0; the drop succeeds because `summary` is not indexed, not a key, and not referenced by the `base_entities` sync triggers (which reference only `id`) — see `.claude/knowledge/sqlite.md`, headings "ALTER TABLE DROP COLUMN exists since SQLite 3.35.0…" and "This app's SQLite engine is the 3.46.0 amalgamation…". The migration file needs a test (`app/db/CLAUDE.md` — Testing): it drops a column, rewrites stored layouts, and branches on existing schema state.

### List search no longer matches summary text

`table_config.layout.searchable_columns` for `npcs`, `pcs`, `foes`, `factions`, `locations`, `items` currently lists `'summary'`. `allTermsMatchItem` skips a key the row lacks, so nothing crashes once the column is gone, but a stale entry would name a column that no longer exists. The migration removes it. Searching a base entity list by summary text stops matching; searching section content belongs to the add-sections feature. The layout rewrite does not bump `table_config.updated_at`: every device's migration writes the identical layout, and an unchanged `updated_at` keeps the synced copies from competing.

### Sync registration

`base_entity_content_sections` is added to `SYNCED_TABLES` in `db/_sync/registry.ts` directly after `base_entities` (parents before children). A base entity delete cascades to its sections without firing the sections' delete trigger (`.claude/knowledge/sqlite.md` — "Foreign key ON DELETE CASCADE does not fire the child table's DELETE triggers"), so no section tombstones are recorded; each peer removes the sections through its own cascade when it applies the `base_entities` delete — the same arrangement `session_steps` already relies on. Peers on different migration heads do not sync at all (`services/syncService.ts` compares `migrationHead`), so a device on the old schema never exchanges rows with one on the new schema.

### Duplicating a base entity duplicates its sections

Today `db/base-entity/duplicate.ts` copies `summary` implicitly through its exclusion-based `copiedColumns`. Once the column is gone that copy disappears, so `baseEntityService.duplicateBaseEntity` calls the new `duplicateByBaseEntity(sourceId, newId)` after the entity row is duplicated, mirroring `sessionService.duplicateSession` → `sessionStepDb.duplicateBySession`. Section `name`, `type`, `content`, `checked`, and `sort_order` are copied; ids and timestamps are fresh. No extra cache invalidation is needed on duplicate: the new entity's sections list was never fetched (`.claude/rules/src-data-access-layer.md` — a duplicate mutation invalidates only the list query key).

### Mention prefetch covers the sections query

`mentionPrefetchByType`'s base entity prefetch currently ensures the entity detail and paints its image before the popup opens. Since the popup's summary now comes from the sections query, the prefetch also ensures `baseEntityContentSectionListQueryOptions(entityId)`, so a hover-prefetched popup still renders its summary without a loading gap.

## CLAUDE.md impact

- `app/domain/CLAUDE.md` — What Belongs Here cites `db/base-entity/create.ts`'s `SUMMARY_TEMPLATES: Record<BaseEntityType, string>` as the DB-side precedent for the Default Placement Hierarchy exception. SF3 deletes that constant, so the cited precedent no longer exists and the exception has no concrete example left [spec-writer_4: grep SUMMARY_TEMPLATES app/domain/CLAUDE.md — found].
- `app/CLAUDE.md` — Domain Glossary has no row for base entity content sections, the ordered, typed child rows of a base entity (`db/base-entity-content-section/schema.ts`, types `'text'` and `'5e-stat-block'`) that now hold a base entity's summary [spec-writer_5: grep "content section" app/CLAUDE.md — not found].
- `app/src/CLAUDE.md` — Testing Policy and `.claude/rules/src-unit-tests.md` require unit tests only under `ComponentName/helper/` and `/src/util/`, and no instruction file requires tests for `app/services/`. Consequently `baseEntityContentSectionService.createSection`'s append-at-max-`sort_order` branch and `useBaseEntityContentSections`'s `summarySection` selection (first `'text'` section or `null`) have no owning test obligation; the same gap already covers `sessionStepService.createCustomStep` [spec-writer_6: ls app/services — no `__tests__` directory found].
