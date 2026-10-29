# Sub-feature 5: TextEditor message variant with send on Enter

`TextEditor` gains a `message` variant that sends on Enter and shows no toolbar, slash commands, lists or headings. Its props `variant` and `onSubmit` have no caller until the composer of sub-feature 7.

[DEFERRED-VIOLATION: `.claude/rules/src-react-hooks.md` — `useCallback` and `useMemo` need a named consumer, in `app/src/components/TextEditor/plugins/MentionTypeaheadPlugin/MentionTypeaheadPlugin.tsx` (`onQueryChange` and `onSelectOption` are `useCallback`s with no comment naming their consumer, and `menuRenderFn` is a `useCallback` with no consumer needing a stable identity)] This sub-feature does not touch that file, and root `CLAUDE.md` — "Active check on touched files" reaches only touched files, so the cleanup stays out of this branch.

## Files affected

Modified:

- `app/src/components/TextEditor/TextEditor.tsx` — the `variant` and `onSubmit` props and the plugin set per variant

New:

- `app/src/components/TextEditor/plugins/SendOnEnterPlugin.ts`
- `app/src/components/TextEditor/plugins/__tests__/SendOnEnterPlugin.test.tsx`

Draft:

- `.claude/knowledge/lexical.md` — six entries appended while writing this spec, unreviewed (the `commandPriority` prop, the re-registered Enter listener, `COMMAND_PRIORITY_BEFORE_EDITOR`, Escape without `onQueryChange`, `fireEvent.keyDown` under jsdom, the `null` Enter event)

No change: `TextEditor/index.ts` (explicit exports of `TextEditor` and `TEXT_EDITOR_GUTTER_WIDTH`; the new props belong to the existing export), `TextEditor.css`, and `plugins/MentionTypeaheadPlugin/MentionTypeaheadPlugin.tsx` (the @ list's own Enter listener decides before the send listener, so the plugin reports nothing).

## Frontend

### TextEditor (modified)

- Purpose: one module serves the document editors and the message composer, which reuses `MentionNode` and `MentionTypeaheadPlugin` without widening the barrel.
- Behavior: `variant?: 'document' | 'message'` defaults to `'document'`, whose plugin set is unchanged. `onSubmit?: (value: string) => Promise<boolean>` is read only by the message variant. The message variant mounts `RichTextPlugin`, `HistoryPlugin`, `MarkdownShortcutPlugin` with `TYPOGRAPHIC_TRANSFORMERS` only, `ExternalValueSyncPlugin`, `OnChangePlugin` when `onChange` is given, `MentionTypeaheadPlugin` and `MentionFormatPlugin` (each when not `readOnly`, as today) and `SendOnEnterPlugin` (when `onSubmit` is given and the editor is not `readOnly`). It does not mount `FloatingToolbar`, `SlashCommandPlugin`, `ListPlugin`, `CheckListPlugin`, `TablePlugin`, `TableCellBackgroundGuardPlugin`, `TableEdgeHandlePlugin`, `TabIndentationPlugin`, `LinkPlugin`, `EmbeddedLinkPlugin`, `BlockDragHandlePlugin`, `EmptyNodeHintPlugin`, `ToggleGutterPlugin`, `ToggleKeyboardPlugin`, `ToggleHeaderGuardPlugin` and `CheckboxReadOnlyPlugin`: each of these renders only when `variant === 'document'`, besides its current `readOnly` condition. The node list is unchanged so stored states parse.
- UI / Visual: `--text-editor-gutter-width` is `'0'` when `readOnly` or `message`.

`TextEditor` passes its `onSubmit` to `SendOnEnterPlugin` and nothing else.

### SendOnEnterPlugin (new)

- Purpose: Enter sends the message, Shift+Enter breaks the line, and Enter with the @ list open picks the highlighted entity.
- Behavior: it registers `KEY_ENTER_COMMAND` at `COMMAND_PRIORITY_BEFORE_EDITOR` and returns the unregister; one comment at the registration says the @ list's Enter listener runs first, at `COMMAND_PRIORITY_LOW`, so a send never preempts a pick. [Rationale: see the root file's "Send on Enter runs at `COMMAND_PRIORITY_BEFORE_EDITOR`, after the mention menu's own listener".] The @ list's listener takes the key while its menu has a selected option, and this listener runs only for an Enter it did not take: no menu, a closed one (unmounted, its listener unregistered) or one with no selected option [spec-writer_1, spec-writer_2, spec-writer_3: `.claude/knowledge/lexical.md`, the entries on the typeahead's `commandPriority`, the re-registered Enter listener and `COMMAND_PRIORITY_BEFORE_EDITOR`]. The listener returns false and does nothing when `shiftKey` is set or the event is null, so the default handler runs: the library dispatches Enter with a `null` event when a composition ends on a line break [spec-writer_32: `app/node_modules/lexical/src/LexicalEvents.ts:1564` — `dispatchCommand(editor, KEY_ENTER_COMMAND, null)`; `app/node_modules/@lexical/react/src/shared/LexicalMenu.tsx:571-577` — the library's own Enter listener takes `KeyboardEvent | null`]. Otherwise it calls `event.preventDefault()` itself (a listener returning true does not, `.claude/knowledge/lexical.md`), returns true and: stops when the root's trimmed `getTextContent()` is empty; else takes `JSON.stringify(editor.getEditorState().toJSON())`, awaits `onSubmit` of it, and on `true` clears the editor (`$getRoot().clear()` plus an empty paragraph in `editor.update`, then `CLEAR_HISTORY_COMMAND`) only when the editor still serialises to the string that was sent. A `false` result keeps the text. No try/catch: a rejected write reaches the Error Boundary through the mutation's `throwOnError`.
- UI / Visual: none; it renders nothing.

```ts
type SendOnEnterProps = {
  onSubmit: (value: string) => Promise<boolean>;
};

declare const SendOnEnterPlugin: FCProps<SendOnEnterProps>;
```

[spec-writer_33: ran `npx tsc --noEmit` and `npx eslint` from `app/` on this block with `import type { FCProps } from '@/types/fcProps.type'` as a scratch `.ts` in `app/src/components/TextEditor/plugins/` — tsc exit 0; eslint only `local/no-unused-exports` on the scratch's own export; deleted]

## Behaviours and their defect

`SendOnEnterPlugin.test.tsx` mounts the plugin in a `LexicalComposer` with `RichTextPlugin`, sets content through `editor.update`, and presses keys with `fireEvent.keyDown` on the `contenteditable` element, which reaches the listener under jsdom [spec-writer_5, `.claude/knowledge/lexical.md`].

- Enter with text calls `onSubmit` once with the serialised state and prevents the default action. Defect: a native newline beside the send, or a wrong payload.
- Shift+Enter calls nothing and leaves the default action alone. Defect: Shift+Enter sending.
- Enter while a probe `KEY_ENTER_COMMAND` listener at `COMMAND_PRIORITY_LOW` returns true calls nothing. The probe is registered on the same editor after the plugin has mounted, so a registration of the plugin at LOW would also run before it. Defect: the send listener registered at HIGH, NORMAL or LOW, which sends before the @ list picks.
- Enter while that probe returns false calls `onSubmit` once. Defect: the send listener registered below `COMMAND_PRIORITY_BEFORE_EDITOR` (at `COMMAND_PRIORITY_EDITOR`), behind the rich-text Enter handler, which never lets it run.
- Enter dispatched with a `null` event calls nothing and does not throw. Defect: a listener that reads `event.shiftKey` or calls `event.preventDefault()` on `null`.
- Enter on empty or whitespace-only content calls nothing and prevents the default action. Defect: an empty message recorded, or a blank line.
- The editor is empty after `onSubmit` resolves true and keeps its text after false. Defect: a draft lost on a refused write.
- Text typed while `onSubmit` is pending survives its resolution. Defect: a clear that swallows later typing.

[MANUAL-VERIFY] After sub-feature 7 mounts the composer, in web mode: type `@` and the first letters of an existing entity, press Enter once: the composer holds that entity as a mention, the log's entry count is unchanged, and a second Enter adds one entry. Only a real menu proves the library's listener takes the key ahead of the send listener.

[MANUAL-VERIFY] After sub-feature 7, in web mode: type `@gob`, press Escape (the list closes), press Enter: the message is sent and the composer is empty. Only a real menu proves that Escape unmounts it (`LexicalMenu` renders only while the typeahead's resolution is set, `app/node_modules/@lexical/react/src/LexicalTypeaheadMenuPlugin.tsx:176-190,288-303`) and with it the menu's Enter listener.

[MANUAL-VERIFY] After sub-feature 7, in web mode: send a message that is only a mention: one new bubble appears showing the mention.

## Verification

After the check rows pass and before the commit, run `pnpm run mutation-check -- app/src/components/TextEditor/plugins/SendOnEnterPlugin.ts` from the repository root and resolve every survivor.
