# SF7: Tests — setGridDimensions, initBeams, updateBeams

Add tests for three helpers that become fully testable after SF3's clock injection. All test files live in `helper/__tests__/`.

## Files Affected

New:
- `app/src/components/Backdrop/helper/__tests__/setGridDimensions.test.ts`
- `app/src/components/Backdrop/helper/__tests__/initBeams.test.ts`
- `app/src/components/Backdrop/helper/__tests__/updateBeams.test.ts`

## Frontend

### `setGridDimensions.test.ts`

`setGridDimensions` reads `window.innerWidth` and `window.innerHeight`. Set these via `Object.defineProperty` before each test and restore them in `afterEach`.

```ts
import { describe, it, expect, afterEach } from 'vitest';
import { setGridDimensions } from '../setGridDimensions';
import type { Grid } from '../../types';
```

Helper: `const makeGridRef = (): { current: Grid } => ({ current: null });`

Setup pattern used in each test:

```ts
Object.defineProperty(window, 'innerWidth', { value: <n>, configurable: true, writable: true });
Object.defineProperty(window, 'innerHeight', { value: <n>, configurable: true, writable: true });
```

Required tests:

- `it('sets squareSize to innerWidth / 8 when that is below 120')` — `innerWidth = 800`, `innerHeight = 600` → expect `squareSize = 100`, `cols = 9`, `rows = 7`, `offsetX = -50`, `offsetY = -50`
- `it('caps squareSize at 120 when innerWidth / 8 exceeds 120')` — `innerWidth = 1200`, `innerHeight = 900` → expect `squareSize = 120`, `cols = 11`, `rows = 8.5` (float, matches `window.innerHeight / squareSize + 1`), `offsetX = -60`, `offsetY = -60`
- `it('sets offsetX and offsetY to -squareSize / 2')` — verify both equal `-squareSize / 2` for any valid input

The `afterEach` should restore `innerWidth` and `innerHeight` to their defaults (`1024` and `768` are typical jsdom defaults — restore by repeating `Object.defineProperty` with those values, or set `configurable: true` in each test to allow subsequent overrides).

### `initBeams.test.ts`

`initBeams` now receives `now: number` (SF3). `getColor` calls `getComputedStyle` which returns `''` in jsdom — this is acceptable since these tests verify structure and timing, not rendering.

```ts
import { describe, it, expect } from 'vitest';
import { initBeams } from '../initBeams';
import type { Beam } from '../../types';

const makeBeamsRef = (): { current: Beam[] } => ({ current: [] });
```

Required tests:

- `it('creates the specified number of beams')` — call `initBeams(ref, 3, 4, 0)`, expect `ref.current` to have length 3
- `it('each beam starts inactive with empty path and particles')` — call `initBeams(ref, 1, 4, 0)`, verify `active = false`, `path = []`, `particles = []`, `progress = 0`, `pathLength = 0`
- `it('speed increments by index starting from beamSpeed')` — call `initBeams(ref, 3, 4, 0)`, expect speeds `[4, 5, 6]`
- `it('nextSpawnTime falls within [now + i*2000, now + i*2000 + 10000] for each beam')` — call `initBeams(ref, 3, 4, 50000)`, loop over `i = 0..2` and assert `beam.nextSpawnTime >= 50000 + i * 2000` and `<= 50000 + i * 2000 + 10000`

### `updateBeams.test.ts`

`updateBeams` now receives `now: number` (SF3). Uses a test grid for the spawn path. Use the same grid shape as `generateZigzagPath.test.ts`: `{ squareSize: 50, cols: 4, rows: 3, offsetX: -25, offsetY: -25 }`.

```ts
import { describe, it, expect } from 'vitest';
import { updateBeams } from '../updateBeams';
import { getCumulativeLengths } from '../getCumulativeLengths';
import type { Beam, Grid } from '../../types';

const makeGridRef = (grid: Grid): { current: Grid } => ({ current: grid });

const testGrid: NonNullable<Grid> = {
  squareSize: 50,
  cols: 4,
  rows: 3,
  offsetX: -25,
  offsetY: -25,
};

const makeBeamsRef = (beams: Beam[]): { current: Beam[] } => ({ current: beams });
```

Helper for a pre-built active beam with a known path:

```ts
const makeActiveBeam = (): Beam => {
  const path = [{ x: 0, y: 0 }, { x: 200, y: 0 }];
  const cumulativeLengths = getCumulativeLengths(path);
  return {
    path,
    cumulativeLengths,
    particles: [],
    color: 'rgb(65, 105, 225)',
    colorTriplet: '65, 105, 225',
    nextSpawnTime: 0,
    progress: 0,
    pathLength: 200,
    speed: 4,
    active: true,
    lastDrawnBounds: null,
  };
};
```

Required tests:

- `it('does not activate a beam whose nextSpawnTime has not passed')` — beam with `active: false`, `nextSpawnTime: 300`, call `updateBeams(ref, gridRef, 200)`, verify `beam.active === false`
- `it('activates a beam when now exceeds its nextSpawnTime')` — beam with `active: false`, `nextSpawnTime: 100`, call `updateBeams(ref, makeGridRef(testGrid), 200)`, verify `beam.active === true` and `beam.path.length > 0`
- `it('advances progress by beam speed each tick')` — `makeActiveBeam()` with `progress: 0`, `speed: 4`, call `updateBeams(ref, makeGridRef(null), now)`, verify `beam.progress === 4`
- `it('ages particles and removes those that reach maxAge')` — `makeActiveBeam()` with a single particle `{ age: 19, maxAge: 20, ... }`, call `updateBeams`, verify `beam.particles` is empty
- `it('deactivates a beam when progress exceeds pathLength')` — `makeActiveBeam()` with `progress: 197`, `speed: 4`, `pathLength: 200`, call `updateBeams(ref, makeGridRef(null), now)`, verify `beam.active === false` after the update (progress becomes 201 ≥ 200)

For the "ages particles" and "deactivates" tests the gridRef can be `makeGridRef(null)` since the spawn branch only runs for inactive beams.

The particle fixture for the aging test: `{ x: 0, y: 0, age: 19, maxAge: 20, progress: 0 }`.
