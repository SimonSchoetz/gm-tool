# SF2: session/getAll Validation

`session/get-all.ts` is the only `getAll` in the DB layer with no input validation. Add `assertValidId` before the `getDatabase()` call, matching `npc/get-all.ts` and `foe/get-all.ts`. Add the two missing validation test cases.

## Files Affected

**Modified:**
- `app/db/session/get-all.ts` — add `assertValidId` import and guard
- `app/db/session/__tests__/get-all.test.ts` — add two validation `it()` blocks

## DB Layer

### `app/db/session/get-all.ts`

Add `assertValidId` import from `'../util'` and call it before `getDatabase()`. Full file after the change:

```typescript
import { getDatabase } from '../database';
import { assertValidId } from '../util';
import type { Session } from './types';

export const getAll = async (adventureId: string): Promise<Session[]> => {
  assertValidId(adventureId, 'Adventure');
  const db = await getDatabase();
  return db.select<Session[]>(
    'SELECT * FROM sessions WHERE adventure_id = $1 ORDER BY created_at DESC',
    [adventureId],
  );
};
```

The entity name `'Adventure'` matches the convention in `npc/get-all.ts` and `foe/get-all.ts`. The resulting error message is `'Valid Adventure ID is required'`.

## DB Tests

### `app/db/session/__tests__/get-all.test.ts`

Add two `it()` blocks after the existing `'should return empty array'` test. Do not change any existing tests.

```typescript
it('should throw when adventureId is empty string', async () => {
  await expect(getAll('')).rejects.toThrow('Valid Adventure ID is required');
});

it('should throw when adventureId is whitespace only', async () => {
  await expect(getAll('   ')).rejects.toThrow('Valid Adventure ID is required');
});
```
