# SF4: Bounds Import

Replace the inline `{ x: number; y: number; width: number; height: number }` object type in `Backdrop.tsx` with the `Bounds` type from `./types`. The type is structurally identical — `Bounds` is defined in `app/src/components/Backdrop/types/bounds.type.ts` [S_1: types/bounds.type.ts:1–6] and exported via the types barrel [S_2: types/index.ts:2].

## Files Affected

Modified:
- `app/src/components/Backdrop/Backdrop.tsx`

## Frontend

### `Backdrop.tsx`

**Import:** Add `Bounds` to the existing types import:

```ts
import { Beam, Bounds, Grid } from './types';
```

**`dirtyRects` declaration:** Replace the inline object type:

```ts
// Before:
const dirtyRects: ({
  x: number;
  y: number;
  width: number;
  height: number;
} | null)[] = [];
// After:
const dirtyRects: (Bounds | null)[] = [];
```

**`activeDirtyRects` type predicate:** Replace the inline type with `Bounds`:

```ts
// Before:
const activeDirtyRects = dirtyRects.filter(
  (r): r is { x: number; y: number; width: number; height: number } => r !== null,
);
// After:
const activeDirtyRects = dirtyRects.filter(
  (r): r is Bounds => r !== null,
);
```
