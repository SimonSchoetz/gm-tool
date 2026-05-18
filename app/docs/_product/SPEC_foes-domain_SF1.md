# SF1: DB Layer

Create the `db/foe/` module and register the `foes` table in `database.ts`.

## Files Affected

```
New:
  app/db/foe/schema.ts
  app/db/foe/types.ts
  app/db/foe/create.ts
  app/db/foe/get.ts
  app/db/foe/get-all.ts
  app/db/foe/update.ts
  app/db/foe/remove.ts
  app/db/foe/index.ts
  app/db/foe/__tests__/create.test.ts
  app/db/foe/__tests__/get.test.ts
  app/db/foe/__tests__/get-all.test.ts
  app/db/foe/__tests__/update.test.ts
  app/db/foe/__tests__/remove.test.ts

Modified:
  app/db/database.ts — add foeTable import and foes entry in tableSchemas
```

## DB Layer

### `app/db/foe/schema.ts`

```ts
import { z } from 'zod';
import { defineTable } from '../util';

export const foeTable = defineTable({
  name: 'foes',
  columns: {
    id: { type: 'TEXT', primaryKey: true, zod: z.string() },
    adventure_id: {
      type: 'TEXT',
      notNull: true,
      foreignKey: { table: 'adventures', column: 'id', onDelete: 'CASCADE' },
      zod: z.string(),
    },
    name: { type: 'TEXT', zod: z.string().optional() },
    summary: { type: 'TEXT', zod: z.string().optional() },
    description: { type: 'TEXT', zod: z.string().optional() },
    image_id: {
      type: 'TEXT',
      foreignKey: { table: 'images', column: 'id', onDelete: 'SET NULL' },
      zod: z.string().nullable().optional(),
    },
    created_at: { type: 'TEXT', notNull: true, zod: z.string() },
    updated_at: { type: 'TEXT', notNull: true, zod: z.string() },
  },
});
```

### `app/db/foe/types.ts`

```ts
import z from 'zod';
import { foeTable } from './schema';

export type Foe = z.infer<typeof foeTable.zodSchema>;
export type UpdateFoeInput = z.infer<typeof foeTable.updateSchema>;
```

### `app/db/foe/create.ts`

```ts
import { getDatabase } from '../database';
import {
  generateId,
  buildCreateQuery,
  generateDbTimestamps,
  assertValidId,
} from '../util';
import { getDateTimeString } from '@util';

const templates = {
  summary: `{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Type | CR | Alignment","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Habitat | Encounter Conditions","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Special Abilities | Resistances | Immunities","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Tactics | Weaknesses | Motivations","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""}],"direction":null,"format":"","indent":0,"type":"root","version":1}}`,
};

export const create = async (adventure_id: string): Promise<string> => {
  assertValidId(adventure_id, 'adventure');

  const id = generateId();
  const { now, ...timestamps } = generateDbTimestamps();
  const name = `New Foe ${getDateTimeString(now)}`;

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-arguments -- explicit type argument triggers excess property checking; inference alone does not
  const { sql, values } = buildCreateQuery<{
    adventure_id: string;
    name: string;
    summary: string;
    created_at: string;
    updated_at: string;
  }>('foes', id, {
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

### `app/db/foe/get.ts`

```ts
import { getDatabase } from '../database';
import { assertValidId } from '../util';
import type { Foe } from './types';

export const get = async (id: string): Promise<Foe | null> => {
  assertValidId(id, 'Foe');
  const db = await getDatabase();
  const result = await db.select<Foe[]>('SELECT * FROM foes WHERE id = $1', [id]);
  return result[0] ?? null;
};
```

### `app/db/foe/get-all.ts`

```ts
import { getDatabase } from '../database';
import { assertValidId } from '../util';
import type { Foe } from './types';

export const getAll = async (adventureId: string): Promise<Foe[]> => {
  assertValidId(adventureId, 'Adventure');
  const db = await getDatabase();
  const data = await db.select<Foe[]>(
    'SELECT * FROM foes WHERE adventure_id = $1 ORDER BY created_at DESC',
    [adventureId],
  );
  return data;
};
```

### `app/db/foe/update.ts`

```ts
import { getDatabase } from '../database';
import { assertValidId, assertHasUpdateFields, buildUpdateQuery } from '../util';
import { foeTable } from './schema';
import type { UpdateFoeInput } from './types';

export const update = async (id: string, data: UpdateFoeInput): Promise<void> => {
  assertValidId(id, 'Foe');
  assertHasUpdateFields(data);
  const validated = foeTable.updateSchema.parse(data);
  const db = await getDatabase();
  const { sql, values } = buildUpdateQuery('foes', id, validated);
  await db.execute(sql, values);
};
```

### `app/db/foe/remove.ts`

```ts
import { getDatabase } from '../database';
import { assertValidId } from '../util';

export const remove = async (id: string): Promise<void> => {
  assertValidId(id, 'Foe');
  const db = await getDatabase();
  await db.execute('DELETE FROM foes WHERE id = $1', [id]);
};
```

### `app/db/foe/index.ts`

```ts
export { create } from './create';
export { get } from './get';
export { getAll } from './get-all';
export { update } from './update';
export { remove } from './remove';
export type { Foe, UpdateFoeInput } from './types';
```

### `app/db/database.ts` changes

Add import alongside existing schema imports:

```ts
import { foeTable } from './foe/schema';
```

Add entry to `tableSchemas` array, after the `npcs` entry:

```ts
{ name: 'foes', sql: foeTable.createTableSQL },
```

## Tests

### `app/db/foe/__tests__/create.test.ts`

Pattern: mock `@tauri-apps/plugin-sql` at module scope, mock `generateId` via
`'../../util'` (returns `'test-generated-id'`), use `vi.useFakeTimers()` +
`vi.setSystemTime(new Date('2024-01-15T10:30:00.000Z'))` in `beforeEach`,
`vi.useRealTimers()` + `vi.resetModules()` in `afterEach`.

Required assertions:
- Calls `db.execute` with SQL containing `'INSERT INTO foes'` and values containing
  `'test-generated-id'`; return value is `'test-generated-id'`
- `adventure_id`, default name matching `/^New Foe /`, and ISO timestamp
  `'2024-01-15T10:30:00.000Z'` are present in values
- Empty `adventure_id` throws `'Valid adventure ID is required'` without calling execute

### `app/db/foe/__tests__/get.test.ts`

Pattern: mock `@tauri-apps/plugin-sql`, `mockSelect.mockResolvedValue([])` in `beforeEach`,
`vi.resetModules()` in `afterEach`.

Required assertions:
- Returns `Foe` when `mockSelect` resolves with one item
- Returns `null` when `mockSelect` resolves with empty array
- Empty id throws `'Valid Foe ID is required'`
- Whitespace-only id throws `'Valid Foe ID is required'`

### `app/db/foe/__tests__/get-all.test.ts`

Same mock setup as get.test.ts.

Required assertions:
- Returns ordered array; `mockSelect` called with
  `'SELECT * FROM foes WHERE adventure_id = $1 ORDER BY created_at DESC'`
- Returns empty array when no foes
- Empty `adventureId` throws `'Valid Adventure ID is required'`
- Whitespace-only `adventureId` throws `'Valid Adventure ID is required'`

### `app/db/foe/__tests__/update.test.ts`

Pattern: mock `@tauri-apps/plugin-sql`, `vi.useFakeTimers()` in `beforeEach`,
`vi.useRealTimers()` + `vi.resetModules()` in `afterEach`.

Required assertions:
- Single field update produces correct `UPDATE foes SET name = $1, updated_at = $2 WHERE id = $3`
- Multi-field update includes all fields in SQL
- Empty id throws `'Valid Foe ID is required'` without calling execute
- Whitespace id throws `'Valid Foe ID is required'`
- Empty data object `{}` throws `'At least one field must be provided for update'`

### `app/db/foe/__tests__/remove.test.ts`

Pattern: mock `@tauri-apps/plugin-sql`, `vi.resetModules()` in `afterEach`.

Required assertions:
- Calls `db.execute` with `'DELETE FROM foes WHERE id = $1'` and `['test-id']`
- Empty id throws `'Valid Foe ID is required'`
- Whitespace id throws `'Valid Foe ID is required'`
