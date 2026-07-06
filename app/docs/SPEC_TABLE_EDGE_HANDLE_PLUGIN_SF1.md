# SF1: TableHandleMenu

Creates the popup content component. This component has no Lexical dependency — it renders buttons and a divider, receiving all operation callbacks as props from the plugin.

## Files Affected

New:
- `app/src/components/TextEditor/plugins/TableEdgeHandlePlugin/components/TableHandleMenu/TableHandleMenu.tsx`
- `app/src/components/TextEditor/plugins/TableEdgeHandlePlugin/components/TableHandleMenu/TableHandleMenu.css`
- `app/src/components/TextEditor/plugins/TableEdgeHandlePlugin/components/index.ts`

## Frontend

### Purpose

`TableHandleMenu` is the visual content rendered inside `EditorPopup` when the user clicks a table edge handle. It renders two sections separated by a horizontal divider: a header-toggle action in the first section, and insert-before / insert-after / delete actions in the second. It accepts `type: 'row' | 'column'` to choose which labels and icons to show. The component owns no state and no side effects.

### Behavior

All actions are callback props. On button click, the component calls the corresponding callback — it does not know what the callback does. `isHeader` controls the active state of the toggle button only.

### UI / Visual

**Props type:**

```ts
type Props = {
  type: 'row' | 'column';
  isHeader: boolean;
  onToggleHeader: () => void;
  onInsertBefore: () => void;
  onInsertAfter: () => void;
  onDelete: () => void;
};
```

Component is typed `FCProps<Props>`.

**Layout:**

```
[Table2Icon]  Toggle header row / Toggle header column   ← active class when isHeader
─────────────────────────────────────────────────────── ← .table-handle-menu-divider
[ArrowUpFromLineIcon / ArrowLeftFromLineIcon]    Insert above / Insert left
[ArrowDownFromLineIcon / ArrowRightFromLineIcon] Insert below / Insert right
[Trash2Icon]                                    Delete row / Delete column
```

Each button is a `<button type="button">` with an icon (24×24, `lucide-react`) and a label. The root element is `<div className="table-handle-menu">`. Each button uses class `table-handle-menu-item`. The toggle button adds `table-handle-menu-item--active` when `isHeader` is `true`.

**Labels by type:**

| `type` | Toggle | Insert before | Insert after | Delete |
|---|---|---|---|---|
| `'row'` | "Toggle header row" | "Insert above" | "Insert below" | "Delete row" |
| `'column'` | "Toggle header column" | "Insert left" | "Insert right" | "Delete column" |

**Icons by type:**

| `type` | Toggle | Insert before | Insert after | Delete |
|---|---|---|---|---|
| `'row'` | `Table2Icon` | `ArrowUpFromLineIcon` | `ArrowDownFromLineIcon` | `Trash2Icon` |
| `'column'` | `Table2Icon` | `ArrowLeftFromLineIcon` | `ArrowRightFromLineIcon` | `Trash2Icon` |

All icons imported from `lucide-react` with the `*Icon` suffix: `import { Table2 as Table2Icon, ArrowUpFromLine as ArrowUpFromLineIcon, ArrowDownFromLine as ArrowDownFromLineIcon, ArrowLeftFromLine as ArrowLeftFromLineIcon, ArrowRightFromLine as ArrowRightFromLineIcon, Trash2 as Trash2Icon } from 'lucide-react'`.

**Divider:**

A `<div className="table-handle-menu-divider">` between the toggle section and the action section. This is defined locally in `TableHandleMenu.css` — do not import the `Divider` component from `FloatingToolbar/components/TextFormattingRow/components/Divider`; that component is internal to `TextFormattingRow` and its barrel is not accessible from this module.

**CSS:**

File: `TableHandleMenu.css`. All values must use design tokens from `styles/variables/`. BEM-ish flat naming:

- `.table-handle-menu` — root container, column flex layout, `min-width` to fit the longest label
- `.table-handle-menu-item` — row flex, align-center, gap between icon and label, cursor pointer, hover state via background token
- `.table-handle-menu-item--active` — visual indicator for active toggle (e.g. background or text color token)
- `.table-handle-menu-divider` — thin horizontal rule between sections (1px height, border or background token for color)

Raw pixel values that have no matching token must be marked `/* one-off */`.

**`components/index.ts`:**

```ts
export { TableHandleMenu } from './TableHandleMenu/TableHandleMenu';
```

Explicit named export. `TableHandleMenu` is a flat sub-component (no `helper/` or `components/` of its own), so no sub-directory barrel is needed — the export references the source file directly.
