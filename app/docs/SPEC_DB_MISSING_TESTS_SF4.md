# SF4: session-step tests

Add five missing test files for the session-step domain.

## Files Affected

**Modified:** none

**New:**

- `app/db/session-step/__tests__/create.test.ts`
- `app/db/session-step/__tests__/get.test.ts`
- `app/db/session-step/__tests__/get-all-by-session.test.ts`
- `app/db/session-step/__tests__/update.test.ts`
- `app/db/session-step/__tests__/remove.test.ts`

## Layered Breakdown

### DB layer

**`app/db/session-step/__tests__/create.test.ts`**

Mocks: `@tauri-apps/plugin-sql` (mockExecute + mockSelect), `'../../../util'` (generateId → `'test-generated-id'`).

Import under test: `import { create } from '../create'`.

`session-step/create.ts` delegates to `buildCreateQuery` from `app/db/util`, which skips `undefined` fields. The `createSchema` column order is `session_id, name, content, default_step_key, checked, sort_order`. Fields not provided in the input are `undefined` after `parse()` and are excluded from the INSERT.

Test cases:

1. `should create session step with only required fields`
   - Input: `{ session_id: 'sess-1', sort_order: 0 }`
   - After parse, `name`, `content`, `default_step_key`, and `checked` are `undefined` and skipped
   - Assert `mockExecute` called with:
     - sql: `'INSERT INTO session_steps (id, session_id, sort_order) VALUES ($1, $2, $3)'`
     - values: `['test-generated-id', 'sess-1', 0]`
   - Assert return value equals `'test-generated-id'`

2. `should create session step with optional name included`
   - Input: `{ session_id: 'sess-1', sort_order: 1, name: 'Strong Start' }`
   - After parse, `content`, `default_step_key`, and `checked` are undefined and skipped; `name` is included between `session_id` and `sort_order` per schema column order
   - Assert `mockExecute` called with:
     - sql: `'INSERT INTO session_steps (id, session_id, name, sort_order) VALUES ($1, $2, $3, $4)'`
     - values: `['test-generated-id', 'sess-1', 'Strong Start', 1]`

3. `should throw when session_id is missing`
   - Input: `{ sort_order: 0 } as CreateSessionStepInput`
   - Assert `create(input)` rejects (ZodError from `createSchema.parse`; do not assert a specific message)
   - Import `type { CreateSessionStepInput } from '../types'` for the type cast

---

**`app/db/session-step/__tests__/get.test.ts`**

Mocks: `@tauri-apps/plugin-sql`.

Import under test: `import { get } from '../get'`.

Import for fixture type: `import type { SessionStep } from '../types'`.

`session-step/get.ts` has no input validation — do not add an error-path test for empty id.

Test cases:

1. `should return session step by id`
   - `mockSelect` returns `[mockStep]` — a valid `SessionStep` fixture with `id: 'step-id'`, `session_id: 'sess-1'`, `sort_order: 0`
   - Assert `mockSelect` called with `('SELECT * FROM session_steps WHERE id = $1', ['step-id'])`
   - Assert return value deep-equals `mockStep`

2. `should return null when session step not found`
   - `mockSelect` returns `[]`
   - Assert return value is `null`

---

**`app/db/session-step/__tests__/get-all-by-session.test.ts`**

Mocks: `@tauri-apps/plugin-sql`.

Import under test: `import { getAllBySession } from '../get-all-by-session'`.

Import for fixture type: `import type { SessionStep } from '../types'`.

Test cases:

1. `should return session steps for a given sessionId ordered by sort_order ASC`
   - `mockSelect` returns `[step1, step2]` — two `SessionStep` fixtures with `sort_order: 0` and `sort_order: 1`
   - Assert `mockSelect` called with `('SELECT * FROM session_steps WHERE session_id = $1 ORDER BY sort_order ASC', ['sess-id'])`
   - Assert return value deep-equals `[step1, step2]`

2. `should return empty array when no steps found for the session`
   - `mockSelect` returns `[]`
   - Assert return value deep-equals `[]`

---

**`app/db/session-step/__tests__/update.test.ts`**

Mocks: `@tauri-apps/plugin-sql`.

Import under test: `import { update } from '../update'`.

`session-step/update.ts` calls `assertValidId(id, 'SessionStep')` — the error message is `'Valid SessionStep ID is required'`.

Test cases:

1. `should update name and produce correct SQL`
   - `update('step-id', { name: 'Updated Name' })`
   - Assert `mockExecute` called with:
     - sql: `'UPDATE session_steps SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2'`
     - values: `['Updated Name', 'step-id']`

2. `should update checked field`
   - `update('step-id', { checked: 1 })`
   - Assert `mockExecute` called with:
     - sql: `'UPDATE session_steps SET checked = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2'`
     - values: `[1, 'step-id']`

3. `should throw when id is empty`
   - `update('', { name: 'Test' })` rejects with `'Valid SessionStep ID is required'`
   - Assert `mockExecute` not called

4. `should throw when id is whitespace only`
   - `update('   ', { name: 'Test' })` rejects with `'Valid SessionStep ID is required'`
   - Assert `mockExecute` not called

5. `should throw when no update fields are provided`
   - `update('step-id', {})` rejects with `'At least one field must be provided for update'`
   - Assert `mockExecute` not called

---

**`app/db/session-step/__tests__/remove.test.ts`**

Mocks: `@tauri-apps/plugin-sql`.

Import under test: `import { remove } from '../remove'`.

`session-step/remove.ts` has no input validation — do not add an error-path test for empty id.

Test cases:

1. `should delete session step by id`
   - `remove('step-id')`
   - Assert `mockExecute` called with `('DELETE FROM session_steps WHERE id = $1', ['step-id'])`
