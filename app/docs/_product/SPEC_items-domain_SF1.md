# SF1: DB Layer

Create the `db/item/` module and register the `items` table in `database.ts`.

## Files Affected

```
New:
  app/db/item/schema.ts
  app/db/item/types.ts
  app/db/item/create.ts
  app/db/item/get.ts
  app/db/item/get-all.ts
  app/db/item/update.ts
  app/db/item/remove.ts
  app/db/item/index.ts
  app/db/item/__tests__/create.test.ts
  app/db/item/__tests__/get.test.ts
  app/db/item/__tests__/get-all.test.ts
  app/db/item/__tests__/update.test.ts
  app/db/item/__tests__/remove.test.ts

Modified:
  app/db/database.ts — add itemTable import and items entry in tableSchemas
```

## DB Layer

### `app/db/item/schema.ts`

```ts
import { z } from 'zod';
import { defineTable } from '../util';

export const itemTable = defineTable({
  name: 'items',
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

### `app/db/item/types.ts`

```ts
import z from 'zod';
import { itemTable } from './schema';

export type Item = z.infer<typeof itemTable.zodSchema>;
export type UpdateItemInput = z.infer<typeof itemTable.updateSchema>;
```

### `app/db/item/create.ts`

`create.ts` contains the Item-specific summary template and the `'New Item'`
default name — these are domain decisions. Write the full file as specified below.

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
  summary: `{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Type | Rarity | Value","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Properties | Weight","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Origin | Owner","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Effects | Attunement","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"History | Secrets","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""}],"direction":null,"format":"","indent":0,"type":"root","version":1}}`,
};

export const create = async (adventure_id: string): Promise<string> => {
  assertValidId(adventure_id, 'adventure');

  const id = generateId();
  const { now, ...timestamps } = generateDbTimestamps();
  const name = `New Item ${getDateTimeString(now)}`;

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-arguments -- explicit type argument triggers excess property checking; inference alone does not
  const { sql, values } = buildCreateQuery<{
    adventure_id: string;
    name: string;
    summary: string;
    created_at: string;
    updated_at: string;
  }>('items', id, {
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

### `app/db/item/get.ts`

Follow `db/npc/get.ts` exactly, substituting `items`/`Item` for `npcs`/`Npc`.

### `app/db/item/get-all.ts`

Follow `db/npc/get-all.ts` exactly, substituting `items`/`Item` for `npcs`/`Npc`.
SQL becomes:
`'SELECT * FROM items WHERE adventure_id = $1 ORDER BY created_at DESC'`.

### `app/db/item/update.ts`

Follow `db/npc/update.ts` exactly, substituting
`items`/`Item`/`itemTable`/`UpdateItemInput` for
`npcs`/`Npc`/`npcTable`/`UpdateNpcInput`.

### `app/db/item/remove.ts`

Follow `db/npc/remove.ts` exactly, substituting `items`/`Item` for `npcs`/`Npc`.
SQL becomes: `'DELETE FROM items WHERE id = $1'`.

### `app/db/item/index.ts`

```ts
export { create } from './create';
export { get } from './get';
export { getAll } from './get-all';
export { update } from './update';
export { remove } from './remove';
export type { Item, UpdateItemInput } from './types';
```

### `app/db/database.ts` changes

Add import alongside existing schema imports:

```ts
import { itemTable } from './item/schema';
```

Add entry to `tableSchemas` array, after the `foes` entry:

```ts
{ name: 'items', sql: itemTable.createTableSQL },
```

## Tests

Read `db/npc/__tests__/` as the pattern reference before writing. Mock setup and test
structure are identical — only the required assertions below are domain-specific.

### `app/db/item/__tests__/create.test.ts`

Required assertions:

- `db.execute` called with full argument match:

```ts
expect(mockExecute).toHaveBeenCalledWith(
  expect.stringContaining('INSERT INTO items'),
  [
    'test-generated-id',
    'test-adventure-id',
    expect.stringMatching(/^New Item /),
    expect.stringContaining('"type":"root"'),
    '2024-01-15T10:30:00.000Z',
    '2024-01-15T10:30:00.000Z',
  ],
);
```

- Return value is `'test-generated-id'`
- Empty `adventure_id` throws `'Valid adventure ID is required'` without calling execute

### `app/db/item/__tests__/get.test.ts`

Required assertions:

- Returns `Item` when `mockSelect` resolves with one item
- Returns `null` when `mockSelect` resolves with empty array
- Empty id throws `'Valid Item ID is required'`
- Whitespace-only id throws `'Valid Item ID is required'`

### `app/db/item/__tests__/get-all.test.ts`

Required assertions:

- Returns ordered array; `mockSelect` called with
  `'SELECT * FROM items WHERE adventure_id = $1 ORDER BY created_at DESC'`
- Returns empty array when no items
- Empty `adventureId` throws `'Valid Adventure ID is required'`
- Whitespace-only `adventureId` throws `'Valid Adventure ID is required'`

### `app/db/item/__tests__/update.test.ts`

Required assertions:

- Single field update produces correct `UPDATE items SET name = $1, updated_at = $2 WHERE id = $3`
- Multi-field update includes all fields in SQL
- Empty id throws `'Valid Item ID is required'` without calling execute
- Whitespace id throws `'Valid Item ID is required'`
- Empty data object `{}` throws `'At least one field must be provided for update'`

### `app/db/item/__tests__/remove.test.ts`

Required assertions:

- Calls `db.execute` with `'DELETE FROM items WHERE id = $1'` and `['test-id']`
- Empty id throws `'Valid Item ID is required'`
- Whitespace id throws `'Valid Item ID is required'`
