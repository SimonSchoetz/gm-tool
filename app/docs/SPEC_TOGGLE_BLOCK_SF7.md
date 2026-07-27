# SF7 — Ambient plugin integration

Closes the last place where existing editor-wide behavior does the wrong thing inside a toggle. Small by design — SF4's shadow-root decision removed most of what this sub-feature would otherwise have contained.

## Files affected

**Modified:**

- `app/src/components/TextEditor/components/FloatingToolbar/components/TextFormattingRow/components/ListBtn/ListBtn.tsx` — guard against converting a toggle header into a list, plus one cleanup task

## Context: what needed no change, and why

Two ambient systems were evaluated against toggles and require no modification. Both conclusions are stated here so a later reader does not re-open them.

**`EmptyNodeHintPlugin` — no change.** It resolves its target with `anchorNode.getTopLevelElementOrThrow()` and applies the hint class to `editor.getElementByKey(element.getKey())`. Before SF4 this would have returned the `ToggleNode`, putting the placeholder hint on the toggle root and suppressing it entirely whenever the body held text. Because SF4 makes both `ToggleNode` and `ToggleBodyNode` shadow roots, the call now returns the header block or the body's own paragraph, which is exactly the element the hint belongs on. Its unrelated `$findCellNode` bail-out concerns table cells only and does not apply.

**`parseSafeEditorState` — no change.** It parses the JSON and checks `root.children.length`; it never enumerates or validates node types, so documents saved before this feature continue to load and documents containing toggles need no special handling.

## Frontend

### `ListBtn.tsx`

**Purpose** — The FloatingToolbar's list buttons operate on whatever block the selection sits in. A toggle header is an ordinary paragraph or heading, so without a guard these buttons convert it into a list. SF4's header transform reverts that, but the user sees the header turn into a list and snap back. This guard stops the most common path at source so no visible correction occurs.

The transform in SF4 remains the structural backstop for every other entry point — markdown shortcuts, paste, and the `/bullet list` slash options. This guard does not replace it.

**Behavior**

Add a predicate that determines whether the current selection sits in a toggle header: resolve the block with the same `anchorNode.getKey() === 'root' ? anchorNode : anchorNode.getTopLevelElementOrThrow()` form already used in `isCurrentListType`, then test whether its parent is a `ToggleNode`.

Because SF4 makes `ToggleNode` a shadow root, that resolution returns the header block itself, so the toggle is detected through the block's parent. A body paragraph correctly fails the test: its parent is the `ToggleBodyNode`, not the `ToggleNode`. Lists inside a toggle body remain fully available, which is required — the body accepts any block type.

Apply the predicate in `handleListToggle`, inside the existing `editor.update()` and after the `$isRangeSelection` narrowing, as an early return before any command is dispatched. In a function whose return type is `void`, use a bare `return;` — never `return null;`.

`isCurrentListType` and the `isActive` state it drives are not modified. A toggle header is never a list, so the button already reports inactive there; changing the active state would misrepresent it as toggled-off rather than unavailable.

Import `$isToggleNode` from `../../../../../../nodes` — six levels up from `ListBtn/` reaches `TextEditor/`, and `nodes/` is a grouping folder whose barrel is the correct import surface.

**Cleanup task, required, not optional:** this file declares its props type as `ListBtnProps` and assigns the component as `FCProps<ListBtnProps>`. The props pattern in `app/src/CLAUDE.md` specifies that a case-3 component — one using `FCProps` rather than `HtmlProps` or `React.ComponentProps` — declares its props as a named `type Props = { ... }`. Rename `ListBtnProps` to `Props` and update the `FCProps<Props>` annotation. The type has no consumer outside this file, so no other file changes.

No other violations were found in this file. The `useCallback` wrappers on `isCurrentListType` and `handleStateUpdate` are justified — both are read as dependencies of the `useEffect` at the bottom of the component — and the locally declared `ListType` union is correct where it is, being a single-consumer type declared in the file that uses it.

**UI / Visual**

No visual change. The buttons keep their current appearance and active-state behavior; the only difference is that pressing a list button with the caret in a toggle header now does nothing instead of producing a list that immediately reverts.

## Tests

None. This sub-feature modifies one component, which the Testing Policy in `app/src/CLAUDE.md` forbids unit-testing, and adds no `helper/` function. Should the implementer extract the toggle-header predicate into `ListBtn/helper/`, it requires a matching test in `ListBtn/helper/__tests__/`.
