# SF6: seedTableConfig Migration

Moves the `table_config` seed data from `db/table-config/seed.ts` into a new migration, removes
the seed call from `database.ts`, and deletes `seed.ts`. After this SF, initial data for new
domain tables belongs in migrations — not in seed files.

## Files Affected

```
New:
  db/migrations/{TIMESTAMP}_seed_table_config.ts
    (replace {TIMESTAMP} with Date.now() at implementation time — must be > 1779321600000)

Modified:
  db/migrations/index.ts
  db/database.ts

Deleted:
  db/table-config/seed.ts
```

`db/table-config/index.ts` is not modified — `seed.ts` is not exported from the barrel.

## DB Layer

### Migration file: `db/migrations/{TIMESTAMP}_seed_table_config.ts`

The migration cannot call `create()` because `getDatabase()` is not yet set when migrations run
(see `database.ts`: `runMigrations()` executes before `db = database`). Use `db.execute()`
directly with `generateId()` and `generateDbTimestamps()` from `'../util'` for ID and timestamp
generation. Use `JSON.stringify()` for the layout field — no schema validation is needed since
the data is known-valid source copied verbatim from `seed.ts`.

Use `INSERT OR IGNORE` so existing installations (which already have the seed data from the old
`seedTableConfig` call) are unaffected — the migration records itself in `_migrations` and skips
the inserts silently.

The config objects below must be copied verbatim from `db/table-config/seed.ts`. Read `seed.ts`
before writing this migration to capture the exact field values.

```ts
import type Database from '@tauri-apps/plugin-sql';
import { generateId, generateDbTimestamps } from '../util';

const configs = [
  // Copy all 8 config objects from db/table-config/seed.ts verbatim.
  // Each object: { table_name, color, tagging_enabled, scope, layout }
  // Do not modify any values.
];

const up = async (db: Database): Promise<void> => {
  for (const config of configs) {
    const id = generateId();
    const { created_at, updated_at } = generateDbTimestamps();
    const layout = JSON.stringify(config.layout);

    await db.execute(
      `INSERT OR IGNORE INTO table_config
         (id, table_name, color, layout, tagging_enabled, scope, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        id,
        config.table_name,
        config.color,
        layout,
        config.tagging_enabled,
        config.scope,
        created_at,
        updated_at,
      ],
    );
  }
};

export const seedTableConfigMigration = {
  id: '{TIMESTAMP}',
  up,
};
```

The `id` field in the exported object must match the timestamp prefix in the file name exactly.

### `db/migrations/index.ts`

Import and add the new migration to the `migrations` array in ascending timestamp order (last).

```ts
import type Database from '@tauri-apps/plugin-sql';
import { initialSchemaMigration } from './1779321600000_initial_schema';
import { seedTableConfigMigration } from './{TIMESTAMP}_seed_table_config';

export type Migration = {
  id: string;
  up: (db: Database) => Promise<void>;
};

export const migrations: Migration[] = [
  initialSchemaMigration,
  seedTableConfigMigration,
];

export const runMigrations = async (db: Database): Promise<void> => {
  // body unchanged
};
```

### `db/database.ts`

Remove the `seedTableConfig` import and its call. No other changes to `database.ts`.

Lines to remove:
```ts
import { seedTableConfig } from './table-config/seed';
```
and:
```ts
await seedTableConfig(database);
```

The `db = database` assignment and all other content remain unchanged.

### Delete `db/table-config/seed.ts`

Delete the file. It has no remaining consumers after the import is removed from `database.ts`.
