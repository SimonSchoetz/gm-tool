# SF1: npc tests

Add five missing test files for the npc domain. No source files are modified.

## Files Affected

**Modified:** none

**New:**

- `app/db/npc/__tests__/create.test.ts`
- `app/db/npc/__tests__/get.test.ts`
- `app/db/npc/__tests__/get-all.test.ts`
- `app/db/npc/__tests__/update.test.ts`
- `app/db/npc/__tests__/remove.test.ts`

## Layered Breakdown

### DB layer

**`app/db/npc/__tests__/create.test.ts`**

Mocks: `@tauri-apps/plugin-sql` (mockExecute + mockSelect), `'../../../util'` (generateId → `'test-generated-id'`).

Import under test: `import { create } from '../create'`.

`npc/create.ts` builds the INSERT statement by calling `Object.keys()` on `{ id, adventure_id, name, summary: templates.summary }`. The column order is always `(id, adventure_id, name, summary)` and the `summary` value is always the internal template string (not exported). Assert the template is present using `expect.any(String)` for the fourth value.

Test cases:

1. `should insert NPC with required fields and return generated ID`
   - Input: `{ adventure_id: 'test-adventure-id', name: 'Test NPC' }`
   - Assert `mockExecute` called with:
     - sql: `'INSERT INTO npcs (id, adventure_id, name, summary) VALUES ($1, $2, $3, $4)'`
     - values: `['test-generated-id', 'test-adventure-id', 'Test NPC', expect.any(String)]`
   - Assert return value equals `'test-generated-id'`

2. `should allow empty name`
   - Input: `{ adventure_id: 'test-adventure-id', name: '' }`
   - Assert `mockExecute` called with values `['test-generated-id', 'test-adventure-id', '', expect.any(String)]`
   - Assert return value equals `'test-generated-id'`

3. `should throw when adventure_id is missing`
   - Input: `{ name: 'Test NPC' } as CreateNpcInput`
   - Assert `create(input)` rejects (ZodError from `createSchema.parse`; do not assert a specific message)
   - Import `type { CreateNpcInput } from '../types'` for the type cast

---

**`app/db/npc/__tests__/get.test.ts`**

Mocks: `@tauri-apps/plugin-sql`.

Import under test: `import { get } from '../get'`.

Import for fixture type: `import type { Npc } from '../types'`.

`npc/get.ts` has no input validation — do not add an error-path test for empty id.

Test cases:

1. `should return NPC by id`
   - `mockSelect` returns `[mockNpc]` where `mockNpc` is a valid `Npc` fixture with all required fields set
   - Assert `mockSelect` called with `('SELECT * FROM npcs WHERE id = $1', ['test-id'])`
   - Assert return value deep-equals `mockNpc`

2. `should return null when NPC not found`
   - `mockSelect` returns `[]`
   - Assert return value is `null`

---

**`app/db/npc/__tests__/get-all.test.ts`**

Mocks: `@tauri-apps/plugin-sql`.

Import under test: `import { getAll } from '../get-all'`.

Import for fixture type: `import type { Npc } from '../types'`.

Test cases:

1. `should return NPCs for a given adventureId ordered by created_at DESC`
   - `mockSelect` returns `[npc1, npc2]` — two `Npc` fixtures with differing `created_at` values, newer first
   - Assert `mockSelect` called with `('SELECT * FROM npcs WHERE adventure_id = $1 ORDER BY created_at DESC', ['adv-1'])`
   - Assert return value deep-equals `[npc1, npc2]`

2. `should return empty array when no NPCs exist for the adventure`
   - `mockSelect` returns `[]`
   - Assert return value deep-equals `[]`

---

**`app/db/npc/__tests__/update.test.ts`**

Mocks: `@tauri-apps/plugin-sql`.

Import under test: `import { update } from '../update'`.

`npc/update.ts` delegates to `buildUpdateQuery`. The npc `updateSchema` column order is `adventure_id, name, summary, description, image_id` — `buildUpdateQuery` processes entries in that order and skips `undefined` values.

Test cases:

1. `should update name and produce correct SQL`
   - `update('test-id', { name: 'Updated NPC' })`
   - Assert `mockExecute` called with:
     - sql: `'UPDATE npcs SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2'`
     - values: `['Updated NPC', 'test-id']`

2. `should update multiple fields`
   - `update('test-id', { name: 'New Name', summary: 'New summary' })`
   - Assert sql: `'UPDATE npcs SET name = $1, summary = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3'`
   - Assert values: `['New Name', 'New summary', 'test-id']`

3. `should throw when id is empty`
   - `update('', { name: 'Test' })` rejects with `'Valid NPC ID is required'`
   - Assert `mockExecute` not called

4. `should throw when id is whitespace only`
   - `update('   ', { name: 'Test' })` rejects with `'Valid NPC ID is required'`
   - Assert `mockExecute` not called

5. `should throw when no update fields are provided`
   - `update('test-id', {})` rejects with `'At least one field must be provided for update'`
   - Assert `mockExecute` not called

---

**`app/db/npc/__tests__/remove.test.ts`**

Mocks: `@tauri-apps/plugin-sql`.

Import under test: `import { remove } from '../remove'`.

Test cases:

1. `should delete NPC by id`
   - `remove('test-id')`
   - Assert `mockExecute` called with `('DELETE FROM npcs WHERE id = $1', ['test-id'])`

2. `should throw when id is empty`
   - `remove('')` rejects with `'Valid NPC ID is required'`
   - Assert `mockExecute` not called

3. `should throw when id is whitespace only`
   - `remove('   ')` rejects with `'Valid NPC ID is required'`
   - Assert `mockExecute` not called
