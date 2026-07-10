# SF2: DB Layer — `paired_devices` Table + `_system` Device Accessor

Creates the peer persistence table with its CRUD module, and the own-device identity accessor on `_system`. TypeScript only.

## Files Affected

Modified:

- `app/db/_migrations/index.ts` — import and append the new migration to the `migrations` array (ascending timestamp order)
- `app/db/_system/schema.ts` — add `deviceDataSchema` + `DeviceData` type
- `app/db/_system/index.ts` — add explicit named exports: `getDevice`, `updateDevice`, `type DeviceData`

New:

- `app/db/_migrations/{Date.now()}_add_paired_devices_table.ts` — timestamp assigned at file creation, never changed
- `app/db/_system/device.ts` — typed accessor pair
- `app/db/_system/__tests__/device.test.ts`
- `app/db/paired-device/schema.ts`
- `app/db/paired-device/types.ts`
- `app/db/paired-device/create.ts`
- `app/db/paired-device/get.ts`
- `app/db/paired-device/get-all.ts`
- `app/db/paired-device/update.ts`
- `app/db/paired-device/remove.ts`
- `app/db/paired-device/index.ts`
- `app/db/paired-device/__tests__/create.test.ts`
- `app/db/paired-device/__tests__/get.test.ts`
- `app/db/paired-device/__tests__/get-all.test.ts`
- `app/db/paired-device/__tests__/update.test.ts`
- `app/db/paired-device/__tests__/remove.test.ts`

## Migration

Follow `db/_migrations/1782657640641_add_settings_table.ts` as the reference shape (idempotent `CREATE TABLE IF NOT EXISTS`, exported const `{ id, up }` with id matching the filename timestamp):

```sql
CREATE TABLE IF NOT EXISTS paired_devices (
  id TEXT PRIMARY KEY,
  name TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
)
```

No seed rows. No `_system` insert either: the `device` key is written lazily on first `init_connectivity` because the id is not known at migration time (it comes from the Rust-generated keypair). `getDevice()` returning `null` before first init is the designed state.

## `_system` Device Accessor

`db/_system/schema.ts` — append below the versioning schema:

```ts
export const deviceDataSchema = z.object({
  id: z.string().regex(/^[0-9a-f]{64}$/),
  name: z.string().nullable(),
});

export type DeviceData = z.infer<typeof deviceDataSchema>;
```

`db/_system/device.ts` — pure name substitution from `db/_system/versioning.ts`: `getVersioning`→`getDevice`, `updateVersioning`→`updateDevice`, `versioningDataSchema`→`deviceDataSchema`, `VersioningData`→`DeviceData`, key string `'versioning'`→`'device'`. No other changes.

The 64-char hex regex encodes the KAD "Device identity: the device id IS the iroh EndpointId" — the id is an Ed25519 public key's hex encoding, not a nanoid.

### `__tests__/device.test.ts`

Pure substitution from `db/_system/__tests__/versioning.test.ts` (same mock scaffolding, same four paths — the reference file already implements the required `vi.resetModules()`/dynamic-import discipline from `app/db/CLAUDE.md` — Testing). Required tests and assertions:

1. `getDevice` returns parsed `DeviceData` when the row exists — mock select resolving `[{ value: '{"id":"<hex literal>","name":"Laptop"}' }]` and assert deep equality with the parsed object, where `<hex literal>` is a 64-char lowercase hex string such as `'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2'`; reuse the same literal across this file's tests.
2. `getDevice` returns `null` when no row exists for the key.
3. `getDevice` returns `null` when the row exists but its value is SQL NULL.
4. `getDevice` throws when the stored JSON does not match the schema — use a value failing the hex regex, e.g. `'{"id":"not-hex","name":null}'`, assert `rejects.toThrow()`.
5. `updateDevice` writes the JSON-serialized value under key `'device'` — assert `mockExecute` called with SQL containing `INSERT OR REPLACE INTO _system` and values `['device', '{"id":"<same hex literal>","name":"Laptop"}']`.

## `paired_devices` CRUD Module

### `schema.ts`

`defineTable` call following `db/adventure/schema.ts` as reference:

```ts
export const pairedDeviceTable = defineTable({
  name: 'paired_devices',
  columns: {
    id: {
      type: 'TEXT',
      primaryKey: true,
      zod: z.string().regex(/^[0-9a-f]{64}$/),
    },
    name: {
      type: 'TEXT',
      zod: z.string().nullable().optional(),
    },
    created_at: {
      type: 'TEXT',
      notNull: true,
      zod: z.string(),
    },
    updated_at: {
      type: 'TEXT',
      notNull: true,
      zod: z.string(),
    },
  },
});
```

`name` uses `.nullable().optional()` because peers report `string | null` names (from the `hello` payload) — the nullable form must be writable, unlike `adventures.name` which is only ever a string or omitted.

### `types.ts`

Substitution from `db/adventure/types.ts`: `PairedDevice`, `UpdatePairedDeviceInput`, from `pairedDeviceTable`.

### `create.ts`

Decision-bearing (deviates from the adventure reference — inline rationale required in the file per the root spec KAD "`paired_devices.id` is a caller-supplied EndpointId"):

```ts
import { getDatabase } from '../database';
import { buildCreateQuery, generateDbTimestamps } from '../util';
import { pairedDeviceTable } from './schema';

type CreatePairedDeviceInput = {
  id: string;
  name: string | null;
};

// id is the peer's iroh EndpointId (64-char hex), supplied by the pairing flow —
// not a generated nanoid like every other table.
export const create = async (input: CreatePairedDeviceInput): Promise<string> => {
  const validated = pairedDeviceTable.zodSchema
    .pick({ id: true, name: true })
    .parse(input);
  const { now: _now, ...timestamps } = generateDbTimestamps();

  const { sql, values } = buildCreateQuery<{
    name: string | null;
    created_at: string;
    updated_at: string;
  }>('paired_devices', validated.id, {
    name: validated.name ?? null,
    ...timestamps,
  });

  const db = await getDatabase();
  await db.execute(sql, values);
  return validated.id;
};
```

Export `CreatePairedDeviceInput` from `types.ts` instead if `defineTable`'s generated schemas make the `.pick` form awkward — the binding decision is: input is `{ id, name }`, both validated through the table's Zod column definitions before the INSERT, and the function returns the id. Verify `pairedDeviceTable`'s generated schema surface (`zodSchema`, `updateSchema`, and whatever create-schema `defineTable` exposes) by reading `db/util/schema/define-table.ts` before writing this file, and prefer the generated create schema if one exists.

### `get.ts`, `get-all.ts`, `update.ts`, `remove.ts`

Pure substitution from the corresponding `db/adventure/` files. Substitution table:

| Reference identifier | Substituted identifier |
| --- | --- |
| `Adventure` | `PairedDevice` |
| `UpdateAdventureInput` | `UpdatePairedDeviceInput` |
| `adventureTable` | `pairedDeviceTable` |
| `'adventures'` (table name in SQL/queries) | `'paired_devices'` |
| `'adventure'` (`assertValidId` entity label in `update.ts`/`remove.ts`) | `'paired device'` |
| `'Valid adventure ID is required'` (guard in `get.ts`) | `'Valid paired device ID is required'` |
| `ORDER BY created_at DESC` (`get-all.ts`) | unchanged |

### `index.ts`

Explicit named exports only (`app/db/CLAUDE.md` barrel rule):

```ts
export { create } from './create';
export { get } from './get';
export { getAll } from './get-all';
export { update } from './update';
export { remove } from './remove';
export type { PairedDevice, UpdatePairedDeviceInput } from './types';
```

Also export `CreatePairedDeviceInput` if it lands in `types.ts`.

### Tests

Reference scaffolding: `db/adventure/__tests__/create.test.ts` (module-scope `vi.mock('@tauri-apps/plugin-sql', ...)`, `mockSelect.mockResolvedValue([])` in `beforeEach`, `afterEach` `vi.resetModules()`). The `generateId` mock from the reference is dropped in `create.test.ts` — this table does not use `generateId`. Required tests per file:

- `create.test.ts`: (1) inserts with the supplied EndpointId and returns it — assert `mockExecute` called with SQL containing `INSERT INTO paired_devices` and values containing the 64-char hex literal; (2) sets `created_at`/`updated_at` as ISO 8601 timestamps under fake timers (assert the two timestamp values equal the mocked system time, matching the reference's `values.at(-2)`/`values.at(-1)` pattern); (3) rejects an id that fails the 64-char hex regex — `await expect(create({ id: 'short', name: null })).rejects.toThrow()`; (4) accepts `name: null` — assert the values array contains `null` for the name position.
- `get.test.ts`: substitution of the adventure `get` tests — returns row when found, returns `null` when result set empty, throws `'Valid paired device ID is required'` on empty-string id.
- `get-all.test.ts`: returns all rows; asserts query contains `ORDER BY created_at DESC`.
- `update.test.ts`: updates name; throws on empty id (`'Valid paired device ID is required'` via `assertValidId`); throws when no fields provided (`'At least one field must be provided for update'`).
- `remove.test.ts`: executes DELETE with the id; throws on invalid id.

Adapt assertion strings exactly as listed in the substitution table — the adventure reference tests' structure is otherwise authoritative.

## Cross-SF Wiring

`getDevice`/`updateDevice` and the `paired-device` CRUD have no consumers in this SF; SF4 (`services/devicesService.ts`) imports `* as pairedDeviceDb from '@db/paired-device'` and `{ getDevice, updateDevice } from '@db/_system'`.
