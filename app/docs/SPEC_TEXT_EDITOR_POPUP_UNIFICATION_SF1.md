# SF1 — `getSelectionLinkUrl` helper

Extracts the Lexical link-URL reader into `FloatingToolBar/helper/`, satisfying the CLAUDE.md rule that functions supporting a component must live in `ComponentName/helper/`. Consumed by `FloatingToolbar` in SF4.

## Files Affected

**New:**
- `src/components/TextEditor/components/FloatingToolBar/helper/getSelectionLinkUrl.ts`
- `src/components/TextEditor/components/FloatingToolBar/helper/index.ts`
- `src/components/TextEditor/components/FloatingToolBar/helper/__tests__/getSelectionLinkUrl.test.ts`

## Frontend

### Purpose

`getSelectionLinkUrl` reads the Lexical editor state to determine whether the current selection contains a link, and returns its URL or `null`. It is used by `FloatingToolbar.updateToolbarVisibility` (SF4) to initialise link-row state when the toolbar opens.

### Behaviour

The function MUST be called inside a Lexical read context (`editor.getEditorState().read(getSelectionLinkUrl)`). It calls `$getSelection()`, confirms the result is a `RangeSelection`, iterates `selection.getNodes()`, and for each node checks (in order):

1. If the node itself is a `LinkNode` (`$isLinkNode(node)` is true) → return `node.getURL()`
2. Store `const parent = node.getParent()`. If `$isLinkNode(parent)` is true → return `parent.getURL()`

Returns `null` when no link node is found in the traversal, or when the selection is not a `RangeSelection`.

### `getSelectionLinkUrl.ts`

```typescript
import { $getSelection, $isRangeSelection } from 'lexical';
import { $isLinkNode } from '@lexical/link';

export const getSelectionLinkUrl = (): string | null => {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) return null;
  const nodes = selection.getNodes();
  for (const node of nodes) {
    if ($isLinkNode(node)) return node.getURL();
    const parent = node.getParent();
    if ($isLinkNode(parent)) return parent.getURL();
  }
  return null;
};
```

`$isLinkNode` accepts `LexicalNode | null | undefined` [verified: `app/node_modules/@lexical/link/LexicalLinkNode.d.ts:78`], so `node.getParent()` (which returns `ElementNode | null` [verified: `app/node_modules/lexical/LexicalNode.d.ts:346`]) can be passed directly. `LinkNode.getURL()` returns `string` [verified: `app/node_modules/@lexical/link/LexicalLinkNode.d.ts:43`].

### `helper/index.ts`

Grouping barrel — explicit named exports:

```typescript
export { getSelectionLinkUrl } from './getSelectionLinkUrl';
```

### `helper/__tests__/getSelectionLinkUrl.test.ts`

Required by testing policy (helper with branching logic and derived data). Four named tests — one per code path.

The test file creates a Lexical editor instance with `LinkNode` registered (`createEditor({ nodes: [LinkNode] })`) for each test. State is set up via `editor.update(...)` and the function is invoked via `editor.getEditorState().read(getSelectionLinkUrl)`.

**Test 1 — "non-range selection returns null":**
Set editor state with no selection (or a NodeSelection). Assert result is `null`.

**Test 2 — "range selection with no link nodes returns null":**
Set a range selection spanning plain text nodes with no `LinkNode` in the selection or as their parents. Assert result is `null`.

**Test 3 — "range selection with a direct LinkNode returns its URL":**
Set a range selection where one of the selected nodes is a `LinkNode` (created via `$createLinkNode('https://example.com')`). Assert result is `'https://example.com'`.

**Test 4 — "range selection where a node's parent is a LinkNode returns the parent URL":**
Set a range selection where the selected node is a text node whose parent is a `LinkNode` (i.e., text inside a link). Assert result is the parent link's URL.
