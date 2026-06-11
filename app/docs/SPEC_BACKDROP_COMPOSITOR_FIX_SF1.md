# SF1: Compositor Architecture

Collapse to one visible canvas. Paint the static grid into a device-pixel `OffscreenCanvas` once. In the animate loop, blit the OffscreenCanvas over each dirty rect to restore the grid, then clip and draw beams on top. Inline particle positions in the draw loop to eliminate the `getWaypointsBetween` call.

## Files Affected

Modified:
- `app/src/components/Backdrop/Backdrop.tsx`
- `app/src/components/Backdrop/helper/drawAndUpdateBeams.ts`
- `app/src/components/Backdrop/helper/createGridTiles.ts`
- `app/src/components/Backdrop/Backdrop.css`

## Frontend

### `Backdrop.tsx`

**Refs:** Remove `beamCanvasRef`. Add two new refs after `animationFrameRef`:

```ts
const offscreenCanvasRef = useRef<OffscreenCanvas | null>(null);
const dprRef = useRef(1);
```

`offscreenCanvasRef` requires an explicit type argument — `null` alone infers `RefObject<null>` (app/CLAUDE.md — `useRef<T>` annotation rules). `dprRef` infers `number` from `1`, so no annotation.

**Context acquisition:** Replace the two-canvas context block with a single canvas:

```ts
const canvas = gridCanvasRef.current;
if (!canvas) return;

const ctx = canvas.getContext('2d', { alpha: false });
if (!ctx) return;
```

Remove `beamCanvas`, `beamCtx`, and the `if (!gridCtx || !beamCtx)` guard.

**`initCanvas` function:**

```ts
const initCanvas = () => {
  setCanvasSize(canvas, ctx);
  setGridDimensions(gridRef);
  const dpr = window.devicePixelRatio || 1;
  dprRef.current = dpr;
  const offscreen = new OffscreenCanvas(canvas.width, canvas.height);
  offscreenCanvasRef.current = offscreen;
  const offscreenCtx = offscreen.getContext('2d');
  if (offscreenCtx) {
    offscreenCtx.scale(dpr, dpr);
    createGridTiles(gridRef, offscreenCtx);
  }
  ctx.drawImage(offscreen, 0, 0, canvas.width, canvas.height, 0, 0, window.innerWidth, window.innerHeight);
  initBeams(beamsRef, AMOUNT_BEAMS, BEAM_SPEED);
};
```

The full-canvas `ctx.drawImage` blit after `createGridTiles` paints the initial grid on the visible canvas — without it the canvas stays black until the first animated dirty-rect blit. The 9-argument form makes the device-pixel source and CSS-pixel destination explicit (see root KAD "drawImage source rect uses device-pixel coordinates").

**`updateCanvasOnResize` function:**

```ts
const updateCanvasOnResize = () => {
  if (wakeTimeoutRef.current !== null) {
    clearTimeout(wakeTimeoutRef.current);
    wakeTimeoutRef.current = null;
  }
  cancelAnimationFrame(animationFrameRef.current);
  setCanvasSize(canvas, ctx);
  setGridDimensions(gridRef);
  const dpr = window.devicePixelRatio || 1;
  dprRef.current = dpr;
  const offscreen = new OffscreenCanvas(canvas.width, canvas.height);
  offscreenCanvasRef.current = offscreen;
  const offscreenCtx = offscreen.getContext('2d');
  if (offscreenCtx) {
    offscreenCtx.scale(dpr, dpr);
    createGridTiles(gridRef, offscreenCtx);
  }
  ctx.drawImage(offscreen, 0, 0, canvas.width, canvas.height, 0, 0, window.innerWidth, window.innerHeight);
  beamsRef.current = [];
  initBeams(beamsRef, AMOUNT_BEAMS, BEAM_SPEED);
  startLoop();
};
```

**`animate` function — dirty-rect block:** Replace the `beamCtx.*` calls and the `clearRect` with the OffscreenCanvas blit:

```ts
if (activeDirtyRects.length > 0 && offscreenCanvasRef.current !== null) {
  const offscreen = offscreenCanvasRef.current;
  const dpr = dprRef.current;
  ctx.save();
  const clipPath = new Path2D();
  for (const r of activeDirtyRects) {
    ctx.drawImage(
      offscreen,
      r.x * dpr,
      r.y * dpr,
      r.width * dpr,
      r.height * dpr,
      r.x,
      r.y,
      r.width,
      r.height,
    );
    clipPath.rect(r.x, r.y, r.width, r.height);
  }
  ctx.clip(clipPath);
  drawBeams(beamsRef, ctx);
  ctx.restore();
}
```

The `offscreenCanvasRef.current !== null` guard is required for TypeScript — the ref is typed `OffscreenCanvas | null`. In practice it is always set by `initCanvas` before `animate` runs.

**JSX:** Replace the two-canvas fragment with a single element:

```tsx
return <canvas ref={gridCanvasRef} className="backdrop-grid" />;
```

**Effect cleanup:** Remove `beamCanvas` and `beamCtx` references — the cleanup function only needs `animationFrameRef` and `wakeTimeoutRef`.

**Imports:** All `helper` imports remain unchanged — `getBeamBounds` is still used in `animate`.

### `drawAndUpdateBeams.ts` — `drawBeams` function

Remove the `getWaypointsBetween` import. Keep all other imports (`getPositionOnPath` is still used by `updateBeams`).

Replace the `getWaypointsBetween` call inside the `i > 0` block with inline waypoint construction (see root KAD "Particle positions reused"):

```ts
if (i > 0) {
  const olderParticle = beam.particles[i - 1];
  const waypoints: { x: number; y: number }[] = [
    { x: olderParticle.x, y: olderParticle.y },
  ];
  for (let j = 1; j < beam.cumulativeLengths.length - 1; j++) {
    if (
      beam.cumulativeLengths[j] > olderParticle.progress &&
      beam.cumulativeLengths[j] < particle.progress
    ) {
      waypoints.push(beam.path[j]);
    }
    if (beam.cumulativeLengths[j] >= particle.progress) break;
  }
  waypoints.push({ x: particle.x, y: particle.y });
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

The `olderParticle` declaration moves to the top of the `i > 0` block — it is now needed before the corner loop. The rest of `drawBeams` and all of `updateBeams` are unchanged.

### `createGridTiles.ts`

Revert the parameter type from `CanvasRenderingContext2D` back to `OffscreenCanvasRenderingContext2D`. Rename the parameter from `ctx` to `offscreenCtx` throughout the function body. No logic changes — `offscreenCtx.scale(dpr, dpr)` is applied by the caller before this function runs, so CSS-pixel drawing coordinates produce correct device-pixel output.

```ts
export const createGridTiles = (
  gridRef: RefObject<Grid>,
  offscreenCtx: OffscreenCanvasRenderingContext2D,
) => {
```

Update every `ctx.` occurrence in the body to `offscreenCtx.`.

### `Backdrop.css`

Remove `.backdrop-beams` from the selector. Keep `.backdrop-grid` and its declarations unchanged. Add the z-index inline comment — the value is non-obvious without it (why -10 and not -1 or a token):

```css
.backdrop-grid {
  position: fixed;
  top: 0;
  left: 0;
  z-index: -10; /* intentional: no z-index token exists; inline per no-unilateral-additions rule */
}
```
