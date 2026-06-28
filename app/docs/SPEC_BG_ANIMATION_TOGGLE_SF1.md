# SF1 — Settings Table Migration

Create the `settings` infrastructure table and insert the `background` default row.

## Files Affected

```
New:      db/_migrations/{timestamp}_add_settings_table.ts
Modified: db/_migrations/index.ts
```

## DB Changes

### Migration file

Name the file `{timestamp}_add_settings_table.ts` where `{timestamp}` is `Date.now()` at the time of file creation (a 13-digit integer). The timestamp will sort after `1751068800000` (approx. June 2026) and before or after existing migrations depending on creation time — this is expected; the `settings` table has no dependencies on other domain tables and is safe to run in any order.

Export shape (mirrors existing migrations):

```ts
import type Database from '@tauri-apps/plugin-sql';

const up = async (db: Database): Promise<void> => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);
  await db.execute(
    'INSERT OR IGNORE INTO settings (id, value) VALUES ($1, $2)',
    ['background', '{"animation_enabled":true}'],
  );
};

export const addSettingsTableMigration = {
  id: '{timestamp}',
  up,
};
```

The `id` field must match the numeric timestamp in the file name exactly.

### `db/_migrations/index.ts`

Add `import { addSettingsTableMigration } from './{timestamp}_add_settings_table'` alongside the existing imports. Append `addSettingsTableMigration` to the `migrations` array. The array order does not need to reflect timestamp order — the runner sorts by `id` string comparison before executing.
