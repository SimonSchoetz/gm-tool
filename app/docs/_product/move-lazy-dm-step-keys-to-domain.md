# Move the Lazy DM step keys into the domain layer

A note written 2026-09-09 for whoever picks this up later, including a fresh Claude session with none of the conversation that produced it. Nothing is broken today and there is no user-visible effect. This is a layering cleanup, worth doing when the session-step code is being touched anyway rather than on its own.

## The change

`LAZY_DM_STEP_KEYS`, the const array of the eight prep-step keys, and `LazyDmStepKey`, the type derived from it, live in the database layer today. Move both into `app/domain/session-steps/`, export them through the domain barrel, and have the database schema import them instead of defining them. `[claude_1: app/db/session-step/schema.ts:4,15 — as of c0bf3f7d]`

## Why

Root `CLAUDE.md`'s App Structure calls `domain/` the application vocabulary layer. The eight step keys are vocabulary: they name the prep steps the whole app is built around, and the domain layer already owns everything else about those steps, since each step's display name, tooltip and placeholder sit in `app/domain/session-steps/lazyDmSteps.ts`. Only the key list itself lives in the database layer, because that is where the column validator first needed it. `[claude_2: app/domain/session-steps/lazyDmSteps.ts:1-16 — as of c0bf3f7d]`

The cost of leaving it is one import that runs against the layering. `app/domain/session-steps/lazyDmSteps.ts:1` type-imports `LazyDmStepKey` from `@db/session-step`, and that is the only import anywhere from the domain layer into the database layer. Every other import between the two runs the other way: three database files take a shared regex constant from `@domain`. `[claude_3: grep for imports crossing app/domain and app/db, excluding tests — one domain-to-db hit, three db-to-domain hits, as of c0bf3f7d]`

That single backwards edge is why `app/docs/CLAUDE.md`'s layered breakdown calls Domain and Database peers instead of putting Domain strictly below Database. Reversing it makes every edge between the two layers run one way.

## What this is not

It is not a bug and not a circular dependency. The domain-to-database import is an `import type`, which TypeScript erases at emit, and the project sets `isolatedModules`, so the marking is mandatory and the erasure unambiguous. At runtime the database layer depends on domain and nothing depends back. The cycle exists only in the type graph, where it costs nothing. `[claude_4: app/tsconfig.json:14 — as of c0bf3f7d]`

## Files it touches

- `app/domain/session-steps/` gains the const and the type. The domain barrel already re-exports this directory, so no barrel edit is needed. `[claude_5: app/domain/index.ts:14 — as of c0bf3f7d]`
- `app/db/session-step/schema.ts` imports both instead of declaring them, and keeps its `z.enum(LAZY_DM_STEP_KEYS)` column validator unchanged.
- `app/db/session-step/index.ts` re-exports the type today. Decide whether the database layer keeps re-exporting vocabulary it no longer owns, or whether callers switch to `@domain`.
- `app/db/session-step/types.ts` changes its import path.
- `app/src/screens/session/components/PrepView/components/StepSection/components/TooltipPanel/TooltipPanel.tsx` type-imports the key from `@db/session-step` and would switch to `@domain`.
- `app/domain/session-steps/lazyDmSteps.ts` loses its import entirely.

No test file references either symbol, and no migration references the keys, so the frozen-literal exception in `app/db/CLAUDE.md` under Migrations does not apply. `[claude_6: grep for LazyDmStepKey and LAZY_DM_STEP over app, including tests and app/db/_migrations — no hits in either, as of c0bf3f7d]`

## When it is done

Update the layered breakdown in `app/docs/CLAUDE.md`: Domain moves strictly below Database and the sentence calling them peers goes, keeping the note that the Rust backend depends on neither. That is an instruction-file edit, so it belongs in a dedicated instruction pass rather than riding along with the code change.
