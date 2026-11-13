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
