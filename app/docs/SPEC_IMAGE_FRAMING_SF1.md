# SF1 — DB Layer: Image Frame Columns

Add three nullable frame columns to the `images` table and introduce an `update` DB function that writes them.

## Files Affected

Modified:
- `app/db/image/schema.ts`
- `app/db/image/types.ts`
- `app/db/image/index.ts`

New:
- `app/db/image/update.ts`
- `app/db/image/__tests__/update.test.ts`

## DB Changes

### `app/db/image/schema.ts`

Add three columns to `imageTable` inside the `columns` object, after `file_size`:

```ts
frame_x: {
  type: 'REAL',
  zod: z.number().nullable().optional(),
},
frame_y: {
  type: 'REAL',
  zod: z.number().nullable().optional(),
},
frame_zoom: {
  type: 'REAL',
  zod: z.number().nullable().optional(),
},
```

All three are nullable and optional. `defineTable` auto-generates the `updateSchema` making them optional update fields. No `NOT NULL`, no `DEFAULT` — null means no framing applied.

The `z.infer<typeof imageTable.zodSchema>` (`Image` type) will gain:
- `frame_x?: number | null`
- `frame_y?: number | null`
- `frame_zoom?: number | null`

Existing consumers of `Image` that omit these fields remain valid (optional fields).

### `app/db/image/types.ts`

Add `UpdateImageFrameInput` after `CreateImageInput`:

```ts
export type UpdateImageFrameInput = {
  frame_x: number | null;
  frame_y: number | null;
  frame_zoom: number | null;
};
```

This type is the DB-layer input for a frame update. All three fields are required together (no partial frame update).

### `app/db/image/update.ts` (new)

```ts
import { getDatabase } from '../database';
import { assertValidId, assertHasUpdateFields, buildUpdateQuery } from '../util';
import { imageTable } from './schema';
import type { UpdateImageFrameInput } from './types';

export const update = async (
  id: string,
  data: UpdateImageFrameInput,
): Promise<void> => {
  assertValidId(id, 'image');
  assertHasUpdateFields(data);

  const validated = imageTable.updateSchema.parse(data);
  const db = await getDatabase();
  const { sql, values } = buildUpdateQuery('images', id, validated);

  await db.execute(sql, values);
};
```

`buildUpdateQuery` skips `undefined` values and appends `updated_at` automatically. Since all three frame fields are passed as `number | null` (never `undefined`), all three are included in the UPDATE statement. `assertHasUpdateFields` passes because at least one value is not `undefined`.

### `app/db/image/index.ts`

Add two explicit named exports:

```ts
export { update } from './update';
export type { UpdateImageFrameInput } from './types';
```

Full barrel after changes:

```ts
export { create } from './create';
export { get } from './get';
export { remove } from './remove';
export { replace } from './replace';
export { update } from './update';
export type { Image, CreateImageInput, UpdateImageFrameInput } from './types';
```

## Test

### `app/db/image/__tests__/update.test.ts` (new)

Follow the exact mock setup from `app/db/image/__tests__/get.test.ts`: `vi.mock` at module scope before any imports, `vi.fn()` for `mockExecute` and `mockSelect`, `beforeEach` with `vi.clearAllMocks()` + `mockExecute.mockResolvedValue({ lastInsertId: 0 })` + `mockSelect.mockResolvedValue([])`, `afterEach` with `vi.resetModules()`. Import `update` after the mock declaration.

Test cases:

1. **Updates frame successfully** — call `update('test-id', { frame_x: 50, frame_y: 25, frame_zoom: 2.0 })`, assert `mockExecute` was called once, assert the SQL contains `frame_x`, `frame_y`, `frame_zoom`, and `updated_at`.

2. **Throws when id is empty** — call `update('', { frame_x: 50, frame_y: 25, frame_zoom: 1.0 })`, assert rejects with `'Valid image ID is required'`.

3. **Sets null frame values** — call `update('test-id', { frame_x: null, frame_y: null, frame_zoom: null })`, assert `mockExecute` was called (null values are valid; `assertHasUpdateFields` passes because null !== undefined).
