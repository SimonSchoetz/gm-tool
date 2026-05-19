# SF1: DB Layer

Create the `db/pc/` module and register the `pcs` table in `database.ts`.

## Files Affected

```
New:
  app/db/pc/schema.ts
  app/db/pc/types.ts
  app/db/pc/create.ts
  app/db/pc/get.ts
  app/db/pc/get-all.ts
  app/db/pc/update.ts
  app/db/pc/remove.ts
  app/db/pc/index.ts
  app/db/pc/__tests__/create.test.ts
  app/db/pc/__tests__/get.test.ts
  app/db/pc/__tests__/get-all.test.ts
  app/db/pc/__tests__/update.test.ts
  app/db/pc/__tests__/remove.test.ts

Modified:
  app/db/database.ts — add pcTable import and pcs entry in tableSchemas
```

## DB Layer

### `app/db/pc/schema.ts`

```ts
import { z } from 'zod';
import { defineTable } from '../util';

export const pcTable = defineTable({
  name: 'pcs',
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

### `app/db/pc/types.ts`

```ts
import z from 'zod';
import { pcTable } from './schema';

export type Pc = z.infer<typeof pcTable.zodSchema>;
export type UpdatePcInput = z.infer<typeof pcTable.updateSchema>;
```

### `app/db/pc/create.ts`

`create.ts` requires the NPC-identical summary template and the `'New Pc'` default name —
these are domain decisions, not derivable from NPC files. Write the full file as follows.

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
  summary: `{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Pronouns | Species | Age","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Hometown | Profession","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Faction | Rank","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Behavior | Wants | Needs | Bonds | Secrets","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Stat Block","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""}],"direction":null,"format":"","indent":0,"type":"root","version":1}}`,
};

export const create = async (adventure_id: string): Promise<string> => {
  assertValidId(adventure_id, 'adventure');

  const id = generateId();
  const { now, ...timestamps } = generateDbTimestamps();
  const name = `New Pc ${getDateTimeString(now)}`;

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-arguments -- explicit type argument triggers excess property checking; inference alone does not
  const { sql, values } = buildCreateQuery<{
    adventure_id: string;
    name: string;
    summary: string;
    created_at: string;
    updated_at: string;
  }>('pcs', id, {
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

### `app/db/pc/get.ts`

Follow `db/npc/get.ts` exactly, substituting `pcs`/`Pc` for `npcs`/`Npc`.

### `app/db/pc/get-all.ts`

Follow `db/npc/get-all.ts` exactly, substituting `pcs`/`Pc`/`'Adventure'` for
`npcs`/`Npc`/`'Adventure'`. SQL becomes:
`'SELECT * FROM pcs WHERE adventure_id = $1 ORDER BY created_at DESC'`.

### `app/db/pc/update.ts`

Follow `db/npc/update.ts` exactly, substituting `pcs`/`Pc`/`pcTable`/`UpdatePcInput`
for `npcs`/`Npc`/`npcTable`/`UpdateNpcInput`.

### `app/db/pc/remove.ts`

Follow `db/npc/remove.ts` exactly, substituting `pcs`/`Pc` for `npcs`/`Npc`.
SQL becomes: `'DELETE FROM pcs WHERE id = $1'`.

### `app/db/pc/index.ts`

```ts
export { create } from './create';
export { get } from './get';
export { getAll } from './get-all';
export { update } from './update';
export { remove } from './remove';
export type { Pc, UpdatePcInput } from './types';
```

### `app/db/database.ts` changes

Add import alongside existing schema imports:

```ts
import { pcTable } from './pc/schema';
```

Add entry to `tableSchemas` array, after the `foes` entry:

```ts
{ name: 'pcs', sql: pcTable.createTableSQL },
```

## Tests

Read the NPC test files in `db/npc/__tests__/` as the pattern reference before writing.
The mock setup and test structure are identical — only the required assertions below are
domain-specific.

### `app/db/pc/__tests__/create.test.ts`

Required assertions:

- `db.execute` called with full argument match:

```ts
expect(mockExecute).toHaveBeenCalledWith(
  expect.stringContaining('INSERT INTO pcs'),
  [
    'test-generated-id',
    'test-adventure-id',
    expect.stringMatching(/^New Pc /),
    expect.stringContaining('"type":"root"'),
    '2024-01-15T10:30:00.000Z',
    '2024-01-15T10:30:00.000Z',
  ],
);
```

- Return value is `'test-generated-id'`
- Empty `adventure_id` throws `'Valid adventure ID is required'` without calling execute

### `app/db/pc/__tests__/get.test.ts`

Required assertions:

- Returns `Pc` when `mockSelect` resolves with one item
- Returns `null` when `mockSelect` resolves with empty array
- Empty id throws `'Valid Pc ID is required'`
- Whitespace-only id throws `'Valid Pc ID is required'`

### `app/db/pc/__tests__/get-all.test.ts`

Required assertions:

- Returns ordered array; `mockSelect` called with
  `'SELECT * FROM pcs WHERE adventure_id = $1 ORDER BY created_at DESC'`
- Returns empty array when no pcs
- Empty `adventureId` throws `'Valid Adventure ID is required'`
- Whitespace-only `adventureId` throws `'Valid Adventure ID is required'`

### `app/db/pc/__tests__/update.test.ts`

Required assertions:

- Single field update produces correct `UPDATE pcs SET name = $1, updated_at = $2 WHERE id = $3`
- Multi-field update includes all fields in SQL
- Empty id throws `'Valid Pc ID is required'` without calling execute
- Whitespace id throws `'Valid Pc ID is required'`
- Empty data object `{}` throws `'At least one field must be provided for update'`

### `app/db/pc/__tests__/remove.test.ts`

Required assertions:

- Calls `db.execute` with `'DELETE FROM pcs WHERE id = $1'` and `['test-id']`
- Empty id throws `'Valid Pc ID is required'`
- Whitespace id throws `'Valid Pc ID is required'`
