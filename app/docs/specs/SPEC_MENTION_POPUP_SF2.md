# SF2: useDraggable Hook

Create the pointer-capture drag hook and fix the pre-existing `export *` violation in `hooks/index.ts`.

## Files Affected

**New:**

- `app/src/hooks/useDraggable/useDraggable.ts`
- `app/src/hooks/useDraggable/__tests__/useDraggable.test.ts`

**Modified:**

- `app/src/hooks/index.ts` — replace `export *` with explicit named exports; add `useDraggable`

## Frontend

### useDraggable.ts

**Purpose:** Manages a draggable position using pointer capture so that `pointermove` and `pointerup` are reliably received even when the cursor leaves the drag-handle element mid-drag.

**Signature:**

```ts
type Position = { x: number; y: number };

export const useDraggable = (
  initialPosition: Position,
  onChange?: (position: Position) => void,
): {
  position: Position;
  draggableProps: {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
  };
}
```

**Implementation details:**

- `position` state is initialized from `initialPosition` and updated during drag via `setPosition`.
- A mutable `dragRef` (typed `{ startX: number; startY: number; originX: number; originY: number } | null`, initialized to `null`) tracks the drag origin. Set on `onPointerDown`; cleared on `onPointerUp`.
- A mutable `positionRef` mirrors the current `position` state synchronously so `onPointerUp` can read the final position without a stale closure. Update `positionRef.current` every time `setPosition` is called.
- `onPointerDown`: call `e.currentTarget.setPointerCapture(e.pointerId)`; set `dragRef.current` to `{ startX: e.clientX, startY: e.clientY, originX: position.x, originY: position.y }`.
- `onPointerMove`: if `dragRef.current` is null, return. Compute `dx = e.clientX - dragRef.current.startX`, `dy = e.clientY - dragRef.current.startY`. Compute `newPos = { x: dragRef.current.originX + dx, y: dragRef.current.originY + dy }`. Call `positionRef.current = newPos` then `setPosition(newPos)`.
- `onPointerUp`: if `dragRef.current` is null, return. Set `dragRef.current = null`. Call `onChange?.(positionRef.current)`.

Import `useState`, `useRef` from `react`. Import `React` for the `React.PointerEvent` type.

**No `useCallback` or `useMemo` required** — the handlers are recreated each render without performance concern; this hook is never used in a list.

---

### useDraggable.test.ts

**Purpose:** Verify the drag lifecycle: initial position, position update during drag, `onChange` on drag end, and no-op when `pointermove` fires without a prior `pointerdown`.

Use `renderHook` from `@testing-library/react` and `act` from `react`. Import `describe`, `it`, `expect`, `vi` from `vitest`.

`setPointerCapture` is not implemented in jsdom — mock it on the synthetic event's `currentTarget` when calling `onPointerDown`.

**Helper: build a minimal pointer event mock**

```ts
const makePointerEvent = (
  clientX: number,
  clientY: number,
  currentTarget?: Partial<Element>,
): React.PointerEvent => ({
  clientX,
  clientY,
  pointerId: 1,
  currentTarget: { setPointerCapture: vi.fn(), ...currentTarget } as unknown as Element,
}) as unknown as React.PointerEvent;
```

**Required test cases** (`describe('useDraggable')`):

1. **Initial position is returned as-is:**
   ```ts
   const { result } = renderHook(() => useDraggable({ x: 10, y: 20 }));
   expect(result.current.position).toEqual({ x: 10, y: 20 });
   ```

2. **Position updates during drag:**
   ```ts
   const { result } = renderHook(() => useDraggable({ x: 0, y: 0 }));
   act(() => { result.current.draggableProps.onPointerDown(makePointerEvent(100, 200)); });
   act(() => { result.current.draggableProps.onPointerMove(makePointerEvent(130, 250)); });
   expect(result.current.position).toEqual({ x: 30, y: 50 });
   ```

3. **onChange is called with final position on pointer-up:**
   ```ts
   const onChange = vi.fn();
   const { result } = renderHook(() => useDraggable({ x: 0, y: 0 }, onChange));
   act(() => { result.current.draggableProps.onPointerDown(makePointerEvent(0, 0)); });
   act(() => { result.current.draggableProps.onPointerMove(makePointerEvent(40, 60)); });
   act(() => { result.current.draggableProps.onPointerUp(makePointerEvent(40, 60)); });
   expect(onChange).toHaveBeenCalledWith({ x: 40, y: 60 });
   ```

4. **pointermove without prior pointerdown does not update position:**
   ```ts
   const { result } = renderHook(() => useDraggable({ x: 5, y: 5 }));
   act(() => { result.current.draggableProps.onPointerMove(makePointerEvent(100, 100)); });
   expect(result.current.position).toEqual({ x: 5, y: 5 });
   ```

5. **onChange is not called if pointer-up fires without active drag:**
   ```ts
   const onChange = vi.fn();
   const { result } = renderHook(() => useDraggable({ x: 0, y: 0 }, onChange));
   act(() => { result.current.draggableProps.onPointerUp(makePointerEvent(50, 50)); });
   expect(onChange).not.toHaveBeenCalled();
   ```

---

### hooks/index.ts

The existing file uses `export *`, which violates the grouping barrel rule (explicit named exports required — `export *` is banned). Replace the entire file:

```ts
export { useSortable } from './useSortable';
export type { SortState } from './useSortable';
export { useListFilter } from './useListFilter/useListFilter';
export { useDraggable } from './useDraggable/useDraggable';
```

`SortState` is a generic type exported from `useSortable.ts` — it requires `export type` per TypeScript isolatedModules conventions. `useListFilter` is exported as a named export from its file and requires no `type` prefix. `SortableColumn` and `UseSortableConfig` are internal types not imported by any consumer outside the hook — do not re-export them.
