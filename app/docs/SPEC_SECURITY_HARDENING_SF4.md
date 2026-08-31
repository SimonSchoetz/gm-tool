# SF4 — Defense-in-depth

Three independent gaps, none of them exploitable on its own given the rest of the codebase, each removing a layer that currently does real work by accident rather than by design: the asset protocol can read the entire filesystem, the device's network identity key is written with whatever the process umask allows, and values arriving from a peer are never checked against the column types they are about to be written into.

## Files affected

`Modified:`

- `app/src-tauri/tauri.conf.json` — narrow `app.security.assetProtocol.scope`
- `app/src-tauri/src/connectivity/identity.rs` — restrict the device key file mode on Unix
- `app/db/_sync/registry.ts` — carry each table's `zodSchema` on its registry entry, built through a single helper
- `app/db/_sync/apply-upsert.ts` — parse the incoming row against the entry's schema before writing
- `app/db/_sync/__tests__/registry.test.ts` — add one test asserting each entry's schema and column list agree
- `app/db/_sync/__tests__/apply-upsert.test.ts` — add one test for a row whose column value has the wrong type
- `app/docs/_product/domain-scaffold.md` — its Sync Registration section prescribes the literal registry entry shape `{ name: '[plural]', columns: Object.keys([singular]Table.zodSchema.shape) }`, which this sub-feature replaces; update that prescription to the helper call

No barrel change. `app/db/_sync/index.ts` uses explicit named exports and already exports `SYNCED_TABLES` and `SYNCED_TABLE_NAMES` from `./registry`; this sub-feature changes the element type of `SYNCED_TABLES` but adds and removes no export, and `SyncedTable` stays module-private because nothing outside `registry.ts` names the type.

## Rust backend

### `app/src-tauri/tauri.conf.json`

Change `app.security.assetProtocol.scope` from `["**"]` to `["$APPDATA/images/*"]`.

`$APPDATA` in an asset-protocol scope pattern resolves to the same directory `app_handle.path().app_data_dir()` returns in Rust, which is the directory every image command joins `"images"` onto. `["**"]` grants the webview read access to the whole filesystem through the asset protocol; this bounds it to the one directory the app actually serves from.

This is the only change in this sub-feature that is observable in the running app. It is verified by launching `pnpm run dev` and confirming that an entity with an image still renders that image — `getImageUrl` in `app/services/imageService.ts` returns `convertFileSrc(path)`, and a path outside the scope yields a blocked request rather than a thrown error, so a silent blank image is the failure mode to watch for.

### `app/src-tauri/src/connectivity/identity.rs`

In `load_or_create_secret_key`, after the existing `fs::write(&key_path, ...)?` call and before `Ok(secret_key)`, add:

```rust
    // This file is the device's whole network identity, and fs::write leaves it at whatever the process umask allows. Windows has no umask equivalent and its default ACL on a per-user app data directory is already user-scoped, so the tightening is Unix-only by design rather than by omission.
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(&key_path, fs::Permissions::from_mode(0o600))
            .map_err(|e| format!("Failed to restrict device key file permissions: {e}"))?;
    }
```

The `use` sits inside the `cfg`-gated block rather than at file scope, so a Windows build never names a Unix-only trait. `fs` is already imported at the top of the file.

This applies only on the creation path. An existing `device.key` written by an earlier version keeps its current mode; re-permissioning files the app did not just create is out of scope and would need its own migration decision.

## DB changes

### `app/db/_sync/registry.ts`

Add `import { z } from 'zod';` above the existing schema imports.

Replace the `SyncedTable` type and the `SYNCED_TABLES` array body:

```ts
type SyncedTable = {
  name: string;
  columns: string[];
  zodSchema: z.ZodObject;
};

const syncedTable = (
  name: string,
  table: { zodSchema: z.ZodObject },
): SyncedTable => ({
  name,
  columns: Object.keys(table.zodSchema.shape),
  zodSchema: table.zodSchema,
});
```

and build every entry through it, preserving the existing order exactly:

```ts
export const SYNCED_TABLES: SyncedTable[] = [
  syncedTable('images', imageTable),
  syncedTable('adventures', adventureTable),
  syncedTable('sessions', sessionTable),
  syncedTable('npcs', npcTable),
  syncedTable('pcs', pcTable),
  syncedTable('foes', foeTable),
  syncedTable('factions', factionTable),
  syncedTable('locations', locationTable),
  syncedTable('items', itemTable),
  syncedTable('encounters', encounterTable),
  syncedTable('session_steps', sessionStepTable),
  syncedTable('table_config', tableConfigTable),
];
```

The FK-ordering comment above the array stays exactly as it is — the ordering it describes is unchanged and still load-bearing.

The bare `z.ZodObject` annotation is correct: `ZodObject`'s two type parameters are both defaulted and declared `out` (covariant), so the concrete `z.ZodObject<ExtractZodShape<...>>` that `defineTable()` returns is assignable to it with no cast, and `.shape` and `.partial()` remain available on the widened type. This was confirmed by compiling exactly this construct against `app/tsconfig.json` [spec-writer_17: ran `npx tsc --noEmit` from `app/` against a scratch module declaring this `SyncedTable` type and this `syncedTable` helper, assigning `npcTable.zodSchema` and `tableConfigTable.zodSchema` through it and calling `.partial().safeParse(...)` on the result — observed zero errors]. `SYNCED_TABLE_NAMES` at the bottom of the file is unchanged.

### `app/db/_sync/apply-upsert.ts`

In `applyUpsert`, directly after `const filtered = filterToWhitelist(row, entry.columns);` and before `const db = await getDatabase();`, add:

```ts
  // A peer row is untrusted network input, not a row read back from this database — parse it before it reaches SQL. partial() because a peer on a different schema version legitimately omits columns this device knows about, and dropping those rows would be a data-loss bug; a column that is present but carries the wrong type is what this catches.
  if (!entry.zodSchema.partial().safeParse(filtered).success) return 'skipped';
```

`filtered` rather than the parse output is what continues to `executeUpsert`. The two are equivalent here — `filterToWhitelist` has already dropped every key outside `entry.columns`, and Zod's default object config strips unrecognized keys rather than rejecting them — and keeping `filtered` avoids widening the value's type at the call site for no gain.

Placement is above the `tableName === 'table_config'` branch, so the check covers the `table_config` path as well as the generic one.

`id` and `updated_at` have already been checked as non-empty strings by the guard above this line; the schema parse does not replace that check, because it would accept an absent `id` under `.partial()`.

## Services

No change.

## Data Access Layer

No change.

## Frontend

No change.

## Tests

### `app/db/_sync/__tests__/registry.test.ts`

Add one test after `should include id and updated_at in every table entry`:

`should expose a schema whose shape matches the column list for every table` — iterate `SYNCED_TABLES` and, for each entry, assert `expect(Object.keys(table.zodSchema.shape)).toEqual(table.columns)`. This is the invariant the `syncedTable` helper exists to guarantee, and it is the one that would break if a future entry were hand-written as an object literal with a mismatched pair.

The existing `toHaveLength(12)` and `Set` size assertions stay at 12 — no table is added or removed here.

### `app/db/_sync/__tests__/apply-upsert.test.ts`

Add one test after the rejection test SF1 added:

`should skip a row whose column value has the wrong type` — call `applyUpsert('npcs', { ...NPC_ROW, name: 42 }, false)`. Assert the result is `'skipped'` and `expect(mockExecute).not.toHaveBeenCalled()`. `npcs.name` is declared `z.string().optional()` on `npcTable.zodSchema`, so a number is rejected by the per-key check while `.partial()` still permits the row's absent columns.

`mockSelect` is not asserted on for this test: the parse runs before `getDatabase()` but the file's `beforeAll` already warms that singleton, and the local-row lookup that would otherwise call `mockSelect` sits below the parse, so asserting on it would duplicate what the `mockExecute` assertion already establishes.

Every existing test in the file continues to pass under the new parse: `NPC_ROW` carries `id`, `adventure_id`, `name`, and `updated_at`, all strings, and `npcTable.zodSchema` declares `id` and `adventure_id` as `z.string()`, `name` as `z.string().optional()`, and `updated_at` as `z.string()`. The `table_config` fixture carries `tagging_enabled: 1` against `z.number()`, `scope: 'adventure'` against `z.enum(['adventure', 'global'])`, and `layout: '{}'` against `z.string()`. The two tests that pass `id: undefined` and `updated_at: undefined` return before reaching the parse.

## Long-lived reference document

`app/docs/_product/domain-scaffold.md`'s Sync Registration section currently instructs that `db/_sync/registry.ts` needs a `{ name: '[plural]', columns: Object.keys([singular]Table.zodSchema.shape) }` entry added to `SYNCED_TABLES`. Replace that entry shape with `syncedTable('[plural]', [singular]Table)`, and keep the rest of the section — the placement rule (after `adventures`, before `table_config`, per the file's own ordering comment), the contrast against the migration's frozen trigger copy, and the note that `registry.test.ts` asserts an exact synced-table count and an `ADVENTURE_SCOPED_TABLES` list — unchanged. `domain-scaffold.md` is a long-living infrastructure reference, not a CLAUDE.md file, so this edit is made directly as part of this sub-feature rather than recorded as a deferred fact.
