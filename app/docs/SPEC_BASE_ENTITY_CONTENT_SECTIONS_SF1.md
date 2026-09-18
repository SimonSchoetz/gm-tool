# SF1 — Content section data model

Introduce the domain vocabulary and the `db/base-entity-content-section/` module for the new `base_entity_content_sections` table, and register the table for sync. Purely additive: nothing outside this sub-feature consumes the new symbols yet. SF2 consumes the db module and the domain errors; SF3 creates the table through a migration.

## Files affected

- `New:` `app/domain/base-entity-content-sections/contentSectionTypes.ts`
- `New:` `app/domain/base-entity-content-sections/errors.ts`
- `New:` `app/domain/base-entity-content-sections/index.ts`
- `Modified:` `app/domain/index.ts` — add the grouping export for the new module
- `New:` `app/db/base-entity-content-section/schema.ts`
- `New:` `app/db/base-entity-content-section/types.ts`
- `New:` `app/db/base-entity-content-section/create.ts`
- `New:` `app/db/base-entity-content-section/get-all-by-base-entity.ts`
- `New:` `app/db/base-entity-content-section/update.ts`
- `New:` `app/db/base-entity-content-section/remove.ts`
- `New:` `app/db/base-entity-content-section/duplicate-by-base-entity.ts`
- `New:` `app/db/base-entity-content-section/index.ts`
- `New:` `app/db/base-entity-content-section/__tests__/create.test.ts`
- `New:` `app/db/base-entity-content-section/__tests__/get-all-by-base-entity.test.ts`
- `New:` `app/db/base-entity-content-section/__tests__/update.test.ts`
- `New:` `app/db/base-entity-content-section/__tests__/remove.test.ts`
- `New:` `app/db/base-entity-content-section/__tests__/duplicate-by-base-entity.test.ts`
- `Modified:` `app/db/_sync/registry.ts` — register the new table
- `Modified:` `app/db/_sync/__tests__/registry.test.ts` — table count and new ordering assertion

## 1. Domain

### `domain/base-entity-content-sections/contentSectionTypes.ts`

Exports `BASE_ENTITY_CONTENT_SECTION_TYPES = ['text', '5e-stat-block'] as const` and `type BaseEntityContentSectionType = (typeof BASE_ENTITY_CONTENT_SECTION_TYPES)[number]`. Same shape as the first ten lines of `domain/entities/entityTypes.ts`; no type guard (no consumer needs one).

### `domain/base-entity-content-sections/errors.ts`

Reference: `domain/session-steps/errors.ts` (compliant with `app/CLAUDE.md` — Error types use factory functions). Five factories, identical structure and parameter lists, with this substitution:

| Reference | New |
| --- | --- |
| `SessionStepLoadError` / `sessionStepLoadError` | `BaseEntityContentSectionLoadError` / `baseEntityContentSectionLoadError` |
| `SessionStepCreateError` / `sessionStepCreateError` | `BaseEntityContentSectionCreateError` / `baseEntityContentSectionCreateError` |
| `SessionStepUpdateError` / `sessionStepUpdateError` | `BaseEntityContentSectionUpdateError` / `baseEntityContentSectionUpdateError` |
| `SessionStepDeleteError` / `sessionStepDeleteError` | `BaseEntityContentSectionDeleteError` / `baseEntityContentSectionDeleteError` |
| `SessionStepReorderError` / `sessionStepReorderError` | `BaseEntityContentSectionReorderError` / `baseEntityContentSectionReorderError` |
| message `Failed to load session steps: …` | `Failed to load base entity content sections: …` |
| message `Failed to create session step: …` | `Failed to create base entity content section: …` |
| message `Failed to update session step ${id}: …` | `Failed to update base entity content section ${id}: …` |
| message `Failed to delete session step ${id}: …` | `Failed to delete base entity content section ${id}: …` |
| message `Failed to reorder session steps: …` | `Failed to reorder base entity content sections: …` |

Each factory sets `error.name` to its type's name literal.

### `domain/base-entity-content-sections/index.ts`

Module barrel with explicit named exports, in the style of `domain/session-steps/index.ts` (one `export type { … }` line and one `export { … }` line per error; `export *` is not used in module barrels): `BASE_ENTITY_CONTENT_SECTION_TYPES`, type `BaseEntityContentSectionType`, and the five error types and five factories.

### `domain/index.ts`

Add `export * from './base-entity-content-sections';` directly after `export * from './base-entities';`. `export *` is correct here: `domain/CLAUDE.md` — Imports documents both `@domain` and `@domain/<subdomain>` as sanctioned import paths, which is the dual-path exception in `app/CLAUDE.md` — Directory Structure, and every existing line in this barrel uses the same form.

## 2. Database

### `db/base-entity-content-section/schema.ts`

`export const baseEntityContentSectionTable = defineTable({ name: 'base_entity_content_sections', columns: { … } })`, importing `z` from `'zod'`, `BASE_ENTITY_CONTENT_SECTION_TYPES` from `'@domain'`, and `defineTable` from `'../util'` (same imports as `db/base-entity/schema.ts`). Columns, in this order:

| Column | `type` | Flags | `zod` |
| --- | --- | --- | --- |
| `id` | `'TEXT'` | `primaryKey: true` | `z.string()` |
| `base_entity_id` | `'TEXT'` | `notNull: true`, `foreignKey: { table: 'base_entities', column: 'id', onDelete: 'CASCADE' }` | `z.string()` |
| `name` | `'TEXT'` | — | `z.string().nullable()` |
| `type` | `'TEXT'` | `notNull: true` | `z.enum(BASE_ENTITY_CONTENT_SECTION_TYPES)` |
| `content` | `'TEXT'` | — | `z.string().nullable()` |
| `checked` | `'INTEGER'` | `notNull: true`, `default: '0'` | `z.number()` |
| `sort_order` | `'INTEGER'` | `notNull: true` | `z.number()` |
| `created_at` | `'TEXT'` | `notNull: true` | `z.string()` |
| `updated_at` | `'TEXT'` | `notNull: true` | `z.string()` |

`db/session-step/schema.ts` is structurally similar but its `name`, `content`, and `default_step_key` use `.optional()` on `zodSchema` — a grandfathered violation of `app/db/CLAUDE.md` — No `zodSchema` field carries `.optional()`. Do not copy those modifiers; use the table above.

The column order above fixes `defineTable`'s generated `createTableSQL`, which SF3's migration freezes verbatim.

### `db/base-entity-content-section/types.ts`

- `BaseEntityContentSection = z.infer<typeof baseEntityContentSectionTable.zodSchema>`
- `CreateBaseEntityContentSectionInput = { base_entity_id: string; type: BaseEntityContentSectionType; sort_order: number; name?: string }` — `BaseEntityContentSectionType` imported as a type from `'@domain'`
- `UpdateBaseEntityContentSectionInput = z.infer<typeof baseEntityContentSectionTable.updateSchema>`

Import `z` the way `db/session-step/types.ts` does (`import z from 'zod'`).

### CRUD files

Reference: the same-named `db/session-step/` files, validated against `app/db/CLAUDE.md` (the only violation found is in `schema.ts`, covered above). Substitution for all files below:

| Reference | New |
| --- | --- |
| table `session_steps` | `base_entity_content_sections` |
| `sessionStepTable` | `baseEntityContentSectionTable` |
| `SessionStep` | `BaseEntityContentSection` |
| `CreateSessionStepInput` | `CreateBaseEntityContentSectionInput` |
| `UpdateSessionStepInput` | `UpdateBaseEntityContentSectionInput` |
| parent column `session_id` | `base_entity_id` |
| `get-all-by-session.ts` / `getAllBySession(sessionId)` | `get-all-by-base-entity.ts` / `getAllByBaseEntity(baseEntityId)` |
| `duplicate-by-session.ts` / `duplicateBySession(sourceSessionId, targetSessionId)` | `duplicate-by-base-entity.ts` / `duplicateByBaseEntity(sourceBaseEntityId, targetBaseEntityId)` |

`assertValidId` entity names — normalized across the module rather than copying the reference's mixed casing: `'Base entity'` for every parent-id check (`create`'s `data.base_entity_id`, `getAllByBaseEntity`'s argument, both arguments of `duplicateByBaseEntity`) and `'Base entity content section'` for every section-id check (`update`, `remove`).

Differences from the reference that the table does not cover:

- **`create.ts`** — the `buildCreateQuery` type argument and object literal are, in this key order: `base_entity_id`, `type`, `sort_order`, `created_at`, `updated_at`, then `...(data.name !== undefined ? { name: data.name } : {})` (conditional spread is required under `exactOptionalPropertyTypes`). No `default_step_key`. `checked` is omitted so the SQL `DEFAULT 0` applies.
- **`get-all-by-base-entity.ts`** — SQL `SELECT * FROM base_entity_content_sections WHERE base_entity_id = $1 ORDER BY sort_order ASC`.
- **`duplicate-by-base-entity.ts`** — destructure away `id`, `base_entity_id`, `created_at`, `updated_at`; pass `{ base_entity_id: targetBaseEntityId }` as overrides. Its inline comment above the destructuring reads: `// name and sort_order are copied rather than reset or re-derived from array position, so each duplicated section keeps its own label and the source's exact ordering values.` Returns early when the source has no sections.
- **No `get.ts`** — no layer needs a single-section read.

### `db/base-entity-content-section/index.ts`

Explicit named exports only (`app/db/CLAUDE.md` bans `export *` in every db barrel): `create`, `duplicateByBaseEntity`, `getAllByBaseEntity`, `update`, `remove`, and types `BaseEntityContentSection`, `CreateBaseEntityContentSectionInput`, `UpdateBaseEntityContentSectionInput`. `baseEntityContentSectionTable` is not exported from the barrel: its only external consumer, `db/_sync/registry.ts`, imports it by the relative path `'../base-entity-content-section/schema'`, matching how the registry imports every other table.

### `db/_sync/registry.ts`

- Add `import { baseEntityContentSectionTable } from '../base-entity-content-section/schema';`.
- Insert `syncedTable('base_entity_content_sections', baseEntityContentSectionTable)` directly after the `base_entities` entry.
- Update the FK-order comment above `SYNCED_TABLES` to also state `base_entity_content_sections after base_entities`.

### Tests

All db test files follow `app/db/CLAUDE.md` — Testing (module-scope `vi.mock('@tauri-apps/plugin-sql', …)`, `mockSelect.mockResolvedValue([])` first in `beforeEach`, `afterEach(() => { vi.resetModules(); })`, static top-level import). Use the matching `db/session-step/__tests__/` file as the scaffold (fake timers at `2024-01-15T10:30:00.000Z`, `generateId` mocked where ids are asserted). Required assertions:

**`create.test.ts`**

- `inserts a section with base_entity_id, type, sort_order and timestamps and returns its id` — `create({ base_entity_id: 'entity-123', type: 'text', sort_order: 0 })` executes `'INSERT INTO base_entity_content_sections (id, base_entity_id, type, sort_order, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)'` with `['test-generated-id', 'entity-123', 'text', 0, '2024-01-15T10:30:00.000Z', '2024-01-15T10:30:00.000Z']`, and resolves to `'test-generated-id'`.
- `includes name when provided` — with `name: 'Summary'`, the SQL contains `name` and the values contain `'Summary'`.
- `throws when base_entity_id is empty` — rejects with `'Valid Base entity ID is required'`; `mockExecute` not called.

**`get-all-by-base-entity.test.ts`**

- `returns the sections of a base entity ordered by sort_order` — `mockSelect` returns two `BaseEntityContentSection` fixtures; asserts the select was called with `'SELECT * FROM base_entity_content_sections WHERE base_entity_id = $1 ORDER BY sort_order ASC'` and `['entity-123']`, and the result equals the fixtures. Fixtures carry every column: the first is a `'text'` section with `name: 'Summary'` and string `content`, the second a `'5e-stat-block'` section with `name: null` and `content: null`.
- `throws when baseEntityId is empty` — rejects with `'Valid Base entity ID is required'`.

**`update.test.ts`**

- `updates content` — `update('section-id', { content: 'New content' })` executes `'UPDATE base_entity_content_sections SET content = $1, updated_at = $2 WHERE id = $3'` with `['New content', '2024-01-15T10:30:00.000Z', 'section-id']`.
- `updates checked` — `{ checked: 1 }` → `'UPDATE base_entity_content_sections SET checked = $1, updated_at = $2 WHERE id = $3'`, `[1, '2024-01-15T10:30:00.000Z', 'section-id']`.
- `rejects a type outside BASE_ENTITY_CONTENT_SECTION_TYPES` — `update('section-id', { type: 'bogus' } as unknown as UpdateBaseEntityContentSectionInput)` rejects; `mockExecute` not called.
- `throws when id is empty` — rejects with `'Valid Base entity content section ID is required'`.
- `throws when no update fields are provided` — rejects with `'At least one field must be provided for update'`.

**`remove.test.ts`**

- `deletes the section by id` — executes `'DELETE FROM base_entity_content_sections WHERE id = $1'` with `['section-id']`.
- `throws when id is empty` — rejects with `'Valid Base entity content section ID is required'`.

**`duplicate-by-base-entity.test.ts`** — scaffold: `db/session-step/__tests__/duplicate-by-session.test.ts` (mocks `../get-all-by-base-entity`; `generateId` yields `'new-section-id-1'`, `'new-section-id-2'`). Fixtures: two sections of `'source-entity-id'`, with key order `id, base_entity_id, name, type, content, checked, sort_order, created_at, updated_at` — section 1: `name: 'Summary'`, `type: 'text'`, `content: 'A dwarven merchant'`, `checked: 1`, `sort_order: 0`; section 2: `name: null`, `type: '5e-stat-block'`, `content: null`, `checked: 0`, `sort_order: 3`. `INSERT_SQL = 'INSERT INTO base_entity_content_sections (id, name, type, content, checked, sort_order, base_entity_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)'`.

- `inserts one row per source section` — two `INSERT_SQL` calls.
- `attaches every copy to the target base entity` — `values[6]` is `'target-entity-id'` and no value is `'source-entity-id'`.
- `copies name, type, content, checked and sort_order` — values `[1..5]` of call 1 are `['Summary', 'text', 'A dwarven merchant', 1, 0]`, of call 2 `[null, '5e-stat-block', null, 0, 3]`.
- `generates fresh ids and timestamps` — ids `['new-section-id-1', 'new-section-id-2']`; `values[7]` and `values[8]` are `'2024-01-15T10:30:00.000Z'`.
- `inserts nothing when the source has no sections` — zero `INSERT_SQL` calls.

**`db/_sync/__tests__/registry.test.ts`** (Modified)

- `'should include all 7 synced tables with unique names'` becomes `'should include all 8 synced tables with unique names'`, asserting `toHaveLength(8)` and `size` `8`.
- Add `'should order base_entities before base_entity_content_sections'`, same shape as the existing sessions/session_steps test.
- The two per-table loop tests (`id`/`updated_at` present, schema shape matches columns) cover the new entry unchanged.
