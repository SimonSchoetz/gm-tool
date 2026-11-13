# Nested block drag

**Purpose.** The GM rearranges notes in the app's document text editor at the granularity they are written in: every list item at any depth and every block inside an open toggle moves by its own handle, into, out of and between lists and toggle bodies, without retyping or cutting and pasting. The three list styles line up with one another so a nested note reads the same in all of them.

## How it works

Happy path, in the document text editor of a content section (the read-only editor in a mention popup and the one-line message editor show no handles):

1. Hovering a block shows a handle directly left of it: for a root block where it always was; for a list item, directly left of the item's marker, at the item's depth and as tall as the whole section it moves, the item and all its sub-items; for a block inside an open toggle's body, directly left of that block, in the body's own indentation to the right of the toggle's chevron column, so it never covers the chevron. A toggle's handle is as tall as the whole toggle, header and body, and moves the whole toggle with its body. A list has no handle of its own: every item has its own handle, and an item moves together with all its sub-items. Hovering a nested block shows its own handle together with the handles of all the blocks that enclose it, up to the top level — parent list items and enclosing toggles — each at its own place and height, so a parent is grabbed from its innermost child. The pointer on any shown handle keeps the hovered block hovered, so the handles stay while it travels to a parent's handle.
2. Dragging the handle shows, as the pointer moves, a drop line, a highlight on the row under the pointer, and the blocks below the gap moving aside to make room. The pointer's vertical position picks the gap: the upper half of a row is the gap above it, the lower half the gap below it. Between list items the pointer's horizontal position picks the depth, and the drop line starts at the indentation of the chosen depth before release.
3. Releasing puts the block there in one change. A paragraph or a list item dropped inside a list becomes an item of that list's style; a list item dropped outside every list becomes a paragraph, its sub-items following as a list of their own style, one level shallower. Numbered lists renumber at once and a list left with no items is gone.
4. Bullets, numbers and checkboxes sit in one marker column and item text in one text column at every depth, each nesting level indenting by the same step, in bullet, numbered and check lists alike.

Failure and cancel: Escape, or releasing outside the editor, leaves the document as it was; releasing a block where it stands changes nothing and adds no undo step. A heading, toggle or table is offered no position inside a list; nothing is offered inside the dragged block itself.

Where the user waits: nowhere. The drop is saved like any other edit.

## Data

- **Reads:** the editor's document — its blocks, lists and toggles — and where they are on screen.
- **Writes:** the same document, through the editor's own save, once per drop. Nothing else is stored.

## Rules

| Rule | Why | Source |
| --- | --- | --- |
| Hovering a list item at any depth shows a handle directly left of that item's marker, and hovering a block inside an open toggle's body shows one directly left of that block; a root block that is not a list shows its handle where it did before, and a table cell shows none | Its position shows which block it moves | Simon Schötz, 2026-11-13; `collectBlockRows.test`, hand test |
| A list shows no handle for the whole list: every item has its own handle, and an item moves together with its sub-items, their order and relative depths kept | One handle per item, no whole-list handle | Simon Schötz, 2026-11-13; `collectBlockRows.test`, `moveBlock.test`, `moveListUnit.test` |
| Hovering a nested block shows its own handle and the handles of all its parent blocks, parent list items and enclosing toggles up to the top level, each at its own place and height; dragging any shown handle moves that handle's own block, as it does when that block is hovered itself | A parent can be grabbed from its innermost child without moving the pointer back out to it | Simon Schötz, 2026-11-13; `handleRowsOf.test`, `handleBlockKeyOf.test`, `BlockDragHandlePlugin.test`, hand test |
| A parent block's handle is as tall as the whole section it moves: a list item's handle spans the item and all its sub-items, an open toggle's handle spans the whole toggle, header and body; a block without a section of its own has a handle as tall as itself | The handle shows how much moves with it | Simon Schötz, 2026-11-13; `BlockDragHandlePlugin.test`, `rowBoxInAnchorSpace.test`, hand test |
| Between two list items the pointer's horizontal position picks the depth, from the depth of the item below up to one deeper than the item above, and the drop line starts at that depth's indentation before release; below an item with sub-items the only position is before its first sub-item | The depth to land at is visible before release; a level cannot be skipped and an item must not orphan the rows below it | Simon Schötz, 2026-11-13; `resolveDropTarget.test`, hand test |
| The depth of a drop is the deepest whose text edge the pointer is at or right of | — | Claude's call, 2026-11-13; `resolveDropTarget.test` |
| In every row, including top-level blocks, the pointer in the upper half chooses the position before the row and the lower half the position after it | One rule for every kind of row | Claude's call, 2026-11-13; `resolveDropTarget.test`, `resolveHoveredRow.test` |
| A paragraph or a list item dropped at a position inside a list becomes an item of that list's style, with its text and inline formatting, and every sub-item of a dragged item takes that style too | Lists hold only list items, and a nested list of mixed styles would break the alignment | proposed by Claude, accepted by Simon Schötz, 2026-11-13; `moveBlock.test`, `moveListUnit.test`, `convertToListItem.test` |
| A check item keeps its checked state only when it lands in a check list; in a bullet or numbered list, or as a paragraph, the state is dropped, and an item from another style landing in a check list is unchecked | Only check items carry a checked state | Simon Schötz, 2026-11-13; `moveBlock.test` |
| A list item dropped at a position outside every list becomes a paragraph with its text and inline formatting, its sub-items following directly below it as a list of their own style, one level shallower | Pulling an item out of a list should not lose its sub-items | proposed by Claude, accepted by Simon Schötz, 2026-11-13; `moveBlock.test`, `convertListUnitToParagraph.test` |
| Below the last item of a list, or above its first, the position belongs to the list when the pointer is at or right of the depth-0 text indent of the list and is outside it, beside the list, when the pointer is left of it | The way into and out of a list is the same horizontal choice as its depth | Claude's call, 2026-11-13; `resolveDropTarget.test` |
| Only paragraphs and list items can join a list; a heading, toggle or table being dragged is offered only positions outside every list | Nothing loses its structure by accident | proposed by Claude, accepted by Simon Schötz, 2026-11-13; `resolveDropTarget.test` |
| A block can be dragged into an open toggle's body, out of it and between positions inside it; the lower half of an open toggle's header is the position before the first block of its body, and the lower half of the last block of a body is outside the toggle when the pointer is left of that block's left edge, one toggle further out for each toggle edge the pointer is left of | Leaving a body is the same horizontal choice as a list depth, so no second gesture is needed | Simon Schötz, 2026-11-13; `resolveDropTarget.test`, `moveBlock.test`, `BlockDragHandlePlugin.test` |
| An open toggle's body is indented one handle width further than the toggle's header text, so the handle of a block in the body sits clear of the toggle's chevron column and never covers the chevron's click area | A handle over the chevron made the chevron hard to click | Simon Schötz, 2026-11-13; hand test |
| A toggle may be dropped into another toggle's open body | Nested toggles can already be made | Claude's call, 2026-11-13; `moveBlock.test` |
| A toggle's handle moves the whole toggle, header and body together; a collapsed toggle is one row, its blocks have no handle and no position, and a drop on its lower half lands after the toggle | The blocks inside a collapsed toggle are hidden and cannot be pointed at | Claude's call, 2026-11-13; `collectBlockRows.test`, `resolveDropTarget.test` |
| No position is offered inside the dragged block: not inside its sub-items, and not inside a toggle's own body | A block cannot be dropped into itself | Claude's call, 2026-11-13; `resolveDropTarget.test`, `moveBlock.test` |
| A toggle body left without a block by a drag keeps one empty paragraph | A toggle body is never empty | Claude's call, 2026-11-13; `moveBlock.test` |
| Numbered lists renumber at once after a drop, and a list left with no items disappears | — | Simon Schötz, 2026-11-13; `moveBlock.test` |
| One undo restores the arrangement from before the drag, and the drop never merges into the typing before it | — | Simon Schötz, 2026-11-13; `moveBlock.test`, `BlockDragHandlePlugin.test` |
| A cancelled drag (Escape, or released outside the editor) and a drop where the block stands change nothing and add no undo step | — | Simon Schötz, 2026-11-13; `BlockDragHandlePlugin.test`, `moveBlock.test`, `moveListUnit.test` |
| The result of a drop is saved like any other edit and survives leaving the screen and restarting the app | — | Simon Schötz, 2026-11-13; hand test |
| Bullets, numbers and checkboxes sit in the same column and item text starts in the same column at every depth, each nesting level indenting by the same step in bullet, numbered and check lists | The three list styles line up, so a nested note reads the same in all of them | Simon Schötz, 2026-11-13; hand test |
| The read-only editor and the one-line message editor show no drag handles | — | Simon Schötz, 2026-11-13; no test |
| A block is moved within one editor by dragging its handle: selecting several blocks to drag them together, moving blocks with the keyboard and dragging a block into another editor are not offered | — | Simon Schötz, 2026-11-13; no test |
| The handle's look, the drop line and the drop highlight are those the document text editor had before this feature; only their position follows the hovered row's depth | No new visual language is needed | Claude's call, 2026-11-13; hand test |

## Open points

None in the open-questions register.

Not yet registered: the native drag itself cannot be driven by a script, so these are hand checks in the Tauri app: the drop line starts at the chosen depth before release, Escape and release outside the editor change nothing, one undo restores the arrangement, the result survives leaving the screen and an app restart, and, on Windows, the drag works (`dependency-update-manual-verification.md`, section 6.2). The marker alignment is checked by eye on the seeded entity "Nested Blocks Foe" (`web-dev-mode.md`), since bullet and number markers are drawn by the browser.

## Where to look

- Handle, drop line and highlight: `BlockDragHandlePlugin` and its components `BlockDragHandle`, `BlockDropIndicator`, `BlockDropHighlight`.
- Rows and positions: `collectBlockRows`, `resolveHoveredRow`, `handleRowsOf`, `resolveDropTarget`.
- The move: `moveBlock`, `moveListUnit`, `convertToListItem`, `convertListUnitToParagraph`, `removeListUnit`, `subListOf`, `wrapperAfter`.
- List alignment and the toggle body's indentation: the list and toggle rules of the text editor's stylesheet.
- Tests: `collectBlockRows.test`, `resolveHoveredRow.test`, `handleRowsOf.test`, `handleBlockKeyOf.test`, `resolveDropTarget.test`, `moveBlock.test`, `moveListUnit.test`, `convertToListItem.test`, `convertListUnitToParagraph.test`, `removeListUnit.test`, `subListOf.test`, `wrapperAfter.test`, `BlockDragHandlePlugin.test`.
