# SF7: Table-config Domain

Replace `createSchema.parse()` with manual construction. Write `CreateTableConfigInput`
manually. `tagging_enabled` and `scope` keep their SQL `DEFAULT` clauses but callers may
override them (the seed does).

## Files Affected

```
Modified:
  app/db/table-config/create.ts
  app/db/table-config/schema.ts
  app/db/table-config/types.ts
  app/db/table-config/__tests__/create.test.ts
```

## DB Changes

### `app/db/table-config/create.ts`

```typescript
import { getDatabase } from '../database';
import { generateId, buildCreateQuery, generateDbTimestamps } from '../util';
import { tableLayoutSchema } from './layout-schema';
import type { CreateTableConfigInput } from './types';

type CreationData = {
  table_name: string;
  color: string;
  layout: string;
  created_at: string;
  updated_at: string;
  tagging_enabled?: number;
  scope?: string;
};

export const create = async (data: CreateTableConfigInput): Promise<string> => {
  const layoutResult = tableLayoutSchema.safeParse(data.layout);
  if (!layoutResult.success) {
    throw new Error(`Invalid layout: ${layoutResult.error.message}`);
  }

  const id = generateId();
  const { created_at, updated_at } = generateDbTimestamps();

  const { sql, values } = buildCreateQuery<CreationData>('table_config', id, {
    table_name: data.table_name,
    color: data.color,
    layout: JSON.stringify(layoutResult.data),
    created_at,
    updated_at,
    ...(data.tagging_enabled !== undefined ? { tagging_enabled: data.tagging_enabled } : {}),
    ...(data.scope !== undefined ? { scope: data.scope } : {}),
  });

  const db = await getDatabase();
  await db.execute(sql, values);
  return id;
};
```

Remove: `import { tableConfigTable } from './schema'`.

### `app/db/table-config/schema.ts`

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

Keep `default: '1'` on `tagging_enabled` and `default: "'adventure'"` on `scope` unchanged.

### `app/db/table-config/types.ts`

Replace `CreateTableConfigInput` with a manually-written type. `TypedCreateTableConfigInput<T>`
derives from it via `Omit` and requires no change.

```typescript
import z from 'zod';
import { tableConfigTable } from './schema';
import type { LayoutColumn, SortDirection, TableLayout } from './layout-schema';

type TableConfigRow = z.infer<typeof tableConfigTable.zodSchema>;

export type TableConfig = Omit<TableConfigRow, 'layout'> & { layout: TableLayout };

export type CreateTableConfigInput = {
  table_name: string;
  color: string;
  layout: TableLayout;
  tagging_enabled?: number;
  scope?: 'adventure' | 'global';
};

export type UpdateTableConfigInput = Omit<
  z.infer<typeof tableConfigTable.updateSchema>,
  'layout'
> & { layout?: TableLayout };

export type TypedTableLayout<T> = {
  searchable_columns: (keyof T & string)[];
  columns: (Omit<LayoutColumn, 'key'> & { key: keyof T & string })[];
  sort_state: { column: keyof T & string; direction: SortDirection };
};

export type TypedCreateTableConfigInput<T> = Omit<CreateTableConfigInput, 'layout'> & {
  layout: TypedTableLayout<T>;
};
```

`table-config/index.ts` already exports `CreateTableConfigInput` with an explicit named
export — no change needed.

### `app/db/table-config/__tests__/create.test.ts`

Read the current test file before editing. Add fake timer setup. Update any SQL assertions
to include `created_at` and `updated_at`. Add tests for optional field exclusion.

Add to `beforeEach`:

```typescript
vi.useFakeTimers();
vi.setSystemTime(new Date('2024-01-15T10:30:00.000Z'));
```

Add to `afterEach`:

```typescript
vi.useRealTimers();
```

Add one test that verifies optional fields are omitted when not provided:

```typescript
it('should omit tagging_enabled and scope from INSERT when not provided', async () => {
  await create({
    table_name: 'test',
    color: '#fff',
    layout: {
      searchable_columns: [],
      columns: [],
      sort_state: { column: 'name', direction: 'asc' },
    },
  });

  const [sql] = mockExecute.mock.calls[0] as [string, unknown[]];
  expect(sql).not.toContain('tagging_enabled');
  expect(sql).not.toContain('scope');
});
```
