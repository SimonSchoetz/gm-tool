# Zod

## `z.ZodObject` is usable as a bare type annotation, and a `defineTable`-produced schema is assignable to it

**Verified at:** zod 4.4.3 (resolved from `^4.3.6` in `app/package.json`), read 2026-08-31
**Citation:** [spec-writer_6: app/node_modules/zod/v4/classic/schemas.d.ts:452-454 — `export interface ZodObject<out Shape extends core.$ZodShape = core.$ZodLooseShape, out Config extends core.$ZodObjectConfig = core.$strip>`, both parameters defaulted and declared `out` (covariant); spec-writer_7: ran `npx tsc --noEmit` from `app/` against a scratch module declaring `type SyncedTable = { name: string; columns: string[]; zodSchema: z.ZodObject }` and assigning `npcTable.zodSchema` and `tableConfigTable.zodSchema` into it — observed zero errors]

`defineTable()` returns `zodSchema: z.ZodObject<ExtractZodShape<T['columns']>>`; because `Shape` is covariant and defaults to `$ZodLooseShape`, that concrete type is assignable to the unparameterized `z.ZodObject` with no cast. This makes it possible to store heterogeneous table schemas in a single typed array.

## `ZodObject.partial()` validates only the keys present in the input, leaving absent keys legal

**Verified at:** zod 4.4.3, read 2026-08-31
**Citation:** [spec-writer_8: app/node_modules/zod/v4/classic/schemas.d.ts:477-479 — `partial(): ZodObject<{ -readonly [k in keyof Shape]: ZodOptional<Shape[k]> }, Config>`; spec-writer_9: schemas.d.ts:26 — `safeParse(data: unknown, params?): parse.ZodSafeParseResult<core.output<this>>` is declared on the shared `_ZodType` base, so it is available on every schema including the result of `.partial()`]

`.partial()` wraps every key in `ZodOptional` without weakening the per-key type check, so `schema.partial().safeParse(row)` accepts a row missing columns while still rejecting a present column whose value has the wrong type. The default `$strip` object config means unrecognized keys are dropped from the parse output rather than causing failure.

## `ZodString.regex()` exists in Zod 4 and returns the same schema type

**Verified at:** zod 4.4.3, read 2026-08-31
**Citation:** [spec-writer_10: app/node_modules/zod/v4/classic/schemas.d.ts:91 — `regex(regex: RegExp, params?: string | core.$ZodCheckRegexParams): this`]

`z.string().regex(SOME_REGEX)` is valid in Zod 4 and returns `this`, so it chains and remains assignable wherever the unrefined `z.string()` was.
