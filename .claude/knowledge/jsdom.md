# jsdom

## jsdom does not compute layout

**Verified at:** jsdom 30.1.1, read 2026-10-20
**Citation:** [instruction-pass_12: app/node_modules/.pnpm/jsdom@30.1.1/node_modules/jsdom/README.md:527-538 — "Layout" is listed as unimplemented; many layout-related properties return zeros]

Many layout-related values, such as `offsetTop`, read as zeros in a jsdom test.

## jsdom 30.1.1 steps a number input only through its `stepUp()` and `stepDown()` methods and has no ArrowUp or ArrowDown key handling

**Verified at:** jsdom 30.1.1, read 2026-10-20
**Citation:** [spec-writer_4: grep ArrowUp app/node_modules/jsdom/lib/jsdom/living --include='*.js' -l — not found; app/node_modules/jsdom/lib/jsdom/living/nodes/HTMLInputElement-impl.js:573-574 — `stepUp(n = 1)` calls `_stepUpdate(n, true)`]

A dispatched `keydown` of `ArrowUp` on a number input therefore leaves its value unchanged in a jsdom test, so no test in this project can pin keyboard stepping.

## The global `DragEvent` is not defined in this project's Vitest jsdom environment, so Lexical's rich-text `DROP_COMMAND` handler throws a `ReferenceError` when a test dispatches a drop that no earlier listener handles

**Verified at:** jsdom 30.1.1
**Citation:** [implement_1: ran `npx vitest run` on `app/src/components/TextEditor/plugins/BlockDragHandlePlugin/__tests__/BlockDragHandlePlugin.test.tsx` with a drop dispatched as a `MouseEvent` and no listener handling it — observed `ReferenceError: DragEvent is not defined` from `eventFiles` in `app/node_modules/.pnpm/@lexical+utils@0.52.0_typescript@6.0.3/node_modules/@lexical/utils/dist/LexicalUtils.dev.js:1086`; the test's `TestDragEvent`, a `MouseEvent` subclass with a `dataTransfer` field, assigned through `vi.stubGlobal('DragEvent', TestDragEvent)`, made it pass]

A drag test whose drop can reach Lexical's own drop handler stubs the global the same way.

## A `PASTE_COMMAND` dispatched in a jsdom test needs `DragEvent` and `ClipboardEvent` globals and a `files` array on the event's `clipboardData`, because Lexical's rich-text handler reads all three when no earlier listener handles the paste

**Verified at:** jsdom 30.1.1, @lexical/utils 0.52.0, @lexical/rich-text 0.52.0
**Citation:** [implement_1: ran `npx vitest run` on `app/src/components/TextEditor/plugins/TogglePastePlugin/__tests__/TogglePastePlugin.test.tsx` with a paste dispatched as a plain `Event` carrying a `clipboardData` object — observed `ReferenceError: DragEvent is not defined`, then `ReferenceError: ClipboardEvent is not defined`, then `TypeError: undefined is not iterable` from `eventFiles` at `app/node_modules/.pnpm/@lexical+utils@0.52.0_typescript@6.0.3/node_modules/@lexical/utils/dist/LexicalUtils.dev.js:1086-1097`; stubbing both globals with `vi.stubGlobal` and adding `files: []` made it pass]

The test's paste event is an instance of the stubbed `ClipboardEvent`, since `eventFiles` compares the event's constructor name.

## The selection read after an awaited `act` can differ from the one `editor.read` returns right after a command

**Verified at:** lexical 0.52.0, jsdom 30.1.1
**Citation:** [implement_1: ran a scratch `npx vitest run` test that put a caret at offset 0 of a header's text after an empty paragraph, dispatched `KEY_ENTER_COMMAND`, and read the selection twice — observed a text point on the header's text right after the command through `editor.read`, and an element point on the preceding empty paragraph after an awaited `act`]

The cause was not established; a test that asserts where a handler left the caret reads it through `editor.read` right after the command inside a synchronous `act`.
