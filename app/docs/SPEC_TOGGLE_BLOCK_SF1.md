# SF1 — Toggle node model

Introduces the two node classes that make up a toggle, their DOM structure, and their serialization. After this sub-feature a toggle can exist in a document and round-trip through save and load, but nothing can create one yet and clicking does nothing.

## Files affected

**New:**

- `app/src/components/TextEditor/nodes/ToggleNode.ts`
- `app/src/components/TextEditor/nodes/ToggleBodyNode.ts`

**Modified:**

- `app/src/components/TextEditor/nodes/index.ts` — add the new node exports, and convert the existing `export *` to explicit named exports (see cleanup task below)
- `app/src/components/TextEditor/TextEditor.tsx` — register both node classes in `initialConfig.nodes`
- `app/src/components/TextEditor/TextEditor.constants.ts` — add `TOGGLE_GUTTER_CLASS`

## Frontend

### `nodes/ToggleNode.ts`

**Purpose** — The container node. Owns the collapsed flag, renders the outer two-column DOM, and redirects Lexical's managed-children slot into the content column so the gutter stays outside it.

**Behavior**

Extends `ElementNode`. Uses `static getType()` / `static clone()` rather than the newer `$config()` form, matching `MentionNode`'s established pattern in this directory.

Field: `__collapsed: boolean`. Declare it as a class field and assign it in the constructor body — `erasableSyntaxOnly` is enabled in `app/tsconfig.json`, which bans constructor parameter properties.

Serialized type, declared in this file:

```ts
export type SerializedToggleNode = Spread<
  { collapsed: boolean },
  SerializedElementNode
>;
```

`Spread`, `SerializedElementNode`, `LexicalUpdateJSON`, `ElementNode`, `ElementDOMSlot`, `EditorConfig`, `LexicalNode`, and `NodeKey` all import from `lexical`. Use `type` declarations, never `interface` — `@typescript-eslint/consistent-type-definitions` is set to `'error', 'type'`.

Methods to implement:

- `static getType()` returns `'toggle'`
- `static clone(node)` constructs a new `ToggleNode` from `node.__collapsed` and `node.__key`
- `static importJSON(serializedNode)` creates an empty node and delegates to `updateFromJSON`
- `updateFromJSON(serializedNode: LexicalUpdateJSON<SerializedToggleNode>): this` calls `super.updateFromJSON` then applies `collapsed`
- `exportJSON(): SerializedToggleNode` spreads `super.exportJSON()` and adds `collapsed: this.__collapsed`
- `isCollapsed(): boolean`
- `setCollapsed(collapsed: boolean): this` — must call `this.getWritable()` before mutating, as `MentionNode.toggleMentionFormat` does
- `toggleCollapsed(): this`
- `createDOM(config: EditorConfig): HTMLElement` — builds and returns the root element described below
- `getDOMSlot(element: HTMLElement): ElementDOMSlot` — returns `super.getDOMSlot(element).withElement(contentElement)`
- `updateDOM(prevNode: this, dom: HTMLElement): boolean` — returns `false`, and when `prevNode.__collapsed !== this.__collapsed`, adds or removes the `toggle-node--collapsed` class on `dom`

A factory `$createToggleNode(collapsed = false): ToggleNode` and a guard `$isToggleNode(node: LexicalNode | null | undefined): node is ToggleNode` are exported from this file, following `$isMentionNode`'s arrow-function form.

Cross-sub-feature consumers, none of which exist inside this sub-feature: `$createToggleNode` is called by SF5's slash command `onSelect`. `$isToggleNode` is called by SF3's `ToggleGutterPlugin` to guard the click-resolved node, by SF5's `isActive` predicate, and by SF7's `ListBtn` header guard. `toggleCollapsed()` is called by SF3's `ToggleGutterPlugin`. `isCollapsed()` is read by SF6's `exportDOM` to decide the `<details open>` attribute. `setCollapsed()` is used by this file's own `updateFromJSON` and by SF6's `importDOM` conversion.

`getDOMSlot` must locate the content column from the root element it is handed. The content column is an invariant of `createDOM`, so a missing element is a programming error, not a runtime condition — resolve it by reading the root's last element child and throwing a descriptive `Error` if it is absent rather than returning a fallback slot. Do not use optional chaining to silently degrade: a wrong slot silently misplaces every child.

**UI / Visual**

`createDOM` returns a single root element with this structure. Class names are written directly in `createDOM` from string literals and the shared constant — the editor `theme` object is deliberately not extended for toggles, because these class names are structural rather than themeable and one of them must also be readable by SF3's plugin.

```text
<div class="toggle-node">                                  <- returned by createDOM
  <div class="toggle-gutter" contenteditable="false">      <- accessory, outside the children slot
    <span class="toggle-chevron"></span>
  </div>
  <div class="toggle-content"></div>                       <- getDOMSlot target: header + body render here
</div>
```

The `toggle-node--collapsed` modifier class is present on the root whenever `__collapsed` is true. `createDOM` applies it for the initial render; `updateDOM` maintains it thereafter.

`contenteditable="false"` on the gutter keeps the caret out of it. Set it via `setAttribute('contenteditable', 'false')`.

All visual styling lands in SF2. This sub-feature produces structure and class names only.

### `nodes/ToggleBodyNode.ts`

**Purpose** — The body container. Holds the collapsible content and provides the two-element structure the collapse animation requires.

**Behavior**

Extends `ElementNode`. No fields of its own — the collapsed flag lives on the parent `ToggleNode`, since the body's visibility is a property of the toggle as a whole and duplicating it would create two sources of truth.

Serialized type: `SerializedElementNode` directly. This node adds no fields, so no `Spread` and no custom serialized type are needed; `exportJSON` and `updateFromJSON` inherit from `ElementNode` and must not be overridden.

Methods to implement:

- `static getType()` returns `'toggle-body'`
- `static clone(node)` constructs a new `ToggleBodyNode` from `node.__key`
- `static importJSON(serializedNode)` creates an empty node and delegates to `updateFromJSON`
- `createDOM(config: EditorConfig): HTMLElement`
- `getDOMSlot(element: HTMLElement): ElementDOMSlot` — returns `super.getDOMSlot(element).withElement(innerElement)`
- `updateDOM(): boolean` — returns `false`

Exports `$createToggleBodyNode(): ToggleBodyNode` and `$isToggleBodyNode(node: LexicalNode | null | undefined): node is ToggleBodyNode`.

Cross-sub-feature consumers of these two symbols: `$createToggleBodyNode` is called by SF5's slash command `onSelect` in `slashCommandOptions.ts` and by SF6's `ToggleNode.importDOM` conversion in `ToggleNode.ts`. `$isToggleBodyNode` is called by SF4's `ToggleKeyboardPlugin` to identify whether the caret's block sits in a toggle body, which the Enter-on-empty-last-block escape rule depends on. Neither has a consumer inside this sub-feature.

The same invariant handling as `ToggleNode.getDOMSlot` applies: throw on a missing inner element rather than degrading.

**UI / Visual**

```text
<div class="toggle-body">
  <div class="toggle-body-inner"></div>     <- getDOMSlot target
</div>
```

The two-element structure exists solely so SF2 can animate `grid-template-rows` on the outer element while the inner element clips overflow. It is not optional — a single element cannot animate to content-determined height.

### `nodes/index.ts`

**Cleanup task, required, not optional:** this barrel currently reads `export * from './MentionNode';`. `nodes/` is a grouping folder — it organizes independent node modules and owns no domain of its own — and `export *` is banned in grouping barrels. Its sibling `plugins/index.ts` already uses explicit named exports. Convert this barrel to explicit named exports as part of this sub-feature.

Required contents after this sub-feature — explicit named exports only:

- From `./MentionNode`: `MentionNode`, `$isMentionNode`, and `SerializedMentionNode`
- From `./ToggleNode`: `ToggleNode`, `$createToggleNode`, `$isToggleNode`, and `SerializedToggleNode`
- From `./ToggleBodyNode`: `ToggleBodyNode`, `$createToggleBodyNode`, `$isToggleBodyNode`

Verify each `MentionNode` symbol against the file before writing the line — the current `export *` means the barrel has never enumerated them.

### `TextEditor.constants.ts`

Add:

```ts
export const TOGGLE_GUTTER_CLASS = 'toggle-gutter';
```

This constant has two consumers in different directories under `TextEditor/`: `nodes/ToggleNode.ts` in this sub-feature, and `plugins/ToggleGutterPlugin/ToggleGutterPlugin.ts` in SF3, where it is used for the click-target lookup. `TextEditor.constants.ts` is the smallest directory level containing both.

The existing `EXTERNAL_SYNC_TAG` export and its comment are unchanged.

### `TextEditor.tsx`

Add `ToggleNode` and `ToggleBodyNode` to the `initialConfig.nodes` array, imported from `./nodes`. Both must be registered — an unregistered node type throws at runtime the first time a document containing one is deserialized.

The `theme` object is not modified. Toggle class names are applied in `createDOM` rather than through theme lookup, per the decision recorded in `ToggleNode.ts` above.

No other change in this file for this sub-feature. `ExternalValueSyncPlugin`, `OnChangePlugin`, and the `readOnly` plugin groups are untouched here; SF3 adds the gutter plugin.

## Tests

None. The Testing Policy in `app/src/CLAUDE.md` requires tests for helper functions in `ComponentName/helper/` and util functions in `/src/util/`. This sub-feature adds neither — it adds two node classes whose methods are framework lifecycle overrides, and no free functions beyond the factories and type guards. No `helper/` directory is created.
