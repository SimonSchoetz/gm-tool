# Zod

## `z.ZodObject` is usable as a bare type annotation, and a `defineTable`-produced schema is assignable to it

**Verified at:** zod 4.6.5, read and run 2026-09-21
**Citation:** [spec-writer_1: app/node_modules/zod/v4/classic/schemas.d.ts:486-488 — `export interface ZodObject<out Shape extends core.$ZodShape = core.$ZodLooseShape, out Config extends core.$ZodObjectConfig = core.$strip>`, both parameters defaulted and declared `out` (covariant)] [spec-writer_2: ran `npx tsc --noEmit` from `app/` at 529b24dd, where `app/db/_sync/registry.ts` assigns each synced table's `defineTable` schema into `zodSchema: z.ZodObject` — observed zero errors]

`defineTable()` returns `zodSchema: z.ZodObject<ExtractZodShape<T['columns']>>`; because `Shape` is covariant and defaults to `$ZodLooseShape`, that concrete type is assignable to the unparameterized `z.ZodObject` with no cast. This makes it possible to store heterogeneous table schemas in a single typed array.

## `ZodObject.partial()` validates only the keys present in the input, leaving absent keys legal

**Verified at:** zod 4.6.5, read 2026-09-21
**Citation:** [spec-writer_3: app/node_modules/zod/v4/classic/schemas.d.ts:510-512 — `partial(): ZodObject<{ -readonly [k in keyof Shape]: ZodOptional<Shape[k]> }, Config>`; schemas.d.ts:27 — `safeParse(data: unknown, params?): parse.ZodSafeParseResult<core.output<this>>` is declared on the shared `ZodType` base, so it is available on every schema including the result of `.partial()`]

`.partial()` wraps every key in `ZodOptional` without weakening the per-key type check, so `schema.partial().safeParse(row)` accepts a row missing columns while still rejecting a present column whose value has the wrong type. The default `$strip` object config means unrecognized keys are dropped from the parse output rather than causing failure.

## `ZodString.regex()` exists in Zod 4 and returns the same schema type

**Verified at:** zod 4.6.5, read 2026-09-21
**Citation:** [spec-writer_4: app/node_modules/zod/v4/classic/schemas.d.ts:94 — `regex(regex: RegExp, params?: string | core.$ZodCheckRegexParams): this`]

`z.string().regex(SOME_REGEX)` is valid in Zod 4 and returns `this`, so it chains and remains assignable wherever the unrefined `z.string()` was.

## A `z.string().optional()` field rejects `null`, also after `ZodObject.partial()`

**Verified at:** zod 4.6.5, run 2026-09-19
**Citation:** [schema-inventory_100: ran a scratch probe parsing rows read back from the database with `zodSchema.partial().safeParse` — observed failures "Invalid input: expected string, received null" on columns declared `z.string().optional()`]

`.optional()` admits `undefined` or a missing key, not `null`, and `.partial()` adds only optionality; a nullable database column needs `.nullable()` for its `null` value to validate.

## Indexing the `shape` of an unparameterized `z.ZodObject` yields `any`

**Verified at:** zod 4.6.5, read 2026-09-21
**Citation:** [spec-writer_5: app/node_modules/zod/v4/core/schemas.d.ts:694 — `export type $ZodLooseShape = Record<string, any>`; app/node_modules/zod/v4/classic/schemas.d.ts:490 — `shape: Shape;` on `ZodObject`]

A bare `z.ZodObject` defaults its `Shape` parameter to `$ZodLooseShape`, which is `Record<string, any>`, so `schema.shape[key]` is typed `any`. Methods declared on the object itself, such as `partial()` and `safeParse()`, keep their declared types.
