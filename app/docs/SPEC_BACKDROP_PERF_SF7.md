# SF7: Tests

Add tests for all new pure helpers. Update the existing `getWaypointsBetween` test for the new signature (already handled in SF3 — verify it was done). The remaining canvas/DOM-coupled helpers (`getColor`, `setCanvasSize`, `setGridDimensions`, `createGridTiles`, `createBeams`, `initBeams`) are not tested here; their test gap is a known limitation noted at spec time, not in scope for this PR.

## Files Affected

New:
- `app/src/components/Backdrop/helper/__tests__/getCumulativeLengths.test.ts`
- `app/src/components/Backdrop/helper/__tests__/extractColorTriplet.test.ts`
- `app/src/components/Backdrop/helper/__tests__/getPositionOnPath.test.ts`
- `app/src/components/Backdrop/helper/__tests__/getBeamBounds.test.ts`
- `app/src/components/Backdrop/helper/__tests__/generateZigzagPath.test.ts`

Modified:
- `app/src/components/Backdrop/helper/__tests__/getWaypointsBetween.test.ts` — already updated in SF3; verify all three call sites have four arguments

## `getCumulativeLengths.test.ts`

Code paths: empty path, single-point path, multi-segment path, degenerate path with a zero-length segment.

```ts
import { describe, it, expect } from 'vitest';
import { getCumulativeLengths } from '../getCumulativeLengths';

describe('getCumulativeLengths', () => {
  it('returns [0] for an empty path', () => {
    expect(getCumulativeLengths([])).toEqual([0]);
  });

  it('returns [0] for a single-point path', () => {
    expect(getCumulativeLengths([{ x: 5, y: 5 }])).toEqual([0]);
  });

  it('returns prefix sums for a multi-segment path', () => {
    const path = [
      { x: 0, y: 0 },
      { x: 3, y: 4 },
      { x: 3, y: 4 },
      { x: 6, y: 8 },
    ];
    // segment 0: length 5 (3-4-5 triangle)
    // segment 1: length 0 (duplicate point)
    // segment 2: length 5
    expect(getCumulativeLengths(path)).toEqual([0, 5, 5, 10]);
  });

  it('returns correct prefix sums for a right-angle path', () => {
    const path = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
    ];
    expect(getCumulativeLengths(path)).toEqual([0, 100, 200]);
  });
});
```

## `extractColorTriplet.test.ts`

Code paths: valid `rgb()` format, too few digit groups (returns null), unrecognized format (returns null).

```ts
import { describe, it, expect } from 'vitest';
import { extractColorTriplet } from '../extractColorTriplet';

describe('extractColorTriplet', () => {
  it('extracts triplet from a valid rgb() string', () => {
    expect(extractColorTriplet('rgb(65, 105, 225)')).toBe('65, 105, 225');
  });

  it('returns null when fewer than three digit groups are present', () => {
    expect(extractColorTriplet('rgb(65, 105)')).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(extractColorTriplet('')).toBeNull();
  });

  it('returns null for a plain color name with no digits', () => {
    expect(extractColorTriplet('red')).toBeNull();
  });
});
```

## `getPositionOnPath.test.ts`

Code paths: path with fewer than 2 points (returns null), point within the first segment, point at a segment boundary, point beyond the total path length, degenerate segment with zero length.

```ts
import { describe, it, expect } from 'vitest';
import { getPositionOnPath } from '../getPositionOnPath';
import { getCumulativeLengths } from '../getCumulativeLengths';

const path = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 100 },
];
const lengths = getCumulativeLengths(path); // [0, 100, 200]

describe('getPositionOnPath', () => {
  it('returns null for a path with fewer than 2 points', () => {
    expect(getPositionOnPath([{ x: 0, y: 0 }], [0], 0)).toBeNull();
  });

  it('returns a point within the first segment', () => {
    expect(getPositionOnPath(path, lengths, 50)).toEqual({ x: 50, y: 0 });
  });

  it('returns the exact corner point at a segment boundary', () => {
    expect(getPositionOnPath(path, lengths, 100)).toEqual({ x: 100, y: 0 });
  });

  it('returns a point in the second segment', () => {
    expect(getPositionOnPath(path, lengths, 150)).toEqual({ x: 100, y: 50 });
  });

  it('returns the last point when distance exceeds total path length', () => {
    expect(getPositionOnPath(path, lengths, 999)).toEqual({ x: 100, y: 100 });
  });

  it('returns the segment start point for a zero-length segment', () => {
    const degeneratePath = [
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ];
    const degenerateLengths = getCumulativeLengths(degeneratePath); // [0, 0, 100]
    expect(getPositionOnPath(degeneratePath, degenerateLengths, 0)).toEqual({
      x: 0,
      y: 0,
    });
  });
});
```

## `getBeamBounds.test.ts`

Code paths: beam with no particles (returns null), beam with one particle (bounds from a single waypoint + padding), beam with particles spanning multiple segments (bounding box covers path corners).

`getBeamBounds` calls `getWaypointsBetween`, which calls `getPositionOnPath`. These are pure functions with no module-level state. Static imports are correct.

Build minimal `Beam` objects by providing only the fields `getBeamBounds` reads: `path`, `cumulativeLengths`, `particles`. All other `Beam` fields are set to arbitrary valid values.

```ts
import { describe, it, expect } from 'vitest';
import { getBeamBounds } from '../getBeamBounds';
import { getCumulativeLengths } from '../getCumulativeLengths';
import type { Beam } from '../../types';

const makePath = () => [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 100 },
];

const makeBeam = (particles: Beam['particles']): Beam => {
  const path = makePath();
  return {
    path,
    cumulativeLengths: getCumulativeLengths(path),
    particles,
    color: 'rgb(65, 105, 225)',
    colorTriplet: '65, 105, 225',
    nextSpawnTime: 0,
    progress: 0,
    pathLength: 200,
    speed: 4,
    active: false,
    lastDrawnBounds: null,
  };
};

const makeParticle = (progress: number) => ({
  x: 0,
  y: 0,
  age: 0,
  maxAge: 20,
  progress,
});

describe('getBeamBounds', () => {
  it('returns null when the beam has no particles', () => {
    expect(getBeamBounds(makeBeam([]), 4)).toBeNull();
  });

  it('returns a padded bounds when the beam has a single particle within one segment', () => {
    const beam = makeBeam([makeParticle(25), makeParticle(75)]);
    const result = getBeamBounds(beam, 0);
    // Waypoints: {x:25,y:0} to {x:75,y:0} — horizontal segment, y is constant
    expect(result).toEqual({ x: 25, y: 0, width: 50, height: 0 });
  });

  it('applies padding uniformly on all sides', () => {
    const beam = makeBeam([makeParticle(25), makeParticle(75)]);
    const result = getBeamBounds(beam, 4);
    expect(result).toEqual({ x: 21, y: -4, width: 58, height: 8 });
  });

  it('includes path corner vertices when the trail spans a segment boundary', () => {
    // Progress 50 → 150 spans the corner at x:100,y:0 (cumulative 100)
    const beam = makeBeam([makeParticle(50), makeParticle(150)]);
    const result = getBeamBounds(beam, 0);
    // Waypoints: {x:50,y:0}, {x:100,y:0}, {x:100,y:50}
    // Bounding box: minX=50, maxX=100, minY=0, maxY=50
    expect(result).toEqual({ x: 50, y: 0, width: 50, height: 50 });
  });
});
```

## `generateZigzagPath.test.ts`

Code paths: returns empty array when grid is null, returns a path that starts at the top of the grid, path length is at least 2 points, every point's x coordinate is within grid bounds.

`generateZigzagPath` accepts a `RefObject<Grid>`. Construct the ref manually using `{ current: gridDimensions }`.

```ts
import { describe, it, expect } from 'vitest';
import { generateZigzagPath } from '../generateZigzagPath';
import type { Grid } from '../../types';

const makeGridRef = (grid: Grid): { current: Grid } => ({ current: grid });

const grid: NonNullable<Grid> = {
  squareSize: 50,
  cols: 4,
  rows: 3,
  offsetX: -25,
  offsetY: -25,
};

describe('generateZigzagPath', () => {
  it('returns an empty array when grid is null', () => {
    expect(generateZigzagPath(makeGridRef(null))).toEqual([]);
  });

  it('returns a path with at least 2 points', () => {
    const path = generateZigzagPath(makeGridRef(grid));
    expect(path.length).toBeGreaterThanOrEqual(2);
  });

  it('starts at the top row of the grid (y equals offsetY)', () => {
    const path = generateZigzagPath(makeGridRef(grid));
    expect(path[0].y).toBe(grid.offsetY);
  });

  it('keeps all x coordinates within grid horizontal bounds', () => {
    const path = generateZigzagPath(makeGridRef(grid));
    const minX = grid.offsetX;
    const maxX = grid.offsetX + grid.cols * grid.squareSize;
    for (const point of path) {
      expect(point.x).toBeGreaterThanOrEqual(minX);
      expect(point.x).toBeLessThanOrEqual(maxX);
    }
  });
});
```
