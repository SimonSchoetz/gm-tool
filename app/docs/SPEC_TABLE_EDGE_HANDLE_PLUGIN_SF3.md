# SF3: TextEditor Registration

Registers `TableEdgeHandlePlugin` and sets `hasCellMerge={false}` on `TablePlugin`.

## Files Affected

Modified:
- `app/src/components/TextEditor/plugins/index.ts`
- `app/src/components/TextEditor/TextEditor.tsx`

## Frontend

### `plugins/index.ts`

Add one explicit named export alongside the existing five:

```ts
export { TableEdgeHandlePlugin } from './TableEdgeHandlePlugin/TableEdgeHandlePlugin';
```

Import path `'./TableEdgeHandlePlugin/TableEdgeHandlePlugin'` resolves to `plugins/TableEdgeHandlePlugin/TableEdgeHandlePlugin.tsx` (SF2). No barrel exists at `TableEdgeHandlePlugin/index.ts` — use the explicit file form.

### `TextEditor.tsx`

**Change 1 — `hasCellMerge={false}` on `TablePlugin`:**

Locate the existing `<TablePlugin />` (currently line 122 — verify position before editing). Replace with:

```tsx
{/* hasCellMerge disabled — insert/delete/move operations assume a regular cell grid */}
<TablePlugin hasCellMerge={false} />
```

The inline comment is required: setting `hasCellMerge={false}` overrides the library default (`true`). A future developer must not remove it without understanding the dependency.

**Change 2 — import `TableEdgeHandlePlugin`:**

Add `TableEdgeHandlePlugin` to the existing named import from `'./plugins'`:

```ts
import {
  MentionTypeaheadPlugin,
  CheckboxReadOnlyPlugin,
  EmbeddedLinkPlugin,
  EmptyNodeHintPlugin,
  SlashCommandPlugin,
  TableEdgeHandlePlugin,      // add
} from './plugins';
```

**Change 3 — register `TableEdgeHandlePlugin`:**

Add `{!readOnly && <TableEdgeHandlePlugin />}` immediately after `{!readOnly && <SlashCommandPlugin />}`:

```tsx
{!readOnly && <SlashCommandPlugin />}
{!readOnly && <TableEdgeHandlePlugin />}   // add
```

Placement after `SlashCommandPlugin` ensures the plugin registers after the slash command plugin, which is consistent with plugin ordering by feature dependency (SlashCommand introduces tables; EdgeHandle edits them).
