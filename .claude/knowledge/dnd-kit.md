# dnd-kit

## `@dnd-kit/core`'s `getScrollableAncestors` stops walking up the DOM at the first `position: fixed` element, so the document's scrolling element is never collected for an element inside a fixed container

**Verified at:** @dnd-kit/core 6.3.1
**Citation:** [architect_1: app/node_modules/.pnpm/@dnd-kit+core@6.3.1_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@dnd-kit/core/dist/core.esm.js:686-723 — the walk pushes `node.scrollingElement` only when `isDocument(node)` (line 698), pushes a visited ancestor when `isScrollable(node, computedStyle)` (line 714), returns when `isFixed(node, computedStyle)` (line 719, `computedStyle.position === 'fixed'`), and otherwise recurses into `node.parentNode` (line 723)]

A fixed ancestor is itself still collected when it is scrollable, because the scrollable check runs before the fixed check.

## `useSortable` called outside any `DndContext` and `SortableContext` renders under Testing Library, and a user-event click on text inside the item reaches an ancestor's `onClick`

**Verified at:** @dnd-kit/sortable 10.0.0, @dnd-kit/core 6.3.1, vitest 5.0.2 (jsdom), ran 2026-10-29
**Citation:** [spec-writer_3: ran `npx vitest run` on a scratch test rendering a component that calls `useSortable({ id })`, with no dnd-kit provider above it, inside a `div` with an `onClick` spy, then `userEvent.setup().click(screen.getByText('Goblin'))` — observed the test passed: the render did not throw and the spy was called once]

A test of a component built on `useSortable` needs no dnd-kit provider to render it or to dispatch a click; it does not exercise dragging.
