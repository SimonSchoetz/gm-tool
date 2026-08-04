# ESLint

## `react-hooks/refs` does not fire on `ref.current` reads inside a `useLayoutEffect` callback

**Verified at:** eslint-plugin-react-hooks 7.1.1, `reactHooks.configs.flat.recommended` as configured in app/eslint.config.js

**Citation:** [spec-writer_30: ran `npx eslint src/scratch-typographic-probe.ts` from `app/` against a disposable hook that declares `useRef<HTMLInputElement | null>(null)` plus a second `useRef<number | null>(null)`, reads both `.current` values at the top of a dependency-array-less `useLayoutEffect`, writes one of them, and calls `input.setSelectionRange(...)` — observed exit code 0, no diagnostics; `npx tsc --noEmit` over the same file reported nothing under `strict`, `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`, and `exactOptionalPropertyTypes`]

`react-hooks/refs` targets ref access during render only — reading and writing `ref.current` inside an effect callback (including `useLayoutEffect`) is not flagged. This is distinct from `react-hooks/set-state-in-effect`, which does fire on a `setState` call at an effect's top level; a `useLayoutEffect` that only performs imperative DOM work (caret placement via `setSelectionRange`, focus, scroll) triggers neither rule and needs no suppression. A `useLayoutEffect` with no dependency array — intentionally running after every render — is likewise not flagged by `react-hooks/exhaustive-deps`.

## Flat config local/inline plugin rules require ESM `export default`, not CommonJS `module.exports`, in a `"type": "module"` project

**Verified at:** eslint 10.6.0
**Citation:** [ran `npx eslint` against a rule file using `module.exports = {...}` in this repo (`app/package.json` has `"type": "module"`) — observed `SyntaxError: The requested module './eslint-rules/no-wrapped-line-comments.js' does not provide an export named 'default'` at config-load time, before the rule module ever executes]

A local ESLint rule file registered via flat config's `plugins: { local: { rules: { 'rule-name': ruleModule } } }` must use `export default { meta, create }` when the file is loaded under `"type": "module"`. Node's ESM loader performs static export analysis on `.js` files at parse time when the nearest `package.json` declares `"type": "module"` — it does not sniff for CommonJS syntax. A file containing `module.exports = {...}` has zero `export` statements from the ESM parser's perspective, so the import fails with a missing-default-export SyntaxError without ever executing the module body (not a `ReferenceError: module is not defined`, which would only occur if the assignment executed).

## `context.sourceCode.getAllComments()` returns `ast.comments`; comment nodes have `.type` (`'Line'` \| `'Block'`), `.value`, `.loc`

**Verified at:** eslint 10.6.0
**Citation:** [source read: `node_modules/eslint/lib/languages/js/source-code/source-code.js` — `getAllComments() { return this.ast.comments; }`; `node_modules/eslint/lib/rules/capitalized-comments.js` — confirms modern rules access it via `context.sourceCode` (not the deprecated `context.getSourceCode()`), and use `sourceCode.getTokenBefore(comment, { includeComments: true })` to detect adjacency between a comment and the token/comment immediately preceding it]

`Program:exit` is a reliable place to run a full-file comment scan, since comments aren't part of the primary AST traversal ESLint visits by default — they must be pulled via `sourceCode.getAllComments()`. `getTokenBefore(node, { includeComments: true })` is the mechanism for confirming no code statement or other comment sits between two comment nodes (needed to detect "consecutive" comment runs with no intervening code).

## Core `multiline-comment-style` rule does not detect manually-wrapped single-sentence comments — it only enforces block-vs-line comment style consistency, and is deprecated

**Verified at:** eslint 10.6.0
**Citation:** [type declaration read: `node_modules/eslint/lib/types/rules.d.ts` — `"multiline-comment-style": Linter.RuleEntry<["starred-block" | "bare-block" | "separate-lines"]>`, marked `@deprecated since 8.53.0`, superseded by `@stylistic/eslint-plugin` (not installed in this repo)]

No ESLint core or already-installed plugin rule (`@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`) detects a single sentence manually split across consecutive `//` line comments — `multiline-comment-style`'s three options only govern which comment *form* to use (JSDoc-style block, bare block, or separate `//` lines), not whether a line comment's content is grammatically complete on its own line. A rule targeting this pattern must be custom-written.
