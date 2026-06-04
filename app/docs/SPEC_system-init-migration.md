# SPEC: `_system` Init Migration

## Progress Tracker

- SF1: `_system` migration — create `_system` table and seed `versioning` via a new migration; fix pre-existing stale mock in `runMigrations.test.ts`
- SF2: Simplify `database.ts` — remove `_system` CREATE TABLE and INSERT, now owned by the migration
- SF3: Fix `_system` SQL column — update `get.ts` and `set.ts` to query `id` instead of `key`

## Key Architectural Decisions

### Migration owns `_system` fully

`database.ts` no longer creates or seeds `_system`. A dedicated migration is responsible for the table's existence, schema, and initial row. `database.ts` reduces to: load the database, call `runMigrations`. This is consistent with how all other tables are owned by their migrations.

### `CREATE TABLE IF NOT EXISTS` — fresh start assumed

The migration assumes no existing `_system` table. `CREATE TABLE IF NOT EXISTS` is used per the migration idempotency convention. The user will delete the existing database manually before running the app after this change.

### SF ordering constraint (runtime, not tsc)

SF1 must be committed before SF2. SF2 removes `_system` creation from `database.ts`. If SF2 were committed alone, a startup without the migration would have no `_system` table, causing a runtime crash on any `_system` read. tsc passes in either order; the constraint is runtime correctness.

### `runMigrations.test.ts` pre-existing breakage

When `CREATE TABLE IF NOT EXISTS _migrations` was moved into `runMigrations` (prior to this spec), the test's mock sequence became stale: what the comments labelled `// BEGIN` now matches `CREATE TABLE IF NOT EXISTS _migrations`, shifting every subsequent mock position. `BEGIN` now lands on `mockRejectedValueOnce`, which means the failure occurs before the `try` block and `ROLLBACK` is never called. The test assertions for `rollbackIndex` will fail. SF1 fixes this.

---

## SF1: `_system` migration

Create the migration file that owns `_system` initialization. Fix the pre-existing stale mock in `runMigrations.test.ts`.

### Files affected

**New:**

- `app/db/_migrations/{timestamp}_init_system.ts` — `{timestamp}` is `Date.now()` evaluated at the moment you create the file; use the same integer as both the filename prefix and the `id` field value

**Modified:**

- `app/db/_migrations/index.ts` — add new migration to the `migrations` array
- `app/db/_migrations/__tests__/runMigrations.test.ts` — fix stale mock sequence (pre-existing breakage)

### DB layer

**`app/db/_migrations/{timestamp}_init_system.ts`**

```ts
import type Database from '@tauri-apps/plugin-sql';

const up = async (db: Database): Promise<void> => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS _system (
      id TEXT PRIMARY KEY,
      value TEXT
    )
  `);
  await db.execute(
    'INSERT OR IGNORE INTO _system (id, value) VALUES ($1, $2)',
    ['versioning', '{"snoozed_update_version":null}'],
  );
};

export const initSystemMigration = {
  id: '{timestamp}',
  up,
};
```

Replace `{timestamp}` with the actual integer from the filename.

**`app/db/_migrations/index.ts`** — add `initSystemMigration` import and push it onto the `migrations` array in ascending timestamp order (after `seedTableConfigMigration`):

```ts
import { initSystemMigration } from './{timestamp}_init_system';

export const migrations: Migration[] = [
  initialSchemaMigration,
  seedTableConfigMigration,
  initSystemMigration,
];
```

**`app/db/_migrations/__tests__/runMigrations.test.ts`** — fix the mock sequence. The test must account for `CREATE TABLE IF NOT EXISTS _migrations` as the first `execute` call in `runMigrations`. The corrected sequence for the ROLLBACK scenario is:

```ts
mockExecute.mockResolvedValueOnce(undefined); // CREATE TABLE IF NOT EXISTS _migrations
mockExecute.mockResolvedValueOnce(undefined); // BEGIN
mockExecute.mockRejectedValueOnce(migrationError); // first execute inside migration.up()
mockExecute.mockResolvedValueOnce(undefined); // ROLLBACK
```

The three `// BEGIN`, `// first db.execute inside up()`, `// ROLLBACK` comments were all shifted by one position. Insert the `CREATE TABLE` mock at the top of the sequence. All existing assertions remain valid — `beginIndex`, `rollbackIndex`, COMMIT absence — because `BEGIN` and `ROLLBACK` still appear in `mockExecute.mock.calls` at their correct relative positions.

---

## SF2: Simplify `database.ts`

Remove the `_system` table creation and `versioning` seed insert from `database.ts`. The function body after this change is: load the database, call `runMigrations`, assign `db`, return.

### Files affected

**Modified:**

- `app/db/database.ts` — remove `_system` CREATE TABLE block and INSERT block

### DB layer

Remove these two blocks from `initDatabase`:

```ts
// REMOVE this block:
await database.execute(`
  CREATE TABLE IF NOT EXISTS _system (
    key TEXT PRIMARY KEY,
    value TEXT
  )
`);

// REMOVE this block:
await database.execute(
  'INSERT OR IGNORE INTO _system (key, value) VALUES ($1, $2)',
  ['versioning', null],
);
```

The resulting `initDatabase` body is:

```ts
const database = await Database.load('sqlite:gm_tool.db');
console.log('Database loaded successfully');
await runMigrations(database);
db = database;
return database;
```

The `console.log('Attempting to load database...')` before `Database.load` remains. The `catch`/`finally` wrapper remains unchanged.

`app/db/__tests__/init-database.test.ts` — no changes required. The existing three tests do not assert on `_system` creation or the `versioning` INSERT; they remain valid after this removal.

---

## SF3: Fix `_system` SQL column

Update `get.ts` and `set.ts` to reference the `id` column instead of `key`. Update their tests to match.

### Files affected

**Modified:**

- `app/db/_system/get.ts` — `WHERE key = $1` → `WHERE id = $1`
- `app/db/_system/set.ts` — `(key, value)` → `(id, value)`
- `app/db/_system/__tests__/get.test.ts` — update SQL assertion string
- `app/db/_system/__tests__/set.test.ts` — update SQL assertion strings

### DB layer

**`app/db/_system/get.ts`** — change the SELECT query:

```ts
'SELECT value FROM _system WHERE id = $1'
```

**`app/db/_system/set.ts`** — change the INSERT OR REPLACE query:

```ts
'INSERT OR REPLACE INTO _system (id, value) VALUES ($1, $2)'
```

**`app/db/_system/__tests__/get.test.ts`** — update the assertion in "returns the stored value for an existing key":

```ts
expect(mockSelect).toHaveBeenCalledWith(
  'SELECT value FROM _system WHERE id = $1',
  ['versioning'],
);
```

Also update the `mockSelect.mockImplementation` guard string from `'SELECT value FROM _system'` — it already matches without the column name in that `includes` check, so no change is needed there.

**`app/db/_system/__tests__/set.test.ts`** — update both assertions:

```ts
// "inserts a new row"
expect(mockExecute).toHaveBeenCalledWith(
  'INSERT OR REPLACE INTO _system (id, value) VALUES ($1, $2)',
  ['versioning', null],
);

// "replaces an existing row"
expect(mockExecute).toHaveBeenCalledWith(
  'INSERT OR REPLACE INTO _system (id, value) VALUES ($1, $2)',
  ['versioning', '{"snoozed_update_version":"1.2.3"}'],
);
```

The second test's value string `'{"snoozed_update_version":"1.2.3"}'` is correct — do not change it.

---

## CLAUDE.md Impact

**`app/db/CLAUDE.md`** — update the infrastructure exemption rule. The current text reads:

> Infrastructure tables prefixed with `_` (e.g., `_migrations`, `_system`) are exempt from the domain column requirements (`id`, `created_at`, `updated_at`). They define their own schema to match their structural purpose.

Replace with:

> Infrastructure tables prefixed with `_` (e.g., `_migrations`, `_system`) are exempt from the `created_at` and `updated_at` domain column requirements. The `id TEXT PRIMARY KEY` naming rule is **not** exempt — all tables, including infrastructure tables, use `id` as the primary key column name. Infrastructure tables define their own schema otherwise to match their structural purpose.
