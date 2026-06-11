# SF5: Dirty-rect rendering

Add `getBeamBounds` helper. Replace the implicit full-canvas redraw with targeted clear-and-clip covering only each beam's current and previous draw bounds. Update `Backdrop.tsx`'s `animate` function to execute the dirty-rect protocol around the `drawBeams` call.

## Files Affected

New:
- `app/src/components/Backdrop/helper/getBeamBounds.ts`

Modified:
- `app/src/components/Backdrop/Backdrop.tsx`
- `app/src/components/Backdrop/helper/index.ts`

## Frontend

### `getBeamBounds.ts` (new)

**Purpose:** Compute the axis-aligned bounding box of a beam's currently visible trail — from its oldest particle to its head, including all path vertices that fall within that progress range — padded uniformly on all sides.

Returns `null` when the beam has no particles (nothing is visible).

```ts
import { Beam, Bounds } from '../types';
import { getWaypointsBetween } from './getWaypointsBetween';

export const getBeamBounds = (beam: Beam, padding: number): Bounds | null => {
  if (beam.particles.length === 0) return null;

  const fromProgress = beam.particles[0].progress;
  const toProgress = beam.particles[beam.particles.length - 1].progress;

  const waypoints = getWaypointsBetween(
    beam.path,
    beam.cumulativeLengths,
    fromProgress,
    toProgress,
  );

  if (waypoints.length === 0) return null;

  let minX = waypoints[0].x;
  let maxX = waypoints[0].x;
  let minY = waypoints[0].y;
  let maxY = waypoints[0].y;

  for (let i = 1; i < waypoints.length; i++) {
    if (waypoints[i].x < minX) minX = waypoints[i].x;
    if (waypoints[i].x > maxX) maxX = waypoints[i].x;
    if (waypoints[i].y < minY) minY = waypoints[i].y;
    if (waypoints[i].y > maxY) maxY = waypoints[i].y;
  }

  return {
    x: minX - padding,
    y: minY - padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
  };
};
```

**Particle ordering:** `beam.particles[0]` is the oldest particle (pushed first, aged most). `beam.particles[beam.particles.length - 1]` is the newest (just pushed, age 0 or 1). `fromProgress < toProgress` always holds because particles are pushed in monotonically increasing `beam.progress` order.

**Padding rationale:** The `padding` value must cover the beam's visible footprint beyond its center line — line width 0.5, head dot radius 0.75, bevel joins. The caller passes `BEAM_BOUNDS_PADDING = 4` from `Backdrop.tsx`.

### `helper/index.ts` (modified)

Add `getBeamBounds` export:

```ts
export { drawBeams, updateBeams } from './createBeams';
export { createGridTiles } from './createGridTiles';
export { getBeamBounds } from './getBeamBounds';
export { initBeams } from './initBeams';
export { setCanvasSize } from './setCanvasSize';
export { setGridDimensions } from './setGridDimensions';
```

### `Backdrop.tsx` (modified)

**New constant** (add after `MAX_TICKS_PER_FRAME`):

```ts
const BEAM_BOUNDS_PADDING = 4;
```

**Updated imports:** Add `getBeamBounds` to the helper import:

```ts
import {
  createGridTiles,
  drawBeams,
  getBeamBounds,
  initBeams,
  setCanvasSize,
  setGridDimensions,
  updateBeams,
} from './helper';
```

**`animate` function:** Wrap the `drawBeams` call with dirty-rect logic. Replace the `if (ticks > 0)` block:

```ts
if (ticks > 0) {
  lastTickTimeRef.current += ticks * SIMULATION_TICK_MS;
  for (let t = 0; t < ticks; t++) {
    updateBeams(beamsRef, gridRef);
  }

  const dirtyRects: Array<{ x: number; y: number; width: number; height: number } | null> = [];
  for (const beam of beamsRef.current) {
    dirtyRects.push(beam.lastDrawnBounds);
    const newBounds = getBeamBounds(beam, BEAM_BOUNDS_PADDING);
    beam.lastDrawnBounds = newBounds;
    dirtyRects.push(newBounds);
  }

  const activeDirtyRects = dirtyRects.filter(
    (r): r is { x: number; y: number; width: number; height: number } => r !== null,
  );

  if (activeDirtyRects.length > 0) {
    beamCtx.save();
    const clipPath = new Path2D();
    for (const r of activeDirtyRects) {
      beamCtx.clearRect(r.x, r.y, r.width, r.height);
      clipPath.rect(r.x, r.y, r.width, r.height);
    }
    beamCtx.clip(clipPath);
    drawBeams(beamsRef, beamCtx);
    beamCtx.restore();
  }
}
```

**Why `lastDrawnBounds` is read before `getBeamBounds`:** The dirty set for this frame is the union of where the beam was last drawn (to clear the old pixels) and where it will be drawn now (to clip the new draw). Reading `beam.lastDrawnBounds` before overwriting it with `newBounds` ensures both are included.

**Why `activeDirtyRects.length > 0` guards the draw:** When all beams have no particles and no previous bounds (all null), there is nothing to clear or draw. Skipping the save/restore/clip/draw when idle avoids any context state cost.

**Type annotation note:** The type of `activeDirtyRects` elements is written inline (not as `Bounds`) to avoid importing `Bounds` in `Backdrop.tsx`. TypeScript infers the type from `getBeamBounds`'s return value; an explicit import would be unused when the annotation is inline. Use the inline object type as shown.

**`updateCanvasOnResize`:** After resetting and reinitializing beams, also reset all `lastDrawnBounds` and clear the beam canvas. Add at the end of `updateCanvasOnResize`, after `initBeams`:

```ts
beamCtx.clearRect(0, 0, beamCanvas.width, beamCanvas.height);
```

The `lastDrawnBounds` reset is implicit — `initBeams` creates new `Beam` objects with `lastDrawnBounds: null`.
