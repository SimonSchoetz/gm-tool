# SPEC: Table Layout Persistence & Column Resize

## Before anything else

Read all CLAUDE.md files!

## Purpose

Add column resize interactivity to SortableList and persist layout preferences (column widths, sort state) in the database. Consolidate scattered config (searchable columns, display columns, sort state, column widths) into a single `layout` JSON column on `table_config`.

## Scope

- Column resize drag interaction on `SortingTableHeader`
- Persist column widths (pixel values) and sort state to DB
- New `layout` column on `table_config` absorbing `searchable_columns`
- Future-proof for visible_columns toggle (NOT implemented now)

---

## Database Changes

### New `layout` column on `table_config`

Add a `layout TEXT` column to the `table_config` table. This replaces `searchable_columns` as the source of truth.

**JSON structure:**

```typescript
type TableLayout = {
  searchable_columns: string[];
  column_widths: Record<string, number>; // key → pixels
  sort_state: {
    column: string;
    direction: 'asc' | 'desc';
  } | null;
  visible_columns?: string[] | null; // future use, null = show all
};
```

**Example stored value (npcs):**

```json
{
  "searchable_columns": ["name", "summary", "description"],
  "column_widths": { "image_id": 120, "name": 250, "created_at": 150, "updated_at": 150 },
  "sort_state": { "column": "updated_at", "direction": "desc" }
}
```

### Migration

Follow existing pattern in `database.ts` → `runMigrations()`:
1. Check if `layout` column exists via `pragma_table_info`
2. `ALTER TABLE table_config ADD COLUMN layout TEXT`
3. Migrate each row: read `searchable_columns`, write into `layout` JSON with empty `column_widths` and null `sort_state`

### Seed update

Update `seed.ts` to include `layout` field for new installs.

**Files:**
- `app/db/table-config/schema.ts` — add `layout` column
- `app/db/database.ts` — migration
- `app/db/table-config/seed.ts` — add layout to defaults

---

## Domain Layer

### New files

**`app/src/domain/table-config/types.ts`** — `TableLayout` and `PersistedSortState` types

**`app/src/domain/table-config/parseLayout.ts`** — Parse layout JSON string safely with fallback defaults:
- Missing/null layout → default (empty widths, null sort, empty searchable)
- Invalid JSON → default
- Partial data → merge with defaults

Export from `app/src/domain/table-config/index.ts`.

---

## Hooks

### `useTableLayout` (new)

`app/src/hooks/useTableLayout.ts`

Wraps `useTableConfig()` for layout-specific operations on a given table.

```typescript
const useTableLayout = (tableName: string) => {
  // Returns:
  columnWidths: Record<string, number>;
  sortState: PersistedSortState | null;
  searchableColumns: string[];
  updateColumnWidths: (widths: Record<string, number>) => Promise<void>;
  updateSortState: (column: string, direction: SortDirection) => Promise<void>;
};
```

No new provider/context needed — piggybacks on existing `TableConfigProvider` + TanStack Query invalidation.

### `useColumnResize` (new)

`app/src/hooks/useColumnResize.ts`

Encapsulates the resize drag state machine.

**Behavior:**
- `handleResizeStart(columnKey, startX)` → attaches mousemove/mouseup to document
- During drag: updates local state for responsive visual feedback
- On mouseup: calls `onResizeEnd(finalWidths)` to persist
- Enforces `MIN_COLUMN_WIDTH` (e.g. 60px)
- Sets `cursor: col-resize` and `user-select: none` on body during drag

**Returns:**
- `activeWidths: Record<string, number>` — current widths (live during drag)
- `gridTemplateColumns: string` — CSS value like `"120px 250px 150px 150px"`
- `handleResizeStart: (columnKey: string, startX: number) => void`

**Default widths:** When no persisted widths exist, use `ListColumn.defaultWidth` (new optional field) or fall back to a sensible default (e.g. 150px).

### `useSortable` (modify)

`app/src/hooks/useSortable.ts`

Add optional `onSortChange` callback to config:

```typescript
type UseSortableConfig<T> = {
  defaultSort: SortState<T>;
  columns: SortableColumn<T>[];
  onSortChange?: (state: SortState<T>) => void; // NEW
};
```

`toggleSort` calls `onSortChange` after updating local state. Local state stays instant; DB persistence is async and fire-and-forget.

---

## Component Changes

### `SortableList` (modify)

`app/src/components/SortableList/SortableList.tsx`

**New prop:** `tableName: string`

**Integration:**
1. Call `useTableLayout(tableName)` to get persisted widths, sort state, searchable columns
2. Call `useColumnResize(...)` with persisted widths and column definitions
3. Use persisted sort state as `defaultSort` when available (fall back to `defaultSortColumn` prop)
4. Pass `onSortChange` to `useSortable` for sort persistence
5. Set `--list-col-template` CSS variable via inline `style` on the container
6. Pass `onResizeStart` to `SortingTableHeader`
7. Use layout's `searchableColumns` if no `filterConfig` prop is provided (prop overrides DB for backward compat)

**`ListColumn` type extension:**

```typescript
export type ListColumn<T extends Record<string, unknown>> = {
  key: keyof T & string;
  label: string;
  sortable?: boolean;
  defaultWidth?: number; // NEW: fallback pixel width
  compareFn?: (a: T, b: T) => number;
  render?: (item: T) => ReactNode;
};
```

### `SortingTableHeader` (modify)

`app/src/components/SortableList/SortingTableHeader/SortingTableHeader.tsx`

**New prop:** `onResizeStart: (columnKey: string, startX: number) => void`

**Changes:**
- Attach `onMouseDown` to `.col-resize-drag-btn` that calls `onResizeStart(column.key, e.clientX)`
- Resize handle is shown for ALL columns (independent of `sortable` flag) — resizing and sorting are separate concerns

**CSS change** (`SortingTableHeader.css`):
- Switch from `display: flex` to `display: grid` with `grid-template-columns: var(--list-col-template)` and matching gap so header aligns with rows

### `SortableListItem` (no changes)

Already uses `grid-template-columns: var(--list-col-template)` via `.sortable-list__row`. Column widths flow through CSS variable inheritance.

---

## Consumer Changes

### `NpcsScreen`

`app/src/screens/npcs/NpcsScreen.tsx`

- Add `tableName='npcs'` prop to `SortableList`
- Optionally add `defaultWidth` to column definitions (e.g. 120 for avatar, 250 for name)
- `filterConfig` can remain as-is or be removed once layout's `searchable_columns` is used

### Settings Screen

`app/src/screens/settings/SettingsScreen.tsx`

No changes needed now. Future consideration: add column visibility toggles here or directly in list screens.

---

## Edge Cases

- **No persisted widths:** Fall back to `defaultWidth` per column, then to 150px
- **New column added to screen after widths are persisted:** `column_widths` won't have the key → uses `defaultWidth` fallback gracefully
- **Column removed from screen:** Orphaned key in `column_widths` is harmless, ignored
- **Window narrower than total pixel widths:** Let CSS grid handle overflow; scroll area already wraps content
- **Rapid sort toggles:** Local state is always correct; last DB write wins
- **No persisted sort state (`null`):** Uses `defaultSortColumn` prop as fallback

---

## Future: Visible Columns Toggle

The `visible_columns` field in `TableLayout` is structurally present but unused. When implemented:
- `null` or absent = show all columns
- `string[]` = show only listed column keys
- Could be toggled from a dropdown in the `SortingTableHeader` or from settings
- `SortableList` would filter its `columns` array against `visible_columns` before rendering

---

## Related Components

- Uses: `GlassPanel`, `SearchInput`, `CustomScrollArea`, `ActionContainer`
- Modifies: `SortableList`, `SortingTableHeader`, `useSortable`
- Creates: `useTableLayout`, `useColumnResize`, `parseLayout`, `TableLayout` types
- Extends: `table_config` DB schema, `TableConfigProvider`
