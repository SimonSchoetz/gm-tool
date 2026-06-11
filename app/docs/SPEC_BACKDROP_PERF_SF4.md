# SF4: Fixed-timestep simulation

Replace the unconditional per-rAF `createBeams` call with a wall-clock-accumulator loop that runs simulation at a fixed 60 Hz timestep regardless of display refresh rate. Split `Backdrop.tsx` to call `updateBeams` and `drawBeams` independently. Remove the `createBeams` wrapper (no remaining callers after this SF).

## Files Affected

Modified:
- `app/src/components/Backdrop/Backdrop.tsx`
- `app/src/components/Backdrop/helper/createBeams.ts`
- `app/src/components/Backdrop/helper/index.ts`

## Frontend

### `Backdrop.tsx` (modified)

**New constants** (add after `BEAM_SPEED`):

```ts
const SIMULATION_TICK_MS = 1000 / 60;
const MAX_TICKS_PER_FRAME = 4;
```

**New ref** (add after `gridRef`):

```ts
const lastTickTimeRef = useRef<number>(0);
```

**`startLoop` function** (new, defined inside `useEffect` before `animate`):

```ts
const startLoop = () => {
  lastTickTimeRef.current = performance.now();
  animationFrameRef.current = requestAnimationFrame(animate);
};
```

**`animate` function** (replace the existing `animate`):

```ts
const animate = (now: number) => {
  const elapsed = now - lastTickTimeRef.current;
  const ticks = Math.min(
    Math.floor(elapsed / SIMULATION_TICK_MS),
    MAX_TICKS_PER_FRAME,
  );

  if (ticks > 0) {
    lastTickTimeRef.current += ticks * SIMULATION_TICK_MS;
    for (let t = 0; t < ticks; t++) {
      updateBeams(beamsRef, gridRef);
    }
    drawBeams(beamsRef, beamCtx);
  }

  animationFrameRef.current = requestAnimationFrame(animate);
};
```

The `drawBeams` call is gated inside `if (ticks > 0)` — when zero simulation ticks have elapsed (sub-16ms frame), nothing is drawn, avoiding a redundant identical frame. The `requestAnimationFrame(animate)` at the bottom is unconditional in this SF. SF6 makes it conditional (idle scheduler).

**`initCanvas` function** (replace `animate()` call at the bottom with `startLoop()`):

```ts
const initCanvas = () => {
  setCanvasSize(gridCanvas, gridCtx);
  setCanvasSize(beamCanvas, beamCtx);
  setGridDimensions(gridRef);
  createGridTiles(gridRef, gridCtx);
  initBeams(beamsRef, AMOUNT_BEAMS, BEAM_SPEED);
};
```

`startLoop()` is called after `initCanvas()`, not inside it.

**Effect body setup** (replace `initCanvas(); window.addEventListener(...); animate();` with):

```ts
initCanvas();
window.addEventListener('resize', updateCanvasOnResize);
startLoop();
```

**`Backdrop.tsx` imports:** Replace the `createBeams` import with `updateBeams` and `drawBeams`:

```ts
import {
  createGridTiles,
  drawBeams,
  initBeams,
  setCanvasSize,
  setGridDimensions,
  updateBeams,
} from './helper';
```

### `createBeams.ts` (modified)

Remove the `createBeams` wrapper function. It had one caller (`Backdrop.tsx`) which now calls `updateBeams` and `drawBeams` directly. Per the re-derive-types rule, a function with no call sites must be deleted. See KAD "`createBeams` wrapper removed" in root index.

Remove `export` from the function that was named `createBeams` — delete the entire wrapper function body, not just the `export` keyword. The file retains `export const drawBeams` and `export const updateBeams`.

### `helper/index.ts` (modified)

Remove `createBeams` from the export line for `createBeams.ts`:

```ts
export { drawBeams, updateBeams } from './createBeams';
export { createGridTiles } from './createGridTiles';
export { initBeams } from './initBeams';
export { setCanvasSize } from './setCanvasSize';
export { setGridDimensions } from './setGridDimensions';
```

`getBeamBounds` is not yet added — that is SF5.
