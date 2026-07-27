# Toggle Block for TextEditor

A collapsible block in the rich text editor: a always-visible header, a body that expands and collapses, and a chevron in a full-height gutter that toggles it. Collapsed state is part of the document.

## Progress tracker

- Sub-feature 1: Toggle node model — the two node classes, their DOM structure, and serialization
- Sub-feature 2: Toggle styles and animation — gutter layout, chevron rotation, body expand/collapse
- Sub-feature 3: Gutter click plugin — full-height gutter click toggles collapsed state in both editable and read-only mode
- Sub-feature 4: Keyboard lifecycle — Enter, Backspace, and cross-boundary deletion behavior, plus the header type guard
- Sub-feature 5: Slash command entry — `/toggle` converts the current block into a toggle
- Sub-feature 6: HTML export and import — serialize as `<details>`/`<summary>` for copy-paste across applications
- Sub-feature 7: Ambient plugin integration — `EmptyNodeHintPlugin` hint resolution and `ListBtn` header guard

## Key Architectural Decisions

### Toggle is a standalone `ElementNode`, not a Lexical list type

`ListType` is a closed union of `'number' | 'bullet' | 'check'` [S_1: app/node_modules/@lexical/list/dist/LexicalListNode.d.ts:15], with `setListType(type: ListType)` typed against it [S_2: same file:40]. A fourth member cannot be added without forking `@lexical/list`. The list model would also constrain the body: `ListNode.canBeEmpty()` and `canIndent()` have literal `false` return types [S_3: same file:49-50], and `ListNodeTagType` permits only `'ul' | 'ol'` [S_4: same file:16], which is the wrong DOM for a header-plus-body disclosure.

The list-like keyboard behavior this feature requires does not come from being a list. It comes from `ElementNode` lifecycle hooks — `insertNewAfter`, `collapseAtStart`, `canBeEmpty`, `canMergeWhenEmpty`, `isShadowRoot`, `canIndent` [S_5: app/node_modules/lexical/dist/nodes/LexicalElementNode.d.ts:209-242] — which `ListItemNode` overrides to obtain exactly that behavior [S_6: app/node_modules/@lexical/list/dist/LexicalListItemNode.d.ts:46,47,61,62,63]. Every `ElementNode` subclass has access to the same hooks.

### The header is an ordinary `ParagraphNode` or `HeadingNode`

`ToggleNode`'s first child is a real block node, not a dedicated header node type. This makes the existing heading machinery apply unchanged: `$setBlocksType` from the `/h1`–`/h3` slash options, and the FloatingToolbar's heading buttons. A dedicated header node type would require reimplementing all of it, because `$setBlocksType` replaces the block it targets.

The cost is that nothing structurally prevents the header from becoming a list. SF4 closes this with a node transform.

### Collapsed state lives on the node and is serialized

`ToggleNode.__collapsed` is written by `exportJSON` and read by `importJSON`. Consequences that follow and are intended: collapsing survives an app restart, propagates to paired devices through the existing sync path, and is written to the database from any `TextEditor` that receives an `onChange` prop — including read-only ones such as `InGameStepSection`. A read-only `TextEditor` with no `onChange` prop, such as the mention popup body, still toggles visually but does not persist; `OnChangePlugin` is only rendered when `onChange` is present [S_7: app/src/components/TextEditor/TextEditor.tsx:141]. This asymmetry is intentional.

### DOM structure is produced with `getDOMSlot`, not pseudo-elements

`ElementNode.getDOMSlot` exists to let a subclass place accessory DOM outside the Lexical-managed children range, with the constraint that `createDOM` still returns exactly one root element [S_8: app/node_modules/lexical/dist/nodes/LexicalElementNode.d.ts:197-205]. `ElementDOMSlot.withElement()` redirects the managed-children slot to an inner element [S_9: app/node_modules/lexical/dist/LexicalDOMSlot.d.ts — `withElement<ElementType extends HTMLElement>(element: ElementType): ElementDOMSlot<ElementType>`], and the slot's selection-resolution logic explicitly accounts for this wrap pattern [S_10: same file — `resolveLeafPosition` doc comment, "wrap pattern that exposed the inner content element via `withElement`"].

`DOMSlot` carries an `@experimental` marker [S_11: same file — class doc comment on `DOMSlot`]. A future Lexical upgrade must re-verify `getDOMSlot`, `ElementDOMSlot`, and `withElement` before the upgrade is accepted.

The alternative — drawing the gutter and chevron as `::before`/`::after` pseudo-elements — was rejected. Pseudo-elements are not real DOM, so every click would require x-coordinate hit-testing plus an ancestor walk to determine which nested toggle was hit, and a rotating chevron plus a full-height click target cannot share one pseudo-element.

### The chevron glyph is a CSS background image

`createDOM` returns raw DOM, so a React icon component cannot be mounted inside it. `.toggle-chevron` is a real `<span>` drawn with a data-URI SVG `background-image`, the same technique the checklist checkbox uses [S_12: app/src/components/TextEditor/TextEditor.css:123]. Because it is a real element rather than a pseudo-element, `transform: rotate()` applies to it directly.

`ChevronRightIcon` from `lucide-react` is used only for the slash command menu entry, which is genuine React. It is not used inside any node's DOM.

### The gutter click plugin is registered unconditionally

`CheckboxReadOnlyPlugin` is rendered only when `readOnly` is true [S_13: app/src/components/TextEditor/TextEditor.tsx:149] because Lexical's own `CheckListPlugin` already handles clicks in editable mode. No built-in plugin handles toggles in either mode, so `ToggleGutterPlugin` is rendered unconditionally and is the sole click handler for both modes. Registering it inside the `!readOnly` group, or adding a read-only twin, would produce either dead toggles or double-firing.

### The slash command converts the current block rather than inserting a new toggle

Every block-level option in `SLASH_COMMAND_OPTIONS` converts: headings via `$setBlocksType` [S_14: app/src/components/TextEditor/plugins/SlashCommandPlugin/slashCommandOptions.ts:61,75,89], lists via the `INSERT_*_LIST_COMMAND` family [S_15: same file:100,109,118]. Only the table option inserts, and its `isActive` is `() => false` [S_16: same file:132], because a table has no single-block equivalent. A toggle header does, so the paragraph containing `/toggle` becomes the header.

A single `Toggle` option is registered, not four heading-toggle variants. With the header being an ordinary block, heading-ness is reachable through `/h1`–`/h3` or the FloatingToolbar after the toggle exists, so variants would lengthen the menu without adding capability.

### HTML export uses `<details>`/`<summary>`

`<details>` is unusable as the editor's live DOM: a `DOMSlot` exposes exactly one content-bearing `element` [S_17: app/node_modules/lexical/dist/LexicalDOMSlot.d.ts — `readonly element: T`], so the header cannot render inside `<summary>` while the body renders outside it. It is nonetheless the correct static HTML representation, so `exportDOM` emits it and `importDOM` accepts it. This makes a toggle copied into another application arrive as a working disclosure widget rather than two orphaned blocks.

### Body collapse animates via `grid-template-rows`

Transitioning to and from content-determined height requires a grid track rather than `height` or `max-height`: `max-height` produces timing that varies with content length, and `height: auto` is not interpolable. `ToggleBodyNode` therefore renders a two-element structure — an outer grid container and an inner overflow-clipped element — using the same `getDOMSlot` mechanism as `ToggleNode`, and animates `grid-template-rows` between `0fr` and `1fr`.

## CLAUDE.md impact

- `app/src/CLAUDE.md`'s Barrel Files section enumerates grouping folders as "`data-access-layer/`, `components/`, `util/`, `hooks/`, `services/`, `providers/`, and any `components/`-style subdirectory at any nesting level". It does not name `nodes/` or `plugins/` under `src/components/TextEditor/`, although both are grouping folders by function and `plugins/index.ts` already follows the explicit-named-exports rule for grouping barrels [S_18: app/src/components/TextEditor/plugins/index.ts:1-8 — eight explicit `export { … } from …` statements, no `export *`] while `nodes/index.ts` does not [S_19: app/src/components/TextEditor/nodes/index.ts:1 — `export * from './MentionNode';`]. The enumeration is incomplete relative to the convention actually in force.

- The external-system facts established while writing this spec are recorded in `.claude/knowledge/lexical.md` and require no further action: the closed `ListType` union, the `ElementNode` behavior-hook set and its relationship to `ListItemNode`, `getTopLevelElement()` stopping at shadow roots, `getDOMSlot`/`ElementDOMSlot.withElement` and its `@experimental` status, the single-`element` constraint on `DOMSlot`, the `after` callbacks on `DOMExportOutput` and `DOMConversionOutput`, and `$setListItemThemeClassNames` applying checkbox classes to nesting wrappers. All are verified at the installed `lexical` / `@lexical/list` / `@lexical/react` 0.46.0 [S_20: app/package.json:21-38].

- `.claude/knowledge/lucide-react.md` already records that every icon is exported under both a bare and an `*Icon`-suffixed name; `ChevronRightIcon` is confirmed present at lucide-react 1.23.0 [S_22: grep `ChevronRight as ChevronRightIcon` app/node_modules/lucide-react/dist/lucide-react.d.ts — found]. No new entry is required.

## Sub-feature files

- [SF1 — Toggle node model](./SPEC_TOGGLE_BLOCK_SF1.md)
- [SF2 — Toggle styles and animation](./SPEC_TOGGLE_BLOCK_SF2.md)
- [SF3 — Gutter click plugin](./SPEC_TOGGLE_BLOCK_SF3.md)
- [SF4 — Keyboard lifecycle](./SPEC_TOGGLE_BLOCK_SF4.md)
- [SF5 — Slash command entry](./SPEC_TOGGLE_BLOCK_SF5.md)
- [SF6 — HTML export and import](./SPEC_TOGGLE_BLOCK_SF6.md)
- [SF7 — Ambient plugin integration](./SPEC_TOGGLE_BLOCK_SF7.md)
