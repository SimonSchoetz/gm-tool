# DB Migration System

## Progress Tracker

- SF1: Migration infrastructure — `Migration` type, `runMigrations` runner, updated `database.ts`
- SF2: Initial schema migration — first migration file capturing the current schema

---

## Key Architectural Decisions

### `_migrations` table as the tracking mechanism

A dedicated `_migrations` table stores one row per applied migration, keyed by the migration's ms-timestamp ID. This provides a full audit log rather than a single version integer, and handles the "relocated old DB" case: if `_migrations` does not exist, it is created empty and all migrations run from scratch.

`_migrations` is bootstrapped in `database.ts` via `CREATE TABLE IF NOT EXISTS` before the migration runner is called. It is not itself created by a migration — doing so would create a chicken-and-egg problem. This table is infrastructure and must never be referenced or modified in domain code.

### Ms-timestamp as migration ID

Migration files are named `{ms_timestamp}_{description}.ts`. The timestamp is assigned once when the file is created and never changed. Lexicographic sort on equal-length timestamps is equivalent to chronological sort, so the runner sorts by `id` string comparison. Timestamps must be unique across all migration files.

### Forward-only migrations

No `down` function. App downgrades are not supported — users always run the newest version.

### `database.ts` no longer registers tables

All `CREATE TABLE IF NOT EXISTS` calls move into the initial schema migration. `database.ts` removes every schema import and the `tableSchemas` loop. The migration runner is the sole mechanism for table creation. Fresh installs go through the runner the same as upgrades — the `IF NOT EXISTS` guards in migrations make this safe.

### Transactions via SQL commands

`@tauri-apps/plugin-sql` exposes no native transaction API. Transactions are managed by executing `BEGIN`, `COMMIT`, and `ROLLBACK` as SQL strings via `db.execute()`. Each migration runs inside its own transaction: if `up()` throws, `ROLLBACK` is called and the error is rethrown, leaving the DB unchanged.

### `Database` type import in non-`database.ts` files

In files where `Database` is used only as a type annotation (not as a value — i.e., no `Database.load()` or `new Database()` calls), import it with `import type Database from '@tauri-apps/plugin-sql'` to satisfy the active `@typescript-eslint/consistent-type-imports` rule from `stylisticTypeChecked`.

---

## SF1: Migration infrastructure

Creates the `Migration` type, `runMigrations` function, and updates `database.ts` to use the runner. After this SF, `database.ts` creates no tables directly — the empty `migrations` array means no tables are created yet.

**Files affected**

```
New:      app/db/migrations/index.ts
Modified: app/db/database.ts
Modified: app/db/__tests__/init-database.test.ts
```

### DB layer

#### `app/db/migrations/index.ts` (New)

```ts
import type Database from '@tauri-apps/plugin-sql';

export type Migration = {
  id: string;
  up: (db: Database) => Promise<void>;
};

export const migrations: Migration[] = [];

export const runMigrations = async (db: Database): Promise<void> => {
  const applied = await db.select<{ id: string }[]>('SELECT id FROM _migrations');
  const appliedIds = new Set(applied.map((r) => r.id));

  const pending = migrations
    .filter((m) => !appliedIds.has(m.id))
    .sort((a, b) => a.id.localeCompare(b.id));

  for (const migration of pending) {
    await db.execute('BEGIN');
    try {
      await migration.up(db);
      await db.execute(
        'INSERT INTO _migrations (id, applied_at) VALUES ($1, $2)',
        [migration.id, new Date().toISOString()],
      );
      await db.execute('COMMIT');
    } catch (error) {
      await db.execute('ROLLBACK');
      throw error;
    }
  }
};
```

#### `app/db/database.ts` (Modified)

Replace the entire file content. The new content differs from the current file in three ways:
1. Remove all 11 schema imports (`imageTable`, `adventureTable`, `sessionTable`, `sessionStepTable`, `npcTable`, `foeTable`, `itemTable`, `locationTable`, `factionTable`, `pcTable`, `tableConfigTable`).
2. Remove the `tableSchemas` array and its `for...of` loop.
3. Remove the entire `// TEMPORARY MIGRATION — delete after first run` block (lines 57–101).
4. After `Database.load()`, add `_migrations` bootstrap and runner call.

Resulting `initDatabase` function body (inside the `initializingPromise` IIFE, replacing the current try block content):

```ts
console.log('Attempting to load database...');
const database = await Database.load('sqlite:gm_tool.db');
console.log('Database loaded successfully');

await database.execute(`
  CREATE TABLE IF NOT EXISTS _migrations (
    id TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL
  )
`);

await runMigrations(database);

db = database;
await seedTableConfig(database);
return database;
```

Imports after the change:

```ts
import Database from '@tauri-apps/plugin-sql';
import { seedTableConfig } from './table-config/seed';
import { runMigrations } from './migrations';
```

Everything outside `initDatabase`'s try block (`let db`, `let initializingPromise`, `getDatabase`, `assertDb`) is unchanged.

#### `app/db/__tests__/init-database.test.ts` (Modified)

Replace the single existing test case. The old assertion (`CREATE TABLE IF NOT EXISTS sessions`) no longer fires in SF1 because `migrations` is empty. New test cases:

```ts
it('should create the _migrations tracking table', async () => {
  await initDatabase();
  expect(mockExecute).toHaveBeenCalledWith(
    expect.stringContaining('CREATE TABLE IF NOT EXISTS _migrations'),
  );
});

it('should query applied migrations on init', async () => {
  await initDatabase();
  expect(mockSelect).toHaveBeenCalledWith('SELECT id FROM _migrations');
});
```

The `beforeEach` / `afterEach` scaffolding, mock setup, and `vi.mock` declarations are unchanged. `mockSelect.mockResolvedValue([])` already handles the `SELECT id FROM _migrations` call (returns empty — no pending migrations in SF1) and the `seedTableConfig` select.

---

## SF2: Initial schema migration

Creates the first migration file containing all current `CREATE TABLE IF NOT EXISTS` statements and registers it in the `migrations` array.

**Files affected**

```
New:      app/db/migrations/1779321600000_initial_schema.ts
Modified: app/db/migrations/index.ts
Modified: app/db/__tests__/init-database.test.ts
```

### DB layer

#### `app/db/migrations/1779321600000_initial_schema.ts` (New)

The `up` function executes each table's `createTableSQL` in FK-dependency order (images first, then adventures which reference images, then entities that reference adventures, then session_steps which reference sessions, then table_config which has no FK). This matches the order currently in `database.ts`.

```ts
import type Database from '@tauri-apps/plugin-sql';
import { imageTable } from '../image/schema';
import { adventureTable } from '../adventure/schema';
import { sessionTable } from '../session/schema';
import { sessionStepTable } from '../session-step/schema';
import { npcTable } from '../npc/schema';
import { foeTable } from '../foe/schema';
import { itemTable } from '../item/schema';
import { locationTable } from '../location/schema';
import { factionTable } from '../faction/schema';
import { pcTable } from '../pc/schema';
import { tableConfigTable } from '../table-config/schema';

const up = async (db: Database): Promise<void> => {
  await db.execute(imageTable.createTableSQL);
  await db.execute(adventureTable.createTableSQL);
  await db.execute(sessionTable.createTableSQL);
  await db.execute(sessionStepTable.createTableSQL);
  await db.execute(npcTable.createTableSQL);
  await db.execute(foeTable.createTableSQL);
  await db.execute(itemTable.createTableSQL);
  await db.execute(locationTable.createTableSQL);
  await db.execute(factionTable.createTableSQL);
  await db.execute(pcTable.createTableSQL);
  await db.execute(tableConfigTable.createTableSQL);
};

export const initialSchemaMigration = {
  id: '1779321600000',
  up,
};
```

No `import type { Migration }` needed — TypeScript verifies assignability to `Migration[]` when this value is placed in the array in `index.ts`.

#### `app/db/migrations/index.ts` (Modified)

Add the import and register the migration. The `migrations` array changes from `[]` to `[initialSchemaMigration]`:

```ts
import type Database from '@tauri-apps/plugin-sql';
import { initialSchemaMigration } from './1779321600000_initial_schema';

export type Migration = {
  id: string;
  up: (db: Database) => Promise<void>;
};

export const migrations: Migration[] = [initialSchemaMigration];

export const runMigrations = async (db: Database): Promise<void> => {
  // body unchanged from SF1
};
```

#### `app/db/__tests__/init-database.test.ts` (Modified)

Add a third test case verifying that the initial migration runs when `_migrations` is empty:

```ts
it('should run the initial schema migration on a fresh database', async () => {
  await initDatabase();
  expect(mockExecute).toHaveBeenCalledWith(expect.stringContaining('BEGIN'));
  expect(mockExecute).toHaveBeenCalledWith(
    expect.stringContaining('CREATE TABLE IF NOT EXISTS sessions'),
  );
  expect(mockExecute).toHaveBeenCalledWith(
    expect.stringContaining('INSERT INTO _migrations'),
  );
  expect(mockExecute).toHaveBeenCalledWith(expect.stringContaining('COMMIT'));
});
```

`mockSelect.mockResolvedValue([])` already returns an empty array for `SELECT id FROM _migrations`, causing the migration to be treated as pending and executed. No changes to `beforeEach` / `afterEach` scaffolding.

---

## CLAUDE.md Impact

**`app/db/CLAUDE.md`** — Add a "Migrations" section after the existing "Seeds" section:

> ## Migrations
>
> Every schema change (ADD COLUMN, DROP COLUMN, change column constraint, new table, dropped table) requires a new migration file in `db/migrations/`. Never alter `createTableSQL` in a `schema.ts` without a corresponding migration file.
>
> Migration file naming: `{ms_timestamp}_{description}.ts`, where the timestamp is `Date.now()` at the time of file creation, assigned once and never changed. Timestamps must be unique.
>
> Each migration file exports a named const with shape `{ id: string, up: (db: Database) => Promise<void> }`. The `id` must match the timestamp in the file name. After creating the file, add it to the `migrations` array in `db/migrations/index.ts` in ascending timestamp order.
>
> All migrations must be idempotent: use `CREATE TABLE IF NOT EXISTS` for new tables; for column-level changes, use `DROP TABLE IF EXISTS` on any temp table before creating it.
>
> The `_migrations` table is infrastructure owned by `database.ts`. Never reference or modify it in domain code or migrations.

**`app/docs/_product/domain-scaffold.md`** — The DB layer section currently instructs adding a schema import and a `tableSchemas` entry to `db/database.ts`. Replace that instruction with:

> **`db/migrations/`** (New migration file) — Create a new migration file named `{Date.now()}_{domain-plural}.ts` that executes `[singular]Table.createTableSQL`. Add it to the `migrations` array in `db/migrations/index.ts`. Do not modify `db/database.ts`.
