# SF2: Offscreen Grid Canvas

Refactor `createGridTiles` to write to an `OffscreenCanvasRenderingContext2D` instead of a live canvas
context. Create the offscreen canvas in `Backdrop.tsx`'s init and resize paths; replace the per-frame
`createGridTiles` call in the animate loop with `ctx.drawImage(offscreenCanvas, 0, 0)`.

## Files affected

Modified:

- `app/src/components/Backdrop/helper/createGridTiles.ts`
- `app/src/components/Backdrop/Backdrop.tsx`

New: none

## Layered breakdown

### Frontend

#### createGridTiles.ts

**Purpose**: Renders the background colour block and grid tiles to an offscreen canvas once per init/resize.
Only the parameter type changes — all drawing logic is unchanged.

Change the second parameter from `CanvasRenderingContext2D` to `OffscreenCanvasRenderingContext2D` and rename
it from `ctx` to `offscreenCtx`. Update every `ctx.*` reference in the function body to `offscreenCtx.*`.

New signature:

```ts
export const createGridTiles = (
  gridRef: RefObject<Grid>,
  offscreenCtx: OffscreenCanvasRenderingContext2D
): void
```

`OffscreenCanvasRenderingContext2D` supports `fillStyle` and `fillRect` identically to
`CanvasRenderingContext2D` [grep "OffscreenCanvasRenderingContext2D" node_modules/typescript/lib/lib.dom.d.ts
— found]. The `getComputedStyle(document.documentElement)` calls inside `createGridTiles` are `window`-level
calls unrelated to the canvas context; they remain valid because this `OffscreenCanvas` is created on the main
thread, not in a Web Worker.

`OffscreenCanvas` is available as a `CanvasImageSource` in the TypeScript DOM lib and in the Tauri WebView
(Tauri 2 uses WKWebView on macOS and WebView2 on Windows; both ship a Chromium/WebKit version that includes
OffscreenCanvas) [grep "OffscreenCanvas" node_modules/typescript/lib/lib.dom.d.ts — found at line 22367].
[grep "CanvasImageSource" node_modules/typescript/lib/lib.dom.d.ts — OffscreenCanvas confirmed in union at
line 39174].

#### Backdrop.tsx

**Purpose**: Manages the canvas animation loop and lifecycle. Add an offscreen canvas that holds the static
grid; draw it once per frame instead of re-rendering the grid from scratch.

**Behaviour**:

- Declare `let offscreenCanvas: OffscreenCanvas | null = null` inside the `useEffect` callback, before the
  inner function declarations.
- `initCanvas`: after `setCanvasSize` and `setGridDimensions`, create
  `new OffscreenCanvas(window.innerWidth, window.innerHeight)`, call `.getContext('2d')` on it, and — if the
  context is non-null — call `createGridTiles(gridRef, offscreenCtx)`.
- `updateCanvasOnResize`: same pattern — recreate the offscreen canvas at the new viewport dimensions before
  reinitialising beams.
- `animate`: replace `createGridTiles(gridRef, ctx)` with `if (offscreenCanvas) ctx.drawImage(offscreenCanvas, 0, 0)`.
  The null guard is required for TypeScript; at runtime `offscreenCanvas` is always non-null when `animate`
  executes because `initCanvas()` is called synchronously before `animate()`.

Full updated `useEffect` body (only the changed lines are shown; the cleanup return is unchanged):

```ts
let offscreenCanvas: OffscreenCanvas | null = null;

const animate = () => {
  if (offscreenCanvas) ctx.drawImage(offscreenCanvas, 0, 0);
  createBeams(beamsRef, ctx, gridRef);
  animationFrameRef.current = requestAnimationFrame(animate);
};

const initCanvas = () => {
  setCanvasSize(canvas, ctx);
  setGridDimensions(gridRef);
  offscreenCanvas = new OffscreenCanvas(window.innerWidth, window.innerHeight);
  const offscreenCtx = offscreenCanvas.getContext('2d');
  if (offscreenCtx) createGridTiles(gridRef, offscreenCtx);
  initBeams(beamsRef, AMOUNT_BEAMS, BEAM_SPEED);
};

const updateCanvasOnResize = () => {
  setCanvasSize(canvas, ctx);
  setGridDimensions(gridRef);
  offscreenCanvas = new OffscreenCanvas(window.innerWidth, window.innerHeight);
  const offscreenCtx = offscreenCanvas.getContext('2d');
  if (offscreenCtx) createGridTiles(gridRef, offscreenCtx);
  beamsRef.current = [];
  initBeams(beamsRef, AMOUNT_BEAMS, BEAM_SPEED);
};
```

The `import` block in `Backdrop.tsx` is unchanged: `createGridTiles` is still imported from `'./helper'`.
