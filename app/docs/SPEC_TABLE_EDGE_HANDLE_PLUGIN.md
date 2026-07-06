# Spec: Table Edge Handle Plugin

## Progress Tracker

- SF1: TableHandleMenu — popup content component (buttons + divider, no Lexical dependency)
- SF2: TableEdgeHandlePlugin — main plugin (state, hover detection, hint rendering, all operations)
- SF3: TextEditor registration — wire `hasCellMerge={false}` and register the plugin

Sub-feature files:

- [SF1](SPEC_TABLE_EDGE_HANDLE_PLUGIN_SF1.md)
- [SF2](SPEC_TABLE_EDGE_HANDLE_PLUGIN_SF2.md)
- [SF3](SPEC_TABLE_EDGE_HANDLE_PLUGIN_SF3.md)

## Key Architectural Decisions

### `hasCellMerge={false}` is not yet set — SF3 adds it

`TablePlugin`'s `hasCellMerge` prop defaults to `true` (merge enabled). The current `TextEditor.tsx` calls `<TablePlugin />` without the prop, leaving merge enabled. SF3 changes it to `<TablePlugin hasCellMerge={false} />` with an inline comment. This is required before the edge-handle operations ship: `$insertTableRowAtSelection`, `$insertTableColumnAtSelection`, and `$moveTableColumn` all behave unpredictably with merged cells. Disabling merge forces the table into a regular grid where every cell occupies exactly one (x, y) position.

### Hints are `position: fixed` elements rendered via `createPortal`

The editor lives inside `CustomScrollArea`, which applies `overflow: hidden` and may affect z-index stacking. Rendering hints and the popup inside the editor's DOM would require working against these constraints. Both the hints and the `EditorPopup` portal to `document.body` and use `position: fixed` with coordinates from `getBoundingClientRect()` — same approach as `FloatingToolbar` and `MentionTypeaheadPlugin`.

### Popup anchors to the hint element's live DOM node

`EditorPopup.getAnchorRect` must return a fresh rect on every invocation because `EditorPopup` re-renders on scroll (its own scroll listener calls `forceRerender()`). `popupState` stores the `HTMLDivElement` of the clicked hint. `getAnchorRect` calls `hintElement.getBoundingClientRect()` each time. The hint element remains mounted while the popup is open — this invariant is enforced by the hide-gate rule (see next decision).

### EditorPopup CSS positions the popup above its anchor rect

`EditorPopup.css` applies `transform: translateX(-50%) translateY(calc(-100% - var(--spacing-xs)))`. The popup bottom edge aligns with `rect.top` minus spacing, centered at `rect.left + rect.width/2`. For top-edge handles the popup appears above the table (good UX). For bottom-edge handles the popup opens upward into the table interior — MVP limitation, accepted deliberately.

### Hint hide is gated on popup state via a ref

The 150ms hide timer must not start when the popup is open. Event handlers (registered in a `useEffect`) cannot read React state directly without stale closure. A `isPopupOpenRef: React.MutableRefObject<boolean>` (set in a `useEffect` keyed on `popupState`) is the solution — it is always current inside the event handlers without adding the state to their dependency arrays.

### `onMouseDown={e => e.stopPropagation()}` on hint elements prevents phantom close-reopen cycle

`EditorPopup` listens for `mousedown` on `document` to detect outside clicks. The hint element is not inside the popup DOM tree, so clicking a hint when the popup is open would trigger `onClickOutside` (close), then the hint's `onClick` (reopen), causing a blink. Adding `onMouseDown={e => e.stopPropagation()}` on every hint element prevents the document-level mousedown listener from firing. The hint's own `onClick` still fires normally.

### Row/column highlight is a direct DOM class mutation, not Lexical state

Row/column highlighting is a hover UX effect with no semantic meaning. Applying it through Lexical state would trigger unnecessary re-renders and history entries. Instead, a `useEffect` keyed on `[activeHint, hintState]` applies `classList.add('table-cell--handle-hover')` to each DOM cell element directly. The effect's cleanup function removes the class. The class is defined in `TableEdgeHandlePlugin.css` via the `.editor-table-cell` selector already applied by the Lexical theme.

### Insert/delete operations close the popup; toggle header does not

Toggle header is a repeatable, reversible action. Keeping the popup open lets the user toggle back without re-triggering the hover flow. Insert and delete are structural changes that shift the table layout — the popup anchor cell may no longer exist at the same coordinates, so the popup closes.

### Toggle header uses optimistic React state

After `editor.update()` queues the Lexical mutation, `setPopupState(prev => prev ? { ...prev, isHeader: !prev.isHeader } : null)` immediately updates the button's active indicator. The toggle is deterministic: `isHeader` was read at popup-open time, the update inverts all cells in the row/column, so `!prev.isHeader` is always the correct new value.

### All insert/delete operations use the selection-first pattern

`$insertTableRowAtSelection`, `$insertTableColumnAtSelection`, `$deleteTableRowAtSelection`, and `$deleteTableColumnAtSelection` all operate on the current focus cell selection. The shared helper `selectCell(x, y, tableElement)` — called inside `editor.update()` — selects the target cell, then the `$`-function reads that selection.

### `@lexical/table` is a direct dependency (post-slash-command implementation)

The slash command implementation added `@lexical/table` as a direct dependency. Import from `@lexical/table` without adding it again.

## CLAUDE.md Impact

None. This spec introduces a new plugin directory following the existing plugin convention (`plugins/PluginName/`). No CLAUDE.md files reference this path. No new structural patterns are introduced that differ from existing plugin conventions.
