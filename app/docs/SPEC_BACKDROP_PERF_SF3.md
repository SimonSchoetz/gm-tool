# SF3: Caching helpers + creation sites

Must be staged together with SF2 (see SF2's Foundation annotation and stage-as-unit file list).

Add `getCumulativeLengths` and `extractColorTriplet` helpers. Update `getPositionOnPath` and `getWaypointsBetween` to accept prefix sums, eliminating per-call `sqrt`. Update `initBeams` and `updateBeams` to initialize all new `Beam` fields. Fix the `return null` violation and dead shadow config in `createBeams.ts`. Delete `getPathLength.ts` and `rgbToRgba.ts` (no remaining call sites after this SF).

## Files Affected

New:
- `app/src/components/Backdrop/helper/getCumulativeLengths.ts`
- `app/src/components/Backdrop/helper/extractColorTriplet.ts`

Modified:
- `app/src/components/Backdrop/helper/getPositionOnPath.ts`
- `app/src/components/Backdrop/helper/getWaypointsBetween.ts`
- `app/src/components/Backdrop/helper/initBeams.ts`
- `app/src/components/Backdrop/helper/createBeams.ts`
- `app/src/components/Backdrop/helper/index.ts`
- `app/src/components/Backdrop/helper/__tests__/getWaypointsBetween.test.ts` — update all three call sites to pass `cumulativeLengths` as the second argument

Deleted:
- `app/src/components/Backdrop/helper/getPathLength.ts`
- `app/src/components/Backdrop/helper/rgbToRgba.ts`

## Frontend

### `getCumulativeLengths.ts` (new)

Returns a prefix-sum array of segment lengths. Index `i` holds the total path length from the first point up to point `i`. Index `0` is always `0`.

```ts
export const getCumulativeLengths = (
  path: { x: number; y: number }[],
): number[] => {
  const result = [0];
  for (let i = 0; i < path.length - 1; i++) {
    const dx = path[i + 1].x - path[i].x;
    const dy = path[i + 1].y - path[i].y;
    result.push(result[i] + Math.sqrt(dx * dx + dy * dy));
  }
  return result;
};
```

For an empty or single-point path, returns `[0]` (the loop does not execute).

### `extractColorTriplet.ts` (new)

Parses a CSS `rgb(r, g, b)` color string into a `"r, g, b"` triplet for use in template literals. Returns `null` when the format is unrecognized (the caller falls back to the original color string in that case).

```ts
export const extractColorTriplet = (color: string): string | null => {
  const match = color.match(/\d+/g);
  if (match !== null && match.length >= 3) {
    return `${match[0]}, ${match[1]}, ${match[2]}`;
  }
  return null;
};
```

### `getPositionOnPath.ts` (modified)

Add `cumulativeLengths: number[]` as the second parameter (before `distance`). Replace the accumulated-`sqrt` loop with prefix-sum index lookups.

Full replacement:

```ts
export const getPositionOnPath = (
  path: { x: number; y: number }[],
  cumulativeLengths: number[],
  distance: number,
): { x: number; y: number } | null => {
  if (path.length < 2) return null;

  for (let i = 0; i < path.length - 1; i++) {
    if (cumulativeLengths[i + 1] >= distance) {
      const segmentLength = cumulativeLengths[i + 1] - cumulativeLengths[i];
      if (segmentLength === 0) return path[i];
      const t = (distance - cumulativeLengths[i]) / segmentLength;
      const dx = path[i + 1].x - path[i].x;
      const dy = path[i + 1].y - path[i].y;
      return { x: path[i].x + dx * t, y: path[i].y + dy * t };
    }
  }

  return path.at(-1) ?? null;
};
```

The `segmentLength === 0` guard prevents division-by-zero for degenerate paths where two consecutive points are identical.

### `getWaypointsBetween.ts` (modified)

Add `cumulativeLengths: number[]` as the second parameter (before `fromProgress`). Replace the accumulated-`sqrt` intermediate-vertex scan with a prefix-sum scan. Pass `cumulativeLengths` through to both `getPositionOnPath` calls.

Full replacement:

```ts
import { getPositionOnPath } from './getPositionOnPath';

export const getWaypointsBetween = (
  path: { x: number; y: number }[],
  cumulativeLengths: number[],
  fromProgress: number,
  toProgress: number,
): { x: number; y: number }[] => {
  const start = getPositionOnPath(path, cumulativeLengths, fromProgress);
  const end = getPositionOnPath(path, cumulativeLengths, toProgress);

  if (!start || !end) return [];

  const intermediates: { x: number; y: number }[] = [];

  for (let i = 1; i < cumulativeLengths.length - 1; i++) {
    if (cumulativeLengths[i] > fromProgress && cumulativeLengths[i] < toProgress) {
      intermediates.push(path[i]);
    }
    if (cumulativeLengths[i] >= toProgress) break;
  }

  return [start, ...intermediates, end];
};
```

### `initBeams.ts` (modified)

Initialize the three new fields on each created `Beam`. Import `getCumulativeLengths` and `extractColorTriplet` directly from their files (sibling imports — do not import through `./index`).

The initial `color` is read via `getColor` then parsed once:

```ts
import { RefObject } from 'react';
import { Beam } from '../types';
import { getColor } from './getColor';
import { getCumulativeLengths } from './getCumulativeLengths';
import { extractColorTriplet } from './extractColorTriplet';

export const initBeams = (
  beamsRef: RefObject<Beam[]>,
  numBeams: number,
  beamSpeed: number,
) => {
  for (let i = 0; i < numBeams; i++) {
    const color = getColor('--color-primary');
    beamsRef.current.push({
      path: [],
      particles: [],
      color,
      nextSpawnTime: Date.now() + Math.random() * 10000 + i * 2000,
      progress: 0,
      pathLength: 0,
      speed: beamSpeed + i,
      active: false,
      cumulativeLengths: getCumulativeLengths([]),
      colorTriplet: extractColorTriplet(color),
      lastDrawnBounds: null,
    });
  }
};
```

`getCumulativeLengths([])` returns `[0]` — a valid empty-path prefix sum. `pathLength` remains `0` (consistent with the empty path).

### `createBeams.ts` (modified)

**Imports:** Remove `rgbToRgba` and `getPathLength`. Add `getCumulativeLengths` and `extractColorTriplet`. Keep all other imports unchanged.

**`drawBeams`:** Export it (`export const drawBeams`). Replace `rgbToRgba(beam.color, opacity)` with:

```ts
const strokeColor =
  beam.colorTriplet !== null
    ? `rgb(${beam.colorTriplet}, ${opacity})`
    : beam.color;
ctx.strokeStyle = strokeColor;
```

Pass `beam.cumulativeLengths` as the second argument to `getWaypointsBetween`:

```ts
const waypoints = getWaypointsBetween(
  beam.path,
  beam.cumulativeLengths,
  olderParticle.progress,
  particle.progress,
);
```

Fix convention violation: change `if (beam.particles.length === 0) return null;` to `if (beam.particles.length === 0) return;` (void context, bare return required — app/CLAUDE.md).

Remove dead shadow config: delete both `ctx.shadowBlur = 0;` and `ctx.shadowColor = beam.color;` inside the `forEach` callback, and delete the trailing `ctx.shadowBlur = 0;` after the forEach. These assignments have never had any visual effect (`shadowBlur = 0` disables shadows unconditionally).

**`updateBeams`:** Export it (`export const updateBeams`). In the spawn branch, add after `beam.path = generateZigzagPath(gridRef)`:

```ts
beam.cumulativeLengths = getCumulativeLengths(beam.path);
beam.pathLength = beam.cumulativeLengths.at(-1) ?? 0;
beam.colorTriplet = extractColorTriplet(beam.color);
```

Remove `beam.pathLength = getPathLength(beam.path)` — replaced by the `cumulativeLengths.at(-1)` derivation above.

Pass `beam.cumulativeLengths` to `getPositionOnPath`:

```ts
const currentPosition = getPositionOnPath(beam.path, beam.cumulativeLengths, beam.progress);
```

**`createBeams` wrapper:** Keep the wrapper function and its export for now. `Backdrop.tsx` still imports and calls `createBeams` until SF4 updates it. The wrapper body stays as-is (calling `drawBeams` then `updateBeams`).

**`ctx.lineWidth = 1` reset:** Keep the `ctx.lineWidth = 1;` reset at the bottom of `drawBeams` — it resets the context after drawing. Do not remove it.

### `helper/index.ts` (modified)

Add exports for `updateBeams` and `drawBeams`. Keep the `createBeams` export — it still has a caller (`Backdrop.tsx`) until SF4.

```ts
export { createBeams, drawBeams, updateBeams } from './createBeams';
export { createGridTiles } from './createGridTiles';
export { initBeams } from './initBeams';
export { setCanvasSize } from './setCanvasSize';
export { setGridDimensions } from './setGridDimensions';
```

`getBeamBounds` is not yet added — that is SF5.

### Deletions

Delete `app/src/components/Backdrop/helper/getPathLength.ts` — its only call site was `createBeams.ts`, which now uses `cumulativeLengths.at(-1)`.

Delete `app/src/components/Backdrop/helper/rgbToRgba.ts` — its only call site was `createBeams.ts`, which now uses `extractColorTriplet`.

Neither file is exported from `helper/index.ts`, so no barrel update is needed for the deletions.

### `getWaypointsBetween.test.ts` (modified)

All three test calls currently pass 3 arguments `(path, fromProgress, toProgress)`. After this SF the function signature is `(path, cumulativeLengths, fromProgress, toProgress)`.

For the test path `[{x:0,y:0}, {x:100,y:0}, {x:100,y:100}, {x:0,y:100}]`, the cumulative lengths are `[0, 100, 200, 300]`. Add this constant at the top of the file and pass it as the second argument in all three existing test calls. No test assertions change — the expected results are identical.

```ts
const cumulativeLengths = [0, 100, 200, 300];
```

Call sites update from `getWaypointsBetween(path, 10, 50)` to `getWaypointsBetween(path, cumulativeLengths, 10, 50)` (and likewise for the other two tests).
