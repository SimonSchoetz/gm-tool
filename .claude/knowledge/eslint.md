# ESLint

## `react-hooks/refs` does not fire on `ref.current` reads inside a `useLayoutEffect` callback

**Verified at:** eslint-plugin-react-hooks 7.1.1, `reactHooks.configs.flat.recommended` as configured in app/eslint.config.js

**Citation:** [spec-writer_30: ran `npx eslint src/scratch-typographic-probe.ts` from `app/` against a disposable hook that declares `useRef<HTMLInputElement | null>(null)` plus a second `useRef<number | null>(null)`, reads both `.current` values at the top of a dependency-array-less `useLayoutEffect`, writes one of them, and calls `input.setSelectionRange(...)` — observed exit code 0, no diagnostics; `npx tsc --noEmit` over the same file reported nothing under `strict`, `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`, and `exactOptionalPropertyTypes`]

`react-hooks/refs` targets ref access during render only — reading and writing `ref.current` inside an effect callback (including `useLayoutEffect`) is not flagged. This is distinct from `react-hooks/set-state-in-effect`, which does fire on a `setState` call at an effect's top level; a `useLayoutEffect` that only performs imperative DOM work (caret placement via `setSelectionRange`, focus, scroll) triggers neither rule and needs no suppression. A `useLayoutEffect` with no dependency array — intentionally running after every render — is likewise not flagged by `react-hooks/exhaustive-deps`.

## `react-hooks/set-state-in-effect` fires on a `setState` call written directly at a `useEffect` callback's top level, but not on one nested inside a listener/subscription callback registered within that effect

**Verified at:** eslint-plugin-react-hooks 7.1.1, `reactHooks.configs.flat.recommended` as configured in app/eslint.config.js

**Citation:** [spec-writer_16: ran `npx eslint` from `app/` against a disposable component calling `setAnchorElem(editor.getRootElement())` directly at a `useEffect`'s top level — observed exit code 1, `react-hooks/set-state-in-effect` error "Avoid calling setState() directly within an effect"; ran the same tool against the same component rewritten to `useEffect(() => editor.registerRootListener((root) => { setAnchorElem(root); }), [editor])` — observed exit code 0, no diagnostics; `npx tsc --noEmit` reported nothing for either version]

A value with no synchronous source that must be read once and then kept current (e.g. an editor's root DOM element, only available after a sibling component's ref commits) cannot be captured via a bare `useEffect(() => { setState(getValue()); }, [dep])` — this trips `react-hooks/set-state-in-effect` regardless of the dependency array. The rule's own suggested fix (subscribe to the external system, call `setState` from inside the subscription callback) is not just style guidance — it is what the lint rule mechanically requires: wrap the read in whatever subscription API the source exposes and call `setState` inside that callback, not synchronously in the effect body. For Lexical's editor root element specifically, `editor.registerRootListener((rootElement) => { ... })` (from `lexical`, `LexicalEditor.registerRootListener`) is the source's own documented mechanism for this, called out directly in `getRootElement()`'s own doc comment ("if you need to know the current root element, or you need to attach an event listener, do it via `registerRootListener`, since this reference may not be stable").

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

## An inline arrow `component` in a TanStack `createFileRoute` options object passes this project's lint config, including `reactRefresh.configs.vite()`

**Verified at:** eslint-plugin-react-refresh ^0.5.3, as configured in app/eslint.config.js
**Citation:** [spec-writer_3: ran `npx eslint src/routes/zz-scratch-inline-component.tsx` from `app/` against a disposable route file exporting only `export const Route = createFileRoute('/adventure/$adventureId/npcs')({ component: () => <NpcsScreen /> })` — observed exit code 0, no diagnostics]

A route file whose only export is `Route` may declare its `component` as an unexported inline arrow that renders a screen with a static prop (e.g. `component: () => <Screen entityType='npcs' />`); `react-refresh/only-export-components` does not flag it, so a per-route static prop needs no separately exported wrapper component.

## `react-hooks/exhaustive-deps` requires the mutation object itself, not its `.mutate`, in the dependencies of a `useMemo` whose callback calls `updateMutation.mutate(...)`

**Verified at:** eslint-plugin-react-hooks 7.1.1, `reactHooks.configs.flat.recommended` as configured in app/eslint.config.js, run 2026-09-19

**Citation:** [spec-writer_55: ran `npx eslint` on a scratch copy of a data-access hook whose `useMemo` callback calls `updateMutation.mutate({ id, data })` inside a nested callback — observed "React Hook useMemo has a missing dependency: 'updateMutation'" with `[]`, and no finding with `[updateMutation]`]

The memo is therefore keyed on `updateMutation`, which `useMutation` rebuilds on every render (`.claude/knowledge/tanstack-query.md`), so it recomputes each time.

## `@typescript-eslint/no-invalid-void-type` rejects `void` as the type argument of `Promise.withResolvers<void>()`

**Verified at:** typescript-eslint 8.70.0, `tseslint.configs.strictTypeChecked` as configured in app/eslint.config.js, run 2026-09-21
**Citation:** [implement_1: ran `npx eslint .` from `app/` with `const firstUpsertDone = Promise.withResolvers<void>();` in `services/__tests__/syncService.test.ts` — observed `error  void is only valid as a return type or generic type argument  @typescript-eslint/no-invalid-void-type` on that type argument; with `Promise.withResolvers<null>()` and `resolve(null)` the run reported no problems]

Although the message names generic type arguments as allowed, this config flags `void` in the type argument of a `Promise.withResolvers` call. A deferred used only as a signal, whose value is never read, therefore takes a non-`void` type argument such as `null` and is resolved with that value.

## `eslint-plugin-import-x` 4.17.1 declares ESLint 10 in its peer range and exports the plugin both as the default export and as the named export `importX`

**Verified at:** eslint-plugin-import-x 4.17.1
**Citation:** [architect_2: ran `npm view eslint-plugin-import-x version peerDependencies` — observed `4.17.1`, peers `eslint: '^8.57.0 || ^9.0.0 || ^10.0.0'`, `@typescript-eslint/utils: '^8.56.0'`, `eslint-import-resolver-node: '*'`] [spec-writer_1: https://unpkg.com/eslint-plugin-import-x@4.17.1/lib/index.d.ts]

The declarations contain `export default plugin` and `export { …, plugin as importX, … }`, and also export `createNodeResolver`. The plugin object carries `meta`, `rules`, `configs` and `flatConfigs`.

## `import-x/no-cycle` ignores TypeScript type-only imports and is documented as computationally expensive, with `maxDepth` and `ignoreExternal` to limit its cost

**Verified at:** https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/no-cycle.md, 2026-09-30 (default-branch docs; the latest release that day was 4.17.1)
**Citation:** [architect_3: https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/no-cycle.md] [architect_2: ran `npm view eslint-plugin-import-x version` — observed `4.17.1`]

The docs state that the rule "ensures that there is no resolvable path back to this module via its dependencies", that it ignores type-only imports in Flow and TypeScript, and that it is "comparatively computationally expensive". `maxDepth` limits the depth checked, and `ignoreExternal: true` stops it from expanding into external modules.

## `eslint-import-resolver-typescript` 4.4.5 provides `createTypeScriptImportResolver` for the `import-x/resolver-next` setting, and its README lists using tsconfig `paths` among its features

**Verified at:** https://github.com/import-js/eslint-import-resolver-typescript/blob/master/README.md, 2026-09-30 (default-branch README; the latest release that day was 4.4.5)
**Citation:** [spec-writer_2: https://github.com/import-js/eslint-import-resolver-typescript/blob/master/README.md] [spec-writer_3: ran `npm view eslint-import-resolver-typescript version` — observed `4.4.5`]

The README's import-x example passes it as `settings: { 'import-x/resolver-next': [createTypeScriptImportResolver({ … })] }` and lists "Use `paths` defined in `tsconfig.json`" among its features. Without a `project` option it uses "`<root>/tsconfig.json` or `<root>/jsconfig.json` by default"; `project` accepts a folder path, a glob, or an array of either. Whether `paths` aliases resolve under a tsconfig with a `references` entry was observed in this repository and is recorded in the entry headed "With `createTypeScriptImportResolver`, a tsconfig whose `references` entry names a second config failed to resolve each tested `paths` alias, …".

## A `no-restricted-imports` glob that flags a relative reach into another module's `components/` folder also flags a module's own imports of the same textual shape

**Verified at:** eslint 10.10.0
**Citation:** [spec-writer_4: ran `npx eslint --rule '{"no-restricted-imports":["error",{"patterns":[{"group":["@/components/*/*","**/components/*/*"]}]}]}'` from `app/` on disposable probe files — observed errors on `'../components/GlassPanel/GlassPanel'` and `'@/components/GlassPanel/GlassPanel'` in `src/screens/`, and on the same-module import `'../components/AvatarCell/AvatarCell'` inside `src/components/SortableList/components/SortableListItem/helper/`] [architect_4: https://eslint.org/docs/latest/rules/no-restricted-imports]

The probe files were deleted after the run. A `**/`-prefixed `group` glob does flag relative specifiers, but in the probe it flagged the owning module's own import exactly as it flagged a cross-module one. The docs also state that a negation pattern cannot re-include a subdirectory of a parent directory that is already excluded.

## An ESLint 10 rule `context` exposes `filename`, `physicalFilename`, `cwd`, `sourceCode` and `options`, and `sourceCode.parserServices` defaults to `{}`

**Verified at:** eslint 10.10.0 (@eslint/core 1.2.1)
**Citation:** [spec-writer_5: `app/node_modules/.pnpm/eslint@10.10.0_jiti@2.7.0_supports-color@7.2.0/node_modules/@eslint/core/dist/cjs/types.d.cts:246` `cwd: string`, `:250` `filename: string`, `:254` `physicalFilename: string`, `:258` `sourceCode`, `:274` `options`; the `@eslint/core` version is `1.2.1` in that directory's `package.json`] [spec-writer_6: `app/node_modules/eslint/lib/languages/js/source-code/source-code.js:356` — `this.parserServices = parserServices || {};`]

`context.filename` is typed `string`. When a parser supplies no services, `parserServices` is the empty object, so `parserServices.program` is absent; under typescript-eslint without type information, `program` is present but `null` (see the next entry).

## With type information, typescript-eslint parser services carry `program: ts.Program`; without it, `program` is `null`

**Verified at:** @typescript-eslint/typescript-estree 8.70.0
**Citation:** [spec-writer_7: `app/node_modules/.pnpm/@typescript-eslint+typescript-estree@8.70.0_supports-color@7.2.0_typescript@6.0.3/node_modules/@typescript-eslint/typescript-estree/dist/parser-options.d.ts:205-216`]

Both are the declared interfaces `ParserServicesWithTypeInformation` and `ParserServicesWithoutTypeInformation`; these are type-level facts, not observed behavior.

## `unrs-resolver`'s postinstall, a native dependency of `eslint-import-resolver-typescript`, does nothing when the platform binding is installed; it only falls back to an `npm install` of the binding when that optional dependency is missing

**Verified at:** eslint-import-resolver-typescript 4.4.5, unrs-resolver 1.12.2, napi-postinstall 0.3.4
**Citation:** [claude_2: `app/node_modules/.pnpm/unrs-resolver@1.12.2/node_modules/unrs-resolver/postinstall.js` — `require("napi-postinstall")`, then calls its `checkAndPreparePackage`; `app/node_modules/.pnpm/napi-postinstall@0.3.4/node_modules/napi-postinstall/lib/index.js:175-230` — for each native target it `require.resolve`s the `@unrs/resolver-binding-<target>` package and `break`s on success, and only on failure calls `installUsingNPM`] [implement_5: `app/node_modules/.pnpm/eslint-import-resolver-typescript@4.4.5_eslint-plugin-import-x@4.17.1_@typescript-eslin_0b9adefa2acb2051aa1ace9a126a731d/node_modules/eslint-import-resolver-typescript/package.json:63` — `"unrs-resolver": "^1.7.11"`; `app/node_modules/.pnpm/unrs-resolver@1.12.2/node_modules/unrs-resolver/package.json:65` — the `@unrs/resolver-binding-<target>` packages under `optionalDependencies`] [implement_6: ran `ls app/node_modules/.pnpm` after `pnpm add` on macOS arm64 — observed only `@unrs+resolver-binding-darwin-arm64@1.12.2` among the bindings; with `unrs-resolver: false` under `allowBuilds` in `app/pnpm-workspace.yaml`, ran `pnpm install` from `app/` — observed exit code 0, then `npx eslint .` resolved every import through the resolver with no `import-x/no-unresolved` report]

The platform binding is installed as an optional dependency, so denying the script through pnpm's `allowBuilds` setting (`.claude/knowledge/pnpm.md`) removes only that network fallback.

## `createTypeScriptImportResolver` passes `references: 'auto'` to `unrs-resolver` for every tsconfig, and its declared option types admit no other value

**Verified at:** eslint-import-resolver-typescript 4.4.5, unrs-resolver 1.12.2
**Citation:** [implement_1: `app/node_modules/.pnpm/eslint-import-resolver-typescript@4.4.5_eslint-plugin-import-x@4.17.1_@typescript-eslin_0b9adefa2acb2051aa1ace9a126a731d/node_modules/eslint-import-resolver-typescript/lib/index.js:81-89` — before building each `ResolverFactory` it sets `tsconfig: { references: 'auto', ...options.tsconfig, configFile: tsconfigPath }`; `app/node_modules/.pnpm/eslint-import-resolver-typescript@4.4.5_eslint-plugin-import-x@4.17.1_@typescript-eslin_0b9adefa2acb2051aa1ace9a126a731d/node_modules/eslint-import-resolver-typescript/lib/normalize-options.js:70` — `{ references: references ?? 'auto', configFile }`, where `references` is read from the `tsconfig` option; `app/node_modules/.pnpm/eslint-import-resolver-typescript@4.4.5_eslint-plugin-import-x@4.17.1_@typescript-eslin_0b9adefa2acb2051aa1ace9a126a731d/node_modules/eslint-import-resolver-typescript/lib/types.d.ts:2` — the resolver's options type extends `unrs-resolver`'s `NapiResolveOptions`; `app/node_modules/.pnpm/unrs-resolver@1.12.2/node_modules/unrs-resolver/index.d.ts:89` — `NapiResolveOptions.tsconfig?: 'auto' | TsconfigOptions`; `app/node_modules/.pnpm/unrs-resolver@1.12.2/node_modules/unrs-resolver/index.d.ts:297-311` — `TsconfigOptions.references?: 'auto'`]

In the object `index.js` builds, `references` can be overridden only by the spread of `options.tsconfig`, and `tsconfig.references` admits only `'auto'` or unset, which becomes `'auto'`.

## With `createTypeScriptImportResolver`, a tsconfig whose `references` entry names a second config failed to resolve each tested `paths` alias, while an `extends`-only copy of it resolved them

**Verified at:** eslint-import-resolver-typescript 4.4.5, unrs-resolver 1.12.2, eslint-plugin-import-x 4.17.1, eslint 10.10.0
**Citation:** [implement_2: ran `npx eslint --rule '{"import-x/no-unresolved":"warn"}' src/components/TextEditor/components/MentionBadge/MentionBadge.tsx` from `app/`, with `project` set to `app/tsconfig.json` (which declares `@/*`, `@domain` and other `paths` and has `"references": [{ "path": "./tsconfig.node.json" }]`) — observed `Unable to resolve path to module` on `@/providers`, `@/types`, `@/util`, `@domain` and `@/data-access-layer`; with `project` set to a file in `app/` beside `tsconfig.json`, holding only `{ "extends": "./tsconfig.json" }`, which inherits `paths` but not `references`, the same run reported no problems]

Why `references` suppresses `paths` was not established, only that it did with this layout. Pointing the resolver's `project` at an `extends`-only tsconfig is the workaround the observation supports.

## `eslint-plugin-import-x` ignores a dependency whose extension is neither in `import-x/extensions` (default `.js`, `.mjs`, `.cjs`) nor in any `import-x/parsers` list

**Verified at:** eslint-plugin-import-x 4.17.1
**Citation:** [implement_3: `app/node_modules/.pnpm/eslint-plugin-import-x@4.17.1_@typescript-eslint+utils@8.70.0_eslint@10.10.0_jiti@2.7.0_e509997355fcdabbf0346b63c207d135/node_modules/eslint-plugin-import-x/lib/utils/ignore.js:14-27` — `getFileExtensions` builds the valid set from `settings['import-x/extensions'] || ['.js', '.mjs', '.cjs']` and adds every extension listed under `settings['import-x/parsers']`; `:28-31` — `ignore()` returns `true` when `hasValidExtension` fails; `app/node_modules/.pnpm/eslint-plugin-import-x@4.17.1_@typescript-eslint+utils@8.70.0_eslint@10.10.0_jiti@2.7.0_e509997355fcdabbf0346b63c207d135/node_modules/eslint-plugin-import-x/lib/config/flat/typescript.js` — the `typescript` preset's `settings` set `'import-x/extensions'` to `.ts`, `.tsx`, `.cts`, `.mts`, `.js`, `.jsx`, `.cjs`, `.mjs` and `'import-x/parsers'` to `{ '@typescript-eslint/parser': ['.ts', '.tsx', '.cts', '.mts'] }`; `app/node_modules/.pnpm/eslint-plugin-import-x@4.17.1_@typescript-eslint+utils@8.70.0_eslint@10.10.0_jiti@2.7.0_e509997355fcdabbf0346b63c207d135/node_modules/eslint-plugin-import-x/lib/index.js:137` — that file is exposed as `flatConfigs.typescript`]

A config that registers the plugin without the `flatConfigs.typescript` preset and sets neither setting has only `.js`, `.mjs` and `.cjs` as valid dependency extensions.

## `import-x/no-cycle` reported no cycle through `.ts` or `.tsx` files until `import-x/extensions` and `import-x/parsers` listed those extensions

**Verified at:** eslint-plugin-import-x 4.17.1
**Citation:** [implement_4: ran `npx eslint .` from `app/` with `import-x/no-cycle` enabled, on this repository's `app/` source at commit 245a4168, which has import cycles through `.ts` and `.tsx` barrel files, with `createTypeScriptImportResolver` as `import-x/resolver-next` and its `project` pointed at a file beside `app/tsconfig.json` holding only `{ "extends": "./tsconfig.json" }`, so every `paths` alias resolved — observed no `import-x/no-cycle` warning with neither setting, and a warning on each cycle member with `'import-x/extensions': ['.ts', '.tsx', '.js']` and `'import-x/parsers': { '@typescript-eslint/parser': ['.ts', '.tsx'] }`]

Only "neither setting" and "both settings" were run; either setting alone was not tested.
