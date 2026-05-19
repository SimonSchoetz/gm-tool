# SF1: adventure/getAll Simplification

[FOUNDATION: SF1 modifies `adventure/types.ts`, `adventure/index.ts`, `adventure/get-all.ts`, and `adventureService.ts`. tsc cannot pass after any one file is changed in isolation — all four source changes plus the test rewrite must be completed before running baseline checks.]

Remove pagination from `adventure/getAll`. Align it with every other `getAll` in the DB layer: no parameters, returns `Adventure[]`, calls `db.select` with no second argument. Remove the `PaginationParams` and `PaginatedResponse` types which become dead code. Update the service and test to match.

## Files Affected

**Modified:**
- `app/db/adventure/get-all.ts` — rewrite: drop pagination, return `Adventure[]`
- `app/db/adventure/types.ts` — remove `PaginationParams` and `PaginatedResponse` type definitions
- `app/db/adventure/index.ts` — remove `PaginationParams` and `PaginatedResponse` from barrel exports
- `app/services/adventureService.ts` — remove `.data` unwrap in `getAllAdventures`
- `app/db/adventure/__tests__/get-all.test.ts` — full rewrite: replace pagination tests with standard getAll tests

## DB Layer

### `app/db/adventure/types.ts`

Remove the `PaginationParams` and `PaginatedResponse` type definitions. The remaining file after the change:

```typescript
import z from 'zod';
import { adventureTable } from './schema';

export type Adventure = z.infer<typeof adventureTable.zodSchema>;
export type UpdateAdventureInput = z.infer<typeof adventureTable.updateSchema>;
```

### `app/db/adventure/index.ts`

Remove `PaginationParams` and `PaginatedResponse` from the `export type` block. The remaining barrel after the change:

```typescript
export { create } from './create';
export { get } from './get';
export { getAll } from './get-all';
export { update } from './update';
export { remove } from './remove';
export type { Adventure, UpdateAdventureInput } from './types';
```

All exports are explicit named exports — correct per the `db/` barrel convention.

### `app/db/adventure/get-all.ts`

Full rewrite. Match the `table-config/get-all.ts` pattern for a no-parameter select query (no second argument to `db.select`):

```typescript
import { getDatabase } from '../database';
import type { Adventure } from './types';

export const getAll = async (): Promise<Adventure[]> => {
  const db = await getDatabase();
  return db.select<Adventure[]>('SELECT * FROM adventures ORDER BY created_at DESC');
};
```

No `PaginationParams`, no `PaginatedResponse`, no `DEFAULT_LIMIT`, no `COUNT(*)` query.

## Services Layer

### `app/services/adventureService.ts`

Update `getAllAdventures` only. Remove the `.data` property access — `adventureDb.getAll()` now returns `Adventure[]` directly:

```typescript
export const getAllAdventures = async (): Promise<Adventure[]> => {
  try {
    return await adventureDb.getAll();
  } catch (err) {
    throw adventureLoadError(err);
  }
};
```

No other function in `adventureService.ts` changes.

## DB Tests

### `app/db/adventure/__tests__/get-all.test.ts`

Full rewrite. The current tests only cover the removed pagination validation. Replace with the standard `getAll` test structure matching `npc/__tests__/get-all.test.ts`.

The test file does not need `vi.mock('../../util', ...)` or fake timers — `getAll` takes no input and generates nothing.

The `Adventure` type fixture shape matches the existing fixture in `adventure/__tests__/get.test.ts`: `id`, `name`, `description`, `created_at`, `updated_at`.

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Adventure } from '../types';

const mockExecute = vi.fn();
const mockSelect = vi.fn();

vi.mock('@tauri-apps/plugin-sql', () => ({
  default: {
    load: vi.fn(() =>
      Promise.resolve({ execute: mockExecute, select: mockSelect }),
    ),
  },
}));

import { getAll } from '../get-all';

describe('getAll', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecute.mockResolvedValue({});
    mockSelect.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should return adventures ordered by created_at DESC', async () => {
    const adventure1: Adventure = {
      id: '1',
      name: 'Adventure 1',
      description: 'Desc 1',
      created_at: '2025-01-02',
      updated_at: '2025-01-02',
    };
    const adventure2: Adventure = {
      id: '2',
      name: 'Adventure 2',
      description: 'Desc 2',
      created_at: '2025-01-01',
      updated_at: '2025-01-01',
    };

    mockSelect.mockResolvedValue([adventure1, adventure2]);

    const result = await getAll();

    expect(mockSelect).toHaveBeenCalledWith(
      'SELECT * FROM adventures ORDER BY created_at DESC',
    );
    expect(result).toEqual([adventure1, adventure2]);
  });

  it('should return empty array when no adventures exist', async () => {
    mockSelect.mockResolvedValue([]);

    const result = await getAll();

    expect(result).toEqual([]);
  });
});
```

The `Adventure` type may have additional optional fields beyond those shown in the fixture (e.g. `image_id`). Omitting optional fields is valid with `exactOptionalPropertyTypes: true` — do not add fields that are absent from the `adventure/__tests__/get.test.ts` fixture unless the type requires them.
