# SF2: Split drawAndUpdateBeams

Split `drawAndUpdateBeams.ts` into two single-concern files. The file previously bundled two functions that share no implementation — they share only their module (`Beam` type and the helper barrel import). Each function owns a distinct responsibility: `drawBeams` renders the canvas; `updateBeams` advances simulation state.

## Files Affected

New:
- `app/src/components/Backdrop/helper/drawBeams.ts`
- `app/src/components/Backdrop/helper/updateBeams.ts`

Modified:
- `app/src/components/Backdrop/helper/index.ts`

Moved:
- `mv app/src/components/Backdrop/helper/drawAndUpdateBeams.ts` (deleted — content fully moved to the two new files)

## Frontend

### `drawBeams.ts` (new)

Extract `drawBeams` from `drawAndUpdateBeams.ts` as modified by SF1. The function body is unchanged from the SF1 state — use the inline waypoint loop, not the `getWaypointsBetween` call that existed before SF1. Imports are only what `drawBeams` itself uses:

```ts
import { RefObject } from 'react';
import { Beam } from '../types';

export const drawBeams = (beamsRef: RefObject<Beam[]>, ctx: CanvasRenderingContext2D) => {
  // ... function body verbatim from SF1 state
};
```

### `updateBeams.ts` (new)

Extract `updateBeams` from `drawAndUpdateBeams.ts`. The function body is unchanged from the pre-SF1 state (SF1 does not modify `updateBeams`). Include only the imports that `updateBeams` uses:

```ts
import { RefObject } from 'react';
import { Beam, Grid } from '../types';
import { getCumulativeLengths } from './getCumulativeLengths';
import { extractColorTriplet } from './extractColorTriplet';
import { generateZigzagPath } from './generateZigzagPath';
import { getColor } from './getColor';
import { getPositionOnPath } from './getPositionOnPath';

export const updateBeams = (beamsRef: RefObject<Beam[]>, gridRef: RefObject<Grid>) => {
  // ... function body verbatim from pre-SF1 state
};
```

### `helper/index.ts`

Replace the single `drawAndUpdateBeams` export line with two separate lines:

```ts
export { drawBeams } from './drawBeams';
export { updateBeams } from './updateBeams';
```

All other exports in the barrel are unchanged.
