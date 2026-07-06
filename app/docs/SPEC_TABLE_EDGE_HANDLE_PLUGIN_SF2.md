# SF2: TableEdgeHandlePlugin

The main plugin. Owns all state, registers DOM event listeners on the editor root element, renders hint elements via portal, and calls all Lexical operations. Imports `TableHandleMenu` from SF1.

## Files Affected

New:
- `app/src/components/TextEditor/plugins/TableEdgeHandlePlugin/TableEdgeHandlePlugin.tsx`
- `app/src/components/TextEditor/plugins/TableEdgeHandlePlugin/TableEdgeHandlePlugin.css`

## Frontend

### Purpose

`TableEdgeHandlePlugin` detects when the mouse is over an outer-edge cell of a Lexical table, renders small hint pills on those edges, expands them on hover, and opens an `EditorPopup` containing `TableHandleMenu` on click. It performs all insert, delete, and header-toggle operations by calling `@lexical/table` utilities inside `editor.update()`.

### State

**State variables (`useState`):**

```ts
type HintState = {
  cellX: number;
  cellY: number;
  tableElement: HTMLTableElement;
  showTop: boolean;
  showBottom: boolean;
  showLeft: boolean;
  showRight: boolean;
  cellRect: DOMRect;
} | null;

type PopupState = {
  type: 'row' | 'column';
  cellX: number;
  cellY: number;
  tableElement: HTMLTableElement;
  isHeader: boolean;
  hintElement: HTMLDivElement;
} | null;
```

- `hintState: HintState` — which cell's edges have visible hints and the cell's current DOMRect
- `activeHint: 'top' | 'bottom' | 'left' | 'right' | null` — which hint the mouse is currently hovering
- `popupState: PopupState` — open popup context; `null` when popup is closed

**Refs (`useRef`):**

- `hideTimerRef: ReturnType<typeof setTimeout> | null` — pending hide timer
- `isPopupOpenRef: boolean` — mirrors `popupState !== null`; kept current via a `useEffect` so event handlers can read it without stale closure; initial value `false`
- `topHintRef`, `bottomHintRef`, `leftHintRef`, `rightHintRef` — `HTMLDivElement | null` — DOM refs for each rendered hint element

### Behavior

#### Effect: sync `isPopupOpenRef`

```ts
useEffect(() => {
  isPopupOpenRef.current = popupState !== null;
}, [popupState]);
```

#### Helpers: `scheduleHide` / `cancelHide`

Both are stable `useCallback` functions with no dependencies (they use only refs and state setters, both of which are stable across renders):

```ts
const scheduleHide = useCallback(() => {
  if (hideTimerRef.current !== null) clearTimeout(hideTimerRef.current);
  hideTimerRef.current = setTimeout(() => {
    setHintState(null);
    setActiveHint(null);
    hideTimerRef.current = null;
  }, 150);
}, []);

const cancelHide = useCallback(() => {
  if (hideTimerRef.current !== null) {
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = null;
  }
}, []);
```

#### Effect: register `mousemove` / `mouseleave` on editor root

```ts
useEffect(() => {
  const rootElement = editor.getRootElement();
  if (!rootElement) return;

  const handleMouseMove = (event: MouseEvent) => {
    const cell = getDOMCellFromTarget(event.target as Node);
    if (!cell) {
      if (!isPopupOpenRef.current) scheduleHide();
      return;
    }
    const tableEl = cell.elem.closest('table') as HTMLTableElement | null;
    if (!tableEl) return;
    const observer = getTableObserverFromTableElement(tableEl);
    if (!observer) return;
    const table = observer.getTable();

    cancelHide();

    const isTop = cell.y === 0;
    const isBottom = cell.y === table.rows - 1;
    const isLeft = cell.x === 0;
    const isRight = cell.x === table.columns - 1;

    if (!isTop && !isBottom && !isLeft && !isRight) {
      if (!isPopupOpenRef.current) scheduleHide();
      return;
    }

    setHintState({
      cellX: cell.x,
      cellY: cell.y,
      tableElement: tableEl,
      showTop: isTop,
      showBottom: isBottom,
      showLeft: isLeft,
      showRight: isRight,
      cellRect: cell.elem.getBoundingClientRect(),
    });
  };

  const handleMouseLeave = () => {
    if (!isPopupOpenRef.current) scheduleHide();
  };

  rootElement.addEventListener('mousemove', handleMouseMove);
  rootElement.addEventListener('mouseleave', handleMouseLeave);

  return () => {
    rootElement.removeEventListener('mousemove', handleMouseMove);
    rootElement.removeEventListener('mouseleave', handleMouseLeave);
    if (hideTimerRef.current !== null) clearTimeout(hideTimerRef.current);
  };
}, [editor, scheduleHide, cancelHide]);
```

#### Effect: row/column highlight

```ts
useEffect(() => {
  if (!hintState || !activeHint) return;
  const { tableElement, cellX, cellY } = hintState;
  const observer = getTableObserverFromTableElement(tableElement);
  if (!observer) return;
  const table = observer.getTable();

  const cellElements: HTMLElement[] = [];
  if (activeHint === 'top' || activeHint === 'bottom') {
    table.domRows[cellY]?.forEach(cell => {
      if (cell?.elem) cellElements.push(cell.elem);
    });
  } else {
    table.domRows.forEach(row => {
      const cell = row?.[cellX];
      if (cell?.elem) cellElements.push(cell.elem);
    });
  }

  cellElements.forEach(el => el.classList.add('table-cell--handle-hover'));
  return () => {
    cellElements.forEach(el => el.classList.remove('table-cell--handle-hover'));
  };
}, [activeHint, hintState]);
```

#### `openPopup`

Called on hint `onClick`. Reads `isHeader` synchronously via `editor.read()`, then sets `popupState`. The hint ref passed as argument is the ref for the clicked hint (whichever of `topHintRef` / `bottomHintRef` / `leftHintRef` / `rightHintRef` was clicked).

```ts
const openPopup = (
  type: 'row' | 'column',
  hintRef: React.RefObject<HTMLDivElement | null>,
) => {
  if (!hintState || !hintRef.current) return;
  const { cellX, cellY, tableElement } = hintState;

  let isHeader = false;
  editor.read(() => {
    const observer = getTableObserverFromTableElement(tableElement);
    if (!observer) return;
    const { tableNode } = observer.$lookup();
    const table = observer.getTable();
    if (type === 'row') {
      isHeader = Array.from({ length: table.columns }, (_, x) => {
        const node = tableNode.getCellNodeFromCords(x, cellY, table);
        return node?.hasHeaderState(TableCellHeaderStates.ROW) ?? false;
      }).every(Boolean);
    } else {
      isHeader = Array.from({ length: table.rows }, (_, y) => {
        const node = tableNode.getCellNodeFromCords(cellX, y, table);
        return node?.hasHeaderState(TableCellHeaderStates.COLUMN) ?? false;
      }).every(Boolean);
    }
  });

  setPopupState({
    type,
    cellX,
    cellY,
    tableElement,
    isHeader,
    hintElement: hintRef.current,
  });
};
```

`editor.read()` is synchronous — `isHeader` is guaranteed to be set before `setPopupState` is called.

#### Hint element event handlers

Each hint `<div>` has:
- `onMouseDown={e => e.stopPropagation()}` — prevents `EditorPopup`'s document-level `mousedown` listener from treating the hint as an outside click (see KAD: `onMouseDown stopPropagation`)
- `onMouseEnter` — cancel pending hide timer, set `activeHint` to this hint's position
- `onMouseLeave` — if `!isPopupOpenRef.current`, `scheduleHide()`
- `onClick` — call `openPopup(type, hintRef)` where `type` is `'row'` for top/bottom hints, `'column'` for left/right hints

#### Operations (all called from `TableHandleMenu` callback props)

All operations require `popupState !== null`. Each operation is a stable `useCallback` with `[editor, popupState]` as dependencies.

**Shared inner pattern** (used by insert and delete operations):

```ts
// inside editor.update():
const observer = getTableObserverFromTableElement(tableElement);
if (!observer) return;
const { tableNode } = observer.$lookup();
const table = observer.getTable();
const cellNode = tableNode.getCellNodeFromCords(cellX, cellY, table);
if (!cellNode) return;
cellNode.selectStart();
// then call the $-function
```

After `editor.update()`: call `setPopupState(null)`.

**Insert row above:**
```ts
editor.update(() => {
  /* shared inner pattern */
  $insertTableRowAtSelection(false);
});
setPopupState(null);
```

**Insert row below:** same with `$insertTableRowAtSelection(true)`.

**Delete row:**
```ts
editor.update(() => {
  /* shared inner pattern */
  $deleteTableRowAtSelection();
});
setPopupState(null);
```

**Insert column left:** same pattern, `$insertTableColumnAtSelection(false)`.

**Insert column right:** same pattern, `$insertTableColumnAtSelection(true)`.

**Delete column:** same pattern, `$deleteTableColumnAtSelection()`.

**Toggle header row:**
```ts
editor.update(() => {
  const observer = getTableObserverFromTableElement(popupState.tableElement);
  if (!observer) return;
  const { tableNode } = observer.$lookup();
  const table = observer.getTable();
  const targetState = popupState.isHeader
    ? TableCellHeaderStates.NO_STATUS
    : TableCellHeaderStates.ROW;
  for (let x = 0; x < table.columns; x++) {
    tableNode
      .getCellNodeFromCords(x, popupState.cellY, table)
      ?.setHeaderStyles(targetState, TableCellHeaderStates.ROW);
  }
});
setPopupState(prev => (prev ? { ...prev, isHeader: !prev.isHeader } : null));
// popup does NOT close
```

**Toggle header column:**
```ts
editor.update(() => {
  /* same pattern, iterate rows, mask = TableCellHeaderStates.COLUMN */
  const targetState = popupState.isHeader
    ? TableCellHeaderStates.NO_STATUS
    : TableCellHeaderStates.COLUMN;
  for (let y = 0; y < table.rows; y++) {
    tableNode
      .getCellNodeFromCords(popupState.cellX, y, table)
      ?.setHeaderStyles(targetState, TableCellHeaderStates.COLUMN);
  }
});
setPopupState(prev => (prev ? { ...prev, isHeader: !prev.isHeader } : null));
```

#### Popup rendering

When `popupState !== null`:

```tsx
<EditorPopup
  getAnchorRect={() => popupState.hintElement.getBoundingClientRect()}
  onClickOutside={() => setPopupState(null)}
>
  <GlassPanel>
    <TableHandleMenu
      type={popupState.type}
      isHeader={popupState.isHeader}
      onToggleHeader={popupState.type === 'row' ? handleToggleHeaderRow : handleToggleHeaderColumn}
      onInsertBefore={popupState.type === 'row' ? handleInsertRowAbove : handleInsertColumnLeft}
      onInsertAfter={popupState.type === 'row' ? handleInsertRowBelow : handleInsertColumnRight}
      onDelete={popupState.type === 'row' ? handleDeleteRow : handleDeleteColumn}
    />
  </GlassPanel>
</EditorPopup>
```

The popup is rendered inline in the component's JSX (not in a portal call inside the plugin body) — `EditorPopup` itself uses `createPortal` internally. The hint elements are rendered via `createPortal(hintMarkup, document.body)` directly in the plugin's JSX.

### Hint Rendering

All four hint elements are always rendered in the portal (not conditionally per hint), controlled by `hintState !== null`. Individual hints are conditionally visible via their own condition: `hintState?.showTop`, `hintState?.showBottom`, etc. If `hintState` is `null`, no hints are rendered.

Hint position is `position: fixed` with coordinates derived from `hintState.cellRect`:

| Hint | `left` | `top` |
|---|---|---|
| top | `cellRect.left + cellRect.width / 2 - 5` | `cellRect.top - 1` |
| bottom | `cellRect.left + cellRect.width / 2 - 5` | `cellRect.bottom - 1` |
| left | `cellRect.left - 1` | `cellRect.top + cellRect.height / 2 - 5` |
| right | `cellRect.right - 1` | `cellRect.top + cellRect.height / 2 - 5` |

The `-5` offset centers the 10px-wide/tall hint on the midpoint. The `-1` straddles the cell border.

Apply position as inline `style` — these are JS-computed layout values, not DB-sourced, so use the `--table-edge-handle-plugin-*` CSS custom property prefix pattern only if the value is shared between CSS rules. Otherwise use direct inline style (permitted for computed layout positions).

### CSS

File: `TableEdgeHandlePlugin.css`. Import in `TableEdgeHandlePlugin.tsx`.

**Hint element classes:**

- `.table-edge-hint` — base for all hints; `position: fixed; z-index: var(--most-front); border-radius: var(--radius-sm); background: <color token>; cursor: grab; transition: width var(--transition-fast), height var(--transition-fast)`
- `.table-edge-hint--horizontal` — `width: 10px; height: 2px`
- `.table-edge-hint--vertical` — `width: 2px; height: 10px`
- `.table-edge-hint--active.table-edge-hint--horizontal` — `height: 8px` (expanded state)
- `.table-edge-hint--active.table-edge-hint--vertical` — `width: 8px`

The `activeHint` state drives the `--active` modifier. The hint with position matching `activeHint` (e.g., `activeHint === 'top'` → top hint gets `--active`) gets the expanded class.

**Highlight class** applied to table cell DOM elements via `classList`:

`.table-cell--handle-hover` — applied to the `.editor-table-cell` elements (class set by the Lexical theme in `TextEditor.tsx`). Style this in `TableEdgeHandlePlugin.css` using the attribute selector form or direct class: background-color token for hover state.

Raw pixel values without a matching design token must be marked `/* one-off */`.

### Imports

```ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  getDOMCellFromTarget,
  getTableObserverFromTableElement,
  TableCellHeaderStates,
  $insertTableRowAtSelection,
  $insertTableColumnAtSelection,
  $deleteTableRowAtSelection,
  $deleteTableColumnAtSelection,
} from '@lexical/table';
import { EditorPopup } from '../../components/EditorPopup';
import { GlassPanel } from '../../../GlassPanel/GlassPanel';
import { TableHandleMenu } from './components';
import './TableEdgeHandlePlugin.css';
```

Import path verification:
- `../../components/EditorPopup` — from `plugins/TableEdgeHandlePlugin/`, up 2 levels to `TextEditor/`, then into `components/EditorPopup/` (module directory with `index.ts`). ✓
- `../../../GlassPanel/GlassPanel` — up 3 levels to `src/components/`, then `GlassPanel/GlassPanel.tsx` (no barrel). ✓ Cannot use `@/components` — circular import rule applies inside `src/components/`.
- `./components` — resolves to `TableEdgeHandlePlugin/components/index.ts` (SF1). ✓

### Component signature

The plugin accepts no props. Zero-props exception applies:

```ts
export const TableEdgeHandlePlugin = () => {
  // ...
};
```

No `FCProps<Props>` — do not write `type Props = object`.
