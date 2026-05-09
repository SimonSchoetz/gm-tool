# SF1: DB Utility Layer

Move `getDateTimeString` to the shared `app/util/` layer. Add `@util` path alias to all
three config files. Make `buildCreateQuery` generic. Fix `buildUpdateQuery` ISO timestamp.

## Files Affected

```
New:
  app/util/getDateTimeString.ts
  app/util/__tests__/getDateTimeString.test.ts

Modified:
  app/tsconfig.json
  app/vite.config.ts
  app/vitest.config.ts
  app/src/util/index.ts
  app/src/screens/adventure/AdventureScreen.tsx
  app/src/components/SortableList/components/SortableListItem/helper/formatDateValue.ts
  app/db/util/build-create-query.ts
  app/db/util/build-update-query.ts
  app/db/util/index.ts
  app/db/util/__tests__/build-update-query.test.ts
  app/db/adventure/__tests__/update.test.ts
  app/db/npc/__tests__/update.test.ts
  app/db/session/__tests__/update.test.ts
  app/db/session-step/__tests__/update.test.ts
  app/db/table-config/__tests__/update.test.ts

Deleted:
  app/src/util/getDateTimeString.ts
  app/src/util/__tests__/getDateTimeString.test.ts
```

## DB Changes

### Move `getDateTimeString` to `app/util/`

Create `app/util/getDateTimeString.ts` with the same implementation as the existing
`app/src/util/getDateTimeString.ts`:

```typescript
export const getDateTimeString = (dateString: string): string => {
  const date = new Date(dateString);
  return (
    date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }) +
    ' ' +
    date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  );
};
```

Delete `app/src/util/getDateTimeString.ts` after creating the shared version.

### Path alias — `app/tsconfig.json`

Add `@util/*` to the paths map:

```json
"paths": {
  "@/*": ["./src/*"],
  "@db/*": ["./db/*"],
  "@util/*": ["./util/*"]
}
```

### Path alias — `app/vite.config.ts`

Add to the `resolve.alias` object:

```typescript
'@util': path.resolve(__dirname, './util'),
```

### Path alias — `app/vitest.config.ts`

Add to the `resolve.alias` object:

```typescript
'@util': path.resolve(__dirname, './util'),
```

### `app/src/util/index.ts`

Remove the `getDateTimeString` export line entirely. Keep all other exports unchanged.

After this change the barrel exports only:

```typescript
export { cn } from './className';
export { filePicker } from './filePicker';
export { formatTableLabel } from './formatTableLabel';
```

### `app/src/screens/adventure/AdventureScreen.tsx`

Change the `@/util` import to import `getDateTimeString` directly from the shared location.
The `cn` import stays on the `@/util` barrel. Split into two import statements:

```typescript
import { cn } from '@/util';
import { getDateTimeString } from '@util/getDateTimeString';
```

### `app/src/components/SortableList/components/SortableListItem/helper/formatDateValue.ts`

Update the import to use the shared location directly:

```typescript
import { getDateTimeString } from '@util/getDateTimeString';
```

### `app/util/__tests__/getDateTimeString.test.ts`

Delete `app/src/util/__tests__/getDateTimeString.test.ts`. Create the test at its new
mirrored location `app/util/__tests__/getDateTimeString.test.ts`. Update the import:

```typescript
import { getDateTimeString } from '@util/getDateTimeString';
```

All test cases remain unchanged.

### `app/db/util/build-create-query.ts`

Make the function generic. Replace the current parameter type with a generic constraint:

```typescript
type CreateQuery = {
  sql: string;
  values: unknown[];
};

export const buildCreateQuery = <T extends Record<string, string | number | null>>(
  tableName: string,
  id: string,
  data: T,
): CreateQuery => {
  const columns: string[] = ['id'];
  const placeholders: string[] = ['$1'];
  const values: unknown[] = [id];
  let paramIndex = 2;

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      columns.push(key);
      placeholders.push(`$${paramIndex++}`);
      values.push(value);
    }
  });

  const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`;
  return { sql, values };
};
```

No exports are added. The generic parameter is inferred at each call site from the `data`
argument — callers do not need to import a separate type.

### `app/db/util/build-update-query.ts`

Replace the `CURRENT_TIMESTAMP` SQL expression with a bound ISO parameter:

```typescript
// Remove:
fields.push('updated_at = CURRENT_TIMESTAMP');
values.push(id);
const sql = `UPDATE ${tableName} SET ${fields.join(', ')} WHERE id = $${paramIndex}`;

// Replace with:
const updatedAt = new Date().toISOString();
fields.push(`updated_at = $${paramIndex++}`);
values.push(updatedAt);
values.push(id);
const sql = `UPDATE ${tableName} SET ${fields.join(', ')} WHERE id = $${paramIndex}`;
```

Example with one updated field: `SET name = $1, updated_at = $2 WHERE id = $3`
with values `[fieldValue, isoTimestamp, id]`.

### `app/db/util/index.ts`

Add `getDateTimeString` export from the shared location. Do not add `DbInsertData` — it does
not exist. Keep all existing exports:

```typescript
export { getDateTimeString } from '@util/getDateTimeString';
```

### Update Tests

All `update.test.ts` files that assert `CURRENT_TIMESTAMP` in SQL must be updated.
Add to `beforeEach` in every affected file:

```typescript
vi.useFakeTimers();
vi.setSystemTime(new Date('2024-01-15T10:30:00.000Z'));
```

Add to `afterEach` (alongside existing `vi.resetModules()` where present):

```typescript
vi.useRealTimers();
```

For each SQL assertion containing `updated_at = CURRENT_TIMESTAMP`:
- Replace with `updated_at = $N` where N is the next index after the last business field
- Insert `'2024-01-15T10:30:00.000Z'` into the values array before `id`

**Example — `app/db/adventure/__tests__/update.test.ts`:**

Before:
```typescript
expect(mockExecute).toHaveBeenCalledWith(
  'UPDATE adventures SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
  ['Updated Name', 'test-id']
);
```

After:
```typescript
expect(mockExecute).toHaveBeenCalledWith(
  'UPDATE adventures SET name = $1, updated_at = $2 WHERE id = $3',
  ['Updated Name', '2024-01-15T10:30:00.000Z', 'test-id']
);
```

Apply the same transformation to all assertions in:
- `app/db/util/__tests__/build-update-query.test.ts` — 4 assertions; also change any
  `expect(sql).toContain('updated_at = CURRENT_TIMESTAMP')` to
  `expect(sql).toContain('updated_at = $')`
- `app/db/npc/__tests__/update.test.ts` — 2 assertions
- `app/db/session/__tests__/update.test.ts` — 3 assertions
- `app/db/session-step/__tests__/update.test.ts` — 2 assertions
- `app/db/table-config/__tests__/update.test.ts` — 2 assertions
