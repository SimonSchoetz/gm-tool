# Spec: Image Framing

## Progress Tracker

- SF1: DB layer — add frame columns to images table; add `update` DB function and test
- SF2: Service — add `updateImageFrame` to `imageService.ts`
- SF3: DAL — extend `useImage` return type; add `useUpdateImageFrame` hook and `ImageFrame` type
- SF4: `HoloImg` — apply stored frame data as CSS custom properties on the rendered image
- SF5: `ImageViewerDialog` — extract `ImageViewerDialogHeader`; add `dimensions` prop and `mode` state; wire settings-2 toggle
- SF6: `FramingOverlay` — new interactive pan/zoom editor sub-component; auto-persist on interaction end

Implement in order: SF1 → SF2 → SF3 → SF4 → SF5 → SF6.

## Key Architectural Decisions

### Interaction model: frame fixed, image pans and zooms (Model B)

The editing UI shows the image filling the dialog content area with a fixed frame indicator centered on top. The user interacts with the image (scroll to zoom, drag to pan), not the frame. The frame indicator is a static overlay showing which region will be visible in the list view. This is WYSIWYG: the image inside the frame in the editor renders identically to `HoloImg` in the list.

### Stored values: percentage-based pan + scale factor

Frame state is stored as three nullable REAL columns on the `images` table: `frame_x` (horizontal position 0–100%), `frame_y` (vertical position 0–100%), `frame_zoom` (scale factor ≥ 1.0). Null for all three means no framing applied. The values map directly to CSS without runtime computation.

### CSS rendering: object-position + transform scale

`.holo-img` applies framing via:
- `object-position: var(--rt-holo-img-frame-x, 50%) var(--rt-holo-img-frame-y, 0%)`
- `transform: scale(var(--rt-holo-img-frame-zoom, 1))`
- `transform-origin: var(--rt-holo-img-frame-x, 50%) var(--rt-holo-img-frame-y, 0%)`

Defaults (`50% 0%`) reproduce the current `object-position: top` behavior when no frame is set. `ImagePlaceholderFrame` already has `overflow: hidden`, clipping the scaled image. The CSS vars are set on the `<img>` element by `HoloImg` via a `style` prop passed through `ImageById`'s `...props` spread.

### Frame data stored on images table

Three nullable columns on `images`. One image = one entity in this app; per-image framing is correct. Entity tables are not modified.

### useImage extended to return frame — no second query

`useImage` already calls `imageService.getImageById`, which returns the full image record. After SF1 adds frame columns, `useImage` extracts and returns `frame: ImageFrame | null` alongside `imageUrl`. TanStack Query deduplicates: `HoloImg` calling `useImage(image_id)` and `ImageById` calling `useImage(imageId)` share the same cache entry.

### HoloImg owns frame data — not relayed as prop

`HoloImg` calls `useImage(image_id)` directly to obtain `frame`. The relay-as-prop rule prohibits its NPC list parent from fetching and forwarding frame data down to `HoloImg`. [app/src/CLAUDE.md — State Management & Error Handling: Framework context is not a prop]

### FramingOverlay owns the save mutation

The scroll and drag-end events that trigger persistence occur inside `FramingOverlay`. Per CLAUDE.md ("If a component has a button, that component owns the button's action"), `FramingOverlay` calls `useUpdateImageFrame(imageId)` directly. `ImageViewerDialog` does not own or proxy the mutation.

### Persistence: debounced on frameState change (600 ms)

A single `useEffect` in `FramingOverlay` debounces all `frameState` changes. This covers both scroll-end (last scroll event fires, 600 ms elapses) and drag-end (pointer-up updates state, 600 ms elapses). No separate persist-on-pointer-up required; the debounce interval is short enough that the save feels immediate after drag release.

### Initial frame state: lazy useState from cached useImage data

When `FramingOverlay` mounts, `useImage(imageId)` returns cached data synchronously (the image was loaded in view mode before framing mode opened). `useState(() => frame ?? { x: 50, y: 0, zoom: 1 })` captures the cached frame on the first render. Default `{ x: 50, y: 0, zoom: 1 }` matches the current `object-position: top` (50% 0%) rendering.

### Maximum zoom: 5.0x

`MAX_ZOOM = 5` is inlined as a constant in `FramingOverlay.tsx` (single consumer). [app/src/CLAUDE.md — Constants: single-consumer constants stay inlined]

### ImageViewerDialogHeader is self-contained (owns the layout effect)

The `useLayoutEffect` that measures header height and sets `--rt-image-viewer-dialog-header-h` on the parent element moves into `ImageViewerDialogHeader`. The component uses an internal ref; no ref forwarding is needed.

## Sub-Feature Files

- [SF1 — DB layer](./SPEC_IMAGE_FRAMING_SF1.md)
- [SF2 — Service](./SPEC_IMAGE_FRAMING_SF2.md)
- [SF3 — DAL](./SPEC_IMAGE_FRAMING_SF3.md)
- [SF4 — HoloImg](./SPEC_IMAGE_FRAMING_SF4.md)
- [SF5 — ImageViewerDialog](./SPEC_IMAGE_FRAMING_SF5.md)
- [SF6 — FramingOverlay](./SPEC_IMAGE_FRAMING_SF6.md)

## CLAUDE.md Impact

None. This spec introduces no new structural patterns, directory conventions, or layer rules beyond those already documented. No existing CLAUDE.md examples are invalidated.
