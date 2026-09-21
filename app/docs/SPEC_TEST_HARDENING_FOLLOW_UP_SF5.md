# Sub-feature 5: Framing overlay saves through the data-access layer

The image framing overlay stops owning a save timer. `useUpdateImageFrame` debounces and flushes frame saves through `useAutosaveQueue` (Sub-feature 4), so an edit made just before the image viewer dialog closes is saved, and opening the overlay without editing writes nothing. Implement after Sub-feature 4.

## Files affected

`Modified:`

- `app/src/data-access-layer/images/useUpdateImageFrame.ts` — debounce and unmount flush through `useAutosaveQueue`; `updateFrame` returns `void`
- `app/src/components/UploadImgBtn/components/ImageViewerDialog/components/ImagePreviewFramingOverlay/ImagePreviewFramingOverlay.tsx` — local timer removed; saves only edited frames; two convention fixes

`Deleted:` none

`New:` none

`Moved:` none

`Draft:` none

Barrels need no change. `app/src/data-access-layer/images/index.ts` keeps `export { useUpdateImageFrame } from './useUpdateImageFrame';` and `export type { ImageFrame } from './useUpdateImageFrame';`, and `app/src/data-access-layer/index.ts` keeps `export { useImage, useUpdateImageFrame } from './images';`. Both use explicit named exports, as `app/src/CLAUDE.md` — Barrel Files requires. `useImage.ts` and `imageQueryOptions.ts` import the unchanged `ImageFrame` type from `./useUpdateImageFrame` and need no change. The overlay is the only consumer of `useUpdateImageFrame` [spec-writer_25: grep useUpdateImageFrame app/src — found only the overlay, the two barrels and the hook itself, as of 529b24dd].

## Layered breakdown

### Data Access Layer

#### `images/useUpdateImageFrame.ts`

- `mutationFn` takes `{ id, frame }: { id: string; frame: ImageFrame }` and calls `imageService.updateImageFrame(id, frame)`. `onSuccess` becomes `(_result, { id }) => { void queryClient.invalidateQueries({ queryKey: imageKeys.detail(id) }); }`. The id comes from the mutation variables because the save is deferred (`.claude/rules/src-data-access-layer.md` — Non-negotiable rules, the deferred-dispatch carve-out).
- `const saveQueue = useAutosaveQueue<ImageFrame>((_pending, frame) => frame, (id, frame) => { mutation.mutate({ id, frame }); });`, importing `useAutosaveQueue` from `'../useAutosaveQueue'`. The latest frame wins, and the merge stays inline (root Key Architectural Decisions — A latest-wins merge stays inline). The save uses `mutate`, never `mutateAsync` (root Key Architectural Decisions — The framing overlay saves through the data-access layer and saves only edits).
- `UseUpdateImageFrameReturn` becomes `{ updateFrame: (frame: ImageFrame) => void }`, and the hook returns `updateFrame: (frame) => { saveQueue.schedule(imageId, frame); }`. The id is captured at schedule time.
- `ImageFrame` stays exported from this file, unchanged.

### Frontend

#### `ImagePreviewFramingOverlay.tsx`

- **Purpose** — unchanged: lets the user pan and zoom an image's framing box inside the image viewer dialog. Only how it persists the frame changes: the data-access layer now owns the debounce, so the last edit survives the dialog closing (`app/src/CLAUDE.md` — TanStack Query pattern: components own no async logic).
- **Behavior**:
  - Remove `PERSIST_DEBOUNCE_MS` (line 14) and the `useEffect` that sets and clears the timer (lines 40-51).
  - Add the module-level `const DEFAULT_FRAME: FrameState = { x: 50, y: 0, zoom: 1 };` beside `MAX_ZOOM` and `ZOOM_STEP`, above the component. Put a single-line comment on it saying these are the values `ImageById.css` falls back to for an image with no stored frame. The CSS cannot import the constant, so both keep their own copy (`app/src/CLAUDE.md` — Constants, Trigger 1).
  - The state initializer becomes `useState<FrameState>(frame ?? DEFAULT_FRAME)`.
  - Directly after that `useState` line, add `const initialFrameRef = useRef(frameState);`. It must come after the declaration of `frameState`, which it reads during render.
  - Add a `useEffect` on `[frameState]` that returns without doing anything when `frameState === initialFrameRef.current`, and otherwise calls `updateFrameRef.current(frameState)`. Put one single-line comment above it saying the frame the overlay opened with is either stored already or equals `ImageById.css`'s fallback, so only a frame the user changed is saved.
  - The identity check is sound because every edit goes through `clampFrame`, which always returns a new object (`helper/clampFrame.ts:7-11`). Both the stored `frame` and `DEFAULT_FRAME` stay the same object across the double render of development Strict Mode.
  - Keep `updateFrameRef`, the effect that assigns it, and the comment above them. `updateFrame` is still a new function on every render, so listing it as an effect dependency would still loop: a save's invalidation re-renders, giving a new `updateFrame`, which re-runs the effect.
  - The overlay no longer writes the frame it opened with, and the save delay becomes 500 ms (root Key Architectural Decisions — The framing overlay saves through the data-access layer and saves only edits).
  - Fix two convention violations in this file:
    - `handlePointerMove` exits with `return null;` (line 84) in a handler whose type is `void`; it becomes `return;` (`app/CLAUDE.md` — TypeScript Coding Style, void early exits).
    - `handlePointerDown` (line 72), `handlePointerMove` (line 81) and `handlePointerUp` (line 107) are wrapped in `useCallback`, but they are passed only to a plain `<div>` and read by no effect. They become plain `const` arrow functions with the same bodies, and the `useCallback` import is removed (`.claude/rules/src-react-hooks.md` — `useCallback` and `useMemo` need a named consumer).
  - The file has no other violations. There is no inline sub-component or IIFE, `Props` uses `FCProps`, and the wheel-listener effect stays unchanged.
- **UI / Visual** — unchanged: no markup, class or style changes.

Hand-off for the human tester: an agent cannot run this check, because only `pnpm run dev` reaches the database (root `CLAUDE.md` — Running the application). With `pnpm run dev`, open an image's viewer dialog, switch to framing mode, drag the frame, and close the dialog immediately after the last drag. Reopen it and confirm the frame kept the dragged position. Then open framing mode and close the dialog without dragging, reopen it, and confirm the frame did not move.

No unit test. The overlay is a component, and `app/src/CLAUDE.md` — Testing Policy forbids component tests. None of its risks is the browser-native-default-action category that policy excludes from the exemption. The debounce and unmount flush are covered by `__tests__/useAutosaveQueue.test.ts` (Sub-feature 4). The id `useUpdateImageFrame` passes through `mutate()` is a data-access-layer hook detail, part of the scope gap recorded under CLAUDE.md impact.

## Checks

From `app/`: the `every check` rows of root `CLAUDE.md` — Tool Use Discipline; `npx vitest run` as part of the full suite.
