# Lexical

## `LexicalTypeaheadMenuPlugin`, `MenuOption`, `useBasicTypeaheadTriggerMatch` are exported from `@lexical/react/LexicalTypeaheadMenuPlugin`

**Verified at:** @lexical/react 0.46.0
**Citation:** [S_1: app/node_modules/@lexical/react/dist/LexicalTypeaheadMenuPlugin.d.ts:40-73]

`useBasicTypeaheadTriggerMatch(trigger: string, { minLength?, maxLength?, punctuation?, allowWhitespace? }): TriggerFn` — `allowWhitespace` is present at this version. `onSelectOption` has signature `(option: TOption, textNodeContainingQuery: TextNode | null, closeMenu: () => void, matchingString: string) => void`; a consumer may omit trailing parameters it does not use (standard TS function-type contravariance) — `MentionTypeaheadPlugin.tsx` and the new `SlashCommandPlugin.tsx` both omit `matchingString`. `MenuOption`'s constructor is `constructor(key: string)`, and the base class already declares `icon?: JSX.Element` and `title?: JSX.Element | string` as public fields — a subclass field named `icon` typed as a component reference (e.g. `LucideIcon`) is not assignable to `JSX.Element` and is a TS compile error; subclasses needing an icon-component reference must use a different field name.

## `@lexical/table` is a transitive-only dependency in this repo — not declared in `package.json`

**Verified at:** @lexical/table 0.46.0 (matches installed `@lexical/react`/`lexical` version)
**Citation:** [S_2: app/node_modules/@lexical/table/package.json:2; grep '@lexical' app/package.json — `@lexical/table` absent]

`TableNode`, `TableRowNode`, `TableCellNode`, and `INSERT_TABLE_COMMAND` (payload `{ columns: string; rows: string; includeHeaders?: boolean | { rows: boolean; columns: boolean } }`) are exported from `@lexical/table` [app/node_modules/@lexical/table/dist/index.d.ts:9-19]. `TablePlugin` (no required props; all of `hasCellMerge`/`hasCellBackgroundColor`/`hasTabHandler`/`hasHorizontalScroll`/`hasNestedTables` default `true`/`false` per its own doc comment) is exported from `@lexical/react/LexicalTablePlugin` [app/node_modules/@lexical/react/dist/LexicalTablePlugin.d.ts:12-46]. Any feature that dispatches `INSERT_TABLE_COMMAND` must (1) add `@lexical/table` as a direct `package.json` dependency, (2) register `TableNode`, `TableRowNode`, `TableCellNode` in the editor's `nodes` array, and (3) render `<TablePlugin />` — otherwise the command throws at runtime because the node types are unregistered.

## Nested/reentrant `editor.update()` and `editor.dispatchCommand()` calls made from inside an active update are queued, not dropped

**Verified at:** lexical 0.46.0
**Citation:** [S_3: app/node_modules/lexical/src/LexicalUpdates.ts:1288-1298 (`updateEditor` pushes to `editor._updates` when `editor._updating` is true, rather than running immediately) and app/node_modules/lexical/src/LexicalUtils.ts:1519-1525 (`dispatchCommand` → `triggerCommandListeners`); cross-checked against facebook/lexical's shipped `lexical-playground/src/plugins/ComponentPickerPlugin/index.tsx` (WebFetch), whose heading options call `editor.update()` from inside the outer `onSelectOption`'s `editor.update()`, and whose list options call `editor.dispatchCommand()` the same way]

Calling `editor.update()` or `editor.dispatchCommand()` from inside another editor.update() callback for the same editor does not run synchronously in place — it is queued (`editor._updates`) and flushed by `$triggerEnqueuedUpdates`, still within the same synchronous flush cycle before control returns to the caller. This is the verified basis for a typeahead `onSelectOption` calling `option.onSelect(editor)` — where `onSelect` itself calls `editor.update()` or `editor.dispatchCommand()` — from inside `onSelectOption`'s own outer `editor.update()` call.
