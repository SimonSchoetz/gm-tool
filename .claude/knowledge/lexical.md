# Lexical

## `LexicalTypeaheadMenuPlugin`, `MenuOption`, `useBasicTypeaheadTriggerMatch` are exported from `@lexical/react/LexicalTypeaheadMenuPlugin`

**Verified at:** @lexical/react 0.46.0
**Citation:** [spec-writer_1: app/node_modules/@lexical/react/dist/LexicalTypeaheadMenuPlugin.d.ts:40-73]

`useBasicTypeaheadTriggerMatch(trigger: string, { minLength?, maxLength?, punctuation?, allowWhitespace? }): TriggerFn` — `allowWhitespace` is present at this version. `onSelectOption` has signature `(option: TOption, textNodeContainingQuery: TextNode | null, closeMenu: () => void, matchingString: string) => void`; a consumer may omit trailing parameters it does not use (standard TS function-type contravariance) — `MentionTypeaheadPlugin.tsx` and the new `SlashCommandPlugin.tsx` both omit `matchingString`. `MenuOption`'s constructor is `constructor(key: string)`, and the base class already declares `icon?: JSX.Element` and `title?: JSX.Element | string` as public fields — a subclass field named `icon` typed as a component reference (e.g. `LucideIcon`) is not assignable to `JSX.Element` and is a TS compile error; subclasses needing an icon-component reference must use a different field name.

## `@lexical/table` is a transitive-only dependency in this repo — not declared in `package.json`

**Verified at:** @lexical/table 0.46.0 (matches installed `@lexical/react`/`lexical` version)
**Citation:** [spec-writer_2: app/node_modules/@lexical/table/package.json:2; grep '@lexical' app/package.json — `@lexical/table` absent]

---
**Reverified at:** @lexical/table 0.46.0 (post-slash-command implementation)
**Citation:** [spec-writer_7: app/package.json:32 — `"@lexical/table": "^0.46.0"` present as a direct dependency]

The slash command implementation added `@lexical/table` as a direct dependency. This entry is stale. Correct state: `@lexical/table` IS declared in `app/package.json`. Import from it directly — do not add it again.

`TableNode`, `TableRowNode`, `TableCellNode`, and `INSERT_TABLE_COMMAND` (payload `{ columns: string; rows: string; includeHeaders?: boolean | { rows: boolean; columns: boolean } }`) are exported from `@lexical/table` [app/node_modules/@lexical/table/dist/index.d.ts:9-19]. `TablePlugin` (no required props; all of `hasCellMerge`/`hasCellBackgroundColor`/`hasTabHandler`/`hasHorizontalScroll`/`hasNestedTables` default `true`/`false` per its own doc comment) is exported from `@lexical/react/LexicalTablePlugin` [app/node_modules/@lexical/react/dist/LexicalTablePlugin.d.ts:12-46]. Any feature that dispatches `INSERT_TABLE_COMMAND` must (1) add `@lexical/table` as a direct `package.json` dependency, (2) register `TableNode`, `TableRowNode`, `TableCellNode` in the editor's `nodes` array, and (3) render `<TablePlugin />` — otherwise the command throws at runtime because the node types are unregistered.

## Nested/reentrant `editor.update()` and `editor.dispatchCommand()` calls made from inside an active update are queued, not dropped

**Verified at:** lexical 0.46.0
**Citation:** [spec-writer_3: app/node_modules/lexical/src/LexicalUpdates.ts:1288-1298 (`updateEditor` pushes to `editor._updates` when `editor._updating` is true, rather than running immediately) and app/node_modules/lexical/src/LexicalUtils.ts:1519-1525 (`dispatchCommand` → `triggerCommandListeners`); cross-checked against facebook/lexical's shipped `lexical-playground/src/plugins/ComponentPickerPlugin/index.tsx` (WebFetch), whose heading options call `editor.update()` from inside the outer `onSelectOption`'s `editor.update()`, and whose list options call `editor.dispatchCommand()` the same way]

Calling `editor.update()` or `editor.dispatchCommand()` from inside another editor.update() callback for the same editor does not run synchronously in place — it is queued (`editor._updates`) and flushed by `$triggerEnqueuedUpdates`, still within the same synchronous flush cycle before control returns to the caller. This is the verified basis for a typeahead `onSelectOption` calling `option.onSelect(editor)` — where `onSelect` itself calls `editor.update()` or `editor.dispatchCommand()` — from inside `onSelectOption`'s own outer `editor.update()` call.

## `useMenuAnchorRef`'s internal anchor `containerDiv` has a self-triggered one-hop vertical position jump on first open

**Verified at:** @lexical/react 0.46.0
**Citation:** [spec-writer_4: app/node_modules/@lexical/react/src/shared/LexicalMenu.tsx:664-725 (`positionMenu`), :211-281 (`useDynamicPositioning`), :756-761 (wiring: `useDynamicPositioning(resolution, anchorElementRef.current, positionMenu, onVisibilityChange)`)]

Every `LexicalTypeaheadMenuPlugin` instance (`MentionTypeaheadPlugin`, `SlashCommandPlugin`, or any future consumer) creates its own hidden `containerDiv` anchor element via `useMenuAnchorRef`. `positionMenu()` computes `containerDiv.style.top = top + anchorHeight + 3 + ...` where `anchorHeight = anchorElementRef.current.offsetHeight` — the container's own previously-applied height, not a stable value — and in the same call sets `containerDiv.style.height` to the caret line's height (e.g. 27px). `useDynamicPositioning` attaches a `ResizeObserver` watching that same `containerDiv`, so the height mutation from pass 1 (offsetHeight 0 → 27) fires the observer, triggering a second `positionMenu()` call that now reads `offsetHeight = 27` and shifts `top` down by exactly that amount before stabilizing. Net effect: the anchor rect returned by `anchorElementRef.current?.getBoundingClientRect()` visibly jumps down by one line-height (`x` unchanged, `top` increases by the anchor's own height) the first time a given typeahead plugin instance opens after mount. This is internal Lexical behavior, not a defect in any consumer's `menuRenderFn` — any component reading the anchor rect synchronously on every render (e.g. `EditorPopup`) will reproduce the jump visually. This codebase's resolution is to not read `anchorElementRef` for positioning at all: `MentionTypeaheadPlugin` and `SlashCommandPlugin`'s `getAnchorRect` instead read `window.getSelection()?.getRangeAt(0)?.getBoundingClientRect()` directly (the same technique `FloatingToolbar.tsx` already used for its own selection-based anchor), which sidesteps this containerDiv offset/jump entirely and keeps all three popup types anchored consistently to the real caret/selection geometry.

## `LexicalMenu`'s `KEY_ARROW_DOWN_COMMAND` handler never actually dispatches `SCROLL_TYPEAHEAD_OPTION_INTO_VIEW_COMMAND` in practice, despite its own precondition being met

**Verified at:** @lexical/react 0.46.0
**Citation:** [spec-writer_5: app/node_modules/@lexical/react/src/shared/LexicalMenu.tsx:467-506 (`KEY_ARROW_DOWN_COMMAND` handler, dispatches `SCROLL_TYPEAHEAD_OPTION_INTO_VIEW_COMMAND` only `if (option.ref && option.ref.current)`); empirically confirmed via a diagnostic build in this repo: a listener registered for `KEY_ARROW_DOWN_COMMAND` at `COMMAND_PRIORITY_HIGH` fires on every keypress and logs every option's `ref.current` as populated (non-null) for all 7 options; a listener registered for `SCROLL_TYPEAHEAD_OPTION_INTO_VIEW_COMMAND` (at both `COMMAND_PRIORITY_LOW` and `COMMAND_PRIORITY_NORMAL`) never fires; a diagnostic that manually calls `editor.dispatchCommand(SCROLL_TYPEAHEAD_OPTION_INTO_VIEW_COMMAND, {...})` from inside the same `KEY_ARROW_DOWN_COMMAND` handler successfully reaches the `SCROLL_TYPEAHEAD_OPTION_INTO_VIEW_COMMAND` listener every time, ruling out a reentrant-dispatch or priority-ordering explanation]

Despite `option.ref.current` being populated for every option (confirmed empirically) and the arrow-key handler visibly executing (the selection highlight updates correctly), Lexical's own dispatch of `SCROLL_TYPEAHEAD_OPTION_INTO_VIEW_COMMAND` from within that same handler never reaches any registered listener — including a handler manually registered at higher priority than Lexical's own default. The root cause could not be pinned down further via static source reading (the source condition for dispatch is provably true, and reentrant `dispatchCommand` calls are provably not blocked in this exact call stack), suggesting either a bug specific to the shipped bundle or an interaction not visible in the `.tsx` source. **Do not rely on `SCROLL_TYPEAHEAD_OPTION_INTO_VIEW_COMMAND` for scroll-into-view behavior in custom `menuRenderFn` implementations.** This codebase's resolution: extract the option list into a real React component (not the `menuRenderFn` render-prop function itself, which cannot use hooks) that receives `selectedIndex` as a prop and calls `option.ref.current.scrollIntoView({ block: 'nearest' })` via `useEffect` keyed on `selectedIndex` — the same value that already reliably drives the visual selected-item highlight. See `SlashCommandOptionList.tsx` / `MentionOptionList.tsx`.

## `DecoratorNode` has no access to Lexical's native text-format system

**Verified at:** lexical 0.46.0
**Citation:** [spec-writer_12: app/node_modules/lexical/dist/Lexical.dev.mjs:9197-9211; app/node_modules/lexical/dist/nodes/LexicalDecoratorNode.d.ts]

`RangeSelection.formatText()` — what `FORMAT_TEXT_COMMAND` dispatches to — only collects `TextNode` instances for a ranged selection and only `ElementNode` instances for its collapsed-selection fallback. A custom `DecoratorNode` subclass is neither, so it cannot receive formatting through Lexical's built-in text-format pipeline; a `DecoratorNode` needing bold/italic/underline-style state must store and toggle that state itself rather than relying on `FORMAT_TEXT_COMMAND`/`formatText()`.

## `TablePlugin` accepts `hasCellMerge` (default `true`) and other optional props

**Verified at:** @lexical/react 0.46.0
**Citation:** [spec-writer_8: app/node_modules/@lexical/react/dist/LexicalTablePlugin.d.ts:12-46]

`TablePlugin` props: `hasCellMerge?: boolean` (default `true` — merge enabled; set to `false` to force a regular grid), `hasCellBackgroundColor?: boolean` (default `true`), `hasTabHandler?: boolean` (default `true`), `hasHorizontalScroll?: boolean` (default `false`), `hasNestedTables?: boolean` (default `false`, experimental). When `hasCellMerge={false}`, all insert/delete/move table operations are safe with the `$`-prefixed utilities. Calling `<TablePlugin />` without `hasCellMerge={false}` leaves merge enabled.

## `TableObserver.$lookup()` returns `{ tableNode, tableElement }` and is `$`-prefixed

**Verified at:** @lexical/table 0.46.0
**Citation:** [spec-writer_9: app/node_modules/@lexical/table/dist/LexicalTableObserver.d.ts:124-127]

`TableObserver.$lookup(): { tableNode: TableNode; tableElement: HTMLTableElementWithWithTableSelectionState }`. Must be called inside `editor.read()` or `editor.update()` — it is a `$`-prefixed method. Obtain a `TableObserver` via `getTableObserverFromTableElement(tableElement)` (exported from `@lexical/table`), then call `observer.$lookup()`. `getTable()` (non-prefixed) returns the `TableDOMTable` and can be called outside an editor context. `TableDOMTable: { domRows: TableDOMRows; columns: number; rows: number }`. `TableDOMRows` is `((TableDOMCell | undefined)[] | undefined)[]`.

## `getDOMCellFromTarget` and `getTableObserverFromTableElement` are exported from `@lexical/table`

**Verified at:** @lexical/table 0.46.0
**Citation:** [spec-writer_10: app/node_modules/@lexical/table/dist/LexicalTableSelectionHelpers.d.ts:25-26]

`getDOMCellFromTarget(node: null | Node): TableDOMCell | null` — given any DOM node, returns the enclosing `TableDOMCell` or `null`. `TableDOMCell: { elem: HTMLElement; highlighted: boolean; hasBackgroundColor: boolean; x: number; y: number }`. `getTableObserverFromTableElement(tableElement): TableObserver | null` — reads a property stored on the DOM table element by `TablePlugin`; safe to call outside `editor.read()`.

## `TableCellNode.setHeaderStyles(state, mask?)` modifies only the bits specified by `mask`

**Verified at:** @lexical/table 0.46.0
**Citation:** [spec-writer_11: app/node_modules/@lexical/table/dist/LexicalTableCellNode.d.ts:54-62]

`setHeaderStyles(headerState: TableCellHeaderState, mask?: TableCellHeaderState): this`. When `mask` is provided, only the bits set in `mask` are modified; other bits are preserved. Example: `setHeaderStyles(TableCellHeaderStates.NO_STATUS, TableCellHeaderStates.ROW)` removes the ROW flag while preserving COLUMN. `TableCellHeaderStates: { BOTH, COLUMN, NO_STATUS, ROW }`. Also available: `hasHeaderState(state): boolean`, `toggleHeaderStyle(state): this`.

## `$findCellNode` returns the closest `TableCellNode` ancestor of a given node, or `null`

**Verified at:** @lexical/table 0.46.0
**Citation:** [spec-writer_6: app/node_modules/@lexical/table/dist/LexicalTableSelectionHelpers.d.ts:40 — `export declare function $findCellNode(node: LexicalNode): null | TableCellNode;`]

Exported from `@lexical/table`. Used to detect whether a selection anchor is inside a table cell, regardless of nesting depth within the cell (e.g., inside a paragraph within the cell). Must be called within an active editor read/update context, like all `$`-prefixed Lexical functions.

## `ListType` is a closed three-member union — a custom list type cannot be added without forking `@lexical/list`

**Verified at:** @lexical/list 0.46.0
**Citation:** [spec-writer_1: app/node_modules/@lexical/list/dist/LexicalListNode.d.ts:15 — `export type ListType = 'number' | 'bullet' | 'check';`; :40 — `setListType(type: ListType): this`; :16 — `export type ListNodeTagType = 'ul' | 'ol';`; :49-50 — `canBeEmpty(): false` and `canIndent(): false` declared as literal return types]

`ListType` admits only `'number' | 'bullet' | 'check'`, and `setListType`, `$createListNode`, and `SerializedListNode.listType` are all typed against it. `ListNode` additionally hardcodes `canBeEmpty()` and `canIndent()` to literal `false` return types (not overridable defaults) and can only render `ul`/`ol`. Any feature wanting a new list-like block must be a separate `ElementNode` subclass rather than a fourth list type.

## List keyboard behavior comes from `ElementNode` lifecycle hooks, not from list membership

**Verified at:** lexical 0.46.0, @lexical/list 0.46.0
**Citation:** [spec-writer_5: app/node_modules/lexical/dist/nodes/LexicalElementNode.d.ts:209-242 — `insertNewAfter`, `canIndent`, `collapseAtStart`, `excludeFromCopy`, `canBeEmpty`, `canInsertTextBefore`, `canInsertTextAfter`, `isInline`, `isShadowRoot`, `extractWithChild`, `canMergeWhenEmpty` all declared on `ElementNode`; S_6: app/node_modules/@lexical/list/dist/LexicalListItemNode.d.ts:46,47,61,62,63 — `ListItemNode` overrides `insertNewAfter`, `collapseAtStart`, `isParentRequired`, `createParentElementNode`, `canMergeWhenEmpty`]

`ListItemNode` obtains Enter-splitting, Backspace-collapsing, and empty-merge behavior by overriding hooks that `ElementNode` declares for every subclass. Any custom `ElementNode` can reproduce list-like keyboard semantics by overriding the same hooks — being a list type is not a prerequisite. Note that `canInsertAfter`, `canReplaceWith`, and `canMergeWith` on both classes carry `@deprecated @internal` tags and must not be used.

## `getTopLevelElement()` stops at any node whose `isShadowRoot()` returns true

**Verified at:** lexical 0.46.0
**Citation:** [spec-writer_23: app/node_modules/lexical/dist/Lexical.dev.mjs:5901-5909 — `getTopLevelElement()` walks parents until `$isRootOrShadowRoot(parent)`; :16053-16055 — `function $isRootOrShadowRoot(node) { return $isRootNode(node) || $isElementNode(node) && node.isShadowRoot(); }`; S_24: same file:13094-13096 — `TableCellNode.isShadowRoot()` returns true, with an inline comment naming `getTopLevelElement` as the reason]

`getTopLevelElement()` and `getTopLevelElementOrThrow()` resolve to the highest ancestor whose parent is the root node **or** any `ElementNode` returning `true` from `isShadowRoot()`. A custom container node that returns `true` therefore makes every editor-wide consumer of `getTopLevelElementOrThrow()` — placeholder/hint plugins, FloatingToolbar active-state predicates, slash-command `isActive` predicates — resolve to the block inside the container rather than to the container itself, usually without any change to those consumers. `TableCellNode` already relies on this.

## `ElementNode.getDOMSlot()` is the supported mechanism for accessory DOM outside the managed-children range

**Verified at:** lexical 0.46.0
**Citation:** [spec-writer_8: app/node_modules/lexical/dist/nodes/LexicalElementNode.d.ts:197-205 — doc comment "An ElementNode subclass can override this to control where its children are inserted into the DOM, e.g. to add a wrapping node or accessory nodes before or after the children. The root of the node returned by createDOM must still be exactly one HTMLElement."; S_9: app/node_modules/lexical/dist/LexicalDOMSlot.d.ts — `ElementDOMSlot.withElement<ElementType extends HTMLElement>(element: ElementType): ElementDOMSlot<ElementType>`; S_10: same file — `resolveLeafPosition` doc comment names the "wrap pattern that exposed the inner content element via `withElement`"; S_11: same file — `DOMSlot` class doc carries `@experimental`]

Overriding `getDOMSlot(element)` to return `super.getDOMSlot(element).withElement(innerElement)` lets `createDOM` build a wrapper containing both non-Lexical accessory elements and an inner element that receives the managed children. Selection mapping through this wrap pattern is explicitly handled by `resolveLeafPosition` and `resolveChildIndex`. `DOMSlot` is marked `@experimental`, so any Lexical upgrade must re-verify `getDOMSlot`, `ElementDOMSlot`, and `withElement` before being accepted.

## `DOMSlot` exposes exactly one content-bearing `element` — a node's children cannot be split across two DOM parents

**Verified at:** lexical 0.46.0
**Citation:** [spec-writer_17: app/node_modules/lexical/dist/LexicalDOMSlot.d.ts — `readonly element: T` with `before`/`after` declared only as boundary `Node | null` markers, not alternate insertion targets]

All Lexical-managed children of an `ElementNode` are inserted into the single `element` a `DOMSlot` points at; `before` and `after` mark boundaries within that one element rather than providing a second parent. A node whose children must render into two structurally separate DOM parents — for example one child inside `<summary>` and another as a following sibling inside `<details>` — cannot be expressed as live editor DOM and must be produced at the `exportDOM` boundary instead.

## `DOMExportOutput.after` runs after children are appended; `DOMConversionOutput.after` restructures converted children

**Verified at:** lexical 0.46.0
**Citation:** [spec-writer_25: app/node_modules/lexical/dist/LexicalNode.d.ts:387-400 — `DOMExportOutput.after?: (generatedElement: HTMLElement | DocumentFragment | Text | null | undefined) => HTMLElement | DocumentFragment | Text | null | undefined`, documented as "Called after the node and all of its children are constructed", parameter documented as "`element` after children are appended"; :381-385 — `DOMConversionOutput = { after?: (childLexicalNodes: LexicalNode[]) => LexicalNode[]; forChild?: DOMChildConversion; node: null | LexicalNode | LexicalNode[] }`]

`exportDOM` cannot restructure its own children in its body, because they do not exist yet when `element` is constructed — the `after` callback is the only place a generated element's children can be rewrapped or reordered. Symmetrically, `importDOM`'s conversion `after` callback receives the already-converted child Lexical nodes and returns the final array, which is where a flat pasted structure is reshaped into a node's required child arrangement.

## `getTopLevelElementOrThrow()` returns `ElementNode | DecoratorNode<unknown>` — never the root-case node's own type

**Verified at:** lexical 0.46.0
**Citation:** [spec-writer_1: app/node_modules/lexical/dist/LexicalNode.d.ts:637 — `getTopLevelElementOrThrow(): ElementNode | DecoratorNode<unknown>;`; :22 and :34 — `ElementNode` and `DecoratorNode` both exported from the `lexical` package root]

`LexicalNode.getTopLevelElementOrThrow()` is declared to return exactly `ElementNode | DecoratorNode<unknown>` — it never returns the receiver's own static type. The common codebase idiom `node.getKey() === 'root' ? node : node.getTopLevelElementOrThrow()` (used to special-case the root node, which has no top-level element of its own) therefore types as `LexicalNode | ElementNode | DecoratorNode<unknown>` when `node: LexicalNode`, not merely `ElementNode | DecoratorNode<unknown>` — TypeScript does not collapse the union even though `ElementNode` and `DecoratorNode<unknown>` are structural subtypes of `LexicalNode`, because a ternary's inferred type is the literal union of both branch types with no subtype-based reduction. Any extracted helper wrapping this idiom (e.g. a shared `resolveTopLevelBlock`) must declare its return type as `LexicalNode | ElementNode | DecoratorNode<unknown>`, both imported from `lexical`.

## `$setListItemThemeClassNames` applies checkbox classes to structural nesting wrappers, not only to real checklist items

**Verified at:** @lexical/list 0.46.0
**Citation:** [spec-writer_21: app/node_modules/@lexical/list/dist/LexicalList.dev.mjs:942-987 — `isCheckList` computed from the parent `ListNode`'s type at :950, `isNested` from whether the node has a `ListNode` child at :952; :975-980 adds `listitemChecked`/`listitemUnchecked` whenever `isCheckList` with no nesting exclusion; :981-983 separately adds `nested.listitem`]

The `<li>` that exists only to wrap a nested `<ul>` inside a check list receives both the `listitemChecked`/`listitemUnchecked` theme class and the `nested.listitem` theme class. Any stylesheet drawing the checkbox via a `::before` pseudo-element on the checked/unchecked classes must explicitly suppress that pseudo-element on the nested-wrapper class, or a non-interactive checkbox renders at every indentation level.

## Registering a command listener that returns `true` never calls `event.preventDefault()` on the caller's behalf — the handler must call it itself

**Verified at:** lexical 0.46.0
**Citation:** [implementer_1: app/node_modules/lexical/src/LexicalEvents.ts:1480 — `dispatchCommand(editor, KEY_ENTER_COMMAND, event)` called with no preceding `event.preventDefault()`; app/node_modules/@lexical/rich-text/src/index.ts:1151 — the default `KEY_ENTER_COMMAND` handler registered at `COMMAND_PRIORITY_EDITOR` calls `event.preventDefault()` itself, only on the branch that decides to handle the event; app/node_modules/lexical/src/LexicalUpdates.ts:912-943 — `triggerCommandListeners` iterates priorities from `COMMAND_PRIORITY_CRITICAL` (4) down to `COMMAND_PRIORITY_EDITOR` (0) and stops at the first listener returning `true`, so a higher-priority listener returning `true` prevents lower-priority listeners (including the default rich-text handler) from running, but this only stops *other Lexical command listeners* — it has no effect on the underlying native browser event]

`KEY_ENTER_COMMAND`, `KEY_BACKSPACE_COMMAND`, and `KEY_DELETE_COMMAND` are dispatched with the originating `KeyboardEvent` (nullable only for `KEY_ENTER_COMMAND`) as payload, and Lexical's core event handler never calls `preventDefault()` before dispatching — that responsibility belongs entirely to whichever registered listener decides to handle the command. A listener registered at a higher priority (e.g. `COMMAND_PRIORITY_LOW`) that returns `true` without calling `event.preventDefault()` successfully stops Lexical's own default handler (registered at `COMMAND_PRIORITY_EDITOR`) from running, but does nothing to prevent the browser's native contenteditable default action for that keystroke, which fires independently and produces an extra, unintended DOM mutation (e.g. a native line split) alongside whatever the Lexical-level handler did. Any custom command handler for a native-keyboard-backed command must accept the event parameter and call `event.preventDefault()` (guarding for `null` where the payload allows it) on every code path that returns `true`.

## `TextMatchTransformer` shortcuts are keyed by the last typed character, and first-match-wins within a trigger bucket

**Verified at:** @lexical/markdown 0.46.0

**Citation:** [spec-writer_26: app/node_modules/@lexical/markdown/src/utils.ts:406-426 — `indexBy` returns `Readonly<Record<string, T[]>>` and pushes onto an existing bucket rather than overwriting; app/node_modules/@lexical/markdown/src/MarkdownShortcuts.ts:447-450 — `indexBy(byType.textMatch, ({trigger}) => trigger)`; :163-208 — `runTextMatchTransformers` reads `lastChar = textContent[anchorOffset - 1]`, slices `textContent` to `anchorOffset`, iterates the bucket and `return true`s on the first regex match; :196-203 — the matched range is split off via `anchorNode.splitText` and passed to `transformer.replace`; app/node_modules/@lexical/markdown/dist/MarkdownTransformers.d.ts — `TextMatchTransformer` requires `dependencies: Klass<LexicalNode>[]`, `regExp: RegExp`, `type: 'text-match'`, with optional `trigger?: string` documented as "Single character that allows the transformer to trigger when typed in the editor" and `replace?: (node: TextNode, match: RegExpMatchArray) => void | TextNode`]

`registerMarkdownShortcuts` indexes text-match transformers into `Record<string, TextMatchTransformer[]>` keyed by the single-character `trigger`, so several transformers may share one trigger character. At runtime the bucket is selected by the character just typed, each transformer's `regExp` is matched against the text from the block start up to the caret, and the first match wins — so array order within a trigger bucket is significant. The transformer fires immediately on the triggering keystroke with no trailing-space requirement, only while typing at the caret; it never runs against pre-existing text and never on paste (paste routes through markdown import, not shortcuts). `replace` receives a `TextNode` already split to exactly the matched range, so `node.setTextContent(replacement)` substitutes in place and preserves the node's format bits, whereas replacing it with a freshly created `TextNode` drops them. `dependencies: []` is valid — `registerMarkdownShortcuts` only iterates the array to `invariant` that each listed node class is registered on the editor.

## `LexicalEditor.registerRootListener(listener)` is the documented way to observe the editor's root DOM element becoming available — `getRootElement()` itself is not stable enough to read synchronously at render or effect-body top level

**Verified at:** lexical 0.46.0
**Citation:** [spec-writer_16: app/node_modules/lexical/dist/LexicalEditor.d.ts:635 — `registerRootListener(listener: RootListener): () => void;`; :360 — `export type RootListener = (rootElement: null | HTMLElement, prevRootElement: null | HTMLElement) => void | (() => void);`; :728-731 — `getRootElement()`'s own doc comment: "if you need to know the current root element, or you need to attach an event listener, do it via {@link LexicalEditor.registerRootListener}, since this reference may not be stable."]

`registerRootListener` fires immediately on registration with the current root element (or `null` if not yet attached) and again on every subsequent change, receiving `(rootElement, prevRootElement)`. Any component that needs the root element as reactive state (e.g. to pass as a prop to a child) must call `setState` from inside this listener's callback, registered inside a `useEffect` returning the listener's own unregister function — calling `setState(editor.getRootElement())` directly at a bare `useEffect`'s top level trips `react-hooks/set-state-in-effect` (see `.claude/knowledge/eslint.md`).

## `DraggableBlockPlugin_EXPERIMENTAL` owns the entire drag interaction internally, including the node move — the consumer supplies only two positioned DOM elements

**Verified at:** @lexical/react 0.46.0
**Citation:** [spec-writer_13: app/node_modules/@lexical/react/dist/LexicalDraggableBlockPlugin.dev.mjs:375-505 (`useDraggableBlockMenu` registers `DRAGOVER_COMMAND` and `DROP_COMMAND` on the editor internally); :444-488 (`$onDrop` calls `targetNode.insertAfter(draggedNode)` / `insertBefore(draggedNode)` directly — the consumer never handles the move); :241-283 (`getBlockElement` scopes to `getTopLevelNodeKeys(editor)` — every direct child of root, with no node-type exclusions, so paragraphs/headings/lists/toggles/tables are all draggable uniformly); :614-621 (the plugin itself renders `createPortal(<><div draggable onDragStart onDragEnd>{menuComponent}</div>{targetLineComponent}</>, anchorElem)` — the draggable wrapper div is Lexical's own, not the consumer's)]

`DraggableBlockPlugin_EXPERIMENTAL({ anchorElem, menuRef, targetLineRef, menuComponent, targetLineComponent, isOnMenu, onElementChanged })` handles hover detection, drag-image setup, drop-position calculation, and the actual `LexicalNode` move — the consumer supplies only a handle element (`menuComponent`, its own root DOM node attached via `menuRef`) and a drop-indicator element (`targetLineComponent`, root attached via `targetLineRef`), plus an `isOnMenu(element)` predicate that must return `true` for any element inside the handle's own subtree (used to suppress hide-on-hover while the user is interacting with the handle itself). No manual `DROP_COMMAND`/`DRAGOVER_COMMAND` registration or node-splicing is needed or should be added by the consumer.

## `menuRef`/`targetLineRef` root elements must use `position: absolute; left: -10000px; top: -10000px;` as their base CSS — Lexical positions them via `transform: translate()`, `opacity`, `display`/`width` set as inline styles, and never resets `left`/`top`

**Verified at:** @lexical/react 0.46.0
**Citation:** [spec-writer_14: app/node_modules/@lexical/react/dist/LexicalDraggableBlockPlugin.dev.mjs:310-330 (`setMenuPosition` sets only `.style.display`, `.style.opacity`, `.style.transform` on `floatingElem` — never `.style.left`/`.style.top`); :344-368 (`setTargetLine` sets only `.style.transform`, `.style.width`, `.style.opacity` on `targetLineElem`); cross-checked against facebook/lexical's shipped reference implementation (WebFetch of `packages/lexical-playground/src/plugins/DraggableBlockPlugin/index.tsx`, which renders `<div ref={menuRef} className="icon draggable-block-menu">` and `<div ref={targetLineRef} className="draggable-block-target-line" />`, and of the PR #2860 diff adding their CSS: `.draggable-block-menu { border-radius: 4px; padding: 2px 1px; cursor: grab; position: absolute; left: -10000px; top: -10000px; }` and `.draggable-block-target-line { pointer-events: none; background: deepskyblue; height: 4px; position: absolute; left: -10000px; top: -10000px; opacity: 0; }`)]

Neither `node_modules` source ships this CSS — it is entirely the consumer's responsibility. A consumer's stylesheet for the `menuRef` root must declare `position: absolute; left: -10000px; top: -10000px;` (JS toggles `display`/`opacity`/`transform` on top of this base) and may add any other visual property (border-radius, cursor, hover color) but must never declare its own `top`/`left`/`transform`/`opacity`/`display`, which Lexical overwrites every frame. The `targetLineRef` root needs the same `position: absolute; left: -10000px; top: -10000px;` base, may declare `height`/`background`/`border-radius`, but must never declare `width`/`transform`/`opacity`, which Lexical sets programmatically (`width` is recalculated from `anchorElem`'s rect on every dragover).

## `anchorElem` must itself be a positioned element (e.g. `position: relative`) — `setMenuPosition`/`setTargetLine` compute `translate()` offsets relative to `anchorElem.getBoundingClientRect()`, and the portaled handle/line elements are appended as `anchorElem`'s direct DOM children

**Verified at:** @lexical/react 0.46.0
**Citation:** [spec-writer_15: app/node_modules/@lexical/react/dist/LexicalDraggableBlockPlugin.dev.mjs:318,326 (`const anchorElementRect = anchorElem.getBoundingClientRect(); const top = (... - anchorElementRect.top + anchorElem.scrollTop) / zoomLevel;`); :351-363 (`setTargetLine` does the equivalent using `anchorElem.getBoundingClientRect()`'s `top`/`width`); :621 (`createPortal(..., anchorElem)` — the handle wrapper div and target-line element are appended directly into `anchorElem`, making `anchorElem` their DOM parent)]

Both position functions compute a `translate()` offset as `(targetRect.top - anchorElementRect.top)`, which is only correct when the CSS containing block for the portaled absolute-positioned children has its own top-left flush with `anchorElem`'s own `getBoundingClientRect()` origin — i.e. when `anchorElem` itself is the positioned ancestor (`position: relative` with no border/padding offsetting its content edge from its border-box). If `anchorElem` is `position: static`, the browser resolves the containing block to whatever further ancestor is positioned instead, which will not generally share the same top-left as `anchorElem`'s own rect, silently misplacing the handle and drop line. Any consumer passing `editor.getRootElement()` (a Lexical `contentEditable` element, not automatically `position: relative`) as `anchorElem` must add `position: relative` to that element's stylesheet rule.

## `TextNode.setTextContent(text)` returns `this` and mutates the node in place

**Verified at:** lexical 0.46.0

**Citation:** [spec-writer_27: app/node_modules/lexical/dist/nodes/LexicalTextNode.d.ts:222 — `setTextContent(text: string): this;`; :245 — `spliceText(offset: number, delCount: number, newText: string, moveSelection?: boolean): TextNode;`]

`setTextContent` replaces a `TextNode`'s entire text content while preserving the same node identity, and therefore its format bits (bold, italic, underline, strikethrough) and its position in the tree. `spliceText` is the partial-range equivalent and additionally accepts `moveSelection`. Both must be called inside an active `editor.update()` context.
