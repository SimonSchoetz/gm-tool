# SF2: Adventure Domain

Complete the staged adventure refactor: fix the layer violation (`@/util` import),
use the generic `buildCreateQuery<CreationData>`, add `NOT NULL` timestamps to schema,
and complete the placeholder test.

The staged changes already cover: removing `CreateAdventureInput` from types, index, and service.
No changes to those files are required in this SF.

## Files Affected

```
Modified:
  app/db/adventure/create.ts
  app/db/adventure/schema.ts
  app/db/adventure/__tests__/create.test.ts
```

## DB Changes

### `app/db/adventure/create.ts`

```typescript
import { getDatabase } from '../database';
import {
  generateId,
  buildCreateQuery,
  generateDbTimestamps,
  getDateTimeString,
} from '../util';

type DbTimestamps = { created_at: string; updated_at: string };
type CreationData = { name: string } & DbTimestamps;

export const create = async (): Promise<string> => {
  const id = generateId();
  const { now, ...timestamps } = generateDbTimestamps();
  const name = `New adventure ${getDateTimeString(now)}`;

  const { sql, values } = buildCreateQuery<CreationData>('adventures', id, {
    name,
    ...timestamps,
  });

  const db = await getDatabase();
  await db.execute(sql, values);
  return id;
};
```

Remove all staged imports that are no longer needed: `@/util`, `adventureTable`, `CreateAdventureInput`.

### `app/db/adventure/schema.ts`

Change `created_at` and `updated_at` from nullable with `CURRENT_TIMESTAMP` default to
`NOT NULL` with no default. `create.ts` now always supplies these values.

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

Remove `default: 'CURRENT_TIMESTAMP'` and change `zod: z.string().optional()` to
`zod: z.string()` for both columns. No other columns change.

### `app/db/adventure/__tests__/create.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const mockExecute = vi.fn();
const mockSelect = vi.fn();

vi.mock('@tauri-apps/plugin-sql', () => ({
  default: {
    load: vi.fn(() =>
      Promise.resolve({
        execute: mockExecute,
        select: mockSelect,
      })
    ),
  },
}));

import { create } from '../create';

describe('create', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecute.mockResolvedValue({});
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T10:30:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetModules();
  });

  it('should insert adventure and return generated ID', async () => {
    const adventureId = await create();

    expect(mockExecute).toHaveBeenCalledTimes(1);
    expect(adventureId).toBe('test-generated-id');
  });

  it('should create adventure with a default name prefixed "New adventure"', async () => {
    await create();

    const [, values] = mockExecute.mock.calls[0] as [string, unknown[]];
    expect(values[1]).toMatch(/^New adventure /);
  });

  it('should set created_at and updated_at as ISO 8601 timestamps', async () => {
    await create();

    const [, values] = mockExecute.mock.calls[0] as [string, unknown[]];
    expect(values[2]).toBe('2024-01-15T10:30:00.000Z');
    expect(values[3]).toBe('2024-01-15T10:30:00.000Z');
  });
});
```

The existing mock for `generateId` (returning `'test-generated-id'`) is already in place in
the staged test file — keep it unchanged.
