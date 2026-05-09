# Spec: DB Layer Default Placement Refactor

## Progress Tracker

- SF1: DB Utility Layer — add `get-datetime-string.ts`, type `buildCreateQuery` with `DbInsertData`, fix `buildUpdateQuery` ISO timestamp
- SF2: Adventure Domain — complete staged refactor (fix layer violation, add timestamps, complete tests)
- SF3: NPC Domain — move default name to `create.ts`, manual type, remove `createSchema` usage
- SF4: Session Domain — narrow `create` signature, manual type, fix DAL mutation closure violation
- SF5: Session-step Domain — manual type, remove `content` field, add timestamps
- SF6: Image Domain — add timestamps, remove dead `CreateImageInput` barrel export
- SF7: Table-config Domain — remove `createSchema` usage, manual type, timestamps
- SF8: Define-table Cleanup — remove `ExtractCreateShape`, `generateCreateSchema`, `createSchema` from `define-table.ts`

Sub-features must be implemented in order. SF8 may only begin after SF2–SF7 are complete,
as it removes `createSchema` from `defineTable` and any remaining callers would break.

Sub-feature files:
- [SF1](SPEC_DB_DEFAULTS_REFACTOR_SF1.md)
- [SF2](SPEC_DB_DEFAULTS_REFACTOR_SF2.md)
- [SF3](SPEC_DB_DEFAULTS_REFACTOR_SF3.md)
- [SF4](SPEC_DB_DEFAULTS_REFACTOR_SF4.md)
- [SF5](SPEC_DB_DEFAULTS_REFACTOR_SF5.md)
- [SF6](SPEC_DB_DEFAULTS_REFACTOR_SF6.md)
- [SF7](SPEC_DB_DEFAULTS_REFACTOR_SF7.md)
- [SF8](SPEC_DB_DEFAULTS_REFACTOR_SF8.md)

## Key Architectural Decisions

### Default Placement Hierarchy

All DB entry defaults must live as close to the database as possible. Two levels are permitted:

1. **SQL schema `DEFAULT` clause** — for short static strings (e.g. `'active'`) and numeric
   literals (e.g. `0`, `1`). These are constants the DB can own entirely.
2. **`create.ts`** — for computed values: timestamps (`new Date().toISOString()`), and computed
   strings (e.g. `'New adventure ' + getDateTimeString(...)`).

No defaults belong in the service layer or frontend. `CURRENT_TIMESTAMP` is banned from all
schemas and `buildUpdateQuery` — it produces `YYYY-MM-DD HH:MM:SS` (not ISO 8601 UTC).

### Manually-Written Creation Types

`Create*Input` types are manually written and contain only what callers must provide: foreign
keys and optional user-supplied data. They are NOT derived from `createSchema` or
`ExtractCreateShape`. The auto-derivation machinery (`ExtractCreateShape`, `generateCreateSchema`,
`createSchema`) is removed entirely from `define-table.ts` in SF8.

Domains whose `create()` function requires no caller input (adventure) export no `Create*Input`
type. Domains whose `create()` requires only a foreign key string (npc, session) take the
FK as a positional `string` argument rather than an object.

### Generic `buildCreateQuery<T>`

`buildCreateQuery` becomes generic: `<T extends Record<string, string | number | null>>`.
Each `create.ts` defines a local `CreationData` type describing exactly what goes into its
INSERT, then calls `buildCreateQuery<CreationData>(...)`. TypeScript errors at the call site
when the data object contains a field not declared in `CreationData`. No named type is exported
from `buildCreateQuery` — the constraint is the generic bound, inferred from the argument.

Each `create.ts` defines two local types:
- `DbTimestamps = { created_at: string; updated_at: string }`
- `CreationData = { <domain-specific fields> } & DbTimestamps`

Optional fields (e.g. `default_step_key?: LazyDmStepKey | null`) are included in `CreationData`
as optional properties. Use conditional spreads at the call site to exclude them when absent.

### `buildUpdateQuery` Timestamp Fix

`buildUpdateQuery` currently injects `updated_at = CURRENT_TIMESTAMP` as a SQL expression.
It is changed to compute `new Date().toISOString()` and inject it as a bound parameter `$N`.
This change is in `buildUpdateQuery` itself; no domain `update.ts` file requires modification.
All domain `update.test.ts` files and `build-update-query.test.ts` must be updated in SF1 to
reflect the new SQL shape.

### `getDateTimeString` in the Shared `app/util/` Layer

`getDateTimeString` moves from `app/src/util/getDateTimeString.ts` to `app/util/getDateTimeString.ts`.
`app/util/` is already in `tsconfig.json`'s `include` array but needs a new `@util/*` path alias
added to `tsconfig.json`, `vite.config.ts`, and `vitest.config.ts`. The frontend barrel
(`app/src/util/index.ts`) re-exports `getDateTimeString` from `@util/getDateTimeString`, so all
existing frontend consumers continue to work with no import changes. DB layer `create.ts` files
import directly from `@util/getDateTimeString` via the `db/util/index.ts` re-export.

### `session.create()` Signature and DAL Cascade

Changing `session/create.ts` from `create(data: CreateSessionInput)` to `create(adventure_id: string)`
removes the only external consumer of `CreateSessionInput`. This cascades through:
`sessionService.createSession(adventureId: string)` → `useSessions.ts` mutation closure →
`SessionsScreen.tsx` call site. The `useSessions.ts` mutation also has a pre-existing
CLAUDE.md violation (passing `adventureId` at call time when it is known at construction time)
that must be fixed in SF4.

## CLAUDE.md Impact

### `app/db/CLAUDE.md`

No change required — the Default Placement Hierarchy rule (`### Default Placement Hierarchy`)
was added in the staged changes that precede this spec. The INSERT Best Practice section already
covers the pattern used here.
