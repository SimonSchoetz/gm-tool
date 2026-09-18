# SF3 — Summary cutover

Create the table through a migration that moves every existing summary into a `'text'` section, drops `base_entities.summary`, and removes `'summary'` from the base-entity list search configuration. Remove the summary from the base-entity db module, duplicate sections along with their entity, and switch the base entity screen, the mention popup, and the mention prefetch to the SF2 hook. The UI stays the same for every entity that has a summary. An entity without one (every newly created entity) shows no summary panel.

## Files affected

- `New:` `app/db/_migrations/<timestamp>_add_base_entity_content_sections.ts` — `<timestamp>` is `Date.now()` at file-creation time (`app/db/CLAUDE.md` — Migrations); the same value is the migration's `id`
- `New:` `app/db/_migrations/__tests__/<timestamp>_add_base_entity_content_sections.test.ts`
- `Modified:` `app/db/_migrations/index.ts` — import and append the new migration
- `Modified:` `app/db/base-entity/schema.ts` — remove the `summary` column
- `Modified:` `app/db/base-entity/create.ts` — remove `SUMMARY_TEMPLATES` and the `summary` field
- `Modified:` `app/db/base-entity/__tests__/create.test.ts` — drop the summary value and the template test (details below)
- `Modified:` `app/db/base-entity/__tests__/get.test.ts` — remove `summary: null` from the `mockRow` fixture
- `Modified:` `app/db/base-entity/__tests__/get-all.test.ts` — remove `summary: null` from the `row1` and `row2` fixtures
- `Modified:` `app/db/base-entity/__tests__/duplicate.test.ts` — remove `summary` from the source row, the SQL, and every expected value list
- `Modified:` `app/db/base-entity/__tests__/update.test.ts` — the multi-field test uses `description` instead of `summary`
- `Modified:` `app/services/baseEntityService.ts` — duplicate sections in `duplicateBaseEntity`
- `Modified:` `app/src/data-access-layer/mentions/mentionPrefetchByType.ts` — prefetch the sections list
- `Modified:` `app/src/screens/base-entity/BaseEntityScreen.tsx` — summary editor reads and writes the summary section
- `Modified:` `app/src/components/MentionPopup/components/MentionPopupContent/components/BaseEntityPopupContent/BaseEntityPopupContent.tsx` — summary from the summary section
- `Modified:` `app/docs/_product/domain-scaffold.md` — remove the summary column, templates, and searchable-column entry, and describe content sections

## 2. Database

### Migration `db/_migrations/<timestamp>_add_base_entity_content_sections.ts`

Exports `addBaseEntityContentSectionsMigration = { id: '<timestamp>', up }`. Every literal below is a frozen local copy, per `app/db/CLAUDE.md` — Migrations (migration-file duplication is required). Each frozen constant carries an inline comment naming what it freezes, where the live equivalent lives, and why. Use the comment on `CREATE_ENCOUNTERS_SQL` in `1786186021664_add_encounters.ts` as the model.

Frozen constants:

- `CREATE_BASE_ENTITY_CONTENT_SECTIONS_SQL`: the exact text `defineTable` generates for SF1's `db/base-entity-content-section/schema.ts`:

  ```sql
    CREATE TABLE IF NOT EXISTS base_entity_content_sections (
      id TEXT PRIMARY KEY,
      base_entity_id TEXT NOT NULL,
      name TEXT,
      type TEXT NOT NULL,
      content TEXT,
      checked INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (base_entity_id) REFERENCES base_entities(id) ON DELETE CASCADE
    )
  ```

- Three sync triggers. Copy them from the three `CREATE TRIGGER` statements in `1786186021664_add_encounters.ts`, replacing every `encounters` (table name, `'encounters:'` id prefix, `'encounters'` table_name value) with `base_entity_content_sections`. The triggers are named `trg_sync_base_entity_content_sections_insert`, `_update` and `_delete`. Carry over that file's frozen-trigger comment.
- `BASE_ENTITY_TABLE_NAMES = ['npcs', 'foes', 'pcs', 'factions', 'locations', 'items']`: a frozen copy of `BASE_ENTITY_TYPES` (`domain/entities/entityTypes.ts`). These are the `table_config.table_name` values of the base-entity lists.
- `frozenTableLayoutSchema`: a frozen copy of `db/table-config/layout-schema.ts`'s `tableLayoutSchema`, including its inner `layoutColumnSchema` and `persistedSortStateSchema` shapes, built with `import { z } from 'zod'`.

`up(db)` runs these statements in this order (KAD "Migration order and resumability"):

1. `db.execute(CREATE_BASE_ENTITY_CONTENT_SECTIONS_SQL)`.
2. The three trigger `db.execute` calls: insert, then update, then delete.
3. `const baseEntityColumns = await db.select<{ name: string }[]>('PRAGMA table_info(base_entities)')`. Then `const summaryColumnExists = baseEntityColumns.some((column) => column.name === 'summary')`.
4. Only when `summaryColumnExists`, run two statements:
   - `db.execute(COPY_SUMMARIES_SQL)`, with no bound values, where `COPY_SUMMARIES_SQL` is `INSERT INTO base_entity_content_sections (id, base_entity_id, name, type, content, sort_order, created_at, updated_at) SELECT id, id, 'Summary', 'text', summary, 0, created_at, updated_at FROM base_entities WHERE summary IS NOT NULL ON CONFLICT(id) DO NOTHING`.
   - Then `db.execute('ALTER TABLE base_entities DROP COLUMN summary')`.
5. `const configRows = await db.select<{ id: string; layout: string }[]>('SELECT id, layout FROM table_config WHERE table_name IN ($1, $2, $3, $4, $5, $6)', [...BASE_ENTITY_TABLE_NAMES])`.
6. For each row:
   - Parse with `const layout = frozenTableLayoutSchema.parse(JSON.parse(row.layout))`.
   - If `layout.searchable_columns` does not include `'summary'`, skip the row.
   - Otherwise run `db.execute('UPDATE table_config SET layout = $1 WHERE id = $2', [JSON.stringify({ ...layout, searchable_columns: layout.searchable_columns.filter((column) => column !== 'summary') }), row.id])`. `updated_at` is deliberately not written (KAD "List search no longer matches summary text").

Required inline code comments. Each names only code constructs:

- **Above step 2:** the triggers are created before any row is inserted, so every copied section gets a `_sync_changes` record.
- **Above step 3:** the `PRAGMA table_info` check replaces the `IF EXISTS` that `DROP COLUMN` lacks. It lets a resumed run skip the copy and the drop once the column is gone, and it keeps the copy ahead of the drop.
- **Above `COPY_SUMMARIES_SQL`:** the section `id` reuses the base entity `id`, so every device's migration produces the same row and sync merges it instead of duplicating it. The same key makes `ON CONFLICT(id) DO NOTHING` idempotent. The copy also keeps the entity's timestamps for the same reason.
- **Above the `UPDATE table_config`:** `updated_at` is left unchanged because every device writes the identical layout.

The `WHERE summary IS NOT NULL` clause also satisfies SQLite's rule that an `INSERT … SELECT` carrying an upsert clause must include a `WHERE` (`.claude/knowledge/sqlite.md`).

### `db/_migrations/index.ts`

Import `addBaseEntityContentSectionsMigration` from `'./<timestamp>_add_base_entity_content_sections'`, after the `addBaseEntitiesMigration` import. Append it to `migrations` after `addBaseEntitiesMigration`. `migrationHead` then resolves to the new id automatically.

### Migration test `db/_migrations/__tests__/<timestamp>_add_base_entity_content_sections.test.ts`

Use the scaffold of `1789304154994_add_base_entities.test.ts`: a `mockDb` object cast to `Parameters<typeof addBaseEntityContentSectionsMigration.up>[0]`, `vi.clearAllMocks()` and `mockExecute.mockResolvedValue({})` in `beforeEach`, and no `plugin-sql` module mock (the migration receives `db` as an argument).

`mockSelect` gets a `mockImplementation` that branches on the SQL text. `'PRAGMA table_info(base_entities)'` resolves to `[{ name: 'id' }, { name: 'summary' }]`, unless the test overrides it. The `table_config` query resolves to the test's rows.

Local constants:

- `COPY_SUMMARIES_SQL` (the exact string above)
- `DROP_SQL = 'ALTER TABLE base_entities DROP COLUMN summary'`
- `CONFIG_SELECT_SQL` (the step-5 string)
- `CONFIG_UPDATE_SQL = 'UPDATE table_config SET layout = $1 WHERE id = $2'`
- `layoutWith(searchableColumns: string[])`, returning a full valid layout object with keys in the order `searchable_columns`, `columns`, `sort_state`: one column `{ key: 'name', label: 'Name', width: 250 }` and `sort_state: { column: 'updated_at', direction: 'desc' }`. The key order must match `frozenTableLayoutSchema`'s field order, because the migration serializes the parsed object and the test compares `JSON.stringify` strings.

Tests, one per path:

- `creates base_entity_content_sections and its three sync triggers before copying any summary` — `calls[0][0]` contains `'CREATE TABLE IF NOT EXISTS base_entity_content_sections'`. `calls[1..3][0]` contain the `_insert`, `_update` and `_delete` trigger names in that order. The index of the `COPY_SUMMARIES_SQL` call is greater than 3.
- `copies every non-null summary into a text section keyed by the base entity id` — `expect(mockExecute).toHaveBeenCalledWith(COPY_SUMMARIES_SQL)`.
- `drops the summary column after copying` — `expect(mockExecute).toHaveBeenCalledWith(DROP_SQL)`. The `DROP_SQL` call index is greater than the `COPY_SUMMARIES_SQL` call index.
- `skips the copy and the drop when base_entities no longer has a summary column` — PRAGMA resolves to `[{ name: 'id' }, { name: 'name' }]`. Neither `COPY_SUMMARIES_SQL` nor `DROP_SQL` is executed. `mockSelect` was still called with `CONFIG_SELECT_SQL`.
- `reads the table_config rows of exactly the six base entity tables` — `expect(mockSelect).toHaveBeenCalledWith(CONFIG_SELECT_SQL, ['npcs', 'foes', 'pcs', 'factions', 'locations', 'items'])`.
- `removes summary from the searchable_columns of a table_config row that still lists it` — rows `[{ id: 'config-npcs', layout: JSON.stringify(layoutWith(['name', 'summary', 'description'])) }]`. Expect `toHaveBeenCalledWith(CONFIG_UPDATE_SQL, [JSON.stringify(layoutWith(['name', 'description'])), 'config-npcs'])`.
- `leaves a table_config row untouched when its searchable_columns no longer lists summary` — rows `[{ id: 'config-foes', layout: JSON.stringify(layoutWith(['name', 'description'])) }]`. No call with `CONFIG_UPDATE_SQL`.

### `db/base-entity/schema.ts`

Remove the `summary` column entry. No other change.

### `db/base-entity/create.ts`

- Delete the `SUMMARY_TEMPLATES` constant.
- Remove `summary: string;` from the `buildCreateQuery` type argument.
- Remove `summary: SUMMARY_TEMPLATES[entityType],` from the object literal.

`entityTypeLabel` and `BaseEntityType` remain in use, for the default name and the parameter type. No content section is created (KAD "New base entities get no content section").

### `db/base-entity/duplicate.ts` — no change

It copies columns by exclusion, so removing `summary` from the schema removes it from the copy without an edit. Checked against `app/db/CLAUDE.md` — Duplication: it already follows the required shape.

### `db/base-entity/index.ts` and `db/base-entity/types.ts` — no change

The barrel already uses explicit named exports. `BaseEntity` and `UpdateBaseEntityInput` derive from the schema and lose `summary` automatically.

### Test updates in `db/base-entity/__tests__/`

- **`create.test.ts`**
  - Rename `'should set adventure_id, entity_type, default name, summary, and ISO timestamps'` to `'should set adventure_id, entity_type, default name, and ISO timestamps'`.
  - Remove `expect.stringContaining('"type":"root"')` from its expected values. The expected list becomes `['test-generated-id', 'adventure-123', 'npcs', expect.stringMatching(/^New NPC /), '2024-01-15T10:30:00.000Z', '2024-01-15T10:30:00.000Z']`.
  - Delete the `'should write the factions summary template'` test.
- **`get.test.ts` and `get-all.test.ts`** — delete the `summary: null,` line from each `BaseEntity` fixture. Without it the typed fixtures fail `tsc`: `summary` is no longer a property of `BaseEntity`.
- **`duplicate.test.ts`**
  - Delete `summary: 'a dwarf merchant',` from `sourceRow`.
  - `INSERT_SQL` becomes `'INSERT INTO base_entities (id, adventure_id, entity_type, description, image_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)'`.
  - Remove the `'a dwarf merchant'` element from the three expected value lists: `'copies every other source column'`, `'writes a null image id when passed null'` and `'generates a fresh id and timestamps'`.
- **`update.test.ts`**
  - In `'should update multiple fields'`, call `update('test-id', { name: 'New Name', description: 'New description' })`.
  - Expect `'UPDATE base_entities SET name = $1, description = $2, updated_at = $3 WHERE id = $4'` with `['New Name', 'New description', '2024-01-15T10:30:00.000Z', 'test-id']`.

## 4. Services

### `services/baseEntityService.ts`

- Add `import * as baseEntityContentSectionDb from '@db/base-entity-content-section';`.
- In `duplicateBaseEntity`:
  - Store the new id: `const newId = await baseEntityDb.duplicate(entityType, id, imageId);`.
  - Then `await baseEntityContentSectionDb.duplicateByBaseEntity(id, newId);`.
  - Then `return newId;`.
  - Keep it inside the existing `try`, so a failure still throws `baseEntityDuplicateError`.

This mirrors `sessionService.duplicateSession`'s call to `sessionStepDb.duplicateBySession` (KAD "Duplicating a base entity duplicates its sections"). `createBaseEntity` and `deleteBaseEntity` are unchanged: no section is created on create, and sections cascade on delete.

## 5. Data Access Layer

### `data-access-layer/mentions/mentionPrefetchByType.ts`

- Import `baseEntityContentSectionListQueryOptions` from `'../base-entity-content-sections'`.
- In `prefetchBaseEntity`, after the existing `ensureQueryData(baseEntityQueryOptions(entityType, entityId))`, add `await queryClient.ensureQueryData(baseEntityContentSectionListQueryOptions(entityId));`. It sits before `ensureImagePainted`.

The popup's summary then comes from a warm cache on hover (KAD "Mention prefetch covers the sections query"). The session and encounter prefetches are unchanged: they have no content sections.

## 6. Frontend

### `screens/base-entity/BaseEntityScreen.tsx`

- **Purpose:** the base entity detail screen. Its header shows the entity's summary, which now comes from the summary content section instead of `baseEntity.summary`.
- **Behavior:**
  - Call `useBaseEntityContentSections(params.baseEntityId ?? '')`, imported from `'@/data-access-layer'` next to `useBaseEntity`, and destructure `summarySection`, `updateSection` and `loading: sectionsLoading`. Place the call directly after the `useBaseEntity` call, before the loading guard's early return, because hooks must run on every render.
  - The existing loading guard becomes `if (loading || sectionsLoading || !baseEntity)`, so the loading icon covers both queries.
  - The `header` prop is `summarySection ? <ScreensSummary>…</ScreensSummary> : null`.
  - Inside it the `TextEditor` gets `value={summarySection.content ?? ''}` and `onChange={(content) => { updateSection(summarySection.id, { content }); }}`. The wrapper is a transformation, so `.claude/rules/src-components.md` allows it.
  - `summarySection` is a `const` narrowed by the ternary, and the narrowing holds inside the deferred `onChange` closure.
  - Saving goes through the hook's per-section 500 ms debounce, the same delay the old `updateBaseEntity({ summary })` path used.
  - No section is created on edit. A base entity with no text section renders no summary panel (KAD "The summary is the first `text` section; no text section hides the summary panel").
- **UI / Visual:** unchanged for an entity that has a summary section. Keep the `ScreensSummary` wrapper, the `placeholder` (`` `${label} Summary` ``) and `textEditorId` (`` `${entityType}_${baseEntity.id}_summary` ``) exactly as they are, so the editor's Lexical namespace and remount key do not change. For an entity without one, `ScreensTextEditorLayout` receives `header={null}` (its `header` prop is typed `JSX.Element | null`) and renders an empty header slot. The body (name input, description editor) is unchanged.

### `.../BaseEntityPopupContent/BaseEntityPopupContent.tsx`

- **Purpose:** the read-only hover popup for a base entity mention. It shows the image and the summary.
- **Behavior:**
  - Call `useBaseEntityContentSections(entityId)`, imported from `'@/data-access-layer'` next to `useBaseEntity`, and destructure `summarySection` and `loading: sectionsLoading`. Place the call directly after the `useBaseEntity` call, before the early exit.
  - The early exit becomes `if (loading || sectionsLoading || !baseEntity) return;`.
  - Pass `summary={summarySection?.content ?? null}`. `EntityPopupBody` already omits its summary block when `summary` is `null`, so an entity without a text section, or with a section whose content is `NULL`, shows only the image.
- **UI / Visual:** unchanged. `imageId` and `textEditorId` stay as they are.

## Long-living reference

### `app/docs/_product/domain-scaffold.md`

- **Usage** code block: delete the `- Summary template lines: …` line.
- **Shared Columns** table: delete the `summary` row.
- **Shared Columns**: add one sentence after the table. A base entity's summary lives in `base_entity_content_sections` (one `'text'` section, the first by `sort_order`), keyed by `base_entity_id`. A new base entity type needs no registration there.
- **Layer Patterns → Database**:
  - Delete the `SUMMARY_TEMPLATES` bullet.
  - In the migration example, change `searchable_columns: ['name', 'summary', 'description']` to `searchable_columns: ['name', 'description']`.
- **Detail Screen Composition**: replace "the header slot renders the summary rich-text editor inside `ScreensSummary`" with this. The header slot renders the rich-text editor for the entity's summary content section (`summarySection` from `useBaseEntityContentSections`) inside `ScreensSummary`, and passes `null` when the entity has no `'text'` section.
- **Customization Points** table: delete the `Summary template lines` row.

## Verification

`app/CLAUDE.md` notes that `pnpm run web` cannot reach the database, so these checks are a **hand-off to the human tester**, run under `pnpm run dev` against a database created before this change:

1. Open an existing NPC with a summary. The summary panel shows the same content. Edit it, navigate away and back, and the edit is still there.
2. Create a new NPC. No summary panel is shown, and the name input and description editor work.
3. Duplicate the NPC from step 1. The duplicate shows the same summary.
4. Hover a mention of the NPC from step 1 in a text editor. The popup shows its summary. A mention of the NPC from step 2 shows only its image, or nothing when it has none.
5. On the NPC list, a search term that appears only in a summary no longer matches. A term in the name or description still does.
