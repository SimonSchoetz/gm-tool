# dnd-kit

## `@dnd-kit/core`'s `getScrollableAncestors` stops walking up the DOM at the first `position: fixed` element, so the document's scrolling element is never collected for an element inside a fixed container

**Verified at:** @dnd-kit/core 6.3.1
**Citation:** [architect_1: app/node_modules/.pnpm/@dnd-kit+core@6.3.1_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@dnd-kit/core/dist/core.esm.js:686-723 — the walk pushes `node.scrollingElement` only when `isDocument(node)` (line 698), pushes a visited ancestor when `isScrollable(node, computedStyle)` (line 714), returns when `isFixed(node, computedStyle)` (line 719, `computedStyle.position === 'fixed'`), and otherwise recurses into `node.parentNode` (line 723)]

A fixed ancestor is itself still collected when it is scrollable, because the scrollable check runs before the fixed check.

## `useSortable` called outside any `DndContext` and `SortableContext` renders under Testing Library, and a user-event click on text inside the item reaches an ancestor's `onClick`

**Verified at:** @dnd-kit/sortable 10.0.0, @dnd-kit/core 6.3.1, vitest 5.0.2 (jsdom), ran 2026-10-29
**Citation:** [spec-writer_3: ran `npx vitest run` on a scratch test rendering a component that calls `useSortable({ id })`, with no dnd-kit provider above it, inside a `div` with an `onClick` spy, then `userEvent.setup().click(screen.getByText('Goblin'))` — observed the test passed: the render did not throw and the spy was called once]

A test of a component built on `useSortable` needs no dnd-kit provider to render it or to dispatch a click; it does not exercise dragging.

## Removing the siblings above the dragged item in the same commit that starts the drag leaves the dragged item above the pointer by their total height

**Verified at:** @dnd-kit/core 6.3.1, @dnd-kit/sortable 10.0.0, react 19.3.0, Chrome 156.0.8078.73 headless, ran 2026-10-29
**Citation:** [spec-writer_1: ran `node drive.mjs` — a scratch page with a `DndContext`, a `SortableContext` of eight 40 px items in a `div` with `overflow-y: auto` and a `PointerSensor`, whose `onDragStart` removed the other selected items from the rendered list and from `items`, driven by Chrome DevTools Protocol mouse events on the dragged item's handle — observed the dragged item's centre 120 px above the pointer with three removed items above it (100 px in a box scrolled 20 px, whose scroll top fell to 0 as the list shrank), 40 px with one, and 0 with the removed items below it, at pointer moves of 0, 10 and 25 px] [architect_1: `app/node_modules/.pnpm/@dnd-kit+core@6.3.1_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@dnd-kit/core/dist/core.esm.js:2952,2960-2962` — `nodeRectDelta = useRectDelta(activeNodeRect)` is subtracted from `translate` in the transform handed to modifiers]

The pointer delta dnd-kit applies is unchanged by the removal, so only the layout position of the dragged item moves.

## A `modifiers` entry on `DndContext` that adds `active.rect.current.initial.top - activeNodeRect.top` to `transform.y` changes nothing when the siblings are removed in the commit that starts the drag

**Verified at:** @dnd-kit/core 6.3.1, @dnd-kit/sortable 10.0.0, react 19.3.0, Chrome 156.0.8078.73 headless, ran 2026-10-29
**Citation:** [spec-writer_1: ran `node drive.mjs` — the same scratch page with that modifier active only while the removal was set — observed the same offsets as without the modifier, in a box that did not overflow and in one scrolled 20 px that did] [architect_1: `app/node_modules/.pnpm/@dnd-kit+core@6.3.1_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@dnd-kit/core/dist/core.esm.js:2952,2960-2962` — `nodeRectDelta = useRectDelta(activeNodeRect)` is subtracted from `translate` in the transform handed to modifiers] [architect_2: same file `:2223-2225` and `:2064-2077` — `useRectDelta` compares against `useInitialValue`, the first non-null rect]

Both rects are measured after the removal, so their difference is 0. dnd-kit's own subtraction of the active node's rect change (`useRectDelta`) is 0 for the same reason.

## Removing the siblings above the dragged item one animation frame after the drag starts keeps the dragged item under the pointer

**Verified at:** @dnd-kit/core 6.3.1, @dnd-kit/sortable 10.0.0, react 19.3.0, Chrome 156.0.8078.73 headless, ran 2026-10-29
**Citation:** [spec-writer_1: ran `node drive.mjs` — the same scratch page with the removal moved into a `requestAnimationFrame` callback set by `onDragStart`, and in a separate run into a `setTimeout(0)` callback — observed in each run the dragged item's centre exactly at the pointer (offset 0) with three removed items above it, at pointer moves of 0, 10, 25, 40 and 80 px, in a box that did not overflow and in one scrolled 20 px that did (its scroll top fell to 0 as the list shrank), and `onDragEnd` reported `over` as the last item for a drop below the list] [architect_1: `app/node_modules/.pnpm/@dnd-kit+core@6.3.1_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@dnd-kit/core/dist/core.esm.js:2952,2960-2962` — `nodeRectDelta = useRectDelta(activeNodeRect)` is subtracted from `translate` in the transform handed to modifiers] [architect_3: same file `:2152-2220` — `useRect` re-measures on a `childList` mutation under `document.body` whose target contains the node]

dnd-kit measures the active node in the commit that starts the drag and subtracts its later rect change from the pointer delta, so a removal in a later commit is compensated by dnd-kit itself.

## Under Vitest's jsdom, a `PointerSensor` drag of a `useSortable` item runs from user-event's `pointer` and `onDragEnd` reports the first item as `over`

**Verified at:** @dnd-kit/core 6.3.1, @dnd-kit/sortable 10.0.0, vitest 5.0.2 (jsdom), @testing-library/user-event 14.6.7, ran 2026-10-29
**Citation:** [spec-writer_2: ran `npx vitest run` on a scratch test with a `DndContext` (`PointerSensor`, `closestCenter`), a `SortableContext` of four items a to d and `userEvent.setup().pointer([{ keys: '[MouseLeft>]', target: handle }, { target: handle, coords }, { keys: '[/MouseLeft]' }])` on the handle of item c — observed `onDragStart` once and `onDragEnd` once with `over.id` `a`]

The first item is the inferred result of every rect being zero under jsdom, which would make all items equally near `closestCenter`; no run measured a rect. A component test can pin what a drag saves, while where the drop lands is decided by geometry jsdom does not compute (`.claude/knowledge/jsdom.md`).

## Under Vitest's jsdom, pressing Escape during a `PointerSensor` drag ends it without calling `onDragEnd`

**Verified at:** @dnd-kit/core 6.3.1, @dnd-kit/sortable 10.0.0, vitest 5.0.2 (jsdom), @testing-library/user-event 14.6.7, ran 2026-10-29
**Citation:** [spec-writer_2: ran `npx vitest run` on the same scratch test with `{Escape}` pressed between the move and the release — observed `onDragEnd` not called and `requestAnimationFrame` resolved]

A cancelled drag is therefore observable in a component test as the absence of the save a drop would make.

## `@dnd-kit/core`'s pointer sensor stops propagation of the `click` that follows an activated drag

**Verified at:** @dnd-kit/core 6.3.1, 2026-10-29
**Citation:** [architect_9: `app/node_modules/.pnpm/@dnd-kit+core@6.3.1_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@dnd-kit/core/dist/core.esm.js:1495-1511` — `handleStart` adds `EventName.Click` with `stopPropagation` and `capture: true` on the document once activated]

The click that follows a drop therefore never reaches the dragged entry's own `onClick`, so a drag runs no click rule.

## `@dnd-kit/core`'s pointer sensor removes its document listeners 50 ms after a drag ends, so a click in that window is still swallowed

**Verified at:** @dnd-kit/core 6.3.1, vitest 5.0.2 (jsdom), @testing-library/user-event 14.6.7, ran 2026-10-29
**Citation:** [implement_1: `app/node_modules/.pnpm/@dnd-kit+core@6.3.1_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@dnd-kit/core/dist/core.esm.js:1475-1479` — `detach` removes the sensor's own listeners at once and calls `setTimeout(this.documentListeners.removeAll, 50)` for the document ones] [implement_2: ran `npx vitest run src/screens/encounter/components/EncounterQueue/__tests__` — a `user.click` in the test right after one that cancelled a drag with Escape reached no `onClick` handler, and the same test passed alone with `-t`]

A test that clicks after a test that dragged waits those 50 ms first.

## `SortableContext` re-measures its droppables when its `items` change during a drag

**Verified at:** @dnd-kit/sortable 10.0.0, 2026-10-29
**Citation:** [architect_10: `app/node_modules/.pnpm/@dnd-kit+sortable@10.0.0_@dnd-kit+core@6.3.1_react-dom@19.3.0_react@19.3.0__react@19.3.0__react@19.3.0/node_modules/@dnd-kit/sortable/dist/sortable.esm.js:316-320` — a layout effect calls `measureDroppableContainers(items)` when `itemsHaveChanged && isDragging`]

A drop is therefore decided against the list as it stands when the drop happens, after any entries were removed from `items` during the drag.
