# SF4 — Keyboard lifecycle

Gives the toggle its editing behavior: how Enter moves through it, how Backspace removes it, how deletion across its boundary resolves, and the guard that keeps the header a paragraph or heading. After this sub-feature a toggle behaves correctly under the keyboard; creating one is still SF5's job.

## Files affected

**Modified:**

- `app/src/components/TextEditor/nodes/ToggleNode.ts` — add the `ElementNode` behavior hooks
- `app/src/components/TextEditor/nodes/ToggleBodyNode.ts` — add the `ElementNode` behavior hooks
- `app/src/components/TextEditor/plugins/index.ts` — add both plugin exports
- `app/src/components/TextEditor/TextEditor.tsx` — render both plugins in the `!readOnly` group

**New:**

- `app/src/components/TextEditor/plugins/ToggleKeyboardPlugin/ToggleKeyboardPlugin.ts`
- `app/src/components/TextEditor/plugins/ToggleHeaderGuardPlugin/ToggleHeaderGuardPlugin.ts`

## Frontend

### `nodes/ToggleNode.ts` and `nodes/ToggleBodyNode.ts` — behavior hooks

Add to **both** classes:

- `isShadowRoot(): true`
- `canBeEmpty(): false`
- `canIndent(): false`

**`isShadowRoot` is the load-bearing one and has a consequence that reaches beyond this sub-feature.** `getTopLevelElement()` walks up until it reaches a node satisfying `$isRootOrShadowRoot`, which is true for the root node and for any `ElementNode` whose `isShadowRoot()` returns true. With both toggle nodes returning `true`, `getTopLevelElementOrThrow()` called from inside a toggle resolves to the header block or to the body's own paragraph — not to the `ToggleNode`. `TableCellNode` uses this same mechanism for the same reason.

This is what makes existing editor code behave correctly inside toggles without modification, and SF7 depends on it. Do not omit it as redundant with the plugins below.

`canBeEmpty(): false` on `ToggleNode` means a toggle whose children are all removed is itself removed rather than left as an empty shell. On `ToggleBodyNode` it means the same for the body — a body with no blocks does not persist.

### `plugins/ToggleKeyboardPlugin/ToggleKeyboardPlugin.ts`

**Purpose** — Owns every keyboard behavior specific to toggles. These cannot live on the node classes: the header is a stock `ParagraphNode` or `HeadingNode`, so its `insertNewAfter` and `collapseAtStart` belong to Lexical, not to this feature. Command handlers are the only place header-relative key behavior can be expressed.

**Behavior**

A component returning `null`, taking the editor from `useLexicalComposerContext()`, registering command handlers inside a `useEffect` keyed on `[editor]` and returning `mergeRegister(...)` for cleanup — the shape `EmptyNodeHintPlugin` already uses.

Register all handlers at `COMMAND_PRIORITY_LOW`, which runs ahead of Lexical's own rich-text defaults. Each handler returns `true` when it has handled the event and `false` to fall through to default behavior. Returning `false` is the correct outcome for every case not listed below — do not consume events the toggle has no opinion about.

Handler behavior table. "Header block" means the first child of a `ToggleNode`; "body block" means any block inside a `ToggleBodyNode`.

| Command | Caret / selection position | Action | Returns |
| --- | --- | --- | --- |
| `KEY_ENTER_COMMAND` | End of header block, toggle expanded | Move the caret into the body's first block. When the body has no blocks, append an empty paragraph first and place the caret there. | `true` |
| `KEY_ENTER_COMMAND` | End of header block, toggle collapsed | Insert an empty paragraph as the `ToggleNode`'s next sibling and place the caret in it. The toggle stays collapsed. | `true` |
| `KEY_ENTER_COMMAND` | Empty body block that is the body's last child | Remove that block from the body and insert it after the `ToggleNode`, placing the caret in it. For a nested toggle this lands in the enclosing body, escaping exactly one level. | `true` |
| `KEY_ENTER_COMMAND` | Anywhere else | — | `false` |
| `KEY_BACKSPACE_COMMAND` | Collapsed caret at offset 0 of the header block | Remove the entire `ToggleNode`, body content included. | `true` |
| `KEY_BACKSPACE_COMMAND` | Non-collapsed selection starting outside the toggle and covering any part of the header | Remove the entire `ToggleNode`. | `true` |
| `KEY_BACKSPACE_COMMAND` | Non-collapsed selection starting inside the body | — remove only the covered content, which is Lexical's default | `false` |
| `KEY_BACKSPACE_COMMAND` | Anywhere else | — | `false` |
| `KEY_DELETE_COMMAND` | Non-collapsed selection starting outside the toggle and covering any part of the header | Remove the entire `ToggleNode`. | `true` |
| `KEY_DELETE_COMMAND` | Anywhere else | — | `false` |

The two deletion rules are deliberately asymmetric, and the asymmetry is the specified behavior rather than an oversight: a selection that has swallowed the header has selected the toggle *as a thing*, so the whole construct goes; a selection that begins inside the body is editing the body's contents, so only what it covers goes and the toggle survives.

Every "empty" test above means the block has no text content. Every "end of header" test means a collapsed selection whose offset equals the block's text length.

The Enter-on-empty-body-block rule requires the block to be the body's **last** child. An empty paragraph in the middle of a body is an intentional blank line, and Enter there must split normally rather than escape.

**UI / Visual**

None. This plugin renders `null`.

### `plugins/ToggleHeaderGuardPlugin/ToggleHeaderGuardPlugin.ts`

**Purpose** — Keeps a toggle's header a paragraph or a heading. The header is an ordinary block, so nothing structurally prevents a list command, a markdown shortcut, or a paste from replacing it with a `ListNode`.

**Behavior**

Registers `editor.registerNodeTransform(ToggleNode, ...)` inside a `useEffect` keyed on `[editor]`, returning the unregister function.

The transform reads the `ToggleNode`'s first child. When it is neither a `ParagraphNode` nor a `HeadingNode`, replace it with a `ParagraphNode` carrying the same children, preserving the caret. A `ListNode` arriving here holds its text inside `ListItemNode` descendants rather than directly, so the replacement must lift the text content out rather than move the list items across unchanged.

This is the structural backstop covering every entry point — the list buttons, the `/bullet list` slash options, markdown shortcuts, and paste. SF7 additionally stops the FloatingToolbar list buttons at source so the most common path produces no visible convert-then-revert flicker; the two are complementary, not redundant, and neither replaces the other.

**UI / Visual**

None. This plugin renders `null`.

### `plugins/index.ts`

Add explicit named exports for `ToggleKeyboardPlugin` and `ToggleHeaderGuardPlugin`, matching the existing style in this barrel.

### `TextEditor.tsx`

Render both new plugins inside the `!readOnly` group, alongside `<MentionFormatPlugin />` and `<EmptyNodeHintPlugin />`.

This differs from SF3's `ToggleGutterPlugin`, which is unconditional, and the difference is intentional: collapsing is a reading action and must work in read-only mode, while keyboard editing and structural repair only apply where the document can be edited. Registering these two unconditionally would attach editing behavior to editors that cannot be edited.

## Tests

None. Both plugins are React components, which the Testing Policy in `app/src/CLAUDE.md` forbids unit-testing, and neither introduces a `helper/` function. The node hooks are single-expression framework overrides with no derived logic.

If the implementer finds that any handler in `ToggleKeyboardPlugin` grows a multi-step derived computation — for example a shared routine that resolves "which toggle, and which position within it" across several handlers — that routine is a helper function, belongs in `ToggleKeyboardPlugin/helper/`, one file per function, and requires tests in `ToggleKeyboardPlugin/helper/__tests__/`. Extract it at that point rather than leaving it inline.
