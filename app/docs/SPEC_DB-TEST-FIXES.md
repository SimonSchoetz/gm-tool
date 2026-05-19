# Spec: DB Layer Test Fixes + Adventure getAll Simplification

## Progress Tracker

- SF1: adventure/getAll simplification — remove pagination, simplify to `Adventure[]` return [FOUNDATION: SF1 must be committed before any other SF runs tsc]
- SF2: session/getAll validation — add missing `assertValidId` guard and tests
- SF3: npc + foe create test fixes — fix positional indexing and add missing summary assertions
- SF4: adventure/create test fix — fix positional indexing
- SF5: adventure/get + remove whitespace tests — add missing whitespace-only validation cases
- SF6: session get/update/remove it() splits — split combined validation `it()` blocks into two
- SF7: image test fixes — whitespace validation, fix null assertion, remove redundant test
- SF8: session/get inline validation migration — replace inline guard with `assertValidId`

## Key Architectural Decisions

### adventure/getAll drops pagination

`adventure/get-all.ts` is the only paginated query in the entire DB layer. Adventures are the slowest-growing entity (one per campaign), so pagination provides no practical benefit. The function is simplified to match every other `getAll` in the codebase: no parameters, returns `T[]` directly. `PaginationParams` and `PaginatedResponse` become dead types and are removed in full.

### session/get.ts is the only remaining inline validation site

`session/update.ts` and `session/remove.ts` already use `assertValidId`. Only `session/get.ts` uses an inline guard (`if (!id || typeof id !== 'string' || id.trim() === '')`). SF8 migrates it to `assertValidId(id, 'session')` to match the rest of the session domain. After SF8, all session CRUD functions use the utility. SF2 uses `assertValidId` for `session/get-all.ts` to match the DB-layer convention for `adventureId` validation.

### Positional index removal strategy

Tests that read `values[N]` from mock calls are fragile to field-order changes in `buildCreateQuery`. Two replacement patterns are used in this spec:
- For NPC and Foe `create` tests: rewrite the full assertion as `toHaveBeenCalledWith(..., [exact, values, with, matchers])` — this documents the complete DB write contract.
- For adventure `create` tests: use `values.find(...)` for the name and `values.at(-2)` / `values.at(-1)` for timestamps (same pattern as `image/__tests__/create.test.ts`).

### Summary template assertion form

`npc/create.ts` and `foe/create.ts` each embed a Lexical JSON string as the default `summary`. Tests assert structural presence — `expect.stringContaining('"type":"root"')` inside the full values array — not the complete JSON string. This keeps the test correct without coupling it to copy changes in the template.

## Sub-feature Files

- [SF1: adventure/getAll simplification](SPEC_DB-TEST-FIXES_SF1.md)
- [SF2: session/getAll validation](SPEC_DB-TEST-FIXES_SF2.md)
- [SF3: npc + foe create test fixes](SPEC_DB-TEST-FIXES_SF3.md)
- [SF4: adventure/create test fix](SPEC_DB-TEST-FIXES_SF4.md)
- [SF5: adventure/get + remove whitespace tests](SPEC_DB-TEST-FIXES_SF5.md)
- [SF6: session get/update/remove it() splits](SPEC_DB-TEST-FIXES_SF6.md)
- [SF7: image test fixes](SPEC_DB-TEST-FIXES_SF7.md)
- [SF8: session/get inline validation migration](SPEC_DB-TEST-FIXES_SF8.md)

## CLAUDE.md Impact

`app/docs/_product/domain-scaffold.md` already prescribes `assertValidId` for all four CRUD functions (`get.ts`, `get-all.ts`, `update.ts`, `remove.ts`). This spec brings the session domain into compliance with what the scaffold already documents — no scaffold update is needed. New domains created after this spec is implemented will already follow the correct pattern.
