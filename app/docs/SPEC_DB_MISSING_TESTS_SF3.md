# SF3: table-config tests

Add four missing test files for the table-config domain.

## Files Affected

**Modified:** none

**New:**

- `app/db/table-config/__tests__/create.test.ts`
- `app/db/table-config/__tests__/get.test.ts`
- `app/db/table-config/__tests__/get-all.test.ts`
- `app/db/table-config/__tests__/update.test.ts`

## Layered Breakdown

### DB layer

Every test file that deals with layout must define a shared `validLayout` fixture inline. Import the type from `'../layout-schema'`:

```ts
import type { TableLayout } from '../layout-schema';

const validLayout: TableLayout = {
  searchable_columns: ['name'],
  columns: [{ key: 'name', label: 'Name', width: 200 }],
  sort_state: { column: 'name', direction: 'asc' },
};
```

`parseLayoutFromRow` is a pure synchronous function with no I/O. Do not mock it — provide valid JSON in mock rows and let it run.

---

**`app/db/table-config/__tests__/create.test.ts`**

Mocks: `@tauri-apps/plugin-sql` (mockExecute + mockSelect), `'../../../util'` (generateId → `'test-generated-id'`).

Import under test: `import { create } from '../create'`.

`table-config/create.ts` builds the INSERT by spreading the Zod-validated result and then appending `id`. The column order produced by `Object.keys()` on the resulting literal is `(table_name, color, tagging_enabled, scope, layout, id)` — `id` comes last because it was not present in the validated schema result and is appended after the spread.

Test cases:

1. `should create table config and return generated ID`
   - Input:

     ```ts
     { table_name: 'npcs', color: '#3498db', tagging_enabled: 1, scope: 'adventure', layout: validLayout }
     ```

   - Assert `mockExecute` called with:
     - sql: `'INSERT INTO table_config (table_name, color, tagging_enabled, scope, layout, id) VALUES ($1, $2, $3, $4, $5, $6)'`
     - values: `['npcs', '#3498db', 1, 'adventure', JSON.stringify(validLayout), 'test-generated-id']`
   - Assert return value equals `'test-generated-id'`

2. `should throw when layout is invalid`
   - Input: `{ table_name: 'npcs', color: '#000', tagging_enabled: 1, scope: 'adventure', layout: {} as TableLayout }`
   - Assert `create(input)` rejects with message containing `'Invalid layout'`
   - Assert `mockExecute` not called

---

**`app/db/table-config/__tests__/get.test.ts`**

Mocks: `@tauri-apps/plugin-sql`.

Import under test: `import { get } from '../get'`.

The fixture row must have `layout` as a JSON string. Define it as `JSON.stringify(validLayout)`. The row's remaining fields: `id: 'test-id'`, `table_name: 'npcs'`, `color: '#3498db'`, `tagging_enabled: 1`, `scope: 'adventure'`, `created_at: '2025-01-01'`, `updated_at: '2025-01-01'`.

Test cases:

1. `should return parsed TableConfig when found`
   - `mockSelect` returns the fixture row (with `layout` as JSON string)
   - Assert `mockSelect` called with `('SELECT * FROM table_config WHERE id = $1', ['test-id'])`
   - Assert return value has `layout` deep-equal to `validLayout` (the parsed object, not the JSON string)
   - Assert return value `id` equals `'test-id'`

2. `should return null when not found`
   - `mockSelect` returns `[]`
   - Assert return value is `null`

3. `should throw when id is empty`
   - `get('')` rejects with `'Valid table config ID is required'`
   - Assert `mockSelect` not called

4. `should throw when id is whitespace only`
   - `get('   ')` rejects with `'Valid table config ID is required'`
   - Assert `mockSelect` not called

---

**`app/db/table-config/__tests__/get-all.test.ts`**

Mocks: `@tauri-apps/plugin-sql`.

Import under test: `import { getAll } from '../get-all'`.

Define two fixture rows: one for `table_name: 'npcs'` and one for `table_name: 'sessions'`, each with `layout: JSON.stringify(validLayout)`.

`table-config/get-all.ts` calls `db.select` with a single string argument and no parameter array:

```ts
db.select<TableConfigRow[]>('SELECT * FROM table_config ORDER BY table_name ASC')
```

The mock assertion must match this signature exactly (no second argument).

Test cases:

1. `should return all table configs with parsed layouts ordered by table_name ASC`
   - `mockSelect` returns the two fixture rows
   - Assert `mockSelect` called with `'SELECT * FROM table_config ORDER BY table_name ASC'` — no second argument
   - Assert return value is an array of two objects where each `layout` deep-equals `validLayout`

2. `should return empty array when no configs exist`
   - `mockSelect` returns `[]`
   - Assert return value deep-equals `[]`

---

**`app/db/table-config/__tests__/update.test.ts`**

Mocks: `@tauri-apps/plugin-sql`.

Import under test: `import { update } from '../update'`.

Test cases:

1. `should update table_name and produce correct SQL`
   - `update('test-id', { table_name: 'sessions' })`
   - Assert `mockExecute` called with:
     - sql: `'UPDATE table_config SET table_name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2'`
     - values: `['sessions', 'test-id']`

2. `should serialize and update layout`
   - `update('test-id', { layout: validLayout })`
   - Assert `mockExecute` called with:
     - sql: `'UPDATE table_config SET layout = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2'`
     - values: `[JSON.stringify(validLayout), 'test-id']`

3. `should throw when id is empty`
   - `update('', { table_name: 'test' })` rejects with `'Valid table config ID is required'`
   - Assert `mockExecute` not called

4. `should throw when id is whitespace only`
   - `update('   ', { table_name: 'test' })` rejects with `'Valid table config ID is required'`
   - Assert `mockExecute` not called

5. `should throw when no update fields are provided`
   - `update('test-id', {})` rejects with `'At least one field must be provided for update'`
   - Assert `mockExecute` not called

6. `should throw when layout is invalid`
   - `update('test-id', { layout: { invalid: true } as unknown as TableLayout })` rejects with message containing `'Invalid layout'`
   - Assert `mockExecute` not called
