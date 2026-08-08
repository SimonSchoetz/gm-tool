# Spec: Encounters Domain

A new adventure-scoped domain entity `Encounter` (plural `Encounters`), following the standard domain shape described in `app/docs/_product/domain-scaffold.md`, with three deliberate reductions: no `summary` column, no `image_id` column, and a deliberately minimal detail screen intended as the base for a future encounter-specific screen.

## Progress tracker

- Sub-feature 1: DB layer — `encounters` table, CRUD, migration, sync registration
- Sub-feature 2: Domain errors — `domain/encounters/` error factories
- Sub-feature 3: Service layer — `encountersService.ts`
- Sub-feature 4: Data access layer — `data-access-layer/encounters/`
- Sub-feature 5: Routes and screens — list screen, minimal detail screen
- Sub-feature 6: Entity-type registration and ambient systems [FOUNDATION]

Sub-feature files:

- [SF1 — DB layer](SPEC_ENCOUNTERS_SF1.md)
- [SF2 — Domain errors](SPEC_ENCOUNTERS_SF2.md)
- [SF3 — Service layer](SPEC_ENCOUNTERS_SF3.md)
- [SF4 — Data access layer](SPEC_ENCOUNTERS_SF4.md)
- [SF5 — Routes and screens](SPEC_ENCOUNTERS_SF5.md)
- [SF6 — Entity-type registration and ambient systems](SPEC_ENCOUNTERS_SF6.md)

## Key Architectural Decisions

### Encounter carries neither `summary` nor `image_id`

The `encounters` table is the base-schema column set minus `summary` and minus `image_id`: `id`, `adventure_id`, `name`, `description`, `pinned_order`, `created_at`, `updated_at`. Every consequence of those two absences is structural rather than cosmetic and propagates through all six sub-features: `create.ts` writes no rich-text template, the service layer never imports `imageService`, there is no `removeEncounterImage` operation anywhere in the service or DAL layer, `duplicate` takes no image argument, the table-config layout declares no `image_id` avatar column, and the detail screen has no `UploadImgBtn`. Any sub-feature that appears to omit an image or summary step relative to a named reference file is doing so on this basis.

### `zodSchema` fields use `.nullable()`, never `.optional()`

`app/db/CLAUDE.md` bans `.optional()` on any `zodSchema` field and states the ban "applies unconditionally to new columns". Every existing domain schema — including `db/foe/schema.ts`, the closest structural reference for this domain — predates that rule and is explicitly grandfathered, so its `name: z.string().optional()` form must not be copied. `encounters` declares `name` and `description` as `z.string().nullable()`. The derived `Encounter` type therefore has `name: string | null` and `description: string | null` rather than the `string | undefined` shape the other domains produce, which changes the test fixtures in SF1 (every fixture object must carry an explicit `description: null` key) but nothing else: `?? ''` at the UI boundary and `?? null` inside `buildDuplicateQuery` both already handle `null`.

### Duplication carries no image argument

`db/encounter/duplicate.ts` has the signature `duplicate(sourceId: string): Promise<string>` — one parameter, not the two-parameter `(sourceId, imageId)` form used by every image-bearing domain. `db/session/duplicate.ts` is the shape reference: it is the only existing domain whose duplicate takes a single argument, because sessions likewise have no `image_id`. `services/encountersService.ts`'s `duplicateEncounter` correspondingly performs no `imageService.duplicateImage` step and calls `encounterDb.duplicate(id)` directly.

### The domain's own migration owns table creation, sync triggers, and the table-config row

`app/docs/_product/domain-scaffold.md` names `db/table-config/seed.ts` as the place to register a new domain's table config. That file does not exist [spec-writer_1: `app/db/table-config/` — contains `create.ts`, `get.ts`, `get-all.ts`, `index.ts`, `layout-schema.ts`, `parse-layout-row.ts`, `schema.ts`, `types.ts`, `update.ts`; no `seed.ts`], and `app/db/CLAUDE.md` — Seeds states that initial data rows belong in the migration that creates the table and that "the `seedTableConfig` pattern is legacy. Do not replicate it for new tables." A single new migration therefore performs three writes: `CREATE TABLE`, the three `_sync_changes` triggers, and the `table_config` row insert.

### The new migration holds a frozen local copy of the sync trigger SQL

`db/_migrations/1784365870026_add_sync_infrastructure.ts` builds its triggers from a module-private `buildTriggerSQL` helper and carries its own frozen copy of the synced-table name list, with an inline comment stating that a migration must never import the live registry because future migrations will extend it. The same reasoning governs the trigger SQL itself: a migration is a frozen historical artifact, and a shared helper would let a later edit retroactively change the behavior of an already-applied migration. The `encounters` migration therefore writes its three `CREATE TRIGGER IF NOT EXISTS` statements as literal SQL rather than importing or re-exporting the existing builder. This is a deliberate, precedent-backed exception to root CLAUDE.md's duplicate-expression extraction rule, not an oversight.

### Sync registration is a required step the scaffold does not describe

Beyond the migration's triggers, `db/_sync/registry.ts` must gain an `encounters` entry so that `getChangesSince` and the upsert/delete apply paths know the table's column set, and `db/_sync/__tests__/registry.test.ts` asserts an exact synced-table count that goes stale the moment the registry grows. Neither is mentioned in `app/docs/_product/domain-scaffold.md`; both are mandatory for a new adventure-scoped table.

### `src/routeTree.gen.ts` is regenerated by the frontend build, not hand-edited

The scaffold instructs the implementer to hand-add route entries to the generated route tree so `tsc` passes before the dev server has run. That is unnecessary: `@tanstack/router-plugin` is registered in `app/vite.config.ts` and rewrites `src/routeTree.gen.ts` during a plain Vite build [spec-writer_2: ran `npx vite build` from `app/` with a scratch route file present — `src/routeTree.gen.ts` gained 13 occurrences of the scratch route id; after deleting the scratch file and re-running, 0 remained]. SF5 therefore instructs a single `npm run build:frontend` run after the route files are created. The regenerated file is gitignored (`app/.gitignore:30`) and is not committed.

### SF6 is the Foundation SF: entity-type registration breaks exactly three files

Adding `'encounters'` to `ENTITY_TYPES` produces exactly three `tsc` errors, all fixed inside SF6 [spec-writer_3: ran `npx tsc --noEmit` from `app/` with `'encounters'` appended to `ENTITY_TYPES` — `domain/entities/buildEntityPath.ts(4,7)` TS2741 missing property on `ENTITY_SEGMENT`, `domain/entities/entityTypeLabels.ts(3,7)` TS2741 missing property on `ENTITY_TYPE_LABELS`, `src/components/Header/components/BreadcrumbList/components/BreadcrumbListEntry.tsx(59,37)` TS2454 `crumb` used before being assigned]. `ScreensDuplicateBtn.tsx`'s and `MentionPopupContent.tsx`'s switches produce no error and no ESLint finding under the same change [spec-writer_4: ran `npx eslint` on both files with the same edit in place — exit 0]; their non-exhaustive switches silently render nothing for the new type, which is a functional gap SF6 closes rather than a check failure. In the reverse direction, SF5's `EncounterSidebar` passes `entityType='encounters'` to `ScreensDuplicateBtn`, whose prop is typed `EntityType` — so SF5 does not type-check until SF6 registers the type. SF6 is annotated `[FOUNDATION: SF5 depends on this]` and the two are staged and committed as one unit.

### The detail screen uses SessionScreen's stacked layout, not the shared text-editor layout

Every other detail screen composes `ScreensTextEditorLayout`, which places the sidebar to the left of a scroll area containing a summary header above a body. Encounter has no summary, and its screen is explicitly a minimal base for a future encounter-specific screen, so it follows `SessionScreen`'s arrangement instead: a `GlassPanel` column holding a header row above a two-column body grid of sidebar plus content. Header content is the name input alone; body content is the description editor alone; the sidebar holds only the duplicate and delete controls.

### The mention popup renders `description` in the body slot

`EntityPopupBody` exposes a `summary: string | null` prop that renders a read-only `TextEditor`. Encounter has no `summary` column, so `EncounterPopupContent` passes `description` into that slot and `imageId={null}`. The prop name describes the popup's rich-text preview slot, not a required source column — passing `null` instead would render an empty popup body for the only rich-text content an encounter has.

### `EncountersScreen` gets no companion CSS file

The scaffold prescribes an empty `[Plural]Screen.css`. `app/src/CLAUDE.md` — Styles states a component has a `.css` file "only when it owns styles of its own" and forbids creating an empty placeholder speculatively. `EncountersScreen` renders only `SortableList` and a loading wrapper, so no CSS file is created and no CSS import is written.

## CLAUDE.md impact

`app/docs/_product/domain-scaffold.md` is corrected directly during implementation, as concrete `Modified:` entries in SF1 and SF5 — it is not a CLAUDE.md file and has no other pathway to be updated. The corrections are enumerated in those sub-features.

For CLAUDE.md files proper: None.
