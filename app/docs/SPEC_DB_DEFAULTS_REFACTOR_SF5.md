# SF5: Session-step Domain

Remove `createSchema` usage from `session-step/create.ts`. Replace the auto-derived
`CreateSessionStepInput` with a manually-written type that omits `content` (no caller
passes it at creation time). Add ISO timestamps.

`sessionStepService.ts` requires no changes — the `CreateSessionStepInput` shape matches
what all current callers pass.

## Files Affected

```
Modified:
  app/db/session-step/create.ts
  app/db/session-step/schema.ts
  app/db/session-step/types.ts
  app/db/session-step/__tests__/create.test.ts
```

## DB Changes

### `app/db/session-step/create.ts`

```typescript
import { getDatabase } from '../database';
import {
  generateId,
  buildCreateQuery,
  generateDbTimestamps,
  assertValidId,
} from '../util';
import type { CreateSessionStepInput } from './types';
import type { LazyDmStepKey } from './schema';

type DbTimestamps = { created_at: string; updated_at: string };
type CreationData = {
  session_id: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  default_step_key?: LazyDmStepKey | null;
  name?: string;
};

export const create = async (data: CreateSessionStepInput): Promise<string> => {
  assertValidId(data.session_id, 'session');

  const id = generateId();
  const { created_at, updated_at } = generateDbTimestamps();

  const { sql, values } = buildCreateQuery<CreationData>('session_steps', id, {
    session_id: data.session_id,
    sort_order: data.sort_order,
    created_at,
    updated_at,
    ...(data.default_step_key !== undefined ? { default_step_key: data.default_step_key } : {}),
    ...(data.name !== undefined ? { name: data.name } : {}),
  });

  const db = await getDatabase();
  await db.execute(sql, values);
  return id;
};
```

`checked` is omitted from the INSERT — the SQL `DEFAULT 0` fires. Remove:
`import { sessionStepTable } from './schema'`.

Note: `DbTimestamps` is declared but used via spread rather than as an intersection.
The `CreationData` type lists `created_at` and `updated_at` directly to keep the type
self-contained.

### `app/db/session-step/schema.ts`

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

Keep `default: '0'` on `checked` — numeric literal stays in SQL schema per the hierarchy.

### `app/db/session-step/types.ts`

Replace the auto-derived `CreateSessionStepInput` with a manually-written type.
`content` is excluded — no caller passes it at creation time.

```typescript
import z from 'zod';
import { sessionStepTable } from './schema';
import type { LazyDmStepKey } from './schema';

export type SessionStep = z.infer<typeof sessionStepTable.zodSchema>;
export type CreateSessionStepInput = {
  session_id: string;
  sort_order: number;
  default_step_key?: LazyDmStepKey | null;
  name?: string;
};
export type UpdateSessionStepInput = z.infer<typeof sessionStepTable.updateSchema>;
```

`session-step/index.ts` already exports `CreateSessionStepInput` and `LazyDmStepKey` with
explicit named exports — no change needed.

### `app/db/session-step/__tests__/create.test.ts`

Read the current test file before editing. Replace with:

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

  it('should insert session step with required fields and return ID', async () => {
    const stepId = await create({ session_id: 'session-123', sort_order: 0 });

    expect(mockExecute).toHaveBeenCalledWith(
      'INSERT INTO session_steps (id, session_id, sort_order, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)',
      ['test-generated-id', 'session-123', 0, '2024-01-15T10:30:00.000Z', '2024-01-15T10:30:00.000Z']
    );
    expect(stepId).toBe('test-generated-id');
  });

  it('should include default_step_key and name when provided', async () => {
    await create({
      session_id: 'session-123',
      sort_order: 1,
      default_step_key: 'strong_start',
      name: 'Strong Start',
    });

    const [sql, values] = mockExecute.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('default_step_key');
    expect(sql).toContain('name');
    expect(values).toContain('strong_start');
    expect(values).toContain('Strong Start');
  });

  it('should throw when session_id is empty', async () => {
    await expect(create({ session_id: '', sort_order: 0 })).rejects.toThrow(
      'Valid session ID is required'
    );
    expect(mockExecute).not.toHaveBeenCalled();
  });
});
```
