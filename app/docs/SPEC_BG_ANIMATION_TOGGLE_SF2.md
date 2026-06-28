# SF2 — Settings DB Module

Create the `db/settings/` module: a Zod schema registry, generic typed accessors, and tests.

## Files Affected

```
New: db/settings/schema.ts
New: db/settings/get.ts
New: db/settings/update.ts
New: db/settings/index.ts
New: db/settings/__tests__/get.test.ts
New: db/settings/__tests__/update.test.ts
```

## DB Changes

### `db/settings/schema.ts`

```ts
import { z } from 'zod';

export const settingsSchemas = {
  background: z.object({ animation_enabled: z.boolean() }),
} as const;

export type SettingsKey = keyof typeof settingsSchemas;
export type SettingsValueMap = {
  [K in SettingsKey]: z.infer<(typeof settingsSchemas)[K]>;
};

export type BackgroundSettings = SettingsValueMap['background'];
```

`as const` is required so TypeScript can index `settingsSchemas` by string literal keys and infer the correct schema type per key.

Adding a new setting: add one entry to `settingsSchemas` and add the corresponding migration in SF1 — no other files change.

### `db/settings/get.ts`

```ts
import { getDatabase } from '../database';
import { settingsSchemas } from './schema';
import type { SettingsKey, SettingsValueMap } from './schema';

export const getSetting = async <K extends SettingsKey>(
  key: K,
): Promise<SettingsValueMap[K] | null> => {
  const db = await getDatabase();
  const rows = await db.select<{ value: string }[]>(
    'SELECT value FROM settings WHERE id = $1',
    [key],
  );
  const raw = rows[0]?.value;
  if (raw === undefined) return null;
  return settingsSchemas[key].parse(JSON.parse(raw)) as SettingsValueMap[K];
};
```

`rows` is typed `{ value: string }[]` (not `string | null`) because `settings.value` is `NOT NULL`. When the row is absent, `rows` is empty and `rows[0]?.value` is `undefined` — return `null`. The `as SettingsValueMap[K]` cast is required because TypeScript cannot prove `settingsSchemas[key].parse(...)` narrows to the indexed type.

### `db/settings/update.ts`

```ts
import { getDatabase } from '../database';
import { settingsSchemas } from './schema';
import type { SettingsKey, SettingsValueMap } from './schema';

export const updateSetting = async <K extends SettingsKey>(
  key: K,
  value: SettingsValueMap[K],
): Promise<void> => {
  settingsSchemas[key].parse(value);
  const db = await getDatabase();
  await db.execute(
    'INSERT OR REPLACE INTO settings (id, value) VALUES ($1, $2)',
    [key, JSON.stringify(value)],
  );
};
```

Validate before writing. `INSERT OR REPLACE` is the upsert pattern used across `_system` — it handles both first-write and subsequent updates identically.

### `db/settings/index.ts`

Explicit named exports (grouping barrel rule — `export *` is banned):

```ts
export { getSetting } from './get';
export { updateSetting } from './update';
export type { SettingsKey, SettingsValueMap, BackgroundSettings } from './schema';
```

## Tests

Both test files follow the scaffolding in `db/_system/__tests__/get.test.ts` and `update.test.ts` exactly: module-scope mock, `beforeEach` with `vi.resetModules()` + `vi.clearAllMocks()`, dynamic import inside each test body.

The `beforeEach` must call `mockSelect.mockResolvedValue([])` — the migration runner (called by `getDatabase()`) does a `SELECT` on `_migrations` and crashes if `mockSelect` has no response.

### `db/settings/__tests__/get.test.ts`

Three code paths, one test each:

**"returns the parsed value for an existing key"**
Set `mockSelect` to return `[{ value: '{"animation_enabled":true}' }]` when the query targets `settings`. Dynamic-import `getSetting`. Assert return value is `{ animation_enabled: true }`. Assert `mockSelect` called with `'SELECT value FROM settings WHERE id = $1'` and `['background']`.

**"returns null when the key does not exist"**
Leave `mockSelect` at default (`[]`). Dynamic-import `getSetting`. Assert `getSetting('background')` returns `null`.

**"throws when stored JSON does not match the schema"**
Set `mockSelect` to return `[{ value: '{"animation_enabled":"yes"}' }]` (string instead of boolean). Dynamic-import `getSetting`. Assert `getSetting('background')` rejects (Zod parse error).

### `db/settings/__tests__/update.test.ts`

Two code paths, one test each:

**"writes the JSON-serialised value with INSERT OR REPLACE"**
Dynamic-import `updateSetting`. Call `updateSetting('background', { animation_enabled: false })`. Assert `mockExecute` called with `'INSERT OR REPLACE INTO settings (id, value) VALUES ($1, $2)'` and `['background', '{"animation_enabled":false}']`.

**"throws when the value does not match the schema"**
Dynamic-import `updateSetting`. Assert `updateSetting('background', { animation_enabled: 'yes' } as never)` rejects (Zod parse error before the DB call). Assert `mockExecute` was NOT called with the `INSERT` query.
