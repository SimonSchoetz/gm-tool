# SF5 — Base entity, content section, image, paired device and table config

Replacing an image no longer destroys the old one when the new file cannot be saved. The remaining five db modules' tests move onto the harness, three more `get.ts` files stop duplicating the shared id check, and `table-config`'s row type is declared once.

## Files affected

- Modified: `app/db/image/replace.ts` — create the new image first, remove the old one only after that succeeds.
- Modified: `app/db/image/get.ts` — the inline `!id` check (get.ts:5-7) replaced by `assertValidId(id, 'image')`; the message becomes `Valid image ID is required`, and a whitespace-only id is now rejected like everywhere else.
- Modified: `app/db/paired-device/get.ts` — the inline check (get.ts:5-7) replaced by `assertValidId(id, 'paired device')`; message unchanged.
- Modified: `app/db/table-config/get.ts` — the inline check (get.ts:10-12) replaced by `assertValidId(id, 'table config')` (message unchanged); the local `TableConfigRow` alias (:7) replaced by the one from `./types`.
- Modified: `app/db/table-config/get-all.ts` — the local `TableConfigRow` alias (:7) replaced by the one from `./types`.
- Modified: `app/db/table-config/types.ts` — `TableConfigRow` (:5) becomes `export type`.
- Modified: `app/db/base-entity/__tests__/create.test.ts`, `duplicate.test.ts`, `get.test.ts`, `get-all.test.ts`, `update.test.ts`, `remove.test.ts` — rewritten on the harness.
- Modified: `app/db/base-entity-content-section/__tests__/create.test.ts`, `duplicate-by-base-entity.test.ts`, `get-all-by-base-entity.test.ts`, `update.test.ts`, `remove.test.ts` — rewritten on the harness.
- Modified: `app/db/image/__tests__/create.test.ts`, `duplicate.test.ts`, `remove.test.ts`, `replace.test.ts`, `update.test.ts` — rewritten on the harness.
- Modified: `app/db/image/__tests__/get.test.ts` — rewritten on the harness; its `toThrow('Image ID is required')` assertion (get.test.ts:61) goes with the rewrite, because `assertValidId` is tested only in `db/util/__tests__/`.
- Modified: `app/db/paired-device/__tests__/create.test.ts`, `get.test.ts`, `get-all.test.ts`, `update.test.ts`, `remove.test.ts` — rewritten on the harness.
- Modified: `app/db/table-config/__tests__/create.test.ts`, `get.test.ts`, `get-all.test.ts`, `update.test.ts` — rewritten on the harness.

No barrel changes: the five modules' `index.ts` files keep their explicit named exports, which satisfy `app/db/CLAUDE.md` — Conventions; `TableConfigRow` stays out of `db/table-config/index.ts` because only files inside the module use it.

## Database

### `app/db/image/replace.ts`

Per the root KAD "Image replacement creates the new image before it removes the old one": swap the two statements at replace.ts:9-10, so the body reads `const newId = await create(data);` then `await remove(oldId);`, then `return newId;`. The signature is unchanged. `create` validates the extension and copies the file before inserting its row, so a failure there leaves the old image untouched. `imageService.replaceImage` (app/services/imageService.ts) needs no change.

### `get.ts` × 3

Each inline id check becomes the shared call, imported from `../util` like each module's `update.ts` does (root KAD "What a db test asserts"). `db/image/get.ts`'s message changes from `Image ID is required` to `Valid image ID is required`; the only code that matches on the old text is the test assertion this SF rewrites [spec-writer_43: grep `Image ID is required` app/src app/services app/domain app/db app/util — found only `app/db/image/get.ts:6` and `app/db/image/__tests__/get.test.ts:61`].

### `TableConfigRow` declared once (`db/table-config`)

`types.ts:5`, `get.ts:7` and `get-all.ts:7` each declare `type TableConfigRow = z.infer<typeof tableConfigTable.zodSchema>`. `types.ts` exports its declaration; `get.ts` and `get-all.ts` import it with `import type { TableConfig, TableConfigRow } from './types';` and delete their own, and drop the `z` and `tableConfigTable` imports that no longer have a use there (tsc's `noUnusedLocals` flags any left behind). This is the active check on files this SF touches (root `CLAUDE.md` — Best Practices & Code Quality, "Active check on touched files"), applying the shared rule on reusing one definition.

### Shared test wiring

Every test file below uses the root KAD's harness wiring — including the dynamic import of every `@db/...` module a test calls, parent-row creators and `@db/pinned-order` as well as the unit — its clock control and its invalid-input cast (`UpdateBaseEntityInput`, `UpdateBaseEntityContentSectionInput`, `CreateTableConfigInput` and `UpdateTableConfigInput`, each from its module's barrel). Every row asserting timestamps "equal to T2" sets the clock to T1 before creating and updating the source and to a later T2 before the duplicate, and asserts T2's ISO string. A test that expects a column to be copied, reset or cleared first gives the source a non-default value. Files that exercise image commands (`image/__tests__/*` and any test here that creates an image through `@db/image`) also mock the Tauri invoke bridge at top level with a typed spy shared through `vi.hoisted`:

```ts
const invoke = vi.hoisted(() =>
  vi.fn<
    (command: string, args?: Record<string, unknown>) => Promise<unknown>
  >(),
);
vi.mock('@tauri-apps/api/core', () => ({ invoke }));
```

`beforeEach` sets one implementation that answers per command with `Promise.resolve(...)` (no `async` function, per the root KAD): `save_image` resolves `1234` (the file size), `read_image_bytes` resolves `'aW1hZ2U='`, and `save_image_bytes` and `delete_image` resolve `undefined`. With the file commands mocked, `invoke` is a mocked collaborator: the arguments the image functions compute for it — the id and extension of the stored row — and the order of their calls are part of what these tests assert (shared rules file, Best Practices & Code Quality, the rule beginning "A test earns its place by the regression it catches"). An image that a test needs only as an existing row — a foreign-key target, or the "old" image of a replace — is inserted with SQL, so the only `invoke` calls a test sees are the ones the function under test makes.

#### Base entity

| File | Test | Defect it catches |
| --- | --- | --- |
| `create.test.ts` | `create('npcs', adventureId)` stores `entity_type` `'npcs'`, the adventure id, and the name `New`, a space, `entityTypeLabel('npcs')`, a space, and `getDateTimeString` of the frozen creation time | a wrong type or label in the stored row |
| `create.test.ts` | an adventure id with no adventure is rejected | the foreign key not enforced |
| `duplicate.test.ts` | with the source given `description` `'d'`, `image_id` of one `images` row and `pinned_order` 2 (through `setPinnedOrder('npcs', id, 2)`), duplicating with a second image's id stores a new entity of the same type and adventure with a fresh id, `description` `'d'`, `image_id` equal to the second image's id, `null` `name` and `pinned_order`, and both timestamps equal to T2 | the source's image reused (two entities sharing, and later deleting, one file), a column the duplicate must reset copied, or the source's timestamps reused |
| `duplicate.test.ts` | the source entity is unchanged afterwards, timestamps included | the duplicate writing to its source |
| `duplicate.test.ts` | duplicating an `'npcs'` id as `'pcs'` rejects with the message `entityTypeLabel('pcs')` + ` not found: ` + the id | the source read without its type filter, duplicating across types |
| `get.test.ts` | with two NPCs stored, `get('npcs', id)` of the later-created one returns it, and `get('pcs', thatId)` returns `null` | a dropped `WHERE id`, or the `entity_type` filter missing so one type's row shows under another's route |
| `get-all.test.ts` | returns only the adventure's entities of the given type, most recently created first (two adventures, NPCs and PCs, created at frozen times out of insertion order) | a missing type or adventure filter, or a wrong `ORDER BY` |
| `update.test.ts` | an `entity_type` of `'bogus'` is rejected and the row is unchanged | the type validation removed |
| `update.test.ts` | with `description` and `image_id` first set, `description: null` and `image_id: null` clear both | `null` treated as "not provided" |
| `remove.test.ts` | removing an entity deletes its content sections and leaves another entity and its sections | the cascade to `base_entity_content_sections` missing, or a DELETE without `WHERE` |

#### Base entity content section

| File | Test | Defect it catches |
| --- | --- | --- |
| `create.test.ts` | a section created without `name` is stored with its `type` and `sort_order`, `null` `name` and `content`, and `checked` 0 | the `checked` default lost or a missing name written as a value |
| `create.test.ts` | a section created with `name` stores it | the optional name dropped |
| `create.test.ts` | a `base_entity_id` with no base entity is rejected | the foreign key not enforced |
| `duplicate-by-base-entity.test.ts` | with two source sections given `name`, `content` `'c'` and `checked` 1, every section is copied to the target entity with a fresh id, the same `name`, `type`, `content`, `checked` and `sort_order`, and both timestamps equal to T2 (source and target differ; the target starts empty) | reading the target instead of the source, reusing ids or timestamps, or dropping a column `create` cannot set |
| `duplicate-by-base-entity.test.ts` | the source's sections are unchanged afterwards | moving instead of copying |
| `get-all-by-base-entity.test.ts` | returns only the entity's sections in ascending `sort_order` (inserted 2, 0, 1, plus another entity's section) | a missing filter or `ORDER BY sort_order`; the first `'text'` section is the displayed summary |
| `update.test.ts` | a `type` of `'bogus'` is rejected and the row is unchanged | the type enum validation removed |
| `update.test.ts` | with `checked` 1 and `content` `'c'` first set, `checked: 0` is written and `content: null` clears the content | falsy values dropped, or `null` treated as "not provided" |
| `remove.test.ts` | removes only the given section | a DELETE without `WHERE id` |

#### Image

| File | Test | Defect it catches |
| --- | --- | --- |
| `create.test.ts` | `create({ filePath: '/pics/Photo.JPG' })` stores `file_extension` `'jpg'`, `original_filename` `'Photo.JPG'` and `file_size` 1234, and called `save_image` with `{ sourcePath: '/pics/Photo.JPG', id: <the stored row's id>, extension: 'jpg' }` | an upper-case extension rejected or stored as-is, or the file saved under a different id than its row |
| `create.test.ts` | an unsupported extension (`.pdf`) rejects with `Unsupported file extension: pdf`, stores no row and never calls `save_image` | validation after the file copy, leaving stray files |
| `create.test.ts` | when `save_image` rejects, no row is stored | a row pointing at a file that was never saved |
| `duplicate.test.ts` | the source (inserted with SQL with `file_extension` `'png'`, `original_filename` `'src.png'`, `file_size` 999 — distinct from the mocked `save_image` result 1234 — and non-null `frame_x`, `frame_y`, `frame_zoom`, with T1 timestamps) is copied to a new row with a fresh id, the same `file_extension`, `original_filename`, `file_size` and frame values, and both timestamps equal to T2; `read_image_bytes` was called with the source's id and extension and `save_image_bytes` with the new id, the same extension and the bytes read | the copy saved under the source's id (overwriting its file), with the wrong extension, without its framing, with a size taken from a save command instead of the source row, or with the source's timestamps |
| `duplicate.test.ts` | the source row is unchanged afterwards, timestamps included | the duplicate writing to its source |
| `duplicate.test.ts` | an unknown source id rejects with `Image not found: <id>` | a silent no-op |
| `get.test.ts` | with two images stored, returns the one whose id is passed, and `null` for an id with no image | a dropped `WHERE id`, or `undefined` for a missing row |
| `remove.test.ts` | deletes the row and calls `delete_image` with the row's id and `file_extension`; a base entity and an adventure that referenced it now have `image_id` `null` | the file left on disk, the wrong file deleted, or the foreign key's `SET NULL` missing |
| `remove.test.ts` | an unknown id deletes nothing and never calls `delete_image` | deleting a file for a row that does not exist |
| `replace.test.ts` | with the old image inserted with SQL, replacing with a valid file returns a new id, stores the new row, deletes the old row, and `invoke.mock.calls.map(([command]) => command)` equals `['save_image', 'delete_image']` | removing first, so a failed save loses the old image |
| `replace.test.ts` | replacing with an unsupported extension rejects, keeps the old row, and never calls `delete_image` | the old image destroyed when the new file is rejected |
| `replace.test.ts` | when `save_image` rejects, the old row is kept and `delete_image` is never called | the old image destroyed when copying the new file fails |
| `replace.test.ts` | when `delete_image` rejects, `replace` rejects with that error and the new row exists | the removal error swallowed, so `replace` returns an id as if the replacement were clean |
| `update.test.ts` | writes `frame_x`, `frame_y` and `frame_zoom`, and with all three set, `null` for all three clears them | a frame value bound to the wrong column, or `null` not clearing a frame |

#### Paired device

Device ids are 64 lowercase hex characters.

| File | Test | Defect it catches |
| --- | --- | --- |
| `create.test.ts` | stores the given id and name; with `name: null` the name is `null` | the caller's id replaced by a generated one (the device would never match its peer) |
| `create.test.ts` | a non-hex id is rejected and no row is stored | an invalid peer id persisted |
| `create.test.ts` | creating the same id twice rejects the second | a duplicate pairing row |
| `get.test.ts` | with two devices stored, returns the one whose id is passed, and `null` for an unknown id | a dropped `WHERE id`, or `undefined` for a missing row |
| `get-all.test.ts` | returns devices most recently created first (created at frozen times out of insertion order) | a missing or reversed `ORDER BY` |
| `update.test.ts` | writes a new name, and with a name set, `name: null` clears it | `null` treated as "not provided" |
| `remove.test.ts` | removes only the given device | a DELETE without `WHERE id` |

#### Table config

A fresh database already holds the nine configs the seed and encounters migrations write. The stored layout is read raw — `JSON.parse` of the `layout` column selected with `db.select` — wherever a test checks what was stored, because `get` and `getAll` re-parse it through `parseLayoutFromRow`, which would strip an unknown key on the way out even if one had been stored.

| File | Test | Defect it catches |
| --- | --- | --- |
| `create.test.ts` | a config created for table `'custom'` without `tagging_enabled` or `scope` is stored with `tagging_enabled` 1 and `scope` `'adventure'`, and its raw stored layout lacks a key the layout schema does not define | a create that overrides the database defaults, or stores unvalidated layout JSON |
| `create.test.ts` | creating a config for `'npcs'`, which the seed already has, is rejected | the unique index on `table_name` missing, duplicating a list config |
| `create.test.ts` | a layout with a `null` column width rejects with an error starting `Invalid layout` and stores no row | an invalid layout persisted, breaking the list screen |
| `get.test.ts` | returns the config whose id is passed with its layout parsed, and `null` for an unknown id | a dropped `WHERE id`, the layout returned as a raw string, or `undefined` for a missing row |
| `get-all.test.ts` | returns the nine seeded configs ordered by `table_name` ascending | a missing `ORDER BY table_name` |
| `update.test.ts` | `tagging_enabled: 0` is written over 1, and `tagging_enabled: 2` is rejected with the row unchanged | a falsy value dropped, or the 0–1 bound removed |
| `update.test.ts` | a new valid layout is stored (raw) without its unknown keys, and an invalid one rejects with `Invalid layout` and leaves the stored layout unchanged | an unvalidated layout reaching the database |
