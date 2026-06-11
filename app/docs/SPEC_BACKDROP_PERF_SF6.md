# SF6: Idle scheduler

Stop the rAF loop when all beams are inactive with empty particle arrays. Restart via `window.setTimeout` timed to the next beam spawn. Cancel both handles in cleanup and on resize.

## Files Affected

Modified:
- `app/src/components/Backdrop/Backdrop.tsx`

## Frontend

### `Backdrop.tsx` (modified)

**New ref** (add after `lastTickTimeRef`):

```ts
const wakeTimeoutRef = useRef<number | null>(null);
```

**`animate` function:** Make the `requestAnimationFrame` call conditional. After the `if (ticks > 0)` block, replace the unconditional `animationFrameRef.current = requestAnimationFrame(animate)` with idle detection:

```ts
const isIdle =
  beamsRef.current.length > 0 &&
  beamsRef.current.every((beam) => !beam.active && beam.particles.length === 0);

if (isIdle) {
  const nextSpawnTime = Math.min(
    ...beamsRef.current.map((beam) => beam.nextSpawnTime),
  );
  const delay = Math.max(0, nextSpawnTime - Date.now());
  wakeTimeoutRef.current = window.setTimeout(startLoop, delay);
  return;
}

animationFrameRef.current = requestAnimationFrame(animate);
```

**`beamsRef.current.length > 0` guard:** `Array.prototype.every` returns `true` for an empty array (vacuous truth). Without the length guard, an empty `beamsRef.current` would trigger idle mode with `Math.min()` returning `Infinity`, causing the timeout to never fire. Since `initBeams` always populates the array, this guard is a defensive invariant, not a code path that is expected to be hit.

**`Math.min(...map)` spread:** With `AMOUNT_BEAMS = 6`, spreading 6 values into `Math.min` is correct. If `AMOUNT_BEAMS` were to become large (hundreds), this pattern would need replacing with a `reduce`. For the current value it is fine.

**Effect cleanup:** Update the cleanup function to cancel both the rAF handle and the timeout:

```ts
return () => {
  window.removeEventListener('resize', updateCanvasOnResize);
  if (animationFrameRef.current) {
    cancelAnimationFrame(animationFrameRef.current);
  }
  if (wakeTimeoutRef.current !== null) {
    clearTimeout(wakeTimeoutRef.current);
  }
};
```

**`updateCanvasOnResize`:** Cancel any pending wake timeout before resetting beams, then restart the loop. Add at the start of `updateCanvasOnResize`, before all existing operations:

```ts
if (wakeTimeoutRef.current !== null) {
  clearTimeout(wakeTimeoutRef.current);
  wakeTimeoutRef.current = null;
}
cancelAnimationFrame(animationFrameRef.current);
```

And replace the trailing resize handler that currently calls nothing to start the loop with `startLoop()` at the end of `updateCanvasOnResize`. The full body of `updateCanvasOnResize` after this SF:

```ts
const updateCanvasOnResize = () => {
  if (wakeTimeoutRef.current !== null) {
    clearTimeout(wakeTimeoutRef.current);
    wakeTimeoutRef.current = null;
  }
  cancelAnimationFrame(animationFrameRef.current);
  setCanvasSize(gridCanvas, gridCtx);
  setCanvasSize(beamCanvas, beamCtx);
  setGridDimensions(gridRef);
  createGridTiles(gridRef, gridCtx);
  beamsRef.current = [];
  initBeams(beamsRef, AMOUNT_BEAMS, BEAM_SPEED);
  beamCtx.clearRect(0, 0, beamCanvas.width, beamCanvas.height);
  startLoop();
};
```

**Loop restart semantics:** `startLoop` resets `lastTickTimeRef.current` to `performance.now()`, preventing a tick burst from accumulated elapsed time during the idle period.
