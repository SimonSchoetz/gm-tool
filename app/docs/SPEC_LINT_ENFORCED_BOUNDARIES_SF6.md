# Sub-feature 6: Promote the rules to error

Raises `local/no-import-past-index` and `import-x/no-cycle` from `warn` to `error`, so a future reach-in or cycle fails `npx eslint .` instead of printing a warning that nobody has to act on (root Key Architectural Decisions — "Both rules land at `warn` and are promoted to `error` last").

## Files affected

Modified:

- `app/eslint.config.js` — in the two rule entries SF1 added, `'warn'` becomes `'error'`. Their options (`passThroughDirs`, `ignoreExternal: true`) stay unchanged. `'local/no-wrapped-line-comments': 'warn'` stays unchanged.

New: none. Deleted: none. Moved: none. Draft: none.

## Layered breakdown

No layer from the layer order is touched. The file is ESLint tooling under `app/`.

Precondition: `npx eslint .` from `app/` prints no `local/no-import-past-index` or `import-x/no-cycle` warning. If it prints any, fix it by the procedure in SF4's "How to rewrite an import" before changing severity. If a remaining cycle cannot be fixed by rewriting a specifier, stop and report it to the user.

## Tests

None. Severity is configuration. `findCrossedBoundary`'s tests from SF1 still run.

## Verification

- Run the full check suite from `app/`: `npx tsc --noEmit`, `npx eslint .`, `npx prettier --check .`, `npx vitest run`.
- Repeat SF1's probe with the disposable file `app/src/screens/scratch-boundary-probe.ts`, with one change: SF3 moved `ShowPopupArgs`, so its type import becomes `import type { ShowPopupArgs } from '@/providers/PinnedPopupsContext/PinnedPopupsContext';`. `npx eslint src/screens/scratch-boundary-probe.ts` must now exit non-zero with three `local/no-import-past-index` errors, naming `src/data-access-layer`, `domain/devices` and `src/providers/PinnedPopupsContext`. Delete the file afterwards.
- Run `time npx eslint .` from `app/` and put the duration in the handoff next to the two SF1 measurements.
