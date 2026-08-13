# Block Drag Handle

- Sub-feature 1: Block Drag Handle Plugin — let a user reorder top-level editor blocks (paragraphs, headings, lists, toggles, tables) by dragging a hover-revealed handle

## Key Architectural Decisions

### Wrap Lexical's own `DraggableBlockPlugin_EXPERIMENTAL` rather than building custom drag mechanics

`@lexical/react`'s `DraggableBlockPlugin_EXPERIMENTAL` (already an installed dependency at `^0.46.0`; the `_EXPERIMENTAL` suffix is Lexical's own designation — its signature must be re-verified against `.claude/knowledge/lexical.md` on any future `@lexical/react` version bump) owns the entire drag interaction internally: hover detection, drag-image setup, drop-position calculation, and the actual `LexicalNode` move (`targetNode.insertAfter`/`insertBefore`, called from inside the library's own `DROP_COMMAND` handler). The consumer supplies only two positioned DOM elements (a handle, a drop-indicator line) and an `isOnMenu` predicate. No `DROP_COMMAND`/`DRAGOVER_COMMAND` registration or node-splicing is written in this feature — see `.claude/knowledge/lexical.md` — "`DraggableBlockPlugin_EXPERIMENTAL` owns the entire drag interaction internally...".

### Scope is block-level reorder only

`getBlockElement` (internal to the plugin) scopes to `getTopLevelNodeKeys(editor)` — every direct child of root, with no node-type exclusions — so paragraphs, headings, lists, toggles, and tables are draggable uniformly as whole units, with no per-type branching required. Dragging a toggle carries its body with it, since the body is the toggle node's child, not a sibling. This feature does not add inline text-span dragging (no Lexical primitive exists for it) and does not add table-internal row/column dragging (already `TableEdgeHandlePlugin`'s domain, out of scope here).

### `.editor-content` gains `position: relative`

`DraggableBlockPlugin_EXPERIMENTAL`'s internal `setMenuPosition`/`setTargetLine` compute `translate()` offsets as `targetRect.top - anchorElem.getBoundingClientRect().top`, while the handle and drop-line are portaled as `anchorElem`'s direct DOM children. This is only correct when `anchorElem` is itself the positioned ancestor its absolutely-positioned children resolve against — see `.claude/knowledge/lexical.md` — "`anchorElem` must itself be a positioned element...". `anchorElem` for this feature is `editor.getRootElement()` (the `.editor-content` div), which currently has no `position` declared. `.editor-content`'s sibling `.placeholder` (rendered by `RichTextPlugin` as a sibling, not a child, of `contentEditable`) already resolves against `.text-editor` and is unaffected by this change.

### Handle and drop-line root elements use a fixed `position: absolute; left: -10000px; top: -10000px;` base

Lexical sets only `transform`, `opacity`, `display`/`width` on these elements via inline styles every frame — it never resets `left`/`top`. Any other `position`/`top`/`left`/`transform`/`opacity`/`display`/`width` declared in this feature's own CSS would conflict with values Lexical overwrites. See `.claude/knowledge/lexical.md` — "`menuRef`/`targetLineRef` root elements must use `position: absolute; left: -10000px; top: -10000px;`...".

### `anchorElem` state is set from inside a `registerRootListener` callback, never synchronously at the effect's top level

`editor.getRootElement()` is not available on `BlockDragHandlePlugin`'s first render (it commits only once `RichTextPlugin`'s `ContentEditable` sibling attaches its own ref, after all components in the tree have rendered), so `anchorElem` must be `useState`. A bare `useEffect(() => { setAnchorElem(editor.getRootElement()); }, [editor]);` trips `react-hooks/set-state-in-effect` ("Avoid calling setState() directly within an effect") — confirmed by running it through this project's installed ESLint config; see `.claude/knowledge/eslint.md` — "`react-hooks/set-state-in-effect` fires on a `setState` call written directly at a `useEffect` callback's top level...". The fix is `editor.registerRootListener`, Lexical's own documented mechanism for observing root-element changes (see `.claude/knowledge/lexical.md` — "`LexicalEditor.registerRootListener(listener)`..."), called from inside a `useEffect` that returns the listener's own unregister function, with `setAnchorElem` called from inside the listener callback — confirmed clean against both ESLint and `tsc --noEmit`.

### `ref` is declared as an ordinary prop on `BlockDragHandle`/`BlockDropIndicator` — no `forwardRef`

`DraggableBlockPlugin_EXPERIMENTAL` expects `menuRef`/`targetLineRef` (each `React.RefObject<HTMLElement | null>`) attached to the actual root DOM node of the consumer-supplied `menuComponent`/`targetLineComponent`. Per `app/src/CLAUDE.md`, `ref` is an ordinary prop on a React 19 function component. This is the first component in this codebase declaring `ref` in its own `Props` type (no existing instance to follow), so both components' full shape is specified below rather than referenced. `menuRef`/`targetLineRef` are created via `useRef<HTMLDivElement>(null)` (concrete DOM type, per the existing DOM-ref-typing convention) and passed directly as each sub-component's `ref` prop — `RefObject<HTMLDivElement | null>` is assignable to both `DraggableBlockPlugin_EXPERIMENTAL`'s broader `RefObject<HTMLElement | null>` parameter and to a sub-component's own `React.Ref<HTMLDivElement>` prop type, since `HTMLDivElement` narrows `HTMLElement`. This is also exactly the pattern used by Lexical's own shipped reference implementation (`packages/lexical-playground/src/plugins/DraggableBlockPlugin/index.tsx`), which types both refs `useRef<HTMLDivElement>(null)`.

## CLAUDE.md impact

None.

---

## Sub-feature 1: Block Drag Handle Plugin

Lets a user reorder top-level editor blocks (paragraphs, headings, lists, toggles, tables) by dragging a hover-revealed handle to a new position, using Lexical's own `DraggableBlockPlugin_EXPERIMENTAL` primitive for all drag mechanics and the node move.

### Files affected

**New:**

- `app/src/components/TextEditor/plugins/BlockDragHandlePlugin/BlockDragHandlePlugin.tsx`
- `app/src/components/TextEditor/plugins/BlockDragHandlePlugin/helper/isOnMenu.ts`
- `app/src/components/TextEditor/plugins/BlockDragHandlePlugin/helper/__tests__/isOnMenu.test.ts`
- `app/src/components/TextEditor/plugins/BlockDragHandlePlugin/helper/index.ts`
- `app/src/components/TextEditor/plugins/BlockDragHandlePlugin/components/BlockDragHandle/BlockDragHandle.tsx`
- `app/src/components/TextEditor/plugins/BlockDragHandlePlugin/components/BlockDragHandle/BlockDragHandle.css`
- `app/src/components/TextEditor/plugins/BlockDragHandlePlugin/components/BlockDropIndicator/BlockDropIndicator.tsx`
- `app/src/components/TextEditor/plugins/BlockDragHandlePlugin/components/BlockDropIndicator/BlockDropIndicator.css`
- `app/src/components/TextEditor/plugins/BlockDragHandlePlugin/components/index.ts`

**Modified:**

- `app/src/components/TextEditor/plugins/index.ts` — add the barrel export for `BlockDragHandlePlugin`.
- `app/src/components/TextEditor/TextEditor.tsx` — import and conditionally render `BlockDragHandlePlugin`.
- `app/src/components/TextEditor/TextEditor.css` — add `position: relative;` to the existing `.editor-content` rule.

### Frontend

#### `BlockDragHandlePlugin`

**Purpose** — Obtains the editor's root DOM element as `anchorElem`, then renders `DraggableBlockPlugin_EXPERIMENTAL` wired to `BlockDragHandle` and `BlockDropIndicator`. This is the only file in the feature that touches Lexical's editor context.

**Behavior** — On mount, subscribes to `editor.registerRootListener` inside a `useEffect`, setting `anchorElem` state from inside the listener callback (never synchronously at the effect's top level — see Key Architectural Decisions). Renders nothing (`null`) until that root element is available, then renders `DraggableBlockPlugin_EXPERIMENTAL` with two `useRef<HTMLDivElement>(null)` refs passed straight through as both the plugin's own `menuRef`/`targetLineRef` and as the `ref` prop of `BlockDragHandle`/`BlockDropIndicator` respectively. No local drag-state, no command registration, no manual node mutation — all of that lives inside `DraggableBlockPlugin_EXPERIMENTAL` itself.

**UI / Visual** — No visual surface of its own; composes the two sub-components below into the Lexical primitive.

File content:

```tsx
import { useEffect, useRef, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { DraggableBlockPlugin_EXPERIMENTAL } from '@lexical/react/LexicalDraggableBlockPlugin';
import { BlockDragHandle, BlockDropIndicator } from './components';
import { isOnMenu } from './helper';

export const BlockDragHandlePlugin = () => {
  const [editor] = useLexicalComposerContext();
  const [anchorElem, setAnchorElem] = useState<HTMLElement | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const targetLineRef = useRef<HTMLDivElement>(null);

  useEffect(
    () =>
      editor.registerRootListener((rootElement) => {
        setAnchorElem(rootElement);
      }),
    [editor],
  );

  if (!anchorElem) return null;

  return (
    <DraggableBlockPlugin_EXPERIMENTAL
      anchorElem={anchorElem}
      menuRef={menuRef}
      targetLineRef={targetLineRef}
      menuComponent={<BlockDragHandle ref={menuRef} />}
      targetLineComponent={<BlockDropIndicator ref={targetLineRef} />}
      isOnMenu={isOnMenu}
    />
  );
};
```

#### `helper/isOnMenu.ts`

**Purpose** — The predicate `DraggableBlockPlugin_EXPERIMENTAL` uses to detect whether a hovered/moused-over element is inside the handle's own subtree, so the handle doesn't hide itself while being interacted with.

File content:

```ts
export const isOnMenu = (element: HTMLElement): boolean =>
  element.closest('.block-drag-handle') !== null;
```

**Tests** (`helper/__tests__/isOnMenu.test.ts`) — two named cases, one per path the predicate distinguishes:

- `'returns true when the element is inside the drag handle'` — construct a `div.block-drag-handle` containing a child element, assert `isOnMenu(child)` is `true`.
- `'returns false when the element is outside the drag handle'` — construct an unrelated `div` with no `block-drag-handle` ancestor, assert `isOnMenu(element)` is `false`.

Uses `document.createElement` directly (jsdom), no React rendering, matching the import style already used in this codebase's helper tests (`import { describe, it, expect } from 'vitest';`).

#### `helper/index.ts`

Explicit named export, matching `TableEdgeHint/helper/index.ts`'s barrel convention:

```ts
export { isOnMenu } from './isOnMenu';
```

#### `BlockDragHandle`

**Purpose** — The visual drag handle: a grip icon that Lexical positions next to whichever top-level block is currently hovered.

**Behavior** — No state or logic of its own. Forwards the `ref` it receives (from `BlockDragHandlePlugin`'s `menuRef`) onto its root `<div>`, which is the DOM node Lexical measures and positions via inline `transform`/`opacity`/`display`.

**UI / Visual** — A `GripVerticalIcon` (verified export, `lucide-react`) inside a `div.block-drag-handle`. `cursor: grab` at rest, `cursor: grabbing` while `:active`, icon color `var(--color-primary)` at rest and `var(--color-fg)` on `:hover` (matching this codebase's existing hover-icon convention, e.g. `ClickableIcon`'s `:hover { color: var(--color-fg); }`) — not Lexical's own demo styling, which is unrelated to this codebase's design tokens.

```tsx
import { GripVerticalIcon } from 'lucide-react';
import { FCProps } from '@/types';
import './BlockDragHandle.css';

type Props = {
  ref: React.Ref<HTMLDivElement>;
};

export const BlockDragHandle: FCProps<Props> = ({ ref }) => (
  <div ref={ref} className='block-drag-handle'>
    <GripVerticalIcon />
  </div>
);
```

```css
.block-drag-handle {
  position: absolute;
  left: -10000px;
  top: -10000px;
  z-index: var(--most-front);
  cursor: grab;
  color: var(--color-primary);
  transition: color var(--transition-fast);
}

.block-drag-handle:hover {
  color: var(--color-fg);
}

.block-drag-handle:active {
  cursor: grabbing;
}
```

#### `BlockDropIndicator`

**Purpose** — The horizontal line Lexical shows at the position a dragged block would be dropped.

**Behavior** — No state or logic of its own. Forwards the `ref` it receives (from `BlockDragHandlePlugin`'s `targetLineRef`) onto its root `<div>`, which Lexical measures and positions/sizes via inline `transform`/`width`/`opacity`.

**UI / Visual** — A thin bar, `background-color: var(--color-primary)` (matching `TableEdgeHint`'s `.growing-hint` indicator color), `height: 3px` (no spacing token represents line stroke thickness; `3px` matches `TableEdgeHint`'s own `TABLE_HINT_THICKNESS` for visual consistency between the editor's two drag-affordance indicators — written as a plain value, not `/* one-off */`, since per root CLAUDE.md's Styles rules that annotation is the user's call, not the implementer's; report this raw value to the user at the end of the task per that same rule), `pointer-events: none` so it never intercepts the `dragover` events meant for the underlying content.

```tsx
import { FCProps } from '@/types';
import './BlockDropIndicator.css';

type Props = {
  ref: React.Ref<HTMLDivElement>;
};

export const BlockDropIndicator: FCProps<Props> = ({ ref }) => (
  <div ref={ref} className='block-drop-indicator' />
);
```

```css
.block-drop-indicator {
  position: absolute;
  left: -10000px;
  top: -10000px;
  z-index: var(--most-front);
  height: 3px;
  border-radius: var(--radius-xs);
  background-color: var(--color-primary);
  pointer-events: none;
}
```

#### `components/index.ts`

Both sub-components are flat (no internal `helper/`/`components/` of their own), so each is exported directly — no per-sub-component `index.ts` — matching `TableEdgeHandlePlugin/components/index.ts`'s convention:

```ts
export { BlockDragHandle } from './BlockDragHandle/BlockDragHandle';
export { BlockDropIndicator } from './BlockDropIndicator/BlockDropIndicator';
```

#### `plugins/index.ts`

Add one line (explicit named export, matching every existing entry in this barrel):

```ts
export { BlockDragHandlePlugin } from './BlockDragHandlePlugin/BlockDragHandlePlugin';
```

#### `TextEditor.tsx`

Two changes:

1. Add `BlockDragHandlePlugin` as the first named import in the existing `from './plugins'` import block (`app/src/components/TextEditor/TextEditor.tsx:23-36`).
2. Insert `{!readOnly && <BlockDragHandlePlugin />}` as a new line directly after `{!readOnly && <TableEdgeHandlePlugin />}` (`app/src/components/TextEditor/TextEditor.tsx:166`) and before `{!readOnly && <MentionFormatPlugin />}` — same read-only gating as every other interactive plugin already rendered in this file.

#### `TextEditor.css`

Add `position: relative;` inside the existing `.editor-content` rule (`app/src/components/TextEditor/TextEditor.css:12-16`):

```css
.editor-content {
  position: relative;
  font-size: var(--font-size-base);
  outline: none;
  min-height: 100%;
}
```

### Raw CSS values pending user review

`BlockDropIndicator.css`'s `height: 3px;` has no matching design token (no token represents line stroke thickness). Per root CLAUDE.md's Styles rules, report this file, line, and value to the user at the end of the task — the user decides whether to add a token, mark it `/* one-off */`, or leave it as-is. Do not decide this during implementation.

### Manual verification

`BlockDragHandlePlugin`, `BlockDragHandle`, and `BlockDropIndicator` are React components and carry no unit tests per this codebase's Testing Policy. Their behavior is interaction-only and depends on the browser's native HTML5 drag-and-drop default actions, which no helper or data-layer test exercises:

- `[MANUAL-VERIFY]` Hovering each top-level block type (paragraph, heading, bullet/numbered/check list item, toggle, table) reveals the handle positioned correctly next to that block.
- `[MANUAL-VERIFY]` Dragging the handle and dropping above/below another block reorders the two blocks, and the change persists (reload the screen and confirm the new order survives, exercising the existing `OnChangePlugin` → sync path).
- `[MANUAL-VERIFY]` Dragging a toggle block moves its body (collapsed or expanded) along with it, not left behind.
- `[MANUAL-VERIFY]` The handle does not disappear or flicker while the pointer is over the handle itself, confirming `isOnMenu` behaves correctly against real Lexical-generated hover events, not just the unit-tested DOM predicate in isolation.
- `[MANUAL-VERIFY]` The drop-indicator line tracks the pointer correctly between blocks during an active drag and disappears when the drag ends or is cancelled (e.g. dropped outside the editor).
