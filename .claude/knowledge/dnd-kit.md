# dnd-kit

## `@dnd-kit/core`'s `getScrollableAncestors` stops walking up the DOM at the first `position: fixed` element, so the document's scrolling element is never collected for an element inside a fixed container

**Verified at:** @dnd-kit/core 6.3.1
**Citation:** [architect_1: app/node_modules/.pnpm/@dnd-kit+core@6.3.1_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@dnd-kit/core/dist/core.esm.js:686-723 — the walk pushes `node.scrollingElement` only when `isDocument(node)` (line 698), pushes a visited ancestor when `isScrollable(node, computedStyle)` (line 714), returns when `isFixed(node, computedStyle)` (line 719, `computedStyle.position === 'fixed'`), and otherwise recurses into `node.parentNode` (line 723)]

A fixed ancestor is itself still collected when it is scrollable, because the scrollable check runs before the fixed check.
