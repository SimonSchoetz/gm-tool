# SF5: Corner Cutting Fix

Add `getWaypointsBetween` helper that returns all path points (including corner vertices) between two progress
values. Update `drawBeams` in `createBeams.ts` to use it when connecting consecutive particles. Fix the
`helper/index.ts` barrel violation (convert `export *` to explicit named exports) and add the new export.

Depends on SF1 (Particle.progress type field) and SF3 (particles are spawned with `progress: beam.progress`
set) — both must be complete before this sub-feature is implemented.

## Files affected

Modified:

- `app/src/components/Backdrop/helper/createBeams.ts`
- `app/src/components/Backdrop/helper/index.ts`

New:

- `app/src/components/Backdrop/helper/getWaypointsBetween.ts`
- `app/src/components/Backdrop/helper/__tests__/getWaypointsBetween.test.ts`

## Layered breakdown

### Frontend

#### getWaypointsBetween.ts

**Purpose**: Given a beam path and two progress values (`fromProgress` = older particle's path distance,
`toProgress` = newer particle's path distance), return an ordered array of `{x, y}` points that includes the
interpolated position at `fromProgress`, any path corner vertices whose cumulative distance falls strictly
between `fromProgress` and `toProgress`, and the interpolated position at `toProgress`. Enables `drawBeams`
to route trail segments through corners instead of cutting across them.

**File**: `app/src/components/Backdrop/helper/getWaypointsBetween.ts`

**Import**:

```ts
import { getPositionOnPath } from './getPositionOnPath';
```

`getPositionOnPath` is a sibling file in `helper/`; import it by direct relative path (not through the
barrel). Its signature is `(path: { x: number; y: number }[], distance: number): { x: number; y: number } | null`
[confirmed: app/src/components/Backdrop/helper/getPositionOnPath.ts:1–4].

**Full implementation**:

```ts
import { getPositionOnPath } from './getPositionOnPath';

export const getWaypointsBetween = (
  path: { x: number; y: number }[],
  fromProgress: number,
  toProgress: number
): { x: number; y: number }[] => {
  const start = getPositionOnPath(path, fromProgress);
  const end = getPositionOnPath(path, toProgress);

  if (!start || !end) return [];

  const intermediates: { x: number; y: number }[] = [];

  let accumulated = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const dx = path[i + 1].x - path[i].x;
    const dy = path[i + 1].y - path[i].y;
    accumulated += Math.sqrt(dx * dx + dy * dy);

    if (accumulated > fromProgress && accumulated < toProgress) {
      intermediates.push(path[i + 1]);
    }

    if (accumulated >= toProgress) break;
  }

  return [start, ...intermediates, end];
};
```

`accumulated` after each iteration equals the cumulative path length from `path[0]` to `path[i + 1]`.
A vertex is a corner waypoint if its cumulative distance is strictly between `fromProgress` and `toProgress`.
The early-break avoids iterating past the relevant segment range.

#### getWaypointsBetween.test.ts

**File**: `app/src/components/Backdrop/helper/__tests__/getWaypointsBetween.test.ts`

Shared test path (right-angle with three segments, each length 100):

```ts
const path = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 100 },
  { x: 0, y: 100 },
];
// Cumulative distances: path[1]=100, path[2]=200, path[3]=300
```

**Test 1 — no intermediate waypoints (same segment)**:

`fromProgress = 10`, `toProgress = 50`. Both are within segment 0→1 (cumulative end = 100). `path[1]` has
cumulative distance 100, which is NOT strictly between 10 and 50.

- `getPositionOnPath(path, 10)` = `{ x: 10, y: 0 }`
- `getPositionOnPath(path, 50)` = `{ x: 50, y: 0 }`
- Expected: `[{ x: 10, y: 0 }, { x: 50, y: 0 }]`

**Test 2 — one intermediate waypoint (single corner)**:

`fromProgress = 50`, `toProgress = 150`. Span crosses the corner at `path[1]` (cumulative distance 100;
100 is strictly between 50 and 150).

- `getPositionOnPath(path, 50)` = `{ x: 50, y: 0 }` (segment 0→1, t = 0.5)
- `getPositionOnPath(path, 150)` = `{ x: 100, y: 50 }` (segment 1→2, t = 0.5)
- Expected: `[{ x: 50, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 50 }]`

**Test 3 — two intermediate waypoints (double corner)**:

`fromProgress = 50`, `toProgress = 250`. Span crosses corners at `path[1]` (100) and `path[2]` (200); both
are strictly between 50 and 250.

- `getPositionOnPath(path, 50)` = `{ x: 50, y: 0 }`
- `getPositionOnPath(path, 250)` = `{ x: 50, y: 100 }` (segment 2→3, t = 0.5; path[2]=(100,100),
  path[3]=(0,100), t=0.5 → x=50, y=100)
- Expected: `[{ x: 50, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 50, y: 100 }]`

Use `toEqual` for coordinate object comparison.

Full test file:

```ts
import { describe, it, expect } from 'vitest';
import { getWaypointsBetween } from '../getWaypointsBetween';

const path = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 100 },
  { x: 0, y: 100 },
];

describe('getWaypointsBetween', () => {
  it('returns only start and end when both progress values are within the same segment', () => {
    const result = getWaypointsBetween(path, 10, 50);
    expect(result).toEqual([{ x: 10, y: 0 }, { x: 50, y: 0 }]);
  });

  it('includes one corner vertex when the range spans a single corner', () => {
    const result = getWaypointsBetween(path, 50, 150);
    expect(result).toEqual([
      { x: 50, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 50 },
    ]);
  });

  it('includes two corner vertices when the range spans two corners', () => {
    const result = getWaypointsBetween(path, 50, 250);
    expect(result).toEqual([
      { x: 50, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 50, y: 100 },
    ]);
  });
});
```

#### createBeams.ts — drawBeams function

**Change 1 — add import**

Add to the existing import block at the top of `createBeams.ts` (sibling-file direct import, not through the
barrel):

```ts
import { getWaypointsBetween } from './getWaypointsBetween';
```

**Change 2 — replace lineTo with getWaypointsBetween in the if (i > 0) block**

Inside the `for (let i = beam.particles.length - 1; i >= 0; i--)` loop in `drawBeams`, replace:

```ts
if (i > 0) {
  const prevParticle = beam.particles[i - 1];
  ctx.beginPath();
  ctx.moveTo(particle.x, particle.y);
  ctx.lineTo(prevParticle.x, prevParticle.y);
  ctx.stroke();
}
```

With:

```ts
if (i > 0) {
  const olderParticle = beam.particles[i - 1];
  const waypoints = getWaypointsBetween(beam.path, olderParticle.progress, particle.progress);
  if (waypoints.length >= 2) {
    ctx.beginPath();
    ctx.moveTo(waypoints[0].x, waypoints[0].y);
    for (let w = 1; w < waypoints.length; w++) {
      ctx.lineTo(waypoints[w].x, waypoints[w].y);
    }
    ctx.stroke();
  }
}
```

`beam.particles` are ordered oldest-first (index 0 = oldest, index length-1 = newest). The loop iterates
newest-to-oldest (`i` decrements). For any `i > 0`: `beam.particles[i]` (`particle`) is the newer element
with higher progress; `beam.particles[i-1]` (`olderParticle`) is the older element with lower progress.
`getWaypointsBetween(path, olderParticle.progress, particle.progress)` correctly passes fromProgress < toProgress.

The `strokeStyle`, `lineWidth`, `shadowBlur`, `lineCap`, and `lineJoin` settings that surround the loop are
unchanged. The head-dot arc (`if (i === beam.particles.length - 1)`) is unchanged.

#### helper/index.ts — barrel fix and new export

Replace the entire file:

```ts
export { createBeams } from './createBeams';
export { createGridTiles } from './createGridTiles';
export { initBeams } from './initBeams';
export { setCanvasSize } from './setCanvasSize';
export { setGridDimensions } from './setGridDimensions';
export { getWaypointsBetween } from './getWaypointsBetween';
```

`helper/` is a within-module grouping barrel. CLAUDE.md mandates explicit named exports — `export *` is
banned. Each helper module exports exactly one function; one named export per line is correct.

`generateZigzagPath`, `getPositionOnPath`, `getPathLength`, `getColor`, and `rgbToRgba` are internal helpers
imported by direct sibling paths inside `helper/`; they are not and must not be part of the public API
exported through `index.ts`.
