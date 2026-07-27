# Fix Cycle 1 — Toggle Block Review Findings

This spec addresses two code-reviewer findings on branch `feat/toggle-block`, ruled in-scope by the architect. It is a review-fix spec, not a durable planning document — delete after implementation, same as any other spec per `app/docs/CLAUDE.md`.

## Progress tracker

- Sub-feature 1: Extract `resolveTopLevelBlock` — deduplicate the nine identical root-special-case block-resolution expressions into one cross-plugin helper
- Sub-feature 2: Extract `collectContentNodes` — move `ToggleHeaderGuardPlugin`'s inline recursive helper into its own `helper/` file with tests, matching its sibling plugin's pattern

## Key Architectural Decisions

### `resolveTopLevelBlock` is promoted to `TextEditor/helper/`, not a plugin-local `helper/`

The expression `anchorNode.getKey() === 'root' ? anchorNode : anchorNode.getTopLevelElementOrThrow()` is duplicated across nine call sites spanning unrelated modules under `TextEditor/`: two keyboard-command handlers, a selection-resolution helper, a slash-command option, two button components, two plugins, and a menu-render callback. These are not siblings under one shared parent module, so the "sibling components within the same parent module → promote to the parent module's `helper/`" step of `app/src/CLAUDE.md`'s Util vs. Helper Placement rule does not apply directly — but its next tier does: `TextEditor/helper/` is the established cross-plugin promotion tier for this exact situation, already holding `parseSafeEditorState` and `getSelectionRangeRect`, both consumed by multiple unrelated plugins/components across the same tree. `resolveTopLevelBlock` is domain-coupled to Lexical node traversal (not generic enough for `/src/util/`), so `TextEditor/helper/` — not `/src/util/` — is correct.

### `resolveTopLevelBlock`'s return type is `LexicalNode | ElementNode | DecoratorNode<unknown>`, not `ElementNode | DecoratorNode<unknown>` alone

`LexicalNode.getTopLevelElementOrThrow()` is declared `(): ElementNode | DecoratorNode<unknown>` — it never returns the receiver's own type [S_1: `app/node_modules/lexical/dist/LexicalNode.d.ts:637`]. The root-case branch returns the input `node` unchanged, typed `LexicalNode` (the parameter type), and TypeScript does not collapse a ternary's inferred union based on subtype relationships between branches. The true type of the expression — and therefore of `resolveTopLevelBlock`'s return — is the three-member union `LexicalNode | ElementNode | DecoratorNode<unknown>`. `ElementNode` and `DecoratorNode` are both exported from the `lexical` package root [S_1: `app/node_modules/lexical/dist/index.d.ts:21,32,34`]. This does not create new type errors at any of the nine call sites: every method the call sites invoke on the resolved value (`getParent`, `getTextContent`, `getTextContentSize`, `getKey`, `is`, `replace`, `selectStart`, `selectEnd`) is declared directly on the base `LexicalNode` class [S_1: `app/node_modules/lexical/dist/LexicalNode.d.ts:599,607,713,763,768,888,917-918`], so it is callable on all three union members without narrowing; call sites that need a narrower type (`$isListNode`, `$isHeadingNode`, `$isToggleNode`) already narrow via a type guard before calling a member specific to that narrower type.

### Both extracted `helper/` directories get an explicit-named-export `index.ts` barrel

`app/src/CLAUDE.md`'s Barrel Files section names `ComponentName/helper/` explicitly as a grouping-folder category requiring an `index.ts` barrel with explicit named exports, "regardless of depth" or file count — the same rule already correctly followed by `LinkRow/helper/index.ts` (`export { getSelectionLinkUrl } from './getSelectionLinkUrl';`). `ToggleKeyboardPlugin/helper/` currently has no barrel and is imported by direct file path (`./helper/resolveHeaderToggleForRemoval`) — this is a pre-existing violation of that rule. Since SF1 touches files inside `ToggleKeyboardPlugin/helper/` (adding an import to `resolveHeaderToggleForRemoval.ts`) and `ToggleKeyboardPlugin.ts` (its external consumer), this spec corrects it in the same pass per root CLAUDE.md's "fix violations in files you touch," rather than perpetuating it. `ToggleHeaderGuardPlugin/helper/` is created compliant from the start, mirroring `LinkRow/helper/index.ts`'s pattern. Both plugin **root** directories (`ToggleKeyboardPlugin/`, `ToggleHeaderGuardPlugin/`) still get no barrel — that is a separate, correct instruction about the plugin module itself, unaffected by this decision.

## Sub-feature 1: Extract `resolveTopLevelBlock`

Deduplicates the nine occurrences of the root-special-case block-resolution expression into one function in `TextEditor/helper/`, consumed by every call site in this same sub-feature. Commit this sub-feature as its own commit — it touches files outside `feat/toggle-block`'s original branch scope (pre-existing plugins/components), per the architect's fix brief.

**Files affected**

Modified:

- `app/src/components/TextEditor/helper/index.ts` — add the new export
- `app/src/components/TextEditor/plugins/ToggleKeyboardPlugin/ToggleKeyboardPlugin.ts` — both call sites; import switches to the local helper barrel and adds the cross-plugin helper import
- `app/src/components/TextEditor/plugins/ToggleKeyboardPlugin/helper/resolveHeaderToggleForRemoval.ts` — one call site; add import
- `app/src/components/TextEditor/plugins/SlashCommandPlugin/slashCommandOptions.ts` — one call site; add import
- `app/src/components/TextEditor/components/FloatingToolbar/components/TextFormattingRow/components/ListBtn/ListBtn.tsx` — two call sites; add import
- `app/src/components/TextEditor/plugins/EmptyNodeHintPlugin/EmptyNodeHintPlugin.tsx` — one call site; add import
- `app/src/components/TextEditor/plugins/SlashCommandPlugin/SlashCommandPlugin.tsx` — one call site; extend existing helper import line
- `app/src/components/TextEditor/components/FloatingToolbar/components/TextFormattingRow/components/HeadingBtn/HeadingBtn.tsx` — one call site; add import

New:

- `app/src/components/TextEditor/helper/resolveTopLevelBlock.ts`
- `app/src/components/TextEditor/helper/__tests__/resolveTopLevelBlock.test.ts`
- `app/src/components/TextEditor/plugins/ToggleKeyboardPlugin/helper/index.ts`

### Frontend

**Purpose.** `resolveTopLevelBlock` resolves the block-level node a selection anchor (or any other node) belongs to, special-casing the document root — which has no top-level element of its own and must be returned as-is instead of throwing.

**Behavior.** Given any `LexicalNode`, return the node itself when its key is `'root'`; otherwise return `node.getTopLevelElementOrThrow()`. No new behavior beyond what the nine inline expressions already did — this is a pure extraction.

**UI / Visual.** None — this is a non-visual utility function with no component or JSX surface.

#### `app/src/components/TextEditor/helper/resolveTopLevelBlock.ts` (New)

```ts
import { DecoratorNode, ElementNode, LexicalNode } from 'lexical';

export const resolveTopLevelBlock = (
  node: LexicalNode,
): LexicalNode | ElementNode | DecoratorNode<unknown> =>
  node.getKey() === 'root' ? node : node.getTopLevelElementOrThrow();
```

#### `app/src/components/TextEditor/helper/index.ts` (Modified)

Add one explicit named export line (this barrel already uses explicit named exports — do not switch to `export *`):

```ts
export { resolveTopLevelBlock } from './resolveTopLevelBlock';
```

#### `app/src/components/TextEditor/helper/__tests__/resolveTopLevelBlock.test.ts` (New)

Follow the `makeEditor` + `editor.update(..., { discrete: true })` + `editor.getEditorState().read(...)` pattern from `app/src/components/TextEditor/plugins/ToggleKeyboardPlugin/helper/__tests__/resolveHeaderToggleForRemoval.test.ts`. `makeEditor` here is `() => createEditor()` — no `nodes` array is needed since `RootNode`, `ParagraphNode`, and `TextNode` are registered by default (the reference test only passes `nodes: [ToggleNode, ToggleBodyNode]` because it needs those two custom node types specifically).

Required tests (two distinct code paths — the root special case and the delegation to `getTopLevelElementOrThrow`):

- `'returns the root node itself when passed the root node'` — inside a discrete `editor.update()`, call `$getRoot()`; inside `editor.getEditorState().read()`, call `resolveTopLevelBlock(root)` and assert the result's `.getKey()` equals `'root'`.
- `'returns the top-level element for a node nested inside a paragraph'` — inside a discrete `editor.update()`, build `$getRoot().append($createParagraphNode().append($createTextNode('hello')))`, capturing the paragraph's key; inside `editor.getEditorState().read()`, call `resolveTopLevelBlock(textNode)` (re-fetched via `$getNodeByKey` or captured from the same read) and assert the result's `.getKey()` equals the paragraph's key, not the text node's.

#### `app/src/components/TextEditor/plugins/ToggleKeyboardPlugin/helper/index.ts` (New)

```ts
export { resolveHeaderToggleForRemoval } from './resolveHeaderToggleForRemoval';
```

#### `app/src/components/TextEditor/plugins/ToggleKeyboardPlugin/ToggleKeyboardPlugin.ts` (Modified)

Replace the import line:

```ts
import { resolveHeaderToggleForRemoval } from './helper/resolveHeaderToggleForRemoval';
```

with:

```ts
import { resolveTopLevelBlock } from '../../helper';
import { resolveHeaderToggleForRemoval } from './helper';
```

In `handleEnter`, replace:

```ts
      const anchorNode = selection.anchor.getNode();
      const block =
        anchorNode.getKey() === 'root'
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();
      const parent = block.getParent();
```

with:

```ts
      const anchorNode = selection.anchor.getNode();
      const block = resolveTopLevelBlock(anchorNode);
      const parent = block.getParent();
```

In `handleBackspace`, replace:

```ts
        const anchorNode = selection.anchor.getNode();
        const block =
          anchorNode.getKey() === 'root'
            ? anchorNode
            : anchorNode.getTopLevelElementOrThrow();
        const parent = block.getParent();
```

with:

```ts
        const anchorNode = selection.anchor.getNode();
        const block = resolveTopLevelBlock(anchorNode);
        const parent = block.getParent();
```

No other lines in this file change.

#### `app/src/components/TextEditor/plugins/ToggleKeyboardPlugin/helper/resolveHeaderToggleForRemoval.ts` (Modified)

Add an import line:

```ts
import { resolveTopLevelBlock } from '../../../helper';
```

Replace:

```ts
    const block =
      node.getKey() === 'root' ? node : node.getTopLevelElementOrThrow();
    const parent = block.getParent();
```

with:

```ts
    const block = resolveTopLevelBlock(node);
    const parent = block.getParent();
```

The existing test file `resolveHeaderToggleForRemoval.test.ts` needs no assertion changes — the function's observable behavior is unchanged.

#### `app/src/components/TextEditor/plugins/SlashCommandPlugin/slashCommandOptions.ts` (Modified)

Add an import line (place with the other relative imports, before the `../../nodes` import):

```ts
import { resolveTopLevelBlock } from '../../helper';
```

In the `'Toggle'` option's `onSelect`, replace:

```ts
        const anchorNode = selection.anchor.getNode();
        const block =
          anchorNode.getKey() === 'root'
            ? anchorNode
            : anchorNode.getTopLevelElementOrThrow();
```

with:

```ts
        const anchorNode = selection.anchor.getNode();
        const block = resolveTopLevelBlock(anchorNode);
```

#### `app/src/components/TextEditor/components/FloatingToolbar/components/TextFormattingRow/components/ListBtn/ListBtn.tsx` (Modified)

Add an import line:

```ts
import { resolveTopLevelBlock } from '../../../../../../helper';
```

In `isCurrentListType`, replace:

```ts
      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === 'root'
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();
```

with:

```ts
      const anchorNode = selection.anchor.getNode();
      const element = resolveTopLevelBlock(anchorNode);
```

In `handleListToggle`, replace:

```ts
        const anchorNode = selection.anchor.getNode();
        const element =
          anchorNode.getKey() === 'root'
            ? anchorNode
            : anchorNode.getTopLevelElementOrThrow();
```

with:

```ts
        const anchorNode = selection.anchor.getNode();
        const element = resolveTopLevelBlock(anchorNode);
```

#### `app/src/components/TextEditor/plugins/EmptyNodeHintPlugin/EmptyNodeHintPlugin.tsx` (Modified)

Add an import line:

```ts
import { resolveTopLevelBlock } from '../../helper';
```

Replace:

```ts
        const anchorNode = selection.anchor.getNode();
        if ($findCellNode(anchorNode) !== null) return null;
        const element =
          anchorNode.getKey() === 'root'
            ? anchorNode
            : anchorNode.getTopLevelElementOrThrow();
```

with:

```ts
        const anchorNode = selection.anchor.getNode();
        if ($findCellNode(anchorNode) !== null) return null;
        const element = resolveTopLevelBlock(anchorNode);
```

#### `app/src/components/TextEditor/plugins/SlashCommandPlugin/SlashCommandPlugin.tsx` (Modified)

Replace the existing import line:

```ts
import { getSelectionRangeRect } from '../../helper';
```

with:

```ts
import { getSelectionRangeRect, resolveTopLevelBlock } from '../../helper';
```

In `menuRenderFn`, replace:

```ts
          const anchorNode = selection.anchor.getNode();
          const element =
            anchorNode.getKey() === 'root'
              ? anchorNode
              : anchorNode.getTopLevelElementOrThrow();
```

with:

```ts
          const anchorNode = selection.anchor.getNode();
          const element = resolveTopLevelBlock(anchorNode);
```

#### `app/src/components/TextEditor/components/FloatingToolbar/components/TextFormattingRow/components/HeadingBtn/HeadingBtn.tsx` (Modified)

Add an import line:

```ts
import { resolveTopLevelBlock } from '../../../../../../helper';
```

In `isCurrentHeadingType`, replace:

```ts
      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === 'root'
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();
```

with:

```ts
      const anchorNode = selection.anchor.getNode();
      const element = resolveTopLevelBlock(anchorNode);
```

## Sub-feature 2: Extract `collectContentNodes`

Moves `ToggleHeaderGuardPlugin`'s inline recursive helper into its own `helper/` file with a full test suite, matching the sibling `ToggleKeyboardPlugin`'s already-correct pattern of extracting `resolveHeaderToggleForRemoval` into `helper/` with tests. Commit this sub-feature separately from SF1 — it is fully contained within `ToggleHeaderGuardPlugin/`, unlike SF1.

Do not change `ToggleHeaderGuardPlugin.ts`'s `registerNodeTransform` logic, the caret-preservation branch, or any behavior beyond this extraction.

**Files affected**

Modified:

- `app/src/components/TextEditor/plugins/ToggleHeaderGuardPlugin/ToggleHeaderGuardPlugin.ts` — remove the inline `collectContentNodes` function and its now-unused imports; import the extracted function instead

New:

- `app/src/components/TextEditor/plugins/ToggleHeaderGuardPlugin/helper/collectContentNodes.ts`
- `app/src/components/TextEditor/plugins/ToggleHeaderGuardPlugin/helper/index.ts`
- `app/src/components/TextEditor/plugins/ToggleHeaderGuardPlugin/helper/__tests__/collectContentNodes.test.ts`

### Frontend

**Purpose.** `collectContentNodes` flattens a node into its leaf content nodes, descending through list and list-item wrappers so that a list pasted as a toggle header's first child can be replaced by a single paragraph containing all of its actual text content.

**Behavior.** Given any `LexicalNode`: if it is a list node or list-item node, recursively flatten each child via the same function and concatenate the results (`flatMap`); otherwise return the node itself wrapped in a single-element array. No behavior change from the current inline implementation — this is a pure relocation.

**UI / Visual.** None — non-visual utility function, no component or JSX surface.

#### `app/src/components/TextEditor/plugins/ToggleHeaderGuardPlugin/helper/collectContentNodes.ts` (New)

Moved verbatim from the current inline definition in `ToggleHeaderGuardPlugin.ts`, with its own import statements:

```ts
import { LexicalNode } from 'lexical';
import { $isListItemNode, $isListNode } from '@lexical/list';

export const collectContentNodes = (node: LexicalNode): LexicalNode[] => {
  if ($isListNode(node) || $isListItemNode(node)) {
    return node.getChildren().flatMap(collectContentNodes);
  }
  return [node];
};
```

#### `app/src/components/TextEditor/plugins/ToggleHeaderGuardPlugin/helper/index.ts` (New)

```ts
export { collectContentNodes } from './collectContentNodes';
```

#### `app/src/components/TextEditor/plugins/ToggleHeaderGuardPlugin/helper/__tests__/collectContentNodes.test.ts` (New)

Follow the `makeEditor` + `editor.update(..., { discrete: true })` + `editor.getEditorState().read(...)` pattern from `ToggleKeyboardPlugin/helper/__tests__/resolveHeaderToggleForRemoval.test.ts`. `makeEditor` here is `() => createEditor({ nodes: [ListNode, ListItemNode] })` (both from `@lexical/list`) — `ParagraphNode` and `TextNode` are registered by default and need no explicit registration.

Required tests (three distinct code paths — the base case, one level of list/list-item recursion, and recursion through a nested list to confirm depth is not hardcoded to one level):

- `'returns the node wrapped in an array when it is not a list or list item node'` — build a paragraph node containing a text node; call `collectContentNodes(paragraph)`; assert the result is a single-element array whose one element's `.getKey()` equals the paragraph's key.
- `'flattens a list node into the content nodes of its list items'` — build a `ListNode` (via `$createListNode('bullet')`) containing two `ListItemNode`s (via `$createListItemNode()`), each wrapping one `TextNode` (`'a'`, `'b'`); call `collectContentNodes(listNode)`; assert the result has length 2 and `result[0].getTextContent()` / `result[1].getTextContent()` equal `'a'` / `'b'` respectively, in that order.
- `'recursively flattens a list item containing a nested list'` — build a `ListItemNode` whose only child is a nested `ListNode` containing one `ListItemNode` wrapping one `TextNode` (`'nested'`); call `collectContentNodes(outerListItem)`; assert the result is a single-element array whose one element's `.getTextContent()` equals `'nested'` — confirming the function recurses through both list levels rather than stopping after one.

#### `app/src/components/TextEditor/plugins/ToggleHeaderGuardPlugin/ToggleHeaderGuardPlugin.ts` (Modified)

Replace the import block and remove the inline function:

```ts
import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $createParagraphNode,
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  LexicalNode,
} from 'lexical';
import { $isHeadingNode } from '@lexical/rich-text';
import { $isListItemNode, $isListNode } from '@lexical/list';
import { ToggleNode } from '../../nodes';

const collectContentNodes = (node: LexicalNode): LexicalNode[] => {
  if ($isListNode(node) || $isListItemNode(node)) {
    return node.getChildren().flatMap(collectContentNodes);
  }
  return [node];
};

export const ToggleHeaderGuardPlugin = (): null => {
```

with:

```ts
import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $createParagraphNode,
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
} from 'lexical';
import { $isHeadingNode } from '@lexical/rich-text';
import { ToggleNode } from '../../nodes';
import { collectContentNodes } from './helper';

export const ToggleHeaderGuardPlugin = (): null => {
```

`LexicalNode` and the `@lexical/list` import are removed because they are no longer used anywhere else in this file — `registerNodeTransform`'s callback body (the caret-preservation branch and everything below it) is unchanged and does not reference either.

## CLAUDE.md impact

None. This spec applies `app/src/CLAUDE.md`'s existing Barrel Files rule (`ComponentName/helper/` requires an explicit-named-export `index.ts` barrel) to two directories that did not yet follow it correctly — it does not introduce a new structural pattern, change a documented example, or add a participant to a registration flow. The cross-plugin `TextEditor/helper/` promotion tier this spec adds a third export to is already established and already documented by existing precedent (`parseSafeEditorState`, `getSelectionRangeRect`); no CLAUDE.md file enumerates that barrel's specific export list.
