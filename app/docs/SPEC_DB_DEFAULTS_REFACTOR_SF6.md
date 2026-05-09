# SF6: Image Domain

Add ISO timestamps to `image/create.ts`. Remove the dead `CreateImageInput` barrel export.

`CreateImageInput` stays in `image/types.ts` — it is used internally by `create.ts` and
`replace.ts`. Only the barrel export is removed (no file outside `app/db/image/` imports it).

## Files Affected

```
Modified:
  app/db/image/create.ts
  app/db/image/schema.ts
  app/db/image/index.ts
  app/db/image/__tests__/create.test.ts
```

## DB Changes

### `app/db/image/create.ts`

Add `generateDbTimestamps` to the util import. Define a local `CreationData` type.
Pass timestamps to `buildCreateQuery`. All other logic (Tauri invoke, validation) is unchanged.

```typescript
import { invoke } from '@tauri-apps/api/core';
import { generateId, buildCreateQuery, generateDbTimestamps } from '../util';
import { getDatabase } from '../database';
import type { CreateImageInput } from './types';

type CreationData = {
  file_extension: string;
  original_filename: string | null;
  file_size: number;
  created_at: string;
  updated_at: string;
};

export const create = async ({
  filePath,
}: CreateImageInput): Promise<string> => {
  if (typeof filePath !== 'string') {
    throw new Error('filePath must be a string');
  }

  const extension = filePath.split('.').pop()?.toLowerCase();

  if (
    !extension ||
    !['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension)
  ) {
    throw new Error(`Unsupported file extension: ${extension}`);
  }

  const originalFilename = filePath.split('/').pop() ?? null;

  const id = generateId();

  const fileSize = await invoke<number>('save_image', {
    sourcePath: filePath,
    id,
    extension,
  });

  const { created_at, updated_at } = generateDbTimestamps();

  const db = await getDatabase();
  const { sql, values } = buildCreateQuery<CreationData>('images', id, {
    file_extension: extension,
    original_filename: originalFilename,
    file_size: fileSize,
    created_at,
    updated_at,
  });
  await db.execute(sql, values);

  return id;
};
```

### `app/db/image/schema.ts`

Change `created_at` and `updated_at` to `NOT NULL` with no default:

```typescript
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
```

### `app/db/image/index.ts`

Remove `CreateImageInput` from the type export — no external consumer imports it:

```typescript
export { create } from './create';
export { get } from './get';
export { remove } from './remove';
export { replace } from './replace';
export type { Image } from './types';
```

### `app/db/image/__tests__/create.test.ts`

Read the current test file before editing. Add fake timer setup. Update SQL assertions
to include `created_at` and `updated_at`. Add a timestamp assertion test.

Add to `beforeEach`:

```typescript
vi.useFakeTimers();
vi.setSystemTime(new Date('2024-01-15T10:30:00.000Z'));
```

Add to `afterEach`:

```typescript
vi.useRealTimers();
```

For each existing `mockExecute.toHaveBeenCalledWith(...)` assertion, add `created_at` and
`updated_at` to the expected column list and add `'2024-01-15T10:30:00.000Z'` twice to the
expected values array (they are the last two values after `file_size`).

Add one new test:

```typescript
it('should set created_at and updated_at as ISO 8601 timestamps', async () => {
  mockExecute.mockResolvedValue({});
  await create({ filePath: '/path/to/image.png' });

  const [, values] = mockExecute.mock.calls[0] as [string, unknown[]];
  expect(values.at(-2)).toBe('2024-01-15T10:30:00.000Z');
  expect(values.at(-1)).toBe('2024-01-15T10:30:00.000Z');
});
```
