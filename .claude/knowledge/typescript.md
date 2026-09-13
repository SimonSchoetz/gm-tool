# TypeScript

## `noUncheckedIndexedAccess` is not included in `strict: true` and widens array/record index types to `T | undefined`

**Verified at:** typescript ~5.9.0
**Citation:** [spec-writer_1: app/tsconfig.json — flag confirmed present; TypeScript handbook https://www.typescriptlang.org/tsconfig#noUncheckedIndexedAccess]

When `noUncheckedIndexedAccess` is enabled, indexing an array (`arr[i]`) or a record (`obj[key]`) returns `T | undefined` rather than `T`. This flag is not part of the `strict` bundle — `"strict": true` alone does not enable it. Code that relies on a row-presence guard must use `if (rows.length === 0)` rather than optional-chaining (`rows[0]?.field`) combined with `=== undefined`, because the latter silently passes type-checking even when the guard intent is row-absence, not field-nullability. Any spec code example that indexes into an array or record must account for the `| undefined` widening when this flag is active.

---
**Reverified at:** app/tsconfig.json read 2026-07-10
**Citation:** [spec-writer_5: app/tsconfig.json:29-35 — compilerOptions contains strict, noUnusedLocals, noUnusedParameters, noFallthroughCasesInSwitch, erasableSyntaxOnly, exactOptionalPropertyTypes; noUncheckedIndexedAccess not present]

The flag is NOT currently enabled in app/tsconfig.json — the original citation's "flag confirmed present" no longer holds. The general TypeScript behavior described above remains correct, but index access in this repo currently returns `T`, not `T | undefined`.

## Spreading an `as const` tuple into another `as const` array literal yields a tuple whose element union includes every spread member

**Verified at:** typescript ~6.0.3, app/tsconfig.json compiler options
**Citation:** [spec-writer_4: ran `npx tsc --noEmit` from `app/` with a disposable `src/zz-scratch-typecheck.tsx` declaring `const BASE = ['npcs', 'foes'] as const; const ALL = [...BASE, 'sessions'] as const;`, assigning `['npcs', 'foes', 'sessions']` to `(typeof ALL)[number][]`, and an `@ts-expect-error` on assigning `'stories'` to that union — observed exit code 0, 0 errors]

A canonical subset list can be declared first and the superset built from it (`const SUPERSET = [...SUBSET, 'x'] as const`) without losing literal types: `(typeof SUPERSET)[number]` is the exact literal union of all members, and a non-member literal is rejected.

## A switch on a property access narrows that same property access inside grouped (fall-through) case labels

**Verified at:** typescript ~6.0.3, app/tsconfig.json compiler options (including `noFallthroughCasesInSwitch`)
**Citation:** [spec-writer_4: ran `npx tsc --noEmit` from `app/` with a disposable function taking `config: { kind: 'static'; label: string } | { kind: 'npcs' | 'foes' | 'sessions' }`, returning early on `config.kind === 'static'`, then `switch (config.kind) { case 'npcs': case 'foes': return takesBase(config.kind); case 'sessions': ... }` where `takesBase` accepts only `'npcs' | 'foes'` — observed exit code 0, 0 errors]

Inside `case 'a': case 'b':` the expression `config.kind` is narrowed to `'a' | 'b'` and is assignable to a parameter typed with exactly that union; empty case labels that fall through to a shared body do not trip `noFallthroughCasesInSwitch`.
