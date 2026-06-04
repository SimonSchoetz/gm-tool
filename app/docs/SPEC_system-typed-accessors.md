# SPEC: `_system` Typed Accessors

## Progress Tracker

- SF1: Rename + schema — rename `set` → `update`, introduce `schema.ts` with `VersioningData`, update barrel transitionally
- SF2: Typed accessors — add `versioning.ts` with `getVersioning`/`updateVersioning`, tests, finalize barrel

## Key Architectural Decisions

### Raw utilities become internal; typed accessors are the public API

`get.ts` and `update.ts` are raw SQL utilities — they accept untyped strings and have no knowledge of JSON shape. They remain as internal implementation details and are not exported from the barrel after SF2. The public API of `_system` is the typed, key-named pair: `getVersioning` and `updateVersioning`. External consumers (services, DAL) import only these.

### One file per key: `versioning.ts` owns both accessors

`getVersioning` and `updateVersioning` both operate on the same key and the same schema. They are one concern — reading and writing the versioning value. Following the 1 concern → 1 file rule, both live in `versioning.ts`. This is the pattern to follow when future keys are added: a new `keyname.ts` per key.

### `schema.ts` holds the Zod schema and derived type

`VersioningData` is derived from `versioningDataSchema` via `z.infer`. The schema is the source of truth; the type is never written by hand. This satisfies the `db/CLAUDE.md` requirement: JSON string columns must have a validated schema, and TypeScript types must be derived from it.

### `getVersioning` returns `null` when the row value is `null` or the row is absent

The `versioning` row is seeded by the migration with `'{"snoozed_update_version":null}'` — not SQL NULL. In practice, `getVersioning` will always find a JSON string. However, `get.ts` returns `string | null` (SQL NULL is possible in principle), and the function must handle it: a `null` raw value propagates as `null` return without attempting a parse.

### Barrel exports `VersioningData` as a type export

The type is part of the public API because the frontend needs it to know the shape of data passed to `updateVersioning`. It is exported with `export type` to make the boundary explicit.

---

## SF1: Rename `set` → `update` + introduce `schema.ts`

Rename the raw write utility. Introduce the Zod schema. Update the barrel to reflect the rename — typed functions are added in SF2.

### Files affected

**New:**

- `app/db/_system/schema.ts`

**Moved:**

- `app/db/_system/set.ts` → `app/db/_system/update.ts`, then rename exported function `set` → `update` inside the file
- `app/db/_system/__tests__/set.test.ts` → `app/db/_system/__tests__/update.test.ts`, then update all references inside (import path, destructured name, `describe` label)

**Modified:**

- `app/db/_system/index.ts` — replace `set` export with `update`

### DB layer

**`app/db/_system/update.ts`** (moved from `set.ts`):

```ts
import { getDatabase } from '../database';

export const update = async (key: string, value: string | null): Promise<void> => {
  const db = await getDatabase();
  await db.execute(
    'INSERT OR REPLACE INTO _system (id, value) VALUES ($1, $2)',
    [key, value],
  );
};
```

The SQL is unchanged. Only the exported function name changes from `set` to `update`.

**`app/db/_system/__tests__/update.test.ts`** (moved from `set.test.ts`):

Apply three substitutions throughout the file:
- `describe('set', ...)` → `describe('update', ...)`
- `import('../set')` → `import('../update')`
- `const { set }` → `const { update }` and `await set(...)` → `await update(...)`

All SQL assertion strings and argument values are unchanged.

**`app/db/_system/schema.ts`** — new file:

```ts
import { z } from 'zod';

export const versioningDataSchema = z.object({
  snoozed_update_version: z.string().nullable(),
});

export type VersioningData = z.infer<typeof versioningDataSchema>;
```

**`app/db/_system/index.ts`** — update the `set` export to `update`. After SF1 the barrel is:

```ts
export { get } from './get';
export { update } from './update';
```

`get` and `update` are removed from the barrel in SF2. Keeping them here makes SF1 compile cleanly without requiring SF2.

---

## SF2: Typed versioning accessors

Add `versioning.ts` with fully typed, Zod-validated read and write functions. Add tests. Finalize the barrel to expose only the typed public API.

### Files affected

**New:**

- `app/db/_system/versioning.ts`
- `app/db/_system/__tests__/versioning.test.ts`

**Modified:**

- `app/db/_system/index.ts` — replace raw exports with typed API

### DB layer

**`app/db/_system/versioning.ts`**:

```ts
import { get } from './get';
import { update } from './update';
import { versioningDataSchema, type VersioningData } from './schema';

export const getVersioning = async (): Promise<VersioningData | null> => {
  const raw = await get('versioning');
  if (raw === null) return null;
  return versioningDataSchema.parse(JSON.parse(raw) as unknown);
};

export const updateVersioning = async (data: VersioningData): Promise<void> => {
  versioningDataSchema.parse(data);
  await update('versioning', JSON.stringify(data));
};
```

`getVersioning` returns `null` when the raw value is `null`. It does not return `null` for missing keys other than `'versioning'` — the function is key-specific and assumes the row exists after migration. The `as unknown` cast on `JSON.parse` satisfies `exactOptionalPropertyTypes` strict mode — `JSON.parse` returns `any`, which must be widened to `unknown` before passing to `parse`.

`updateVersioning` calls `versioningDataSchema.parse(data)` before serializing as a runtime guard against miscasts. It serializes with `JSON.stringify` and writes via `update`.

**`app/db/_system/index.ts`** — finalized barrel:

```ts
export type { VersioningData } from './schema';
export { getVersioning, updateVersioning } from './versioning';
```

`get` and `update` are intentionally not exported — they are internal utilities. `VersioningData` uses `export type` to make the intent explicit.

**`app/db/_system/__tests__/versioning.test.ts`**:

Full scaffolding: `vi.mock('@tauri-apps/plugin-sql', ...)` at module scope, `vi.resetModules()` + `vi.clearAllMocks()` + `mockExecute.mockResolvedValue({ lastInsertId: 0 })` + `mockSelect.mockResolvedValue([])` in `beforeEach`. All imports are dynamic inside each test body.

Five tests:

**"getVersioning returns parsed VersioningData when the row exists"**

```ts
mockSelect.mockImplementation((query: string) => {
  if (query.includes('SELECT value FROM _system')) {
    return Promise.resolve([{ value: '{"snoozed_update_version":null}' }]);
  }
  return Promise.resolve([]);
});
const { getVersioning } = await import('../versioning');
const result = await getVersioning();
expect(result).toEqual({ snoozed_update_version: null });
```

**"getVersioning returns null when the row value is null"**

Default `mockSelect.mockResolvedValue([])` causes `get` to return `null`. No additional mock needed.

```ts
const { getVersioning } = await import('../versioning');
const result = await getVersioning();
expect(result).toBeNull();
```

**"getVersioning throws when the stored JSON does not match the schema"**

```ts
mockSelect.mockImplementation((query: string) => {
  if (query.includes('SELECT value FROM _system')) {
    return Promise.resolve([{ value: '{"wrong_field":true}' }]);
  }
  return Promise.resolve([]);
});
const { getVersioning } = await import('../versioning');
await expect(getVersioning()).rejects.toThrow();
```

**"updateVersioning serializes and writes null snoozed_update_version"**

```ts
const { updateVersioning } = await import('../versioning');
await updateVersioning({ snoozed_update_version: null });
expect(mockExecute).toHaveBeenCalledWith(
  'INSERT OR REPLACE INTO _system (id, value) VALUES ($1, $2)',
  ['versioning', '{"snoozed_update_version":null}'],
);
```

**"updateVersioning serializes and writes a version string"**

```ts
const { updateVersioning } = await import('../versioning');
await updateVersioning({ snoozed_update_version: '1.2.3' });
expect(mockExecute).toHaveBeenCalledWith(
  'INSERT OR REPLACE INTO _system (id, value) VALUES ($1, $2)',
  ['versioning', '{"snoozed_update_version":"1.2.3"}'],
);
```

---

## CLAUDE.md Impact

**`app/db/CLAUDE.md`** — update the `_system/` structure entry to note that `get.ts` and `update.ts` are internal utilities not exported from the barrel, and that per-key typed accessor files (`versioning.ts`) are the pattern for `_system` consumers. Add to the structure block:

```
├── _system/          # Infrastructure key-value store
│   ├── schema.ts     # Zod schemas and derived types for each key's value shape
│   ├── versioning.ts # Typed accessors for the versioning key (public API)
│   ├── get.ts        # Raw SQL utility — internal, not exported from barrel
│   └── update.ts     # Raw SQL utility — internal, not exported from barrel
```

No convention rule change is needed — the existing "JSON string columns must have validated schemas" rule covers this. The structure update is documentation only.
