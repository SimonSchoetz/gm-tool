# Spec: DB Missing Tests

## Progress Tracker

- Sub-feature 1 (SF1): npc tests — add all missing tests for npc CRUD operations (create, get, getAll, update, remove)
- Sub-feature 2 (SF2): image/replace test — add missing test for image.replace
- Sub-feature 3 (SF3): table-config tests — add all missing tests for table-config CRUD operations (create, get, getAll, update)
- Sub-feature 4 (SF4): session-step tests — add all missing tests for session-step CRUD operations (create, get, getAllBySession, update, remove)
- Sub-feature 5 (SF5): util tests — rename `__test__` directory to `__tests__` and add missing tests for buildUpdateQuery, buildCreateQuery, and validation utilities
- Sub-feature 6 (SF6): mention-search test — add missing test for the db-root searchByName function

## Key Architectural Decisions

### Test file location follows `__tests__/` convention

Every test file lives in a `__tests__/` subdirectory immediately next to the source file it tests, per the root CLAUDE.md convention ("Test files live in a `__tests__/` subdirectory next to the code they test"). The existing `app/db/util/schema/__test__/` directory uses the singular `__test__` and violates this rule. SF5 corrects it by renaming to `__tests__/`.

### SQL plugin mock pattern is consistent across all DB tests

Every test that calls into `getDatabase()` must mock `@tauri-apps/plugin-sql` at the top of the file, before any imports of the module under test. The established pattern from `app/db/adventure/__tests__/` and `app/db/session/__tests__/`:

```ts
const mockExecute = vi.fn();
const mockSelect = vi.fn();

vi.mock('@tauri-apps/plugin-sql', () => ({
  default: {
    load: vi.fn(() => Promise.resolve({ execute: mockExecute, select: mockSelect })),
  },
}));
```

### `generateId` is mocked to return a fixed string in create tests

Functions that call `generateId()` from `app/util` import it as `'../../util'` relative to their source file. From test files one level deeper in `__tests__/`, the resolved mock path is `'../../../util'`. The mock returns `'test-generated-id'` to make assertions deterministic:

```ts
vi.mock('../../../util', () => ({ generateId: vi.fn(() => 'test-generated-id') }));
```

### `image/replace` test mocks sibling modules, not the SQL plugin

`replace.ts` is a compositor: it calls `remove()` then `create()`. Testing it end-to-end would require mocking both the SQL plugin and Tauri's `invoke`. Instead, mock the two sibling modules directly to test the orchestration in isolation:

- `vi.mock('../remove', () => ({ remove: vi.fn() }))`
- `vi.mock('../create', () => ({ create: vi.fn() }))`

### Pure util functions require no external mocks

`buildUpdateQuery`, `buildCreateQuery`, `assertValidId`, and `assertHasUpdateFields` are pure functions with no I/O. Their tests import the functions directly and need no `vi.mock` setup.

### `table-config` tests provide valid `TableLayout` inline

`table-config` functions serialize `TableLayout` to JSON for the DB and parse it back on read. Tests define a valid `TableLayout` inline rather than mocking `parseLayoutFromRow`. `parseLayoutFromRow` is a pure synchronous function — it runs without mocking as long as the JSON in the mock row is valid.

### `mention-search` test lives in the existing `app/db/__tests__/` directory

`mention-search.ts` is a cross-table utility at the db root. Its test is placed in `app/db/__tests__/mention-search.test.ts`, co-located with the existing `init-database.test.ts`.

### Dynamic INSERT column order in npc/create and table-config/create

`npc/create.ts` and `table-config/create.ts` build INSERT statements by calling `Object.keys()` on a literal object. The column order in the SQL matches the literal key insertion order — a runtime detail that tests must capture exactly:

- `npc/create.ts` inserts `(id, adventure_id, name, summary)` — always in that order, always including the template `summary`.
- `table-config/create.ts` spreads the Zod-validated result then appends `id`, producing column order `(table_name, color, tagging_enabled, scope, layout, id)`.

### Tests assert only observable behavior that exists in source

Functions without input validation — `npc/get.ts`, `session-step/get.ts`, `session-step/remove.ts` — do not throw for invalid input. Tests for these functions must not include error-path cases for empty ids; doing so would assert behavior that does not exist.

## Sub-feature Files

- [SF1: npc tests](SPEC_DB_MISSING_TESTS_SF1.md)
- [SF2: image/replace test](SPEC_DB_MISSING_TESTS_SF2.md)
- [SF3: table-config tests](SPEC_DB_MISSING_TESTS_SF3.md)
- [SF4: session-step tests](SPEC_DB_MISSING_TESTS_SF4.md)
- [SF5: util tests + `__test__` rename](SPEC_DB_MISSING_TESTS_SF5.md)
- [SF6: mention-search test](SPEC_DB_MISSING_TESTS_SF6.md)

## CLAUDE.md Impact

None. This spec adds test files only. The `__test__` → `__tests__` rename in SF5 aligns existing code with the already-documented `__tests__/` rule — no documentation change is needed.
