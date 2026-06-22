# SPEC: Text Editor Popup Unification

## Progress Tracker

- SF1: `getSelectionLinkUrl` helper — extract Lexical link-URL reader to `FloatingToolBar/helper/`
- SF2: `LinkBtn` simplification — remove Lexical subscription; receive `isActive` + `onClick` as controlled props [FOUNDATION: SF4 depends on this — stage SF2+SF3+SF4 as one commit]
- SF3: `LinkInput` restructure — controlled component, no `GlassPanel`, no cancel button, focus-on-enable [FOUNDATION: SF4 depends on this — stage SF2+SF3+SF4 as one commit]
- SF4: `FloatingToolbar` restructure — two-row layout, state ownership, new close logic [FOUNDATION: depends on SF2+SF3 — stage SF2+SF3+SF4 as one commit]
- SF5: `FloatingToolbar.css` — two-row layout styles
- SF6: `LinkInput.css` — update for inline layout
- SF7: `FloatingToolBar/index.ts` barrel (chore) — create missing module-directory barrel

## Key Architectural Decisions

### Two-row layout replaces modal mode

`FloatingToolbar` previously swapped its entire content between button mode and link-input mode via `isLinkInputMode`. That state and its ref, `enterLinkInputMode`, and `exitLinkInputMode` are removed. The toolbar now always renders a fixed two-row structure: buttons in row 1, link row in row 2. The link input is always present; only its enabled/disabled state changes.

### URL state lifted to `FloatingToolbar`

`LinkInput` becomes a fully controlled component. `FloatingToolbar` owns `linkUrl: string`, `linkInitialUrl: string`, and `linkInputEnabled: boolean` — the three link-row coordination values — because the parent initialises all three on toolbar open and must clear or update them on toggle-off and Apply. A child cannot initialise or clear its own state on behalf of the parent.

### Lexical selection read on toolbar open

`updateToolbarVisibility` calls `editor.getEditorState().read(getSelectionLinkUrl)` when the selection is non-collapsed (before calling `setIsOpen(true)`). The result initialises `linkInputEnabled`, `linkUrl`, and `linkInitialUrl`. This is the only point where Lexical state is read for link purposes — no per-keystroke dispatch, no as-you-type application. Dispatching `TOGGLE_LINK_COMMAND` happens only in `handleLinkApply` (Apply button / Enter key) and `handleLinkBtnClick` (toggle-off path).

### `linkInitialUrl` tracks last committed state

`linkInitialUrl` is the URL at the last committed Lexical state: either the URL read from Lexical on toolbar open, or the URL last successfully applied via `handleLinkApply`. The Apply button is enabled when `linkUrl !== linkInitialUrl`. After a non-empty Apply, `setLinkInitialUrl(linkUrl)` resets dirty state. After an empty Apply (remove link), both are set to `''` and `linkInputEnabled` is set to `false`.

### `linkInputEnabledRef` replaces `isLinkInputModeRef`

A ref mirroring `linkInputEnabled` (`linkInputEnabledRef`) guards the `SELECTION_CHANGE_COMMAND` handler, preventing `updateToolbarVisibility` from closing the toolbar while the link input is active. Wherever `linkInputEnabled` state is set, `linkInputEnabledRef.current` is updated to match in the same call site.

### `handleBlur` removed — `EditorPopup.onClickOutside` is the sole close path

`FloatingToolbar` wires `onClickOutside={() => setIsOpen(false)}` to `EditorPopup`. `EditorPopup.onClickOutside` already fires on `mousedown` on any element outside the popup's DOM node. Clicking the link input (inside the popup) does not trigger it; clicking anywhere else — including the editor text area — does, producing the requested mousedown-close behaviour. The `handleBlur` listener on `rootElement` is removed: it was only needed to close on focus-out from the editor, which `onClickOutside` now covers without the link-input-guard complexity.

### `LinkBtn`'s Lexical subscription removed

`LinkBtn` no longer reads Lexical state. It receives `isActive: boolean` (= `linkInputEnabled`) and `onClick: () => void` from `FloatingToolbar`. The Lexical link-detection logic (whether the selection contains a link) moves into `updateToolbarVisibility` via `getSelectionLinkUrl`.

### `LinkBtn` mousedown guard preserves Lexical selection

A `<span onMouseDown={(e) => { e.preventDefault(); }}>` wrapper around `<LinkBtn />` in the link row prevents the editor from losing DOM focus when `LinkBtn` is clicked. This is necessary for the toggle-off path: `handleLinkBtnClick` dispatches `TOGGLE_LINK_COMMAND(null)`, which operates on the editor's internal `RangeSelection`. If the editor loses DOM focus before dispatch, the Lexical selection may be lost. The `e.preventDefault()` on the span preserves it. The `LinkInput` is outside this span and receives focus normally on click.

### `LinkInput` focuses programmatically on enable

`autoFocus` is removed (`LinkInput` is always rendered; `autoFocus` fires only on mount). Instead, `LinkInput` uses a `useEffect([disabled])` with a `useRef<HTMLInputElement | null>(null)` to call `inputRef.current?.focus()` when `disabled` transitions from `true` to `false`. The `ref` is passed to `Input` — valid in React 19, where `ref` is a regular prop on function components.

### Apply button disabled logic

`isApplyEnabled` (prop on `LinkInput`) is `linkUrl !== linkInitialUrl`. The Apply button (`ClickableIcon`) receives `disabled={!isApplyEnabled}`. A disabled `<button>` in HTML suppresses `onClick`, so no additional guard is needed inside `handleLinkApply`.

### `getSelectionLinkUrl` is a Lexical read callback

`getSelectionLinkUrl` calls `$getSelection()` and `$isLinkNode()` — Lexical `$`-prefixed functions that MUST run inside a Lexical read or update context. `FloatingToolbar` always calls it as `editor.getEditorState().read(getSelectionLinkUrl)`. Never call it outside a Lexical read context.

### Missing `FloatingToolBar/index.ts` (SF7 chore)

`FloatingToolBar/` is a module directory (single concern). Per CLAUDE.md, module directories require an `index.ts` barrel. None exists. SF7 creates it and updates `TextEditor/components/index.ts` to use the barrel path.

## Sub-feature Files

- [SF1 — getSelectionLinkUrl helper](SPEC_TEXT_EDITOR_POPUP_UNIFICATION_SF1.md)
- [SF2 — LinkBtn simplification](SPEC_TEXT_EDITOR_POPUP_UNIFICATION_SF2.md)
- [SF3 — LinkInput restructure](SPEC_TEXT_EDITOR_POPUP_UNIFICATION_SF3.md)
- [SF4 — FloatingToolbar restructure](SPEC_TEXT_EDITOR_POPUP_UNIFICATION_SF4.md)
- [SF5 — FloatingToolbar.css two-row layout](SPEC_TEXT_EDITOR_POPUP_UNIFICATION_SF5.md)
- [SF6 — LinkInput.css update](SPEC_TEXT_EDITOR_POPUP_UNIFICATION_SF6.md)
- [SF7 — FloatingToolBar/index.ts barrel (chore)](SPEC_TEXT_EDITOR_POPUP_UNIFICATION_SF7.md)

## CLAUDE.md Impact

None. This spec modifies existing component behaviour without introducing new structural patterns, layers, or ambient infrastructure.
