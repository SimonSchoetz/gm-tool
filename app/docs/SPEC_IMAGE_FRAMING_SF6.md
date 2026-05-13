# SF6 — FramingOverlay: Interactive Pan/Zoom Editor

Create `FramingOverlay` and wire it into `ImageViewerDialog`. The overlay shows the full image with a frame indicator and allows the user to scroll to zoom and drag to pan. Frame state auto-persists 600 ms after the last interaction.

## Files Affected

New:
- `app/src/components/UploadImgBtn/components/ImageViewerDialog/components/FramingOverlay/index.ts`
- `app/src/components/UploadImgBtn/components/ImageViewerDialog/components/FramingOverlay/FramingOverlay.tsx`
- `app/src/components/UploadImgBtn/components/ImageViewerDialog/components/FramingOverlay/FramingOverlay.css`
- `app/src/components/UploadImgBtn/components/ImageViewerDialog/components/FramingOverlay/helper/index.ts`
- `app/src/components/UploadImgBtn/components/ImageViewerDialog/components/FramingOverlay/helper/clampFrame.ts`
- `app/src/components/UploadImgBtn/components/ImageViewerDialog/components/FramingOverlay/helper/computePanDelta.ts`
- `app/src/components/UploadImgBtn/components/ImageViewerDialog/components/FramingOverlay/helper/__tests__/clampFrame.test.ts`
- `app/src/components/UploadImgBtn/components/ImageViewerDialog/components/FramingOverlay/helper/__tests__/computePanDelta.test.ts`

Modified:
- `app/src/components/UploadImgBtn/components/ImageViewerDialog/components/index.ts`
- `app/src/components/UploadImgBtn/components/ImageViewerDialog/ImageViewerDialog.tsx`

## Frontend

### Purpose

`FramingOverlay` is the interactive image framing editor. It replaces the standard image view inside `ImageViewerDialog` when the GM activates framing mode. The GM scrolls to zoom and drags to pan; state persists automatically after each interaction ends.

---

## Helper Functions

### `helper/clampFrame.ts`

```ts
export type FrameState = {
  x: number;
  y: number;
  zoom: number;
};

export const clampFrame = (frame: FrameState, maxZoom: number): FrameState => ({
  x: Math.min(100, Math.max(0, frame.x)),
  y: Math.min(100, Math.max(0, frame.y)),
  zoom: Math.min(maxZoom, Math.max(1, frame.zoom)),
});
```

`x` and `y` are clamped to 0–100 (valid `object-position` percentage range that keeps the image covering the frame). `zoom` is clamped to `[1, maxZoom]` — 1.0 is the fill-size minimum; values below 1 would expose empty space inside the frame.

### `helper/computePanDelta.ts`

```ts
export const computePanDelta = (
  dx: number,
  dy: number,
  containerWidth: number,
  containerHeight: number,
  zoom: number,
): { dx: number; dy: number } => ({
  dx: (dx / containerWidth) * 100 / zoom,
  dy: (dy / containerHeight) * 100 / zoom,
});
```

Converts a pointer drag delta in pixels to a pan delta in `object-position` percentage units. Dividing by `zoom` accounts for the scaled image: at zoom 2, the same pixel drag moves half as much of the visible image area. The caller subtracts the result from current `x` and `y` (dragging right decreases `x`, revealing the left side of the image).

### `helper/index.ts`

```ts
export { clampFrame } from './clampFrame';
export type { FrameState } from './clampFrame';
export { computePanDelta } from './computePanDelta';
```

### `helper/__tests__/clampFrame.test.ts`

Test cases:
- x below 0 → clamped to 0
- x above 100 → clamped to 100
- y below 0 → clamped to 0
- y above 100 → clamped to 100
- zoom below 1 → clamped to 1
- zoom above maxZoom → clamped to maxZoom
- valid values within range → returned unchanged
- x=50, y=50, zoom=1 with maxZoom=5 → `{ x: 50, y: 50, zoom: 1 }`

### `helper/__tests__/computePanDelta.test.ts`

Test cases:
- dx=containerWidth, zoom=1 → `dx` result = 100 (full container drag = 100% shift)
- dx=containerWidth, zoom=2 → `dx` result = 50 (same drag = half shift at 2x zoom)
- dx=0, dy=0 → `{ dx: 0, dy: 0 }`
- negative dx (dragging left) → negative result
- dy uses containerHeight for normalization (symmetric with dx)

---

## FramingOverlay Component

### `FramingOverlay/index.ts`

```ts
export { FramingOverlay } from './FramingOverlay';
```

### `FramingOverlay/FramingOverlay.tsx`

**Props type** (case 3 — closed API, `FCProps<Props>`):

```ts
import type { CSSProperties } from 'react';

type Props = {
  imageId: string;
  dimensions?: { width: CSSProperties['width']; height: CSSProperties['height'] };
};
```

`dimensions` is optional — callers that don't pass it render the frame at the default aspect ratio from `ImagePlaceholderFrame` (200×350). When `dimensions` is absent, the frame indicator renders with `aspect-ratio: 200 / 350` as default.

**Constants (inlined — single consumer):**

```ts
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.001;
const PERSIST_DEBOUNCE_MS = 600;
```

`ZOOM_STEP` is the multiplier applied to `event.deltaY` for scroll-to-zoom. The exact value determines scroll sensitivity; the implementer may tune it.

**Imports:**

```ts
import { useState, useEffect, useRef, useCallback } from 'react';
import type { CSSProperties } from 'react';
import { FCProps } from '@/types';
import { useImage, useUpdateImageFrame } from '@/data-access-layer';
import type { ImageFrame } from '@/data-access-layer';
import { ImageById } from '../../../ImageById/ImageById';
import { clampFrame, computePanDelta } from './helper';
import type { FrameState } from './helper';
import './FramingOverlay.css';
```

`ImageById` import path from `FramingOverlay.tsx`:
- `FramingOverlay.tsx` is at: `UploadImgBtn/components/ImageViewerDialog/components/FramingOverlay/FramingOverlay.tsx`
- `ImageById.tsx` is at: `UploadImgBtn/components/ImageById/ImageById.tsx`... 

Wait — `ImageById` is at `app/src/components/ImageById/ImageById.tsx`, not inside `UploadImgBtn/components/`. The correct relative path from `FramingOverlay.tsx`:
- Up 5 levels: `../../../../../` → `app/src/components/`
- Then: `ImageById/ImageById`
- Check if `ImageById/index.ts` exists: from earlier glob, only `ImageById.tsx` exists — no barrel. Use explicit file path.
- Full relative: `'../../../../../ImageById/ImageById'`

Do not use `@/components` (circular import from within the `components/` grouping folder). [app/src/CLAUDE.md — Sibling imports within `components/` use relative paths]

**State and refs:**

```ts
const containerRef = useRef<HTMLDivElement>(null);
const isDraggingRef = useRef(false);
const lastPointerRef = useRef<{ x: number; y: number } | null>(null);

const { frame } = useImage(imageId);
const { updateFrame } = useUpdateImageFrame(imageId);

const [frameState, setFrameState] = useState<FrameState>(
  () => frame ?? { x: 50, y: 0, zoom: 1 }
);
```

The lazy `useState` initializer captures `frame` from the TanStack Query cache on first render. Default `{ x: 50, y: 0, zoom: 1 }` matches `object-position: 50% 0%` (= `object-position: top`), the current rendering default.

**Persist effect:**

```ts
useEffect(() => {
  const timer = setTimeout(() => {
    void updateFrame({ x: frameState.x, y: frameState.y, zoom: frameState.zoom });
  }, PERSIST_DEBOUNCE_MS);
  return () => { clearTimeout(timer); };
}, [frameState, updateFrame]);
```

Every `frameState` change resets the debounce timer. The mutation fires 600 ms after the last change — covering scroll-end and drag-end without needing separate pointer-up handlers. `updateFrame` from `useMutation` is referentially stable; including it in deps does not cause re-runs.

**Scroll handler (zoom):**

```ts
const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
  e.preventDefault();
  setFrameState(prev =>
    clampFrame({ ...prev, zoom: prev.zoom - e.deltaY * ZOOM_STEP }, MAX_ZOOM)
  );
}, []);
```

`e.deltaY` is positive when scrolling down (zoom out → decrease zoom). Negating it means scroll-up zooms in. `clampFrame` enforces `zoom ∈ [1, MAX_ZOOM]`.

**Pointer handlers (pan):**

```ts
const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
  isDraggingRef.current = true;
  lastPointerRef.current = { x: e.clientX, y: e.clientY };
  (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
}, []);

const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
  if (!isDraggingRef.current || lastPointerRef.current === null) return;
  const container = containerRef.current;
  if (container === null) return;

  const dx = e.clientX - lastPointerRef.current.x;
  const dy = e.clientY - lastPointerRef.current.y;
  lastPointerRef.current = { x: e.clientX, y: e.clientY };

  const { width, height } = container.getBoundingClientRect();
  setFrameState(prev => {
    const delta = computePanDelta(dx, dy, width, height, prev.zoom);
    return clampFrame({ ...prev, x: prev.x - delta.dx, y: prev.y - delta.dy }, MAX_ZOOM);
  });
}, []);

const handlePointerUp = useCallback(() => {
  isDraggingRef.current = false;
  lastPointerRef.current = null;
}, []);
```

`setPointerCapture` ensures the element continues receiving pointer events even when the pointer leaves its boundary during a drag. `dx` is subtracted from `x` (dragging right moves the image right, revealing the left side of the image — decreasing `object-position` x). 

**CSS vars for the image element:**

```ts
const frameStyle = {
  '--rt-framing-overlay-x': `${frameState.x}%`,
  '--rt-framing-overlay-y': `${frameState.y}%`,
  '--rt-framing-overlay-zoom': frameState.zoom,
} as CSSProperties;
```

These are set on the `ImageById` element, which spreads them onto `<img>`.

**Frame indicator dimensions:**

The frame indicator is a centered overlay div showing the crop region. Its aspect ratio is derived from `dimensions`. Pass to the frame indicator div as an inline style using `aspectRatio`. When `dimensions` is absent, default to `200 / 350`.

```ts
const frameWidth = dimensions?.width ?? 200;
const frameHeight = dimensions?.height ?? 350;
const aspectRatio = `${String(frameWidth)} / ${String(frameHeight)}`;
```

**Return JSX:**

```tsx
return (
  <div
    ref={containerRef}
    className='framing-overlay'
    onWheel={handleWheel}
    onPointerDown={handlePointerDown}
    onPointerMove={handlePointerMove}
    onPointerUp={handlePointerUp}
    onPointerLeave={handlePointerUp}
  >
    <ImageById
      imageId={imageId}
      alt='Framing preview'
      className='framing-overlay-image'
      style={frameStyle}
    />
    <div className='framing-overlay-mask' />
    <div
      className='framing-overlay-frame'
      style={{ aspectRatio }}
    />
  </div>
);
```

`onPointerLeave` reuses `handlePointerUp` to cancel a drag if the pointer exits the container.

### `FramingOverlay/FramingOverlay.css`

```css
.framing-overlay {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  cursor: grab;
}

.framing-overlay:active {
  cursor: grabbing;
}

.framing-overlay-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: var(--rt-framing-overlay-x, 50%) var(--rt-framing-overlay-y, 0%);
  transform: scale(var(--rt-framing-overlay-zoom, 1));
  transform-origin: var(--rt-framing-overlay-x, 50%) var(--rt-framing-overlay-y, 0%);
  pointer-events: none;
  user-select: none;
}

.framing-overlay-mask {
  position: absolute;
  inset: 0;
  /* Blurs and dims the region outside the frame indicator.
     Technique: backdrop-filter on the full overlay with a CSS mask cutout
     centered at the frame indicator rect. The mask-composite: exclude
     creates a transparent hole where the frame sits, leaving that region clear. */
  backdrop-filter: blur(var(--blur)) brightness(0.5);
  mask-image: linear-gradient(black, black), linear-gradient(black, black);
  mask-size: 100% 100%, var(--rt-framing-overlay-frame-w, 200px) var(--rt-framing-overlay-frame-h, 350px);
  mask-position: 0 0, 50% 50%;
  mask-repeat: no-repeat;
  mask-composite: exclude;
  pointer-events: none;
}

.framing-overlay-frame {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  max-width: 100%;
  max-height: 100%;
  border: 2px solid var(--color-primary);
  pointer-events: none;
}
```

**Note on mask technique:** `mask-composite: exclude` is supported in WebKit (used by Tauri). If rendering issues appear at implementation time, acceptable alternatives are: `clip-path: path('...')` with evenodd fill rule (requires JS to compute pixel coordinates), or four overlay divs around the frame rect. The implementer chooses based on what renders correctly.

**Note on mask-size:** `--rt-framing-overlay-frame-w` and `--rt-framing-overlay-frame-h` must be set on `.framing-overlay-mask` via inline style so the mask hole matches the rendered frame indicator size. The implementer sets these after the `FramingOverlay` component mounts and the frame indicator's `getBoundingClientRect()` is known (via a `useLayoutEffect` in `FramingOverlay.tsx`). Add `useLayoutEffect` to update these vars on the container div's inline style when the frame indicator dimensions are known.

Alternatively: since the frame indicator uses `aspect-ratio` + `max-width: 100%` + `max-height: 100%`, its rendered size is determined by the container and the aspect ratio — calculable from the container's dimensions without a DOM measurement. The implementer may compute this directly from `frameWidth`, `frameHeight`, and the container's `getBoundingClientRect()`.

**Simpler alternative if mask-composite is unreliable:** Replace the mask with four absolutely-positioned strips (top, bottom, left, right) outside the frame rect, each with `background: rgba(0,0,0,0.5)` and `backdrop-filter: blur(8px)`. This is more verbose but universally supported.

---

## Wiring into ImageViewerDialog

### `components/index.ts` — updated

```ts
export { ImageViewerDialogHeader } from './ImageViewerDialogHeader';
export { FramingOverlay } from './FramingOverlay';
```

### `ImageViewerDialog.tsx` — updated

Add import:
```ts
import { ImageViewerDialogHeader, FramingOverlay } from './components';
```

Replace `{mode === 'framing' && null}` with:

```tsx
{mode === 'framing' && (
  <FramingOverlay
    imageId={image_id}
    {...(dimensions !== undefined ? { dimensions } : {})}
  />
)}
```

The conditional spread avoids passing `dimensions={undefined}` to a prop typed as optional, satisfying `exactOptionalPropertyTypes`. `dimensions` is already in scope from the updated `Props` type (SF5).
