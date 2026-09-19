---
paths: ["app/db/**/__tests__/**", "db/**/__tests__/**"]
---

# Unit tests under `db/`

## Module registry reset

Every test file that calls `vi.mock('@tauri-apps/plugin-sql', ...)` at module scope must reset the module registry between tests. Default: `afterEach(() => { vi.resetModules(); })` with a static top-level import of the function under test — correct for domain CRUD test files (see `db/adventure/__tests__/`, `db/session/__tests__/`), where `getDatabase()` is incidental plumbing and every assertion targets `mockExecute`/`mockSelect` call history, already reset per test by `vi.clearAllMocks()`. The stricter pattern — `vi.resetModules()` in `beforeEach` plus a dynamic `await import('../moduleName')` inside each test body, never a static top-level import — is required only when the suite asserts on `initDatabase`'s or `getDatabase`'s own init-or-caching behavior (e.g. `db/__tests__/init-database.test.ts`): a stale cached `db` from a prior test would silently short-circuit the migration-running path and falsify the assertion.

## Init path and `select` mocks

Every test that calls `getDatabase()` runs the full init path, which runs every migration's statements — the applied-ledger `database.select()` and any `select` a migration step issues — against whatever `mockSelect` returns at that moment. Any test file that invokes `getDatabase()` — directly or indirectly — must call `mockSelect.mockResolvedValue([])` in its `beforeEach` before any other setup (omitting it crashes the init), and a test that needs `select` to return rows scopes that override to its own SQL: `mockSelect.mockImplementation((query: string) => query.includes('<the SQL under test>') ? rows : [])` (see `db/_system/__tests__/get.test.ts`). A blanket `mockSelect.mockResolvedValue(rows)` also answers the init path's selects, so a migration step that parses selected row content throws on a foreign row.
