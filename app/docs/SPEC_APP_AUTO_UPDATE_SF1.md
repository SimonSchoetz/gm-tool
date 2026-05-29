# SF1: `_system` DB Module

Creates the `db/_system/` module with `get` and `set` operations, and bootstraps the `_system`
table with its seed row inline in `database.ts`.

## Files Affected

```
New:
  db/_system/get.ts
  db/_system/set.ts
  db/_system/index.ts
  db/_system/__tests__/get.test.ts
  db/_system/__tests__/set.test.ts

Modified:
  db/database.ts
```

## DB Layer

### `db/_system/get.ts`

```ts
import { getDatabase } from '../database';

export const get = async (key: string): Promise<string | null> => {
  const db = await getDatabase();
  const rows = await db.select<{ value: string | null }[]>(
    'SELECT value FROM _system WHERE key = $1',
    [key],
  );
  return rows[0]?.value ?? null;
};
```

No input validation is needed — `_system` is accessed only by internal code with known-valid keys.

### `db/_system/set.ts`

`INSERT OR REPLACE` is the correct upsert primitive for a key-value store: if the key exists
the row is replaced; if not it is inserted. There is no separate create/update distinction.

```ts
import { getDatabase } from '../database';

export const set = async (key: string, value: string | null): Promise<void> => {
  const db = await getDatabase();
  await db.execute(
    'INSERT OR REPLACE INTO _system (key, value) VALUES ($1, $2)',
    [key, value],
  );
};
```

### `db/_system/index.ts`

Explicit named exports — `export *` is banned in all db barrel files.

```ts
export { get } from './get';
export { set } from './set';
```

### `db/database.ts`

Add the `_system` table creation and its seed row immediately after the `_migrations` block and
before `runMigrations`. Insert both statements as a single inline block — no helper function,
no seed file.

After the existing `_migrations` CREATE TABLE block, add:

```ts
await database.execute(`
  CREATE TABLE IF NOT EXISTS _system (
    key TEXT PRIMARY KEY,
    value TEXT
  )
`);

await database.execute(
  'INSERT OR IGNORE INTO _system (key, value) VALUES ($1, $2)',
  ['versioning', null],
);
```

`INSERT OR IGNORE` ensures the seed row is only written on first init; subsequent starts leave
the existing row untouched.

## Tests

Both test files require `vi.resetModules()` in `beforeEach` and dynamic imports inside each test
body — two tests per file exercise `getDatabase()`, which owns module-level singleton state.
See `db/CLAUDE.md` — Testing for the full singleton reset rule.

`mockSelect.mockResolvedValue([])` must be set in `beforeEach` before any other setup. This
satisfies the `seedTableConfig` call inside `initDatabase()` which selects from `table_config`.

### `db/_system/__tests__/get.test.ts`

```
Assertions:
  'returns the stored value for an existing key'
    mockSelect returns [{ value: 'some-json' }]
    → get('versioning') resolves to 'some-json'
    → mockSelect called with ('SELECT value FROM _system WHERE key = $1', ['versioning'])

  'returns null when the key does not exist'
    mockSelect returns []
    → get('nonexistent') resolves to null
```

### `db/_system/__tests__/set.test.ts`

```
Assertions:
  'inserts a new row'
    → set('versioning', null) resolves without error
    → mockExecute called with
        ('INSERT OR REPLACE INTO _system (key, value) VALUES ($1, $2)', ['versioning', null])

  'replaces an existing row'
    → set('versioning', '{"snoozed_update_version":"1.2.3"}') resolves without error
    → mockExecute called with
        ('INSERT OR REPLACE INTO _system (key, value) VALUES ($1, $2)',
         ['versioning', '{"snoozed_update_version":"1.2.3"}'])
```
