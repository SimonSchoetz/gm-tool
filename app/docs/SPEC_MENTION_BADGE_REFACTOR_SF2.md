# SF2: Generic cross-table entity lookup

Adds a generic, cross-table "resolve one entity by id" DB function and a service-layer wrapper that returns a tolerant, never-throwing result — the mechanism SF3's live-data hook depends on. This is the fix for the crash risk identified in the root spec's Key Architectural Decisions heading "Live name/color resolution bypasses the existing per-entity DAL hooks entirely": the six existing per-entity hooks throw a domain error on a missing id, which is correct for their own screens but wrong for a mention badge that must degrade gracefully instead.

## Files affected

**Modified:**

- `db/mention-search.ts` — add `getById`
- `db/__tests__/mention-search.test.ts` — add tests for `getById`
- `services/mentionSearchService.ts` — add `getMentionEntityData`

## Layered breakdown

### DB

**`db/mention-search.ts` (modified)** — add alongside the existing `searchByName`:

```ts
export const getById = async (
  tableName: string,
  id: string,
): Promise<MentionSearchRow | null> => {
  const db = await getDatabase();

  // tableName is interpolated directly because SQL does not support parameterized
  // table names. The service layer validates tableName against the canonical
  // mentionable entity type list before calling this function — see
  // services/mentionSearchService.ts's getMentionEntityData.
  const rows = await db.select<MentionSearchRow[]>(
    `SELECT id, name, updated_at FROM ${tableName} WHERE id = $1`,
    [id],
  );

  return rows[0] ?? null;
};
```

`MentionSearchRow` is the existing type already declared in this file (`{ id: string; name: string; updated_at: string }`) — reused as-is, no new type needed. No error is thrown when the row is absent; an empty result set is a normal, valid outcome of this query, not a failure.

### Services

**`services/mentionSearchService.ts` (modified)** — add:

```ts
// merge into the existing `import { mentionSearchError } from '@domain/mentions';` line:
import { isMentionableEntityType, mentionSearchError } from '@domain/mentions';

export type MentionEntityData = {
  name: string | null;
  deleted: boolean;
};

export const getMentionEntityData = async (
  entityType: string,
  entityId: string,
): Promise<MentionEntityData> => {
  if (!isMentionableEntityType(entityType)) {
    return { name: null, deleted: true };
  }

  try {
    const row = await mentionSearch.getById(entityType, entityId);
    if (!row) {
      return { name: null, deleted: true };
    }
    return { name: row.name, deleted: false };
  } catch (err) {
    throw mentionSearchError(err);
  }
};
```

An unrecognized `entityType` and a missing row are both treated identically as `deleted: true` — from the caller's perspective there is no meaningful difference between "this table isn't a real mentionable table" and "no row with this id exists in it" (root spec KAD "Unrecognized or unknown entity types are treated as deleted, not as an error"). Only a genuine DB failure (caught in the `try`/`catch`) throws `mentionSearchError`, consistent with this file's existing `searchMentions` error handling.

## Test coverage

**`db/__tests__/mention-search.test.ts` (modified)** — add a new `describe('getById', ...)` block, following the existing `describe('searchByName', ...)` block's `beforeEach`/`afterEach` setup (`vi.clearAllMocks()`, `mockSelect.mockResolvedValue([])`, `vi.resetModules()` — see `app/db/CLAUDE.md`'s Testing section, which this file already follows). Import `getById` alongside the existing `searchByName` import. Three named tests:

- `'returns the row when a matching id exists'` — `mockSelect.mockResolvedValue([{ id: '1', name: 'Goblin', updated_at: '2025-01-01' }])`; assert `getById('npcs', '1')` resolves to `{ id: '1', name: 'Goblin', updated_at: '2025-01-01' }`; assert `mockSelect` was called with `` `SELECT id, name, updated_at FROM npcs WHERE id = $1` `` and `['1']`.
- `'returns null when no row matches'` — `mockSelect.mockResolvedValue([])`; assert `getById('npcs', 'missing-id')` resolves to `null`.

No test file is added for `services/mentionSearchService.ts`. No service file in this codebase has a test today (confirmed: no `services/__tests__/` directory exists, and `searchMentions` — already in this same file — has no test coverage) — the root Testing Policy's "Required" tests are scoped to helper functions and util functions, not the service layer. `getMentionEntityData` follows that existing, established absence of convention rather than introducing a new one.
