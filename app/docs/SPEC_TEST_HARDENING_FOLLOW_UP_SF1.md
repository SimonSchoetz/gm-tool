# Sub-feature 1: Shared image test fixtures and tighter db assertions

The db tests gain one support module for the image test code they currently repeat, a guard that fails when a synced table's schema would make sync drop a peer row carrying `null`, and an image `remove` test that fails on a `DELETE` without `WHERE`. The harness header comment stops duplicating wiring that `.claude/rules/db-unit-tests.md` now owns. No production code changes.

## Files affected

`Modified:`

- `app/db/_sync/__tests__/registry.test.ts` — adds the null-acceptance test
- `app/db/__tests__/support/sqlite-test-database.ts` — line 1 comment shortened; nothing else in the file changes
- `app/db/image/__tests__/create.test.ts` — local `answerCommand` and `readImages` replaced by the fixtures
- `app/db/image/__tests__/duplicate.test.ts` — local `answerCommand` replaced by the fixture
- `app/db/image/__tests__/remove.test.ts` — local `answerCommand` and inline seed replaced by the fixtures; both tests seed a row that must survive
- `app/db/image/__tests__/replace.test.ts` — local `answerCommand` and `readImages` replaced by the fixtures; `seedOldImage` calls `seedImage`
- `app/db/image/__tests__/get.test.ts` — inline seed replaced by `seedImage`
- `app/db/image/__tests__/update.test.ts` — inline seed replaced by `seedImage`
- `app/db/adventure/__tests__/update.test.ts` — inline seed replaced by `seedImage`
- `app/db/base-entity/__tests__/update.test.ts` — inline seed replaced by `seedImage`
- `app/db/base-entity/__tests__/duplicate.test.ts` — inline seed replaced by `seedImage`

`Deleted:` none

`New:`

- `app/db/__tests__/support/image-fixtures.ts`

`Moved:` none

`Draft:`

- `.claude/knowledge/zod.md` — an unreviewed draft, already in the working tree: three entries refreshed to zod 4.6.5 and one entry added ("Indexing the `shape` of an unparameterized `z.ZodObject` yields `any`"), written while this spec was verified. Review it and commit it with this sub-feature.

## Layered breakdown

### Database

#### `app/db/__tests__/support/image-fixtures.ts` (New)

Placement: `app/db/__tests__/support/`, beside the harness, because its only consumers are db tests; Vitest collects only `*.{test,spec}` files, so it never runs as a test [spec-writer_20: .claude/knowledge/vitest.md:52]. Only files under `app/db/**/__tests__/` import it, and they import it dynamically (root Key Architectural Decisions — Image test fixtures live in one support module and reach the test's database at call time).

Top-level imports: exactly `import type { Image } from '@db/image';`. No runtime import of any `@db/...` module at module level.

One single-line comment at the top of the file stating that the helpers resolve `@db/database` when called, after the calling test's `vi.resetModules()`, so they reach that test's database.

Exports, and nothing else:

- `answerImageCommand(command: string): Promise<unknown>` — the body of the current `answerCommand` in `app/db/image/__tests__/remove.test.ts:17-29`, unchanged: `'save_image'` resolves `1234`; `'read_image_bytes'` resolves `'aW1hZ2U='`; `'save_image_bytes'` and `'delete_image'` resolve `undefined`; any other command rejects with ``new Error(`Unexpected command: ${command}`)``.
- `seedImage(id: string, fileExtension: string, seededAt: string): Promise<void>` — runs `INSERT INTO images (id, file_extension, created_at, updated_at) VALUES ($1, $2, $3, $3)` with `[id, fileExtension, seededAt]` on the database `testDatabase()` returns.
- `readImages(): Promise<Image[]>` — returns `select<Image[]>('SELECT * FROM images')` on the database `testDatabase()` returns.

One non-exported helper, `testDatabase`, does the dynamic import for both: `const { getDatabase } = await import('@db/database');` then returns `getDatabase()`.

No test file for this module: it has no logic of its own beyond a fixed command table, and each answer it gives is asserted through its importers (`create.test.ts` asserts `file_size` 1234, `duplicate.test.ts` asserts the `'aW1hZ2U='` bytes it saves, `remove.test.ts` asserts the `delete_image` call).

#### Call sites

Every call site obtains the helpers with `const { … } = await import('@db/__tests__/support/image-fixtures');` where it runs: inside the test body, inside a file-local helper the test calls (`seedOldImage`, `seedSourceEntity`), or inside `beforeEach` after `vi.resetModules()` when the helper is used there; a `beforeEach` that does so becomes `async`. The `vi.mock(...)` blocks and the `invoke` `vi.hoisted` spy stay at each file's top level, because Vitest rejects `vi.mock` and `vi.hoisted` anywhere else [spec-writer_21: .claude/knowledge/vitest.md:24].

| File | Remove | Replace with |
| --- | --- | --- |
| `image/__tests__/create.test.ts` | `answerCommand` (lines 18-30), `readImages` (34-38), and the `import type { Image } from '../types';` line, which only `readImages` used | `beforeEach` imports `answerImageCommand` and calls `invoke.mockImplementation(answerImageCommand)`; each of the three tests imports and calls `readImages` |
| `image/__tests__/duplicate.test.ts` | `answerCommand` (18-30) | `beforeEach` imports `answerImageCommand` and calls `invoke.mockImplementation(answerImageCommand)`; the local `seedSourceImage` and `readImage` stay, because they insert and read every column, not the minimal row |
| `image/__tests__/remove.test.ts` | `answerCommand` (17-29) and the inline `INSERT INTO images` (45-48) | `beforeEach` imports `answerImageCommand`; seeds use `seedImage` (see Assertions below) |
| `image/__tests__/replace.test.ts` | `answerCommand` (18-30), `readImages` (36-40), and `import type { Image } from '../types';` | `beforeEach` imports `answerImageCommand`; the fourth test ("rejects with the deletion error…") imports `answerImageCommand` itself for its fallback `: answerImageCommand(command)`; `seedOldImage` keeps its name and comment, and its body imports `seedImage` and calls `seedImage(OLD_ID, 'png', '2026-01-10T09:00:00.000Z')`; each test that reads imports `readImages` |
| `image/__tests__/get.test.ts` | the inline `INSERT` in the loop and the now-unused `getDatabase` import and `db` (lines 19-20, 25-28) | the loop body becomes `await seedImage(id, extension, SEEDED_AT);` |
| `image/__tests__/update.test.ts` | the inline `INSERT` and the now-unused `getDatabase` import and `db` (lines 29-34) | `await seedImage(IMAGE_ID, 'png', '2026-01-10T09:00:00.000Z');` |
| `adventure/__tests__/update.test.ts` | in "clears description and image_id…", the inline `INSERT` and the now-unused `getDatabase` import and `db` (lines 57, 59-63) | `await seedImage('image-1', 'png', T1);` after `const id = await create();` |
| `base-entity/__tests__/update.test.ts` | in "clears description and image_id…", the inline `INSERT` and the now-unused `getDatabase` import and `db` (lines 46, 48-52) | `await seedImage('image-1', 'png', '2026-01-10T09:00:00.000Z');` after `const id = await createNpc();` |
| `base-entity/__tests__/duplicate.test.ts` | in `seedSourceEntity`, the inline `INSERT` and the now-unused `getDatabase` import and `db` (lines 33-34, 36-39) | the loop body becomes `await seedImage(imageId, 'png', T1);` |

Every existing assertion in these files stays as it is, except in `remove.test.ts` (below). Each file keeps its own seed timestamp (`T1`, `SEEDED_AT` or the inline `'2026-01-10T09:00:00.000Z'` it already uses), although several share the same value: each test file owns its clock values, and a shared timestamp would couple unrelated fixtures.

#### `app/db/image/__tests__/remove.test.ts` — assertions

Declare `const SEEDED_AT = '2026-01-10T09:00:00.000Z';` at file level, because the timestamp now appears at three seed sites in this file.

- Test 1, renamed to `'deletes only its own row and file, and clears the image of the adventure and base entity that referenced it'`: seed `'image-1'` and `'image-2'` (both `'png'`, `SEEDED_AT`), keep the rest of the setup, call `remove('image-1')`. Change `expect(await db.select<unknown[]>('SELECT id FROM images')).toEqual([])` to `.toEqual([{ id: 'image-2' }])`. Keep the `invoke` assertions (one call, `'delete_image'` with `{ id: 'image-1', extension: 'png' }`) and the two `image_id` assertions. Defect caught: a `DELETE FROM images` without `WHERE` removes `image-2` too.
- Test 2, title unchanged (`'deletes nothing and deletes no file for an id with no image'`): seed `'image-1'`, call `remove('missing-image')`, assert `(await readImages()).map((image) => image.id)` equals `['image-1']`, and keep `expect(invoke).not.toHaveBeenCalled()`. Defects caught: a `DELETE` without `WHERE` removes the unrelated row; a `delete_image` call for an id with no row.

#### `app/db/_sync/__tests__/registry.test.ts` — null-acceptance test

Add one test inside `describe('registry', …)`, after `"lists the column names of each migrated table as the table's registry columns"`, following the file's own style (`openMigratedDatabase()`, a loop over `SYNCED_TABLES`, the table and column in the assertion message). No new import.

- Title: `'accepts null in the zodSchema field of every column a synced table leaves nullable'`.
- For each table: ``db.select<{ name: string; notnull: number; pk: number }[]>(`PRAGMA table_info(${table.name})`)``, keep the rows with `notnull === 0 && pk === 0`. The `pk` filter is required because SQLite reports `notnull = 0` for a `TEXT PRIMARY KEY` column.
- For each kept column: ``expect(table.zodSchema.partial().safeParse({ [column.name]: null }).success, `${table.name}.${column.name}`).toBe(true)``. The expression is the one `applyUpsert` applies to a peer row, and never indexes `table.zodSchema.shape`, which is typed `any` (root Key Architectural Decisions — The null-acceptance guard reads the migrated database and parses the way sync does).
- Defect caught: a nullable column whose zod field rejects `null`, such as `z.string().optional()` [spec-writer_22: .claude/knowledge/zod.md:24], which makes sync skip every peer row that carries `null` in that column.
- Prove it can fail: temporarily change `description` in `app/db/adventure/schema.ts` from `z.string().nullable()` to `z.string().optional()`, run `npx vitest run db/_sync` from `app/`, confirm the new test fails with the message `adventures.description`, then revert. A `tsc` error while the change is applied is expected and irrelevant.
- If the test fails on the unmodified schemas, stop and report each failing `table.column` with its migrated column definition and its zod field. Never weaken or skip the test. Per `app/db/CLAUDE.md`, the fix for a nullable column is `.nullable()` alone, but changing a `schema.ts` changes derived types, so it needs the user's go-ahead first.

#### `app/db/__tests__/support/sqlite-test-database.ts` — line 1

Line 1 becomes exactly one comment line: keep its first sentence unchanged (from `// Stands in for` through ``because `node:sqlite` exists only in Node.``), delete everything from `A db test wires it with` to the end of the line, and append ``How a db test wires it in is in `.claude/rules/db-unit-tests.md`.`` The deleted text repeats the wiring that rule states and names `mockSelect`, which no db test uses [spec-writer_19: grep mockSelect app/db — found only in line 1 of this file, as of 529b24dd]. Every other line of the file stays as it is.

## Checks

From `app/`: `npx vitest run db`, then the `every check` rows of root `CLAUDE.md` — Tool Use Discipline (type-check, lint, format-check).
