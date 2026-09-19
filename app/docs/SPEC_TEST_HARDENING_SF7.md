# SF7 — Remaining db tests

The last db tests move onto the harness — settings, system values, mention search, pinned order and `ensureColumn` — and the pure `db/util` tests lose their duplicates and gain the cases they missed. Two test files that only exercised internal pass-throughs are deleted, and the `generateId` tests shrink to the one that guards a cross-language contract. No production code changes.

## Files affected

- Modified: `app/db/_settings/__tests__/get.test.ts`, `update.test.ts` — rewritten on the harness.
- Modified: `app/db/_system/__tests__/device.test.ts`, `versioning.test.ts` — rewritten on the harness.
- Modified: `app/db/_system/__tests__/get.test.ts` — delete the file.
- Modified: `app/db/_system/__tests__/update.test.ts` — delete the file.
- Modified: `app/db/__tests__/mention-search.test.ts`, `pinned-order.test.ts` — rewritten on the harness.
- Modified: `app/db/util/__tests__/ensure-column.test.ts` — rewritten on the harness.
- Modified: `app/db/util/__tests__/build-create-query.test.ts`, `build-update-query.test.ts`, `build-duplicate-query.test.ts`, `validation.test.ts`, `generate-db-timestamps.test.ts` — pure unit tests, trimmed and extended as below.
- Modified: `app/db/util/__tests__/generate-id.test.ts` — reduced to one test.
- Modified: `app/db/util/schema/__tests__/define-table.test.ts` — the zod assertions replaced as below.

`_system`'s `get` and `update` are internal helpers: `db/_system/index.ts` does not export them, and `_system/` is an infrastructure directory, not a domain directory (`app/db/CLAUDE.md` — Structure, :5). `app/db/CLAUDE.md` — Testing's per-function obligation covers public functions of domain directories (:83), so it does not require their test files; `device.ts` and `versioning.ts`, the only functions that call them, exercise them on a real database.

## Database

### Harness tests

Every file in this section uses the root KAD's harness wiring and clock control, except `ensure-column.test.ts`, which departs from the root KAD "Test-file wiring under Vitest 5" as that KAD names: first line `// @vitest-environment node`, no `vi.mock`; each test calls `openTestDatabase()`, creates its own table with `db.execute('CREATE TABLE …')`, and passes the database to `ensureColumn` directly (SF2).

#### `_settings`

| File | Test | Defect it catches |
| --- | --- | --- |
| `get.test.ts` | returns the seeded `background` setting as `{ animation_enabled: true }` | the stored JSON not parsed through its schema |
| `get.test.ts` | returns `null` after the `background` row is deleted with SQL | a missing row crashing the settings screen |
| `get.test.ts` | a stored value that fails the schema (`'{"animation_enabled":"yes"}'`, written with SQL) rejects | a malformed setting reaching the UI as the wrong type |
| `update.test.ts` | `updateSetting('background', { animation_enabled: false })` is returned by the next `getSetting('background')` | the value written under another key or not serialized |
| `update.test.ts` | a value that fails the schema rejects and the stored value is unchanged | an invalid setting persisted, making every later read fail |

#### `_system`

Device ids are 64 lowercase hex characters (`ENDPOINT_ID_HEX_REGEX`, app/domain/devices/identity.ts:2).

| File | Test | Defect it catches |
| --- | --- | --- |
| `device.test.ts` | `getDevice()` returns `null` on a fresh database | a missing device row crashing connectivity start-up |
| `device.test.ts` | a `device` row whose `value` is SQL `NULL`, inserted with SQL, makes `getDevice()` return `null` | a `NULL` value (`_system.value` is nullable and `_system`'s `update` accepts `null`) parsed as JSON and rejected instead of read as "no device" |
| `device.test.ts` | `updateDevice({ id, name })` is returned by `getDevice()` | the device identity not persisted, so the device changes identity on restart |
| `device.test.ts` | `updateDevice` with a non-hex id rejects and `getDevice()` still returns `null` | an invalid id stored, after which every `getDevice()` throws |
| `device.test.ts` | a stored device `'{"id":"not-hex","name":null}'`, written with SQL, makes `getDevice()` reject | a corrupt identity accepted and handed to connectivity |
| `versioning.test.ts` | `getVersioning()` returns the seeded `{ snoozed_update_version: null }` | the seeded row not parsed |
| `versioning.test.ts` | `getVersioning()` returns `null` after the `versioning` row is deleted with SQL | a missing row crashing the update check |
| `versioning.test.ts` | a stored `'{"wrong_field":true}'`, written with SQL, makes `getVersioning()` reject | a malformed stored value accepted |
| `versioning.test.ts` | `updateVersioning({ snoozed_update_version: '1.2.3' })` is returned by `getVersioning()`, and `updateVersioning` with `snoozed_update_version: 1` (passed `as unknown as VersioningData`) rejects and leaves the stored value unchanged | a snoozed update not remembered, or an invalid value persisted |

#### `mention-search.test.ts`

Fixture, with names set through each module's `update` and `updated_at` set by the frozen clock: adventures A and B, whose names contain `dra` — A is created first and also updated first — and a third adventure whose name does not; in adventure A, two NPCs whose names contain `dra` — the one created first is also updated first, so the expected most-recently-updated-first order is the reverse of insertion order — one NPC whose name does not, and one PC whose name contains `dra`; in adventure B, one NPC whose name contains `dra`; and one session whose name contains `dra` in each adventure. Every matching name has `dra` after its first character (for example `Hydra`, `Alexandra`), so a prefix-only pattern finds nothing.

| Test | Defect it catches |
| --- | --- |
| `searchByName('npcs', 'dra', adventureA)` returns `{ id, name, updated_at }` of exactly adventure A's two matching NPCs, most recently updated first | a missing type or adventure filter, substring matching narrowed to a prefix, or a missing `ORDER BY updated_at DESC` (insertion order is the reverse of the expected order) |
| with `adventureId` `null` it returns the matching NPCs of both adventures and no PC | the global scope still filtering by adventure, or dropping the type filter |
| `searchByName('sessions', 'dra', adventureA)` returns only adventure A's matching session | a non-base type routed to `base_entities` or unscoped |
| `searchByName('adventures', 'dra', null)` returns adventures B and A, in that order | the non-base global path querying the wrong table, filtering by adventure, or missing its `ORDER BY` |
| a type that is not an entity type (`'images'`) returns `[]` | a caller-supplied name interpolated into the FROM clause |
| `getById('npcs', npcId)` returns its row; `getById('pcs', npcId)` and `getById('images', anyId)` return `null` | the type filter missing, exposing one type's row as another, or an arbitrary table queried |
| `getById('sessions', sessionId)` returns its row | the non-base lookup broken, so session mentions render as deleted |

`'adventures'` is not searched with an adventure id (root KAD "A latent SQL error in pinned order stays out of reach and untested").

#### `pinned-order.test.ts`

Every pinned row a test must ignore has a higher `pinned_order` than the expected result, so a missing filter changes the answer.

| Test | Defect it catches |
| --- | --- |
| `getMaxPinnedOrder('npcs', id)` returns the highest `pinned_order` among pinned NPCs of that entity's adventure, ignoring higher-pinned PCs in the same adventure and higher-pinned NPCs in another | the maximum taken across types or adventures, so a new pin lands after the wrong list's items |
| `getMaxPinnedOrder('npcs', id)` returns `null` when no NPC in the adventure is pinned | returning 0, so the first pin gets position 1 instead of 0 |
| `getMaxPinnedOrder('sessions', id)` returns the highest `pinned_order` among the session's adventure's sessions, ignoring a higher-pinned session in another adventure and a higher-pinned NPC in the same adventure | the non-base path querying the wrong table or scope |
| `setPinnedOrder('npcs', id, 3)` stores 3 and `setPinnedOrder('npcs', id, null)` clears it, for that row only | pin or unpin written to another row |
| `setPinnedOrder('sessions', id, 2)` stores 2 for that session only | a non-base pin written to the wrong table or row |

`'adventures'` is not exercised (root KAD "A latent SQL error in pinned order stays out of reach and untested").

#### `util/__tests__/ensure-column.test.ts`

| Test | Defect it catches |
| --- | --- |
| on a table without the column, `ensureColumn` adds it (`PRAGMA table_info` lists it) | the `ALTER` not run |
| on a table that already has the column, `ensureColumn` resolves and the table is unchanged | the `ALTER` re-run and failing, since SQLite's `ADD COLUMN` has no `IF NOT EXISTS` (`.claude/knowledge/sqlite.md` — "SQLite's ALTER TABLE supports no IF NOT EXISTS modifier on ADD COLUMN") |

### Pure `db/util` tests

These keep the default environment and no `vi.mock`.

- `build-create-query.test.ts`: delete the test at :36, which repeats :5. Keep the other three.
- `build-update-query.test.ts`: delete the test at :54, which repeats :25. Add: an explicit `null` value is kept in the `SET` list and bound as `null` — catches a `value != null` filter that would make clearing a field impossible.
- `build-duplicate-query.test.ts`:
  - Replace the test at :34 (`null ?? null`, language behavior) with: copied values `0` and `''` stay `0` and `''` — catches a `||` fallback turning falsy values into `null`.
  - Rewrite the test at :70 so `copiedColumns` holds stale `created_at` and `updated_at` values ahead of another column, and assert the whole `sql` and `values` with `toBe`/`toEqual` — the stale keys keep their early position in the spread, so reading the last two values would check the wrong column. Catches: the spread order letting copied timestamps win.
  - Add: an override for a column that is also in `copiedColumns` wins — catches overrides applied before the copy.
- `validation.test.ts`: delete the test at :43, which repeats :37. Add: `assertHasUpdateFields({ name: null })` does not throw — catches clearing a field being rejected as "no fields".
- `generate-db-timestamps.test.ts`: delete the test at :22, which the test at :14 already covers.
- `generate-id.test.ts`: keep only the test that `generateId()` matches `/^[A-Za-z0-9_-]+$/` (:28-34) and delete the other four, which check nanoid's own length and uniqueness. Rename the kept test and replace its comment `// nanoid uses A-Za-z0-9_- characters` (:31) so both name the contract it guards instead of nanoid: `generateId` names image files, and `is_valid_image_id` in `app/src-tauri/src/commands/images/mod.rs` and `IMAGE_ID_REGEX` in `app/domain/sync/messages.ts` accept only `[A-Za-z0-9_-]`. The kept one guards a contract across the TypeScript/Rust boundary: `generateId` names image files (`db/image/create.ts:24`, `db/image/duplicate.ts:14`), and the Rust image commands accept only `[A-Za-z0-9_-]` ids (app/src-tauri/src/commands/images/mod.rs:20-25), as does `IMAGE_ID_REGEX` (app/domain/sync/messages.ts:5) — a generator producing any other character would make every image save fail.

### `app/db/util/schema/__tests__/define-table.test.ts`

Keep the existing assertions on `table.name` and `createTableSQL`. Replace the `toBeDefined` assertions on the zod schemas with tests on `updateSchema`, the part the nine `update.ts` files use. The fixture gets five columns: `id` (`type: 'TEXT'`, `primaryKey: true`, `zod: z.string()` — its `.optional()` is removed, per `app/db/CLAUDE.md` — Conventions, "No `zodSchema` field carries `.optional()`"), `name` (`type: 'TEXT'`, `notNull: true`, `zod: z.string().min(1)`, which the kept `toContain('name TEXT NOT NULL')` assertion needs), a column with `type: 'INTEGER'`, `zod: z.number()` and `updateZod: z.number().max(1)`, and `created_at` and `updated_at`, each `type: 'TEXT'`, `zod: z.string()`.

| Test | Defect it catches |
| --- | --- |
| `updateSchema`'s keys are exactly the fixture's columns minus `id`, `created_at` and `updated_at` | an update able to change a row's id or timestamps |
| `updateSchema.parse({})` succeeds | an update requiring every column |
| the column with `updateZod` rejects `2` in `updateSchema` although its `zod` accepts it | `updateZod` ignored, dropping update-only bounds such as `tagging_enabled`'s 0–1 |
