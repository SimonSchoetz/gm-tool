# SF5: BEAM_BOUNDS_PADDING Constant

Extract `BEAM_BOUNDS_PADDING = 4` from `Backdrop.tsx` into a standalone constants file at the component root. See root KAD "BEAM_BOUNDS_PADDING lives at the Backdrop component root, not in helper/" for placement rationale.

## Files Affected

New:
- `app/src/components/Backdrop/Backdrop.constants.ts`

Modified:
- `app/src/components/Backdrop/Backdrop.tsx`
- `app/src/components/Backdrop/helper/__tests__/getBeamBounds.test.ts`

## Frontend

### `Backdrop.constants.ts` (new)

```ts
export const BEAM_BOUNDS_PADDING = 4;
```

### `Backdrop.tsx`

Remove the inline `const BEAM_BOUNDS_PADDING = 4;` declaration. Add an import:

```ts
import { BEAM_BOUNDS_PADDING } from './Backdrop.constants';
```

All usages of `BEAM_BOUNDS_PADDING` in the file body are unchanged.

### `getBeamBounds.test.ts`

Import `BEAM_BOUNDS_PADDING` from the constants file:

```ts
import { BEAM_BOUNDS_PADDING } from '../../Backdrop.constants';
```

Replace the hardcoded `4` argument with `BEAM_BOUNDS_PADDING` in the tests that specifically verify padding behavior with the production value. The test that returns `null` (no particles) and the tests that use `padding = 0` are unchanged.

**Test: "applies padding uniformly on all sides"** — replace the argument:

```ts
// Before:
const result = getBeamBounds(beam, 4);
// After:
const result = getBeamBounds(beam, BEAM_BOUNDS_PADDING);
```

The expected value `{ x: 21, y: -4, width: 58, height: 8 }` remains unchanged — it is based on `BEAM_BOUNDS_PADDING = 4` and remains correct.
