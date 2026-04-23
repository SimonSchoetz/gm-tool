# SF5: util tests + `__test__` rename

Rename the existing `__test__` (singular) directory to `__tests__` (plural) to comply with the CLAUDE.md convention. Add three missing test files for the pure utility functions.

## Files Affected

**Modified:**

- `app/db/util/schema/__test__/define-table.test.ts` — rename the containing directory from `__test__` to `__tests__`; file content is unchanged

**New:**

- `app/db/util/schema/__tests__/define-table.test.ts` (rename target — same content as existing file)
- `app/db/util/__tests__/build-update-query.test.ts`
- `app/db/util/__tests__/build-create-query.test.ts`
- `app/db/util/__tests__/validation.test.ts`

The rename is accomplished by creating `app/db/util/schema/__tests__/define-table.test.ts` with the existing file's content, then deleting `app/db/util/schema/__test__/define-table.test.ts` and the now-empty `__test__/` directory.

## Layered Breakdown

### DB layer (pure utility functions — no DB I/O, no mocks needed)

**`app/db/util/__tests__/build-update-query.test.ts`**

No mocks. Import: `import { buildUpdateQuery } from '../build-update-query'`.

`buildUpdateQuery` builds an UPDATE statement by iterating `Object.entries(validated)` and skipping `undefined` values. It always appends `updated_at = CURRENT_TIMESTAMP` and places `id` as the final parameter.

Test cases:

1. `should generate UPDATE SQL for a single field`
   - `buildUpdateQuery('adventures', 'test-id', { name: 'New Name' })`
   - Assert `sql === 'UPDATE adventures SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2'`
   - Assert `values` deep-equals `['New Name', 'test-id']`

2. `should generate UPDATE SQL for multiple fields in entry order`
   - `buildUpdateQuery('adventures', 'test-id', { name: 'New Name', description: 'New Desc' })`
   - Assert `sql === 'UPDATE adventures SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3'`
   - Assert `values` deep-equals `['New Name', 'New Desc', 'test-id']`

3. `should skip undefined values`
   - `buildUpdateQuery('adventures', 'test-id', { name: 'Name', description: undefined })`
   - Assert `sql === 'UPDATE adventures SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2'`
   - Assert `values` deep-equals `['Name', 'test-id']`

4. `should use the correct final parameter index for id`
   - `buildUpdateQuery('sessions', 'sess-id', { name: 'A', summary: 'B' })`
   - Assert `sql` ends with `'updated_at = CURRENT_TIMESTAMP WHERE id = $3'`
   - Assert `values[2]` equals `'sess-id'`

---

**`app/db/util/__tests__/build-create-query.test.ts`**

No mocks. Import: `import { buildCreateQuery } from '../build-create-query'`.

`buildCreateQuery` starts with `id` at `$1` and appends each defined field from `validated`. Undefined fields are skipped.

Test cases:

1. `should generate INSERT SQL with id and all defined fields`
   - `buildCreateQuery('sessions', 'test-id', { adventure_id: 'adv-1', name: 'Session 1' })`
   - Assert `sql === 'INSERT INTO sessions (id, adventure_id, name) VALUES ($1, $2, $3)'`
   - Assert `values` deep-equals `['test-id', 'adv-1', 'Session 1']`

2. `should skip undefined fields`
   - `buildCreateQuery('sessions', 'test-id', { adventure_id: 'adv-1', name: undefined })`
   - Assert `sql === 'INSERT INTO sessions (id, adventure_id) VALUES ($1, $2)'`
   - Assert `values` deep-equals `['test-id', 'adv-1']`

3. `should produce INSERT with only id when validated object has no defined fields`
   - `buildCreateQuery('test_table', 'test-id', {})`
   - Assert `sql === 'INSERT INTO test_table (id) VALUES ($1)'`
   - Assert `values` deep-equals `['test-id']`

4. `should start id at $1 and use sequential indices`
   - `buildCreateQuery('npcs', 'npc-id', { a: 1, b: 2, c: 3 })`
   - Assert `sql` contains `'($1, $2, $3, $4)'`
   - Assert `values[0]` equals `'npc-id'`
   - Assert `values` deep-equals `['npc-id', 1, 2, 3]`

---

**`app/db/util/__tests__/validation.test.ts`**

No mocks. Import: `import { assertValidId, assertHasUpdateFields } from '../validation'`.

Test cases for `assertValidId`:

1. `should throw with entity name in message when id is empty string`
   - `expect(() => assertValidId('', 'Adventure')).toThrow('Valid Adventure ID is required')`

2. `should throw when id is whitespace only`
   - `expect(() => assertValidId('   ', 'Session')).toThrow('Valid Session ID is required')`

3. `should not throw when id is a valid non-empty string`
   - `expect(() => assertValidId('test-id', 'NPC')).not.toThrow()`

Test cases for `assertHasUpdateFields`:

1. `should throw when data object is empty`
   - `expect(() => assertHasUpdateFields({})).toThrow('At least one field must be provided for update')`

2. `should throw when all values are undefined`
   - `expect(() => assertHasUpdateFields({ name: undefined, description: undefined })).toThrow('At least one field must be provided for update')`

3. `should not throw when at least one value is defined`
   - `expect(() => assertHasUpdateFields({ name: 'New Name' })).not.toThrow()`

4. `should not throw when multiple values are defined`
   - `expect(() => assertHasUpdateFields({ name: 'New Name', description: 'New Desc' })).not.toThrow()`
