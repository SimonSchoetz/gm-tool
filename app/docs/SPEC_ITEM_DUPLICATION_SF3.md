# SF3 — Image duplication

Adds the ability to copy a stored image — both its file on disk and its row — so that a duplicated entity owns its image outright and neither record's deletion affects the other.

## Files affected

**New:**

- `app/db/image/duplicate.ts`
- `app/db/image/__tests__/duplicate.test.ts`

**Modified:**

- `app/db/image/index.ts` — add `export { duplicate } from './duplicate'`, matching the existing explicit-named-export style
- `app/services/imageService.ts` — add `duplicateImage`
- `app/domain/images/errors.ts` — add `imageDuplicateError`
- `app/domain/images/index.ts` — add the two new exports alongside the existing `ImageUpdateFrameError` pair
- `app/domain/index.ts` — add `ImageDuplicateError` and `imageDuplicateError` to the `./images` export blocks. Required, not optional: `imageService.ts` imports its error factories from `@domain`, not from `@domain/images`

## DB layer

### `db/image/duplicate.ts`

Exports `duplicate(sourceId: string): Promise<string>`, returning the new image id.

Model the file on `db/image/create.ts`, which is the closest existing reference — same imports, same `buildCreateQuery` usage, same `getDatabase` call. It differs in where the file bytes and the row values come from:

- `create.ts` derives `file_extension`, `original_filename`, and `file_size` from a source path on the user's filesystem and invokes `save_image`, which returns the byte count.
- `duplicate.ts` reads them from the source row, and copies the bytes with two invocations instead of one.

Sequence:

1. `assertValidId(sourceId, 'image')`.
2. Read the source row. `db/image/get.ts` already exports `get(id): Promise<Image | null>`; call it rather than issuing a second `SELECT`. Throw `new Error(\`Image not found: ${sourceId}\`)` when it returns `null` — this is an internal invariant with no caller expected to narrow it by type, which `app/CLAUDE.md` exempts from the error-factory requirement.
3. `generateId()` for the new id.
4. `invoke<string>('read_image_bytes', { id: sourceId, extension: source.file_extension })` → base64 string.
5. `invoke('save_image_bytes', { id, extension: source.file_extension, dataBase64 })`. This command returns `()` on the Rust side, so there is no value to capture — unlike `save_image`, which is why `file_size` comes from the source row rather than from the call.
6. `generateDbTimestamps()` for fresh `created_at` / `updated_at`.
7. `buildCreateQuery` against `'images'` with the new id, copying `file_extension`, `original_filename`, `file_size`, `frame_x`, `frame_y`, and `frame_zoom` from the source row, plus the fresh timestamps.

`frame_x`, `frame_y`, and `frame_zoom` must be in the INSERT. Nothing writes them at create time — only `imageService.updateImageFrame` does — so a duplicate that omits them loses the crop and zoom the user set on the original. This is the one place where the entity-level "copy every field" requirement is not satisfied by copying the entity row alone.

`buildCreateQuery`'s type parameter constrains values to `string | number | null`. The three framing columns are `REAL` typed `z.number().nullable().optional()`, and `original_filename` and `file_size` are similarly nullable, so declare the explicit type argument accordingly to keep excess property checking active — the pattern `create.ts` already uses.

## Service layer

### `services/imageService.ts`

Add:

```ts
export const duplicateImage = async (sourceId: string): Promise<string> =>
  imageDb.duplicate(sourceId);
```

Wrap in try/catch throwing `imageDuplicateError(cause)`, per `app/services/CLAUDE.md`'s rule that every exported service function wraps its DB calls and never re-throws raw DB errors. Note that the two existing single-call functions in this file — `createImage` and `replaceImage` — do not wrap; they are pre-existing violations of that rule and are not in scope to fix here, but do not copy their shape. `updateImageFrame` in the same file is the compliant reference.

## Domain layer

### `domain/images/errors.ts`

Add `ImageDuplicateError` / `imageDuplicateError(cause?: unknown)` following the factory-function pattern already used by `imageUpdateFrameError` in the same file. Message: `` `Failed to duplicate image: ${String(cause)}` ``.

## Tests

### `db/image/__tests__/duplicate.test.ts`

Follow the setup in the sibling `db/image/__tests__/` files: `vi.mock('@tauri-apps/plugin-sql', ...)` at module scope, `afterEach(() => { vi.resetModules(); })`, static top-level import of the function under test, and `mockSelect.mockResolvedValue([])` in `beforeEach` before anything calls `getDatabase()`. `invoke` from `@tauri-apps/api/core` must also be mocked.

Required assertions, one per distinct path:

- `copies the source row's framing values into the new row` — the `buildCreateQuery`-produced INSERT carries `frame_x`, `frame_y`, and `frame_zoom` from the source row. Assert on the values array passed to `mockExecute`.
- `takes file_size from the source row, not from the save command` — `save_image_bytes` is mocked resolving `undefined`; assert the inserted `file_size` equals the source row's.
- `reads and writes the file with the source's extension` — assert `invoke` was called with `('read_image_bytes', { id: sourceId, extension: <source ext> })` and then `('save_image_bytes', { id: <new id>, extension: <source ext>, dataBase64: <read result> })`. One matcher argument per call-site argument, in position order.
- `generates fresh timestamps rather than copying the source's` — the inserted `created_at` and `updated_at` differ from the source row's.
- `throws when the source image does not exist` — `get` resolves `null`; assert the thrown message is `Image not found: <sourceId>`.
