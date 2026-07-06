# Lexical

## `LexicalTypeaheadMenuPlugin`, `MenuOption`, `useBasicTypeaheadTriggerMatch` are exported from `@lexical/react/LexicalTypeaheadMenuPlugin`

**Verified at:** @lexical/react 0.46.0
**Citation:** [S_1: app/node_modules/@lexical/react/dist/LexicalTypeaheadMenuPlugin.d.ts:40-73]

`useBasicTypeaheadTriggerMatch(trigger: string, { minLength?, maxLength?, punctuation?, allowWhitespace? }): TriggerFn` — `allowWhitespace` is present at this version. `onSelectOption` has signature `(option: TOption, textNodeContainingQuery: TextNode | null, closeMenu: () => void, matchingString: string) => void`; a consumer may omit trailing parameters it does not use (standard TS function-type contravariance) — `MentionTypeaheadPlugin.tsx` and the new `SlashCommandPlugin.tsx` both omit `matchingString`. `MenuOption`'s constructor is `constructor(key: string)`, and the base class already declares `icon?: JSX.Element` and `title?: JSX.Element | string` as public fields — a subclass field named `icon` typed as a component reference (e.g. `LucideIcon`) is not assignable to `JSX.Element` and is a TS compile error; subclasses needing an icon-component reference must use a different field name.

## `@lexical/table` is a transitive-only dependency in this repo — not declared in `package.json`

**Verified at:** @lexical/table 0.46.0 (matches installed `@lexical/react`/`lexical` version)
**Citation:** [S_2: app/node_modules/@lexical/table/package.json:2; grep '@lexical' app/package.json — `@lexical/table` absent]

---
**Reverified at:** @lexical/table 0.46.0 (post-slash-command implementation)
**Citation:** [S_7: app/package.json:28 — `"@lexical/table": "^0.46.0"` present as a direct dependency]

The slash command implementation added `@lexical/table` as a direct dependency. This entry is stale. Correct state: `@lexical/table` IS declared in `app/package.json`. Import from it directly — do not add it again.

`TableNode`, `TableRowNode`, `TableCellNode`, and `INSERT_TABLE_COMMAND` (payload `{ columns: string; rows: string; includeHeaders?: boolean | { rows: boolean; columns: boolean } }`) are exported from `@lexical/table` [app/node_modules/@lexical/table/dist/index.d.ts:9-19]. `TablePlugin` (no required props; all of `hasCellMerge`/`hasCellBackgroundColor`/`hasTabHandler`/`hasHorizontalScroll`/`hasNestedTables` default `true`/`false` per its own doc comment) is exported from `@lexical/react/LexicalTablePlugin` [app/node_modules/@lexical/react/dist/LexicalTablePlugin.d.ts:12-46]. Any feature that dispatches `INSERT_TABLE_COMMAND` must (1) add `@lexical/table` as a direct `package.json` dependency, (2) register `TableNode`, `TableRowNode`, `TableCellNode` in the editor's `nodes` array, and (3) render `<TablePlugin />` — otherwise the command throws at runtime because the node types are unregistered.

## Nested/reentrant `editor.update()` and `editor.dispatchCommand()` calls made from inside an active update are queued, not dropped

**Verified at:** lexical 0.46.0
**Citation:** [S_3: app/node_modules/lexical/src/LexicalUpdates.ts:1288-1298 (`updateEditor` pushes to `editor._updates` when `editor._updating` is true, rather than running immediately) and app/node_modules/lexical/src/LexicalUtils.ts:1519-1525 (`dispatchCommand` → `triggerCommandListeners`); cross-checked against facebook/lexical's shipped `lexical-playground/src/plugins/ComponentPickerPlugin/index.tsx` (WebFetch), whose heading options call `editor.update()` from inside the outer `onSelectOption`'s `editor.update()`, and whose list options call `editor.dispatchCommand()` the same way]

Calling `editor.update()` or `editor.dispatchCommand()` from inside another editor.update() callback for the same editor does not run synchronously in place — it is queued (`editor._updates`) and flushed by `$triggerEnqueuedUpdates`, still within the same synchronous flush cycle before control returns to the caller. This is the verified basis for a typeahead `onSelectOption` calling `option.onSelect(editor)` — where `onSelect` itself calls `editor.update()` or `editor.dispatchCommand()` — from inside `onSelectOption`'s own outer `editor.update()` call.

## `useMenuAnchorRef`'s internal anchor `containerDiv` has a self-triggered one-hop vertical position jump on first open

**Verified at:** @lexical/react 0.46.0
**Citation:** [S_4: app/node_modules/@lexical/react/src/shared/LexicalMenu.tsx:664-725 (`positionMenu`), :211-281 (`useDynamicPositioning`), :756-761 (wiring: `useDynamicPositioning(resolution, anchorElementRef.current, positionMenu, onVisibilityChange)`)]

Every `LexicalTypeaheadMenuPlugin` instance (`MentionTypeaheadPlugin`, `SlashCommandPlugin`, or any future consumer) creates its own hidden `containerDiv` anchor element via `useMenuAnchorRef`. `positionMenu()` computes `containerDiv.style.top = top + anchorHeight + 3 + ...` where `anchorHeight = anchorElementRef.current.offsetHeight` — the container's own previously-applied height, not a stable value — and in the same call sets `containerDiv.style.height` to the caret line's height (e.g. 27px). `useDynamicPositioning` attaches a `ResizeObserver` watching that same `containerDiv`, so the height mutation from pass 1 (offsetHeight 0 → 27) fires the observer, triggering a second `positionMenu()` call that now reads `offsetHeight = 27` and shifts `top` down by exactly that amount before stabilizing. Net effect: the anchor rect returned by `anchorElementRef.current?.getBoundingClientRect()` visibly jumps down by one line-height (`x` unchanged, `top` increases by the anchor's own height) the first time a given typeahead plugin instance opens after mount. This is internal Lexical behavior, not a defect in any consumer's `menuRenderFn` — any component reading the anchor rect synchronously on every render (e.g. `EditorPopup`) will reproduce the jump visually. This codebase's resolution is to not read `anchorElementRef` for positioning at all: `MentionTypeaheadPlugin` and `SlashCommandPlugin`'s `getAnchorRect` instead read `window.getSelection()?.getRangeAt(0)?.getBoundingClientRect()` directly (the same technique `FloatingToolbar.tsx` already used for its own selection-based anchor), which sidesteps this containerDiv offset/jump entirely and keeps all three popup types anchored consistently to the real caret/selection geometry.

## `LexicalMenu`'s `KEY_ARROW_DOWN_COMMAND` handler never actually dispatches `SCROLL_TYPEAHEAD_OPTION_INTO_VIEW_COMMAND` in practice, despite its own precondition being met

**Verified at:** @lexical/react 0.46.0
**Citation:** [S_5: app/node_modules/@lexical/react/src/shared/LexicalMenu.tsx:467-506 (`KEY_ARROW_DOWN_COMMAND` handler, dispatches `SCROLL_TYPEAHEAD_OPTION_INTO_VIEW_COMMAND` only `if (option.ref && option.ref.current)`); empirically confirmed via a diagnostic build in this repo: a listener registered for `KEY_ARROW_DOWN_COMMAND` at `COMMAND_PRIORITY_HIGH` fires on every keypress and logs every option's `ref.current` as populated (non-null) for all 7 options; a listener registered for `SCROLL_TYPEAHEAD_OPTION_INTO_VIEW_COMMAND` (at both `COMMAND_PRIORITY_LOW` and `COMMAND_PRIORITY_NORMAL`) never fires; a diagnostic that manually calls `editor.dispatchCommand(SCROLL_TYPEAHEAD_OPTION_INTO_VIEW_COMMAND, {...})` from inside the same `KEY_ARROW_DOWN_COMMAND` handler successfully reaches the `SCROLL_TYPEAHEAD_OPTION_INTO_VIEW_COMMAND` listener every time, ruling out a reentrant-dispatch or priority-ordering explanation]

Despite `option.ref.current` being populated for every option (confirmed empirically) and the arrow-key handler visibly executing (the selection highlight updates correctly), Lexical's own dispatch of `SCROLL_TYPEAHEAD_OPTION_INTO_VIEW_COMMAND` from within that same handler never reaches any registered listener — including a handler manually registered at higher priority than Lexical's own default. The root cause could not be pinned down further via static source reading (the source condition for dispatch is provably true, and reentrant `dispatchCommand` calls are provably not blocked in this exact call stack), suggesting either a bug specific to the shipped bundle or an interaction not visible in the `.tsx` source. **Do not rely on `SCROLL_TYPEAHEAD_OPTION_INTO_VIEW_COMMAND` for scroll-into-view behavior in custom `menuRenderFn` implementations.** This codebase's resolution: extract the option list into a real React component (not the `menuRenderFn` render-prop function itself, which cannot use hooks) that receives `selectedIndex` as a prop and calls `option.ref.current.scrollIntoView({ block: 'nearest' })` via `useEffect` keyed on `selectedIndex` — the same value that already reliably drives the visual selected-item highlight. See `SlashCommandOptionList.tsx` / `MentionOptionList.tsx`.

## `TablePlugin` accepts `hasCellMerge` (default `true`) and other optional props

**Verified at:** @lexical/react 0.46.0
**Citation:** [S_8: app/node_modules/@lexical/react/dist/LexicalTablePlugin.d.ts:12-46]

`TablePlugin` props: `hasCellMerge?: boolean` (default `true` — merge enabled; set to `false` to force a regular grid), `hasCellBackgroundColor?: boolean` (default `true`), `hasTabHandler?: boolean` (default `true`), `hasHorizontalScroll?: boolean` (default `false`), `hasNestedTables?: boolean` (default `false`, experimental). When `hasCellMerge={false}`, all insert/delete/move table operations are safe with the `$`-prefixed utilities. Calling `<TablePlugin />` without `hasCellMerge={false}` leaves merge enabled.

## `TableObserver.$lookup()` returns `{ tableNode, tableElement }` and is `$`-prefixed

**Verified at:** @lexical/table 0.46.0
**Citation:** [S_9: app/node_modules/@lexical/table/dist/LexicalTableObserver.d.ts:124-127]

`TableObserver.$lookup(): { tableNode: TableNode; tableElement: HTMLTableElementWithWithTableSelectionState }`. Must be called inside `editor.read()` or `editor.update()` — it is a `$`-prefixed method. Obtain a `TableObserver` via `getTableObserverFromTableElement(tableElement)` (exported from `@lexical/table`), then call `observer.$lookup()`. `getTable()` (non-prefixed) returns the `TableDOMTable` and can be called outside an editor context. `TableDOMTable: { domRows: TableDOMRows; columns: number; rows: number }`. `TableDOMRows` is `((TableDOMCell | undefined)[] | undefined)[]`.

## `getDOMCellFromTarget` and `getTableObserverFromTableElement` are exported from `@lexical/table`

**Verified at:** @lexical/table 0.46.0
**Citation:** [S_10: app/node_modules/@lexical/table/dist/LexicalTableSelectionHelpers.d.ts:25-26]

`getDOMCellFromTarget(node: null | Node): TableDOMCell | null` — given any DOM node, returns the enclosing `TableDOMCell` or `null`. `TableDOMCell: { elem: HTMLElement; highlighted: boolean; hasBackgroundColor: boolean; x: number; y: number }`. `getTableObserverFromTableElement(tableElement): TableObserver | null` — reads a property stored on the DOM table element by `TablePlugin`; safe to call outside `editor.read()`.

## `TableCellNode.setHeaderStyles(state, mask?)` modifies only the bits specified by `mask`

**Verified at:** @lexical/table 0.46.0
**Citation:** [S_11: app/node_modules/@lexical/table/dist/LexicalTableCellNode.d.ts:54-62]

`setHeaderStyles(headerState: TableCellHeaderState, mask?: TableCellHeaderState): this`. When `mask` is provided, only the bits set in `mask` are modified; other bits are preserved. Example: `setHeaderStyles(TableCellHeaderStates.NO_STATUS, TableCellHeaderStates.ROW)` removes the ROW flag while preserving COLUMN. `TableCellHeaderStates: { BOTH, COLUMN, NO_STATUS, ROW }`. Also available: `hasHeaderState(state): boolean`, `toggleHeaderStyle(state): this`.

## `$findCellNode` returns the closest `TableCellNode` ancestor of a given node, or `null`

**Verified at:** @lexical/table 0.46.0
**Citation:** [S_6: app/node_modules/@lexical/table/dist/LexicalTableSelectionHelpers.d.ts:40 — `export declare function $findCellNode(node: LexicalNode): null | TableCellNode;`]

Exported from `@lexical/table`. Used to detect whether a selection anchor is inside a table cell, regardless of nesting depth within the cell (e.g., inside a paragraph within the cell). Must be called within an active editor read/update context, like all `$`-prefixed Lexical functions.
