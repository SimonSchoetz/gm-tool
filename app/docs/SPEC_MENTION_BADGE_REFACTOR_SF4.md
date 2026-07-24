# SF4: MentionNode clipboard support

Adds `exportDOM`/`static importDOM` to `MentionNode`, the two overrides it currently lacks. `getTextContent()` (`@{displayName}`) already exists and is unchanged — this sub-feature adds the HTML-level clipboard representation, which is what lets a copied mention badge round-trip through paste as a real, reconstructable element instead of an empty node, and gives an external, non-Lexical paste destination a readable `<span>@DisplayName</span>` instead of nothing.

## Files affected

**Modified:**

- `TextEditor/nodes/MentionNode.tsx`

## Layered breakdown

### Frontend — `TextEditor/nodes/MentionNode.tsx`

Add one module-level function above the `MentionNode` class (kept inline in this file, not extracted to a `helper/` directory — `TextEditor/nodes/` is not a `components/`-style folder and this codebase's existing precedent for a Lexical node/plugin's own small supporting function is to keep it inline, e.g. `EmbeddedLinkPlugin.tsx`'s `isHttpUrl`):

```ts
const convertMentionElement = (
  domNode: HTMLElement,
): DOMConversionOutput | null => {
  const entityId = domNode.getAttribute('data-lexical-mention-entity-id');
  const entityType = domNode.getAttribute('data-lexical-mention-entity-type');
  if (!entityId || !entityType) return null;

  const adventureId = domNode.getAttribute(
    'data-lexical-mention-adventure-id',
  );
  const displayName = (domNode.textContent ?? '').replace(/^@/, '');

  return {
    node: new MentionNode(entityId, entityType, displayName, '', adventureId),
  };
};
```

The reconstructed node's `color` is an empty string — it is not recoverable from the DOM and is not needed to be: `MentionBadge` (SF8) always resolves the live color from `useTableConfigs()` and opportunistically re-snapshots the node the moment resolution succeeds, so this placeholder self-corrects immediately after paste rather than persisting.

Add to the `MentionNode` class body, after the existing `static importJSON` method:

```ts
exportDOM(): DOMExportOutput {
  const element = document.createElement('span');
  element.setAttribute('data-lexical-mention-entity-id', this.__entityId);
  element.setAttribute(
    'data-lexical-mention-entity-type',
    this.__entityType,
  );
  if (this.__adventureId !== null) {
    element.setAttribute(
      'data-lexical-mention-adventure-id',
      this.__adventureId,
    );
  }
  element.textContent = this.getTextContent();
  return { element };
}

static importDOM(): DOMConversionMap | null {
  return {
    span: (domNode: HTMLElement) => {
      if (!domNode.hasAttribute('data-lexical-mention-entity-id')) {
        return null;
      }
      return {
        conversion: convertMentionElement,
        priority: 1,
      };
    },
  };
}
```

`priority: 1` is deliberate: Lexical's default conversion for a bare `<span>` (no special attributes) has no competing claim on this element, but explicitly stating a priority above the unset default (`0`) makes this node's claim on `data-lexical-mention-entity-id`-bearing spans unambiguous should another node type ever register a `span` converter in the same editor.

Update the existing `import` statement at the top of the file to add the two new types used above (`DOMConversionMap`, `DOMConversionOutput`, `DOMExportOutput`) to the existing `from 'lexical'` import:

```ts
import {
  DecoratorNode,
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  NodeKey,
  SerializedLexicalNode,
} from 'lexical';
```

No change to `SerializedMentionNode`, `exportJSON`, `importJSON`, `clone`, or the constructor in this sub-feature — those are unaffected by clipboard support. SF5 changes the constructor and `SerializedMentionNode` for format support; this sub-feature does not touch either.

## Test coverage

No test file is added. `TextEditor/nodes/MentionNode.tsx` is a Lexical node class, not a helper function, a util function, or a component (its exported class does not itself return JSX — only `decorate()` does) — it falls outside all three categories the root Testing Policy requires or forbids tests for, and no other node file in this codebase (there is only one, `MentionNode.tsx`) has an established test precedent either way.
