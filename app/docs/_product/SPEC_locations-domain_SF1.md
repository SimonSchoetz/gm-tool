# SF1: DB Layer

Create the `db/location/` module and register the `locations` table in `database.ts`.

## Files Affected

```
New:
  app/db/location/schema.ts
  app/db/location/types.ts
  app/db/location/create.ts
  app/db/location/get.ts
  app/db/location/get-all.ts
  app/db/location/update.ts
  app/db/location/remove.ts
  app/db/location/index.ts
  app/db/location/__tests__/create.test.ts
  app/db/location/__tests__/get.test.ts
  app/db/location/__tests__/get-all.test.ts
  app/db/location/__tests__/update.test.ts
  app/db/location/__tests__/remove.test.ts

Modified:
  app/db/database.ts — add locationTable import and locations entry in tableSchemas
```

## DB Layer

### `app/db/location/schema.ts`

```ts
import { z } from 'zod';
import { defineTable } from '../util';

export const locationTable = defineTable({
  name: 'locations',
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

### `app/db/location/types.ts`

```ts
import z from 'zod';
import { locationTable } from './schema';

export type Location = z.infer<typeof locationTable.zodSchema>;
export type UpdateLocationInput = z.infer<typeof locationTable.updateSchema>;
```

### `app/db/location/create.ts`

`create.ts` contains the Location-specific summary template and the `'New Location'`
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
  summary: `{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Type | Region | Climate","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Notable Features | Hazards","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Factions | Key NPCs","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"History | Secrets","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Stat Block / Travel Notes","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""}],"direction":null,"format":"","indent":0,"type":"root","version":1}}`,
};

export const create = async (adventure_id: string): Promise<string> => {
  assertValidId(adventure_id, 'adventure');

  const id = generateId();
  const { now, ...timestamps } = generateDbTimestamps();
  const name = `New Location ${getDateTimeString(now)}`;

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-arguments -- explicit type argument triggers excess property checking; inference alone does not
  const { sql, values } = buildCreateQuery<{
    adventure_id: string;
    name: string;
    summary: string;
    created_at: string;
    updated_at: string;
  }>('locations', id, {
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

### `app/db/location/get.ts`

Follow `db/npc/get.ts` exactly, substituting `locations`/`Location` for `npcs`/`Npc`.

### `app/db/location/get-all.ts`

Follow `db/npc/get-all.ts` exactly, substituting `locations`/`Location` for `npcs`/`Npc`.
SQL becomes:
`'SELECT * FROM locations WHERE adventure_id = $1 ORDER BY created_at DESC'`.

### `app/db/location/update.ts`

Follow `db/npc/update.ts` exactly, substituting
`locations`/`Location`/`locationTable`/`UpdateLocationInput` for
`npcs`/`Npc`/`npcTable`/`UpdateNpcInput`.

### `app/db/location/remove.ts`

Follow `db/npc/remove.ts` exactly, substituting `locations`/`Location` for `npcs`/`Npc`.
SQL becomes: `'DELETE FROM locations WHERE id = $1'`.

### `app/db/location/index.ts`

```ts
export { create } from './create';
export { get } from './get';
export { getAll } from './get-all';
export { update } from './update';
export { remove } from './remove';
export type { Location, UpdateLocationInput } from './types';
```

### `app/db/database.ts` changes

Add import alongside existing schema imports:

```ts
import { locationTable } from './location/schema';
```

Add entry to `tableSchemas` array, after the `foes` entry:

```ts
{ name: 'locations', sql: locationTable.createTableSQL },
```

## Tests

Read `db/npc/__tests__/` as the pattern reference before writing. Mock setup and test
structure are identical — only the required assertions below are domain-specific.

### `app/db/location/__tests__/create.test.ts`

Required assertions:

- `db.execute` called with full argument match:

```ts
expect(mockExecute).toHaveBeenCalledWith(
  expect.stringContaining('INSERT INTO locations'),
  [
    'test-generated-id',
    'test-adventure-id',
    expect.stringMatching(/^New Location /),
    expect.stringContaining('"type":"root"'),
    '2024-01-15T10:30:00.000Z',
    '2024-01-15T10:30:00.000Z',
  ],
);
```

- Return value is `'test-generated-id'`
- Empty `adventure_id` throws `'Valid adventure ID is required'` without calling execute

### `app/db/location/__tests__/get.test.ts`

Required assertions:

- Returns `Location` when `mockSelect` resolves with one item
- Returns `null` when `mockSelect` resolves with empty array
- Empty id throws `'Valid Location ID is required'`
- Whitespace-only id throws `'Valid Location ID is required'`

### `app/db/location/__tests__/get-all.test.ts`

Required assertions:

- Returns ordered array; `mockSelect` called with
  `'SELECT * FROM locations WHERE adventure_id = $1 ORDER BY created_at DESC'`
- Returns empty array when no locations
- Empty `adventureId` throws `'Valid Adventure ID is required'`
- Whitespace-only `adventureId` throws `'Valid Adventure ID is required'`

### `app/db/location/__tests__/update.test.ts`

Required assertions:

- Single field update produces correct `UPDATE locations SET name = $1, updated_at = $2 WHERE id = $3`
- Multi-field update includes all fields in SQL
- Empty id throws `'Valid Location ID is required'` without calling execute
- Whitespace id throws `'Valid Location ID is required'`
- Empty data object `{}` throws `'At least one field must be provided for update'`

### `app/db/location/__tests__/remove.test.ts`

Required assertions:

- Calls `db.execute` with `'DELETE FROM locations WHERE id = $1'` and `['test-id']`
- Empty id throws `'Valid Location ID is required'`
- Whitespace id throws `'Valid Location ID is required'`
