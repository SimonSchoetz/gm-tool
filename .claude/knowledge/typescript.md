# TypeScript

## `noUncheckedIndexedAccess` is not included in `strict: true` and widens array/record index types to `T | undefined`

**Verified at:** typescript ~5.9.0
**Citation:** [S_1: app/tsconfig.json — flag confirmed present; TypeScript handbook https://www.typescriptlang.org/tsconfig#noUncheckedIndexedAccess]

When `noUncheckedIndexedAccess` is enabled, indexing an array (`arr[i]`) or a record (`obj[key]`) returns `T | undefined` rather than `T`. This flag is not part of the `strict` bundle — `"strict": true` alone does not enable it. Code that relies on a row-presence guard must use `if (rows.length === 0)` rather than optional-chaining (`rows[0]?.field`) combined with `=== undefined`, because the latter silently passes type-checking even when the guard intent is row-absence, not field-nullability. Any spec code example that indexes into an array or record must account for the `| undefined` widening when this flag is active.

---
**Reverified at:** app/tsconfig.json read 2026-07-10
**Citation:** [S_5: app/tsconfig.json:29-35 — compilerOptions contains strict, noUnusedLocals, noUnusedParameters, noFallthroughCasesInSwitch, erasableSyntaxOnly, exactOptionalPropertyTypes; noUncheckedIndexedAccess not present]

The flag is NOT currently enabled in app/tsconfig.json — the original citation's "flag confirmed present" no longer holds. The general TypeScript behavior described above remains correct, but index access in this repo currently returns `T`, not `T | undefined`.
