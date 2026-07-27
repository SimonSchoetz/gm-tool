# SF6 — HTML export and import

Makes toggles survive copy-paste across applications by serializing them as `<details>`/`<summary>` and accepting the same structure back. Purely additive — no in-editor behavior changes.

## Files affected

**Modified:**

- `app/src/components/TextEditor/nodes/ToggleNode.ts` — add `exportDOM` and `static importDOM`
- `app/src/components/TextEditor/nodes/ToggleBodyNode.ts` — add `exportDOM`

## Frontend

### `nodes/ToggleNode.ts`

**Purpose** — `<details>` is the correct static HTML representation of a disclosure. It cannot be the editor's live DOM, because a `DOMSlot` exposes exactly one content-bearing element and the header would have to render inside `<summary>` while the body renders outside it. At the export boundary that constraint does not apply: the DOM is generated once, not reconciled, and `DOMExportOutput` provides a post-construction hook that can restructure it.

**Behavior — `exportDOM(editor: LexicalEditor): DOMExportOutput`**

Return an object with both fields:

- `element` — a `<details>` element. Set the `open` attribute when the node is **not** collapsed, and omit it when it is. `open` is a boolean attribute: set it with `setAttribute('open', '')` and simply do not set it otherwise. Do not set `open="false"` — the attribute's presence, not its value, is what browsers read.
- `after` — a callback that receives the generated element with all children already appended, and wraps the **first** child element in a `<summary>` element in place, returning the element.

`DOMExportOutput.after` is documented as running "after the node and all of its children are constructed," receiving `element` after children are appended, and may perform in-place updates. That ordering is what makes this work: at `element` construction time the header does not exist yet, so the wrapping cannot happen in `exportDOM`'s body.

The first child is the header by construction — `ToggleNode` always has exactly two children, header then body. Guard for its absence anyway and return the element unchanged in that case rather than throwing: export runs over arbitrary document content, including states produced by an interrupted edit, and a copy operation must not fail.

The resulting shape:

```text
<details open>
  <summary><h2>Header text</h2></summary>
  <div>…body blocks…</div>
</details>
```

**Behavior — `static importDOM(): DOMConversionMap | null`**

Return a map keyed on `details`, following the shape `MentionNode.importDOM` already uses in this directory: a function receiving the DOM node and returning `{ conversion, priority }`, with `priority: 1`.

The conversion function returns a `DOMConversionOutput`:

- `node` — a new `ToggleNode`, collapsed when the source element has no `open` attribute and expanded when it does.
- `after` — a callback receiving the converted child Lexical nodes, which restructures them into the required two-child shape: the first converted node becomes the header, and every remaining node is appended into a new `ToggleBodyNode`. Return the resulting two-node array.

The `after` callback must normalize two cases the source HTML may present:

- The first child is not a paragraph or heading — wrap its content in a `ParagraphNode`, so the header constraint holds from the moment the node enters the document. SF4's header guard transform would otherwise fire immediately after paste and produce a visible correction.
- There are no children beyond the first — append an empty `ParagraphNode` to the `ToggleBodyNode`, so the body is never empty.

Pasted `<details>` from an unknown source may nest arbitrarily; no special handling is required, because a nested `<details>` inside the body converts through this same map.

### `nodes/ToggleBodyNode.ts`

**Behavior — `exportDOM(editor: LexicalEditor): DOMExportOutput`**

Return `{ element }` with a plain `<div>`. No `after` callback and no attributes.

`ToggleBodyNode` deliberately does not register an `importDOM`. A bare `<div>` carries no signal that it was a toggle body, and claiming the `div` tag in a conversion map would capture every unrelated pasted `<div>` in the document. The body is reconstructed by `ToggleNode`'s conversion `after` callback instead, which is the only context where a `<div>` is known to be a toggle body.

**UI / Visual**

None for either file. Export and import produce no rendered editor UI; the in-editor DOM is unchanged and remains the structure specified in SF1.

## Tests

None. Both additions are framework serialization overrides on node classes, and neither introduces a `helper/` function. Consistent with SF1, which established that these node classes carry no helper directory.
