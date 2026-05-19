# SF8: session/get Inline Validation Migration

`session/get.ts` is the only remaining function in the session domain that uses an inline validation guard instead of `assertValidId`. `session/update.ts` and `session/remove.ts` already use the utility. Replace the inline guard with `assertValidId(id, 'session')`. The error message produced is identical (`'Valid session ID is required'`), so no test changes are required.

## Files Affected

**Modified:**
- `app/db/session/get.ts` — replace inline validation guard with `assertValidId`

## DB Layer

### `app/db/session/get.ts`

Replace the inline guard and add `assertValidId` to the import. Full file after the change:

```typescript
import { getDatabase } from '../database';
import { assertValidId } from '../util';
import type { Session } from './types';

export const get = async (id: string): Promise<Session | null> => {
  assertValidId(id, 'session');
  const db = await getDatabase();
  const sessions = await db.select<Session[]>(
    'SELECT * FROM sessions WHERE id = $1',
    [id],
  );
  return sessions[0] ?? null;
};
```

The `assertValidId` import path `'../util'` resolves to `app/db/util/index.ts` from `app/db/session/get.ts` — confirmed correct.

The existing test assertions in `app/db/session/__tests__/get.test.ts` remain valid: the error message `'Valid session ID is required'` is unchanged. No test file modifications are required for this sub-feature.
