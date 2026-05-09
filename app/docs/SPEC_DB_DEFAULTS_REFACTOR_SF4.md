# SF4: Session Domain

Narrow `session/create.ts` to take `adventure_id: string` directly. Remove `CreateSessionInput`
(no consumers remain). Fix the pre-existing DAL mutation closure violation in `useSessions.ts`.
Update the screen call site.

## Files Affected

```
Modified:
  app/db/session/create.ts
  app/db/session/schema.ts
  app/db/session/types.ts
  app/db/session/index.ts
  app/db/session/__tests__/create.test.ts
  app/src/services/sessionService.ts
  app/src/data-access-layer/sessions/useSessions.ts
  app/src/screens/sessions/SessionsScreen.tsx
```

## DB Changes

### `app/db/session/create.ts`

```typescript
import { getDatabase } from '../database';
import {
  generateId,
  buildCreateQuery,
  generateDbTimestamps,
  assertValidId,
} from '../util';

type DbTimestamps = { created_at: string; updated_at: string };
type CreationData = { adventure_id: string } & DbTimestamps;

export const create = async (adventure_id: string): Promise<string> => {
  assertValidId(adventure_id, 'adventure');

  const id = generateId();
  const { created_at, updated_at } = generateDbTimestamps();

  const { sql, values } = buildCreateQuery<CreationData>('sessions', id, {
    adventure_id,
    created_at,
    updated_at,
  });

  const db = await getDatabase();
  await db.execute(sql, values);
  return id;
};
```

Remove: `import { sessionTable } from './schema'`, `import type { CreateSessionInput } from './types'`.

### `app/db/session/schema.ts`

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

Keep `default: "'prep'"` on `active_view` unchanged.

### `app/db/session/types.ts`

Remove `CreateSessionInput` — no consumers remain after this SF.

```typescript
import z from 'zod';
import { sessionTable } from './schema';

export type Session = z.infer<typeof sessionTable.zodSchema>;
export type UpdateSessionInput = z.infer<typeof sessionTable.updateSchema>;
```

### `app/db/session/index.ts`

Remove `CreateSessionInput` from the type export list:

```typescript
export type { Session, UpdateSessionInput } from './types';
```

Keep all function exports unchanged.

### `app/db/session/__tests__/create.test.ts`

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

  it('should insert session and return generated ID', async () => {
    const sessionId = await create('adventure-123');

    expect(mockExecute).toHaveBeenCalledWith(
      'INSERT INTO sessions (id, adventure_id, created_at, updated_at) VALUES ($1, $2, $3, $4)',
      ['test-generated-id', 'adventure-123', '2024-01-15T10:30:00.000Z', '2024-01-15T10:30:00.000Z']
    );
    expect(sessionId).toBe('test-generated-id');
  });

  it('should throw when adventure_id is empty', async () => {
    await expect(create('')).rejects.toThrow('Valid adventure ID is required');
    expect(mockExecute).not.toHaveBeenCalled();
  });
});
```

## Services

### `app/src/services/sessionService.ts`

- Remove `CreateSessionInput` from the `@db/session` import
- Change `createSession` signature to `(adventureId: string)`:

```typescript
export const createSession = async (adventureId: string): Promise<string> => {
  try {
    const newSessionId = await sessionDb.create(adventureId);
    await sessionStepService.initDefaultSteps(newSessionId);
    return newSessionId;
  } catch (err) {
    throw sessionCreateError(err);
  }
};
```

## Data Access Layer

### `app/src/data-access-layer/sessions/useSessions.ts`

Fix the `CreateSessionInput` import removal and the mutation closure violation.
`adventureId` is known at construction time — it must be captured in the closure,
not passed at call time.

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Session } from '@db/session';
import * as service from '@/services/sessionService';
import { sessionKeys } from './sessionKeys';

type UseSessionsReturn = {
  sessions: Session[];
  loading: boolean;
  createSession: () => Promise<string>;
  deleteSession: (id: string) => Promise<void>;
};

export const useSessions = (adventureId: string): UseSessionsReturn => {
  const queryClient = useQueryClient();

  const { data: sessions = [], isPending: loading } = useQuery({
    queryKey: sessionKeys.list(adventureId),
    queryFn: () => service.getAllSessions(adventureId),
    enabled: !!adventureId,
    throwOnError: true,
  });

  const createMutation = useMutation({
    mutationFn: () => service.createSession(adventureId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: sessionKeys.list(adventureId) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => service.deleteSession(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: sessionKeys.list(adventureId) });
    },
  });

  return {
    sessions,
    loading,
    createSession: () => createMutation.mutateAsync(),
    deleteSession: (id) => deleteMutation.mutateAsync(id),
  };
};
```

## Frontend

### `app/src/screens/sessions/SessionsScreen.tsx`

**Purpose:** Update `handleSessionCreation` to call `createSession()` with no arguments.

**Behavior:** Unchanged — clicking "create new" still navigates to the new session.

**UI / Visual:** No visual change.

Change only `handleSessionCreation`:

```typescript
const handleSessionCreation = async () => {
  const newSessionId = await createSession();
  void router.navigate({
    to: `/adventure/${adventureId}/session/${newSessionId}`,
  });
};
```

No other changes to `SessionsScreen.tsx`.
