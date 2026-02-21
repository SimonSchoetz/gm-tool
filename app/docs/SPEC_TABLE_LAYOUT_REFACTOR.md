# SPEC: Refactor Table Layout Persistence

## Progress Tracker

- [x] Sub-feature 1: DB Cleanup — Remove unrequested columns, add `create` with nanoid
- [x] Sub-feature 2: Layout Validation — Validate `layout` JSON at DB boundary using Zod schema
- [x] Sub-feature 3: Remove `useTableLayout` — Move layout update helpers into `TableConfigProvider`
- [x] Sub-feature 4: Resize Ownership — Move resize state and persistence into `SortingTableHeader`

---

## Sub-feature 1: DB Cleanup

Remove unrequested/redundant columns from the schema and seed. Add a proper `create` function with nanoid so seeds follow the same convention as all other tables.

### DB

**`app/db/table-config/schema.ts`**
- Remove `display_name` column
- Remove `searchable_columns` column

**`app/db/table-config/create.ts`** _(new)_
- `create(data: CreateTableConfigInput): Promise<void>`
- Generate ID with nanoid
- Validate input against `tableConfigTable.insertSchema`
- INSERT only required fields

**`app/db/table-config/types.ts`**
- Add `CreateTableConfigInput` derived from `tableConfigTable.insertSchema`

**`app/db/table-config/index.ts`**
- Export `create`

**`app/db/table-config/seed.ts`**
- Replace raw SQL INSERT with calls to `create()`
- Remove `id`, `display_name`, `searchable_columns` from seed data objects

**`app/db/database.ts`**
- Add migration: drop `display_name` column from `table_config` if it exists
- Add migration: drop `searchable_columns` column from `table_config` if it exists
- (Use `ALTER TABLE ... DROP COLUMN` — supported in SQLite ≥ 3.35.0)

---

## Sub-feature 2: Layout Validation

The `layout` column stores a JSON-serialised `TableLayout`. Validate it against a named Zod schema before writing to the DB, and use `safeParse` when reading.

### Domain

**`app/src/domain/table-config/tableLayoutSchema.ts`** _(new)_
- Define `layoutColumnSchema` (Zod) with fields: `key`, `label`, `sortable?`, `resizable?`, `width`
- Define `tableLayoutSchema` (Zod) with fields: `searchable_columns`, `columns`, `sort_state`
- Export `TableLayout` and `LayoutColumn` types derived from schemas

**`app/src/domain/table-config/types.ts`**
- Remove manually-written `TableLayout` and `LayoutColumn` — import derived types from `tableLayoutSchema.ts` instead

**`app/src/domain/table-config/parseLayout.ts`**
- Replace manual field-by-field reconstruction with `tableLayoutSchema.safeParse(parsed)`
- On parse failure return `DEFAULT_LAYOUT`

**`app/src/domain/table-config/index.ts`**
- Export `tableLayoutSchema`

### DB

**`app/db/table-config/update.ts`**
- If `data.layout` is provided, parse JSON and validate against `tableLayoutSchema` before executing UPDATE; throw on failure

**`app/db/table-config/create.ts`** (from sub-feature 1)
- Same validation for `layout` field on create

---

## Sub-feature 3: Remove `useTableLayout`

`useTableLayout` is a thin, too-granular wrapper. Move its layout update helpers directly into `TableConfigProvider` and read layout in `SortableList` via `getConfigForTable` + `parseLayout`.

### Provider / Hooks

**`app/src/providers/table-config/TableConfigProvider.tsx`**
- Add `updateColumnWidths(tableName: string, widths: Record<string, number>): Promise<void>` to context
- Add `updateSortState(tableName: string, column: string, direction: SortDirection): Promise<void>` to context
- Both helpers: get config via `getConfigForTable`, parse layout, merge changes, call `updateMutation.mutateAsync` with stringified updated layout

**`app/src/providers/table-config/useTableConfig.ts`**
- Expose `updateColumnWidths` and `updateSortState` in context type

**`app/src/hooks/useTableLayout.ts`** _(delete)_

**`app/src/hooks/index.ts`**
- Remove `useTableLayout` export

### Frontend

**`app/src/components/SortableList/SortableList.tsx`**
- Replace `useTableLayout(tableName)` with:
  - `const { getConfigForTable, updateSortState } = useTableConfig()`
  - `const config = getConfigForTable(tableName)`
  - `const layout = useMemo(() => parseLayout(config?.layout), [config?.layout])`
- Pass `updateSortState` directly to sort config's `onSortChange`
- Remove `updateColumnWidths` from this component (handled by header in sub-feature 4)

---

## Sub-feature 4: Resize Ownership

`SortingTableHeader` should own resize state and call the provider directly to persist widths. `SortableList` passes `tableName` to the header — no resize callbacks.

### Provider / Hooks

No changes — `useTableConfig().updateColumnWidths` (added in sub-feature 3) is used by `SortingTableHeader`.

### Frontend

**`app/src/components/SortableList/SortingTableHeader/SortingTableHeader.tsx`**
- Accept `tableName: string` prop (replaces `onResizeStart` callback)
- Accept `columns` with `width` included so resize state can be initialised
- Use `useColumnResize` internally (moved from `SortableList`)
- Call `useTableConfig()` internally for `updateColumnWidths`
- Set `--list-col-template` CSS variable on the header's root element via `style` prop so it cascades to `SortableListItem` rows through the shared ancestor

Updated props type:
```ts
type SortingTableHeaderProps<T> = {
  tableName: string;          // NEW
  columns: ColumnConfig<T>[]; // must include width + resizable
  sortState: SortState<T>;
  onSort: (column: keyof T & string) => void;
  // onResizeStart — REMOVED
  className?: string;
};
```

**`app/src/components/SortableList/SortableList.tsx`**
- Remove `useColumnResize` import and usage
- Remove `resizeColumns`, `persistedWidths`, `gridTemplateColumns`, `handleResizeStart`
- Remove `listStyle` / `--list-col-template` from the wrapper element
- Pass `tableName` and full `columns` (including `width`) to `<SortingTableHeader>`
- Remove `onResizeStart` prop from `<SortingTableHeader>` usage

**`app/src/hooks/index.ts`**
- Remove `useColumnResize` from public exports (it is now internal to `SortingTableHeader`)

**`app/src/components/SortableList/SortableList.css`**
- No change — `.sortable-list__row` still reads `var(--list-col-template)`, which now cascades from the header element
