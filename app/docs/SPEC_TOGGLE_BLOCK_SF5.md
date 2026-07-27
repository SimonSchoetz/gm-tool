# SF5 — Slash command entry

Adds `/toggle` to the slash command menu. After this sub-feature the feature is usable end to end: a toggle can be created, opened, closed, and edited.

## Files affected

**Modified:**

- `app/src/components/TextEditor/plugins/SlashCommandPlugin/slashCommandOptions.ts` — add the `Toggle` option

## Frontend

### `slashCommandOptions.ts`

**Purpose** — This file is the single registry of slash command options. A new option is one more `SlashCommandOption` entry; no plugin change is needed.

**Behavior**

Append one entry to the end of `SLASH_COMMAND_OPTIONS`:

- Label: `'Toggle'`
- Icon: `ChevronRightIcon`, imported from `lucide-react` alongside the existing icon imports in this file. Import the pre-suffixed name directly — `lucide-react` exports every icon under both a bare and an `*Icon`-suffixed name, so `as` aliasing must not be added.
- Section: `'Other'`

Place the entry last in the array so the `Other` section renders after `Text`, `List`, and `Table`.

**`onSelect` — converts, does not insert.**

Inside `editor.update()`:

1. Read the selection; bail unless it is a range selection.
2. Resolve the current block from the anchor, using the same `anchorNode.getKey() === 'root' ? anchorNode : anchorNode.getTopLevelElementOrThrow()` form the other options and this plugin already use.
3. Bail when that block is already a toggle header — that is, when its parent is a `ToggleNode`. A header must remain a single paragraph or heading, so nesting a toggle inside one is not a valid conversion. Bailing is correct here rather than nesting into the body: the user's caret is in the header, and silently acting somewhere else would be worse than doing nothing.
4. Create a `ToggleNode` in the expanded state and a `ToggleBodyNode` containing one empty `ParagraphNode`.
5. Replace the current block with the `ToggleNode`, then append the original block into the `ToggleNode` as its first child, followed by the `ToggleBodyNode`. The original block becomes the header, carrying whatever text and formatting it already had.
6. Place the caret at the end of the header.

Nesting works without special handling: when the current block is a paragraph inside another toggle's body, replacing it in place produces a `ToggleNode` inside that `ToggleBodyNode`, which is exactly a nested toggle.

Calling `editor.update()` from inside `onSelect` is safe even though `SlashCommandPlugin.onSelectOption` already invokes `option.onSelect(editor)` from within its own `editor.update()`. Nested and reentrant `editor.update()` calls are queued on `editor._updates` and flushed within the same synchronous cycle, not dropped — this is the same mechanism the existing heading options rely on.

**`isActive`**

`(element) => $isToggleNode(element.getParent())`.

The predicate receives `anchorNode.getTopLevelElementOrThrow()`. Because SF4 makes `ToggleNode` a shadow root, that call resolves to the header block when the caret is in a header, so the toggle is detected through the block's parent rather than the block itself. `$isToggleNode` accepts `null`, so a top-level block whose parent is the root needs no separate guard.

A body paragraph correctly reports inactive: `ToggleBodyNode` is also a shadow root, so `getTopLevelElementOrThrow()` returns the paragraph, whose parent is the `ToggleBodyNode`, not a `ToggleNode`. Only the header marks the option active.

Import `$isToggleNode`, `$createToggleNode`, and `$createToggleBodyNode` from `../../nodes` — the module barrel. This file sits in `plugins/SlashCommandPlugin/`, so `../../nodes` resolves to `TextEditor/nodes`, and `nodes/` is a grouping folder whose barrel is the correct import surface for external consumers.

**UI / Visual**

The menu entry renders through the existing `SlashCommandOptionList`, which groups entries by their `section` string and marks active options from `activeOptionKeys`. No component change is required — a new section string produces a new section automatically.

## Tests

None. This sub-feature adds data to an existing configuration array and introduces no helper or util function.
