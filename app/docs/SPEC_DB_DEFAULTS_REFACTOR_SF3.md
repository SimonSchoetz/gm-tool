# SF3: NPC Domain

Move the default NPC name from `npcsService.ts` to `npc/create.ts`. Change `create()`
signature to take `adventure_id: string` directly. Remove `CreateNpcInput` (no consumers
remain after this SF).

## Files Affected

```
Modified:
  app/db/npc/create.ts
  app/db/npc/schema.ts
  app/db/npc/types.ts
  app/db/npc/index.ts
  app/db/npc/__tests__/create.test.ts
  app/src/services/npcsService.ts
```

## DB Changes

### `app/db/npc/create.ts`

```typescript
import { getDatabase } from '../database';
import {
  generateId,
  buildCreateQuery,
  generateDbTimestamps,
  assertValidId,
  getDateTimeString,
} from '../util';

const templates = {
  summary: `{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Pronouns | Species | Age","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Hometown | Profession","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Faction | Rank","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Behavior | Wants | Needs | Bonds | Secrets","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Stat Block","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""}],"direction":null,"format":"","indent":0,"type":"root","version":1}}`,
};

type DbTimestamps = { created_at: string; updated_at: string };
type CreationData = {
  adventure_id: string;
  name: string;
  summary: string;
} & DbTimestamps;

export const create = async (adventure_id: string): Promise<string> => {
  assertValidId(adventure_id, 'adventure');

  const id = generateId();
  const { now, ...timestamps } = generateDbTimestamps();
  const name = `New NPC ${getDateTimeString(now)}`;

  const { sql, values } = buildCreateQuery<CreationData>('npcs', id, {
    adventure_id,
    name,
    summary: templates.summary,
    ...timestamps,
  });

  const db = await getDatabase();
  await db.execute(sql, values);
  return id;
};
```

Remove: `import { npcTable } from './schema'`, `import type { CreateNpcInput } from './types'`.

### `app/db/npc/schema.ts`

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

No other columns change.

### `app/db/npc/types.ts`

Remove `CreateNpcInput` — no consumers remain after this SF.

```typescript
import z from 'zod';
import { npcTable } from './schema';

export type Npc = z.infer<typeof npcTable.zodSchema>;
export type UpdateNpcInput = z.infer<typeof npcTable.updateSchema>;
```

### `app/db/npc/index.ts`

Remove `CreateNpcInput` from the type export list:

```typescript
export type { Npc, UpdateNpcInput } from './types';
```

Keep all function exports unchanged.

### `app/db/npc/__tests__/create.test.ts`

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

  it('should insert NPC and return generated ID', async () => {
    const npcId = await create('adventure-123');

    expect(mockExecute).toHaveBeenCalledTimes(1);
    expect(npcId).toBe('test-generated-id');
  });

  it('should set adventure_id, default name, summary, and ISO timestamps', async () => {
    await create('adventure-123');

    const [sql, values] = mockExecute.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('INSERT INTO npcs');
    expect(values).toContain('adventure-123');
    const name = values[2] as string;
    expect(name).toMatch(/^New NPC /);
    expect(values).toContain('2024-01-15T10:30:00.000Z');
  });

  it('should throw when adventure_id is empty', async () => {
    await expect(create('')).rejects.toThrow('Valid adventure ID is required');
    expect(mockExecute).not.toHaveBeenCalled();
  });
});
```

## Services

### `app/src/services/npcsService.ts`

- Remove `CreateNpcInput` from the `@db/npc` import
- Remove `getDateTimeString` from the `@/util` import; if it was the only import from `@/util`,
  remove the entire import line
- In `createNpc`, remove the `dto` construction and call `npcDb.create(adventureId)` directly:

```typescript
export const createNpc = async (adventureId: string): Promise<string> => {
  try {
    return await npcDb.create(adventureId);
  } catch (err) {
    throw npcCreateError(err);
  }
};
```
