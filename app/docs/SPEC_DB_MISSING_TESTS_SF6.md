# SF6: mention-search test

Add the missing test for `searchByName` in the db-root cross-table utility.

## Files Affected

**Modified:** none

**New:**

- `app/db/__tests__/mention-search.test.ts`

## Layered Breakdown

### DB layer

**`app/db/__tests__/mention-search.test.ts`**

Mocks: `@tauri-apps/plugin-sql` (mockExecute + mockSelect).

Import under test: `import { searchByName } from '../mention-search'`.

In `beforeEach`: `vi.clearAllMocks()`. Default: `mockExecute.mockResolvedValue({})`, `mockSelect.mockResolvedValue([])`.

`searchByName` branches on whether `adventureId` is `null`. When not null, it adds an `AND adventure_id = $2` clause and passes `adventureId` as the second parameter. When null, it omits the clause and passes only the LIKE pattern. The `tableName` is interpolated directly into the SQL string (not parameterized).

Test cases:

1. `should search with LIKE pattern scoped to adventureId when adventureId is not null`
   - `mockSelect` returns `[{ id: '1', name: 'Goblin', updated_at: '2025-01-01' }]`
   - `await searchByName('npcs', 'gob', 'adv-1')`
   - Assert `mockSelect` called with:
     - sql: `` `SELECT id, name, updated_at FROM npcs WHERE name LIKE $1 AND adventure_id = $2 ORDER BY updated_at DESC` ``
     - params: `['%gob%', 'adv-1']`
   - Assert return value deep-equals `[{ id: '1', name: 'Goblin', updated_at: '2025-01-01' }]`

2. `should search without adventureId filter when adventureId is null`
   - `mockSelect` returns `[{ id: '2', name: 'Tavern', updated_at: '2025-01-02' }]`
   - `await searchByName('places', 'tav', null)`
   - Assert `mockSelect` called with:
     - sql: `` `SELECT id, name, updated_at FROM places WHERE name LIKE $1 ORDER BY updated_at DESC` ``
     - params: `['%tav%']`
   - Assert return value deep-equals `[{ id: '2', name: 'Tavern', updated_at: '2025-01-02' }]`

3. `should return empty array when no results match`
   - `mockSelect` returns `[]`
   - `await searchByName('npcs', 'zzz', 'adv-1')`
   - Assert return value deep-equals `[]`
