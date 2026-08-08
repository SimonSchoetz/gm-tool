# SF2 — Domain errors: `domain/encounters/`

Adds the six typed error factories the service layer throws, and registers the module in the domain grouping barrel. Self-contained: nothing outside `domain/encounters/` and `domain/index.ts` changes, and the sub-feature type-checks on its own.

## Files affected

New:

- `app/domain/encounters/errors.ts`
- `app/domain/encounters/index.ts`

Modified:

- `app/domain/index.ts` — add the `encounters` re-export

## Domain layer

### `errors.ts`

Pure substitution from `app/domain/foes/errors.ts` — six factory functions, each following the `app/CLAUDE.md` factory-function pattern (typed alias plus a factory that constructs an `Error`, casts it, and sets `error.name`). No class declarations.

Substitution table:

| Foe symbol | Encounter symbol | Message |
| --- | --- | --- |
| `FoeNotFoundError` / `foeNotFoundError(id)` | `EncounterNotFoundError` / `encounterNotFoundError(id)` | `` `Encounter with id ${id} not found` `` |
| `FoeLoadError` / `foeLoadError(cause?)` | `EncounterLoadError` / `encounterLoadError(cause?)` | `` `Failed to load Encounters: ${String(cause)}` `` |
| `FoeCreateError` / `foeCreateError(cause?)` | `EncounterCreateError` / `encounterCreateError(cause?)` | `` `Failed to create Encounter: ${String(cause)}` `` |
| `FoeUpdateError` / `foeUpdateError(id, cause?)` | `EncounterUpdateError` / `encounterUpdateError(id, cause?)` | `` `Failed to update Encounter ${id}: ${String(cause)}` `` |
| `FoeDeleteError` / `foeDeleteError(id, cause?)` | `EncounterDeleteError` / `encounterDeleteError(id, cause?)` | `` `Failed to delete Encounter ${id}: ${String(cause)}` `` |
| `FoeDuplicateError` / `foeDuplicateError(id, cause?)` | `EncounterDuplicateError` / `encounterDuplicateError(id, cause?)` | `` `Failed to duplicate Encounter ${id}: ${String(cause)}` `` |

The `name` string assigned inside each factory is the PascalCase type name, matching the alias exactly.

### `index.ts`

Module directory barrel with explicit named exports — twelve lines, one `export type` and one `export` per error, in the same paired order `app/domain/foes/index.ts` uses. `export *` is not used here: the module barrel is the curated public-API statement that `domain/index.ts` re-exports wholesale.

### `app/domain/index.ts`

Add `export * from './encounters';` in the alphabetically-sorted position between `export * from './devices';` and `export * from './entities';`. `export *` is correct in this file and is what every existing line uses: `app/CLAUDE.md` — Directory Structure grants the grouping-barrel `export *` exception to layers whose own CLAUDE.md documents a dual import path, and `app/domain/CLAUDE.md` — Imports documents both `@domain` and `@domain/<subdomain>` as sanctioned. Re-listing the twelve names by hand would add a second hand-maintained copy with no curation value.

## Tests

None. No `errors.ts` anywhere in `app/domain/` has a test file. The three `__tests__/` directories under `domain/` cover other module kinds entirely: `domain/entities/__tests__/` tests the `buildEntityPath` and `entityTypeLabel` lookup accessors, and `domain/devices/__tests__/` and `domain/sync/__tests__/` each test their sibling `messages.ts`. An error factory has no branching and no derived output — a test would assert the message template against itself.

## Cross-sub-feature wiring

All twelve exported symbols have their first consumer in SF3: `app/services/encountersService.ts` imports `encounterNotFoundError`, `encounterLoadError`, `encounterCreateError`, `encounterUpdateError`, `encounterDeleteError`, and `encounterDuplicateError` from `@domain/encounters`. The six type aliases are consumed as the declared return types of their own factories within `errors.ts` itself.
