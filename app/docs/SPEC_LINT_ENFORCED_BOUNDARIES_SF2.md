# Sub-feature 2: Domain and database boundary fixes

Makes every existing import that crosses an `index.ts` boundary in `db/` and `domain/` go through that `index.ts`, which clears every `local/no-import-past-index` warning outside `app/src/` plus the two `src/` imports of `@db/table-config/layout-schema`. These imports crossed a boundary before this branch too; SF1's rule is the first thing to flag them [spec-writer_23: ran a disposable scan applying `findCrossedBoundary`'s algorithm to every import in `app/src`, `app/db`, `app/domain`, `app/services`, `app/util` at 245a4168 with `app/domain` as pass-through — observed, outside `app/src`: `db/_sync/registry.ts` ×8 and `domain/sync/messages.ts` ×1; inside `app/src`: `useTableConfig.ts` and `useSortable.ts` on `@db/table-config/layout-schema`, plus six provider imports that SF3 and SF5 handle].

## Files affected

Modified:

- `app/domain/sync/messages.ts` — `import { ENVELOPE_VERSION } from '../devices/messages'` becomes `from '../devices'`. `domain/devices/index.ts` already exports `ENVELOPE_VERSION`, and no file in `domain/devices/` imports `domain/sync/`, so no cycle is introduced.
- `app/db/image/index.ts` — add `export { imageTable } from './schema';`
- `app/db/adventure/index.ts` — add `export { adventureTable } from './schema';`
- `app/db/session/index.ts` — add `export { sessionTable } from './schema';`
- `app/db/base-entity/index.ts` — add `export { baseEntityTable } from './schema';`
- `app/db/base-entity-content-section/index.ts` — add `export { baseEntityContentSectionTable } from './schema';`
- `app/db/encounter/index.ts` — add `export { encounterTable } from './schema';`
- `app/db/session-step/index.ts` — add `export { sessionStepTable } from './schema';`
- `app/db/table-config/index.ts` — add `export { tableConfigTable } from './schema';` and `export type { PersistedSortState, SortDirection } from './layout-schema';`
- `app/db/_sync/registry.ts` — lines 2–9 import each table from its module `index.ts` (`'../image'`, `'../adventure'`, `'../session'`, `'../base-entity'`, `'../base-entity-content-section'`, `'../encounter'`, `'../session-step'`, `'../table-config'`) instead of `'../<table>/schema'`. Imported names are unchanged.
- `app/src/data-access-layer/table-config/useTableConfig.ts` — `import type { SortDirection } from '@db/table-config/layout-schema'` becomes `from '@db/table-config'`.
- `app/src/hooks/useSortable.ts` — `import { PersistedSortState } from '@db/table-config/layout-schema'` becomes `from '@db/table-config'`.

New: none. Deleted: none. Moved: none. Draft: none.

## Layered breakdown

### Domain

`domain/sync/messages.ts` — the specifier change listed above. This file lies outside `app/src/`, so the "hides something" rule does not apply to `domain/devices/index.ts`, which keeps every export it has (root Key Architectural Decisions — "`db/`, `domain/`, `services/` and `app/util/` keep their barrels as they are").

### Database

Each of the eight synced table modules exports its table definition (root Key Architectural Decisions — "A db table definition is part of its module's public API"). The export is an explicit named export, per `app/db/CLAUDE.md` — Conventions ("`export *` is banned"). Add each line after the barrel's existing value exports and before its `export type` block. `db/table-config/index.ts` also exports the two layout-schema types its `src/` consumers read. `db/_sync/registry.ts` needs no other change: it uses the same identifiers, which now come from the module `index.ts`.

No `db/` barrel removes an export. The "hides something" test does not apply in `db/`.

### Data Access Layer

`data-access-layer/table-config/useTableConfig.ts` — the specifier change listed above.

### Frontend

`hooks/useSortable.ts` — the specifier change listed above. The import keeps its current non-`type` form. `isolatedModules` is on and `verbatimModuleSyntax` is off in `app/tsconfig.json`, so importing a name the barrel re-exports through `export type` compiles.

## Tests

No behavior changes, so no test is added or modified. The existing `db/_sync/__tests__/` suite must still pass.

## Verification

`npx eslint .` from `app/` prints no `local/no-import-past-index` warning for any file under `db/`, `domain/` or `services/`, or for `useTableConfig.ts` or `useSortable.ts`.
