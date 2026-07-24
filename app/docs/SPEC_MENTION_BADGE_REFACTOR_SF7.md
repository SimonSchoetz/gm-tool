# SF7: Toolbar active-state extension

`TextFormatBtn`'s current active-state check only inspects a `RangeSelection`'s own `hasFormat`, which — per the root spec's Key Architectural Decisions — never reflects a `MentionNode`'s format, since `MentionNode` is invisible to Lexical's native format pipeline. This sub-feature extends the check so the toolbar correctly highlights when a selected mention (or a selection spanning a mention) already has the format active.

## Files affected

**Modified:**

- `TextEditor/components/FloatingToolbar/components/TextFormattingRow/components/TextFormatBtn/TextFormatBtn.tsx`

## Layered breakdown

### Frontend — `TextFormatBtn.tsx`

Add `$isMentionNode` to the imports. From this file's location (`TextEditor/components/FloatingToolbar/components/TextFormattingRow/components/TextFormatBtn/TextFormatBtn.tsx`), the node module (`TextEditor/nodes/`) is six directories up:

```ts
import { $isMentionNode } from '../../../../../../nodes';
```

Replace `handleStateUpdate`:

```ts
const handleStateUpdate = useCallback(() => {
  const selection = $getSelection();
  if (selection === null) {
    setIsActive(false);
    return;
  }

  const mentionNodes = selection.getNodes().filter($isMentionNode);

  if ($isRangeSelection(selection)) {
    const hasFormattedMention = mentionNodes.some((node) =>
      node.getMentionFormats().includes(formatType),
    );
    setIsActive(selection.hasFormat(formatType) || hasFormattedMention);
    return;
  }

  setIsActive(
    mentionNodes.length > 0 &&
      mentionNodes.every((node) => node.getMentionFormats().includes(formatType)),
  );
}, [formatType]);
```

Two selection shapes, two distinct rules:

- **`RangeSelection`** (a ranged selection, possibly spanning both text and one or more mentions): active if the text portion has the format (`selection.hasFormat`, unchanged native behavior) **or** any mention within the selection has it. This is an explicit `OR`, not a requirement that every node share the format — a selection spanning "some bold text and one non-bold mention" already shows active under native `hasFormat` semantics for the text-only case, and this extension does not tighten that; it only adds mentions as an additional way to be active.
- **`NodeSelection`** (one or more decorator nodes selected as whole units, e.g. via keyboard navigation, with no ranged text involved): active only if every selected mention has the format — no `RangeSelection.hasFormat` exists for this selection type to combine with.

No other part of `TextFormatBtn.tsx` changes — `handleFormat`, the registered listeners, and the rendered `BaseBtn` are unaffected.

## Test coverage

No test file is added. `TextFormatBtn.tsx` is a component (its export returns JSX); the root Testing Policy forbids component tests, and this change has no extracted helper — the logic above is inline in the existing `handleStateUpdate` callback, matching the file's current structure.
