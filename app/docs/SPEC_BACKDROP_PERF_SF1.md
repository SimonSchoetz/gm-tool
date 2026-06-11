# SF1: Two-canvas layout + CSS

Replace the single-canvas + OffscreenCanvas architecture with two stacked canvases: an opaque grid canvas painted once, and a transparent beam canvas updated per frame. Extract all inline styles to `Backdrop.css`. Fix the `return null` violation in `createGridTiles`.

## Files Affected

Modified:
- `app/src/components/Backdrop/Backdrop.tsx`
- `app/src/components/Backdrop/helper/createGridTiles.ts`

New:
- `app/src/components/Backdrop/Backdrop.css`

## Frontend

### `Backdrop.css` (new)

**Purpose:** Holds all static styles for both canvas elements, replacing the inline `style` prop that was on the single canvas.

**Content:**

```css
.backdrop-grid,
.backdrop-beams {
  position: fixed;
  top: 0;
  left: 0;
  z-index: -10;
}
```

No `transition` declaration — the previous `transition: opacity 0.1s ease-in-out` was dead (the canvas opacity never changed).

Note: `z-index: -10` is inlined because no z-index token exists in `styles/variables/`. See KAD "z-index: -10 is inlined" in the root index.

### `Backdrop.tsx` (modified)

**Purpose:** Render two stacked canvas elements; paint the grid canvas once at init and again on resize; keep the beam canvas context available for the animation loop.

**Behavior:**

- Replace the single `canvasRef` with `gridCanvasRef` and `beamCanvasRef`.
- Replace the single `canvas.getContext('2d', { alpha: false })` call with two context acquisitions: `gridCanvas.getContext('2d', { alpha: false })` (opaque, for the grid) and `beamCanvas.getContext('2d')` (transparent default, for beams).
- Remove the `OffscreenCanvas` / `offscreenCanvas` variable entirely.
- Change `initCanvas` to: call `setCanvasSize` for both canvases, call `setGridDimensions`, call `createGridTiles(gridRef, gridCtx)` directly on the grid context, then call `initBeams`.
- Change `updateCanvasOnResize` to: call `setCanvasSize` for both canvases, call `setGridDimensions`, call `createGridTiles(gridRef, gridCtx)` on the grid context, reset `beamsRef.current = []`, call `initBeams`. Remove `OffscreenCanvas` creation. Do not call `cancelAnimationFrame` or restart the loop here — that is SF6's responsibility.
- The `animate` function still calls `createBeams(beamsRef, beamCtx, gridRef)` where `beamCtx` is the beam canvas context. The grid canvas is never touched inside `animate`.
- Import `Backdrop.css` at the top of the file.
- Remove the `style` prop from the single canvas element; replace the single `<canvas>` with two `<canvas>` elements: grid first, beam second (DOM order ensures beam paints above grid at equal z-index).

**UI / Visual:**

```tsx
import './Backdrop.css';

// refs
const gridCanvasRef = useRef<HTMLCanvasElement>(null);
const beamCanvasRef = useRef<HTMLCanvasElement>(null);

// JSX
return (
  <>
    <canvas ref={gridCanvasRef} className="backdrop-grid" />
    <canvas ref={beamCanvasRef} className="backdrop-beams" />
  </>
);
```

The `useEffect` guard changes from:

```ts
const canvas = canvasRef.current;
if (!canvas) return;
const ctx = canvas.getContext('2d', { alpha: false });
if (!ctx) return;
```

to:

```ts
const gridCanvas = gridCanvasRef.current;
const beamCanvas = beamCanvasRef.current;
if (!gridCanvas || !beamCanvas) return;

const gridCtx = gridCanvas.getContext('2d', { alpha: false });
const beamCtx = beamCanvas.getContext('2d');
if (!gridCtx || !beamCtx) return;
```

The `initCanvas` body:

```ts
const initCanvas = () => {
  setCanvasSize(gridCanvas, gridCtx);
  setCanvasSize(beamCanvas, beamCtx);
  setGridDimensions(gridRef);
  createGridTiles(gridRef, gridCtx);
  initBeams(beamsRef, AMOUNT_BEAMS, BEAM_SPEED);
};
```

The `updateCanvasOnResize` body:

```ts
const updateCanvasOnResize = () => {
  setCanvasSize(gridCanvas, gridCtx);
  setCanvasSize(beamCanvas, beamCtx);
  setGridDimensions(gridRef);
  createGridTiles(gridRef, gridCtx);
  beamsRef.current = [];
  initBeams(beamsRef, AMOUNT_BEAMS, BEAM_SPEED);
};
```

The `animate` function body remains unchanged in this SF, using `beamCtx` in place of the old `ctx`:

```ts
const animate = () => {
  createBeams(beamsRef, beamCtx, gridRef);
  animationFrameRef.current = requestAnimationFrame(animate);
};
```

The `return` from `useEffect` stays the same: cancel rAF, remove resize listener.

### `createGridTiles.ts` (modified)

**Purpose:** Accept a `CanvasRenderingContext2D` instead of `OffscreenCanvasRenderingContext2D`, since the grid is now painted directly on the grid canvas.

**Changes:**

1. Change the parameter type from `OffscreenCanvasRenderingContext2D` to `CanvasRenderingContext2D`. Rename the parameter from `offscreenCtx` to `ctx` throughout the function body.
2. Fix convention violation: change `if (!gridRef.current) return null;` to `if (!gridRef.current) return;`. The function has a void return type; `return null` is a CLAUDE.md violation (app/CLAUDE.md — "In any function typed void, use a bare return; for early exits").

No other logic changes.
