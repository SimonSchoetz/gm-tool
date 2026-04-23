# SPEC: Session Step & View Refactor

## Progress Tracker

- Sub-feature 1: LazyDmStepKey SSoT — move canonical type to DB layer; remove duplicate union in domain
- Sub-feature 2: LazyDmStepDefinition placeholder — add `placeholder: string` and populate all 8 entries
- Sub-feature 3: Default step name derivation — derive display names from `LAZY_DM_STEPS`; stop writing name at creation
- Sub-feature 4: Persist active view — add `active_view` column to sessions; remove local state and prop-drilling

## Key Architectural Decisions

### LazyDmStepKey canonical source is the DB layer

`LazyDmStepKey` values are stored in `session_steps.default_step_key`. The DB schema is the authoritative source. The frontend domain layer imports the type from `@db/session-step` rather than maintaining an independent union definition. This follows the existing `src/CLAUDE.md` convention: types derived from or owned by the DB schema are imported directly from `@db/domainName`.

### Display texts remain in domain

Names, tooltips, and placeholders for default steps are static content describing the Lazy DM methodology. They stay in `domain/session-steps/lazyDmSteps.ts`. The `LazyDmStepKey` type used to type this data is imported from `@db/session-step`.

### Default step names are not read from DB

Default step `name` values were written to the DB at creation; after this change they are not written and not read for display. Display names for default steps are always derived from `LAZY_DM_STEPS` via `default_step_key`. The `name` column remains in the schema for custom steps. Existing DB records with `name` set on default steps are silently ignored.

### View persistence removes prop-drilling

Once `active_view` lives in the DB, both `SessionScreen` and `SessionHeader` obtain the value independently via `useSession()`. No prop is needed. The `View` type previously exported from `SessionScreen.tsx` is deleted; `SessionView` from `@db/session` replaces it. This satisfies the `src/CLAUDE.md` rule: "Never relay a value as a prop when the receiving component can obtain it directly from a framework-managed context."

### Migration approach for active_view

There is no migration framework in this project. The `active_view` column is added to the sessions schema (so new databases get it via `CREATE TABLE IF NOT EXISTS`) and via an `ALTER TABLE` statement executed in `database.ts` (so existing databases are upgraded). The `ALTER TABLE` call is wrapped in a try-catch that silently swallows SQLite's "duplicate column name" error and re-throws all others. This is idempotent without a migration table.

### SessionView and SESSION_VIEW_VALUES follow the LazyDmStepKey pattern

`SESSION_VIEW_VALUES = ['prep', 'ingame'] as const` is defined in `db/session/schema.ts` and used as the Zod enum source, mirroring `LAZY_DM_STEP_KEYS` from SF1. `SessionView` is derived as `typeof SESSION_VIEW_VALUES[number]`. Both are exported from `@db/session`.

## Sub-Feature Files

- [SF1: LazyDmStepKey SSoT](SPEC_SESSION_STEP_VIEW_REFACTOR_SF1.md)
- [SF2: LazyDmStepDefinition placeholder](SPEC_SESSION_STEP_VIEW_REFACTOR_SF2.md)
- [SF3: Default step name derivation](SPEC_SESSION_STEP_VIEW_REFACTOR_SF3.md)
- [SF4: Persist active view](SPEC_SESSION_STEP_VIEW_REFACTOR_SF4.md)

## CLAUDE.md Impact

None. No new directory, layer, or structural pattern is introduced beyond what is already documented. The `@db/domainName` import depth rule for DB-originated types is already documented in `app/db/CLAUDE.md`.
