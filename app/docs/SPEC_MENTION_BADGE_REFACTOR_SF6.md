# SF6: MentionFormatPlugin

Registers a `FORMAT_TEXT_COMMAND` listener that toggles SF5's custom format field on any `MentionNode` present in the current selection, without swallowing the command — Lexical's own default handler (registered by `RichTextPlugin`, already mounted in `TextEditor.tsx`) independently continues to format any `TextNode` portions of a mixed selection, since this plugin's listener always returns `false`.

## Files affected

**New:**

- `TextEditor/plugins/MentionFormatPlugin/MentionFormatPlugin.tsx`

**Modified:**

- `TextEditor/plugins/index.ts` — add one export line
- `TextEditor/TextEditor.tsx` — import and mount the plugin

## Layered breakdown

### Frontend — `TextEditor/plugins/MentionFormatPlugin/MentionFormatPlugin.tsx` (new)

```tsx
import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { FORMAT_TEXT_COMMAND, COMMAND_PRIORITY_LOW, $getSelection } from 'lexical';
import { $isMentionNode } from '../../nodes';

export const MentionFormatPlugin = () => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      FORMAT_TEXT_COMMAND,
      (formatType) => {
        const selection = $getSelection();
        if (selection === null) return false;

        selection
          .getNodes()
          .filter($isMentionNode)
          .forEach((node) => node.toggleMentionFormat(formatType));

        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor]);

  return null;
};
```

`selection.getNodes()` is declared on the shared `BaseSelection` interface (`lexical/dist/LexicalSelection.d.ts:54`) — both `RangeSelection` (a ranged text selection) and `NodeSelection` (a single decorator node selected as a whole, e.g. via keyboard navigation) implement it, so no selection-type narrowing is needed before calling it. Returning `false` unconditionally means this listener only ever adds a side effect (toggling any mention's format) — it never claims to have "handled" the command, so `RichTextPlugin`'s own listener (registered at Lexical's lowest priority, `COMMAND_PRIORITY_EDITOR`) still runs afterward and independently formats any selected `TextNode`s. `COMMAND_PRIORITY_LOW` matches the priority already used by this codebase's other command registrations in `EmbeddedLinkPlugin.tsx` and `MentionTypeaheadPlugin.tsx`.

### Frontend — `TextEditor/plugins/index.ts` (modified)

Add, alongside the existing plugin exports:

```ts
export { MentionFormatPlugin } from './MentionFormatPlugin/MentionFormatPlugin';
```

### Frontend — `TextEditor/TextEditor.tsx` (modified)

Add `MentionFormatPlugin` to the existing named import from `./plugins`, and mount it in the same `{!readOnly && ...}`-gated group as `MentionTypeaheadPlugin`/`SlashCommandPlugin`/`TableEdgeHandlePlugin` (formatting is an edit-time concern; a read-only editor never mounts `FloatingToolbar` either, so there is no way to dispatch `FORMAT_TEXT_COMMAND` in read-only mode in the first place):

```tsx
{!readOnly && <MentionTypeaheadPlugin />}
{!readOnly && <SlashCommandPlugin />}
{!readOnly && <TableEdgeHandlePlugin />}
{!readOnly && <MentionFormatPlugin />}
{!readOnly && <EmptyNodeHintPlugin />}
```

## Test coverage

No test file is added. `MentionFormatPlugin` is a component (returns `null`, which is still a component per the "exported function returns JSX or null from a component-shaped export" convention already followed by every other plugin in `TextEditor/plugins/` — none of which have test files) registering a command listener; the root Testing Policy forbids component tests, and this plugin has no extracted helper logic to test separately — its entire body is the command registration and node lookup, inline, matching every existing plugin in this directory (none extract a `helper/`).
