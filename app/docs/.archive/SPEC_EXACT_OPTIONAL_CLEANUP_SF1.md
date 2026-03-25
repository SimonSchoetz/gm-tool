# SF1 — mergeUpdate helper

Create a type-safe optimistic cache merge utility and its tests.

## Files Affected

**New:**

- `app/src/data-access-layer/mergeUpdate.ts`
- `app/src/data-access-layer/__tests__/mergeUpdate.test.ts`

## Data Access Layer

### `app/src/data-access-layer/mergeUpdate.ts`

Create this file. No imports required.

Export a single function `mergeUpdate` with this exact signature:

```ts
export const mergeUpdate = <T extends object>(
  base: T,
  patch: { [K in keyof T]?: T[K] | undefined },
): T
```

Implementation:

- Spread `base` into a new object and cast to `T` — this is the single permitted `as T` cast in this file.
- Iterate over the keys of `patch`. For each key whose value is not `undefined`, write that value into the result.
- Return the result.

The `as T` cast on `{ ...base }` is sound: the result starts as a complete copy of `T`, and every subsequent write targets a key that exists in `T` with a compatible value type enforced by the signature.

### `app/src/data-access-layer/__tests__/mergeUpdate.test.ts`

Create this file. Import `mergeUpdate` from `'../mergeUpdate'`.

Required test cases — each in its own `it` block, all under a single `describe('mergeUpdate', ...)`:

1. **Merges defined values from patch into base** — call `mergeUpdate` with a base object and a patch containing defined values for some keys; assert the returned object has the patched values.
2. **Skips keys where patch value is undefined** — call `mergeUpdate` with a patch that explicitly sets a key to `undefined`; assert the returned object retains the base value for that key.
3. **Leaves keys absent from patch unchanged** — call `mergeUpdate` with a patch that omits some keys entirely; assert those keys retain their base values.
4. **Works correctly when patch is empty `{}`** — call `mergeUpdate` with an empty patch; assert the returned object is a copy of base with all original values.

Use a plain object type (e.g. `{ name: string; count: number }`) as the generic `T` for all four cases — no domain types needed.
