# Spec: Lint-enforced module boundaries

- Sub-feature 1: Boundary and cycle lint rules — add `local/no-import-past-index` and `import-x/no-cycle` at `warn`
- Sub-feature 2: Domain and database boundary fixes — make every existing cross-module import in `db/` and `domain/` go through a module's `index.ts`
- Sub-feature 3: Pinned-popups context split — break the one real import cycle by moving the context and hook into their own module
- Sub-feature 4: Module barrels — delete the 77 `index.ts` files that hide nothing, add the 28 that module folders with internals lack, and rewrite their importers
- Sub-feature 5: Layer-root barrels — delete `src/components/index.ts`, `src/hooks/index.ts`, `src/providers/index.ts`, `src/types/index.ts` and `src/util/index.ts`, and rewrite their importers
- Sub-feature 6: Promote the rules to `error` — raise both rules to `error` once the tree produces no warnings

Sub-feature files:

- [SF1 — Boundary and cycle lint rules](SPEC_LINT_ENFORCED_BOUNDARIES_SF1.md)
- [SF2 — Domain and database boundary fixes](SPEC_LINT_ENFORCED_BOUNDARIES_SF2.md)
- [SF3 — Pinned-popups context split](SPEC_LINT_ENFORCED_BOUNDARIES_SF3.md)
- [SF4 — Module barrels](SPEC_LINT_ENFORCED_BOUNDARIES_SF4.md)
- [SF5 — Layer-root barrels](SPEC_LINT_ENFORCED_BOUNDARIES_SF5.md)
- [SF6 — Promote the rules to error](SPEC_LINT_ENFORCED_BOUNDARIES_SF6.md)

Counts and paths in this spec describe the repository as of `245a4168` [spec-writer_9: `app/src`, `app/db`, `app/domain` — as of 245a4168]. Before starting, confirm HEAD still descends from that commit with no changes under `app/src/`, `app/db/` or `app/domain/`; if it has changed there, re-derive the lists in SF4 and SF5 with the rules those sub-features state, rather than trusting the listed paths.

## Key Architectural Decisions

### An `index.ts` marks a module boundary, and a local lint rule enforces it

A folder that contains a file named exactly `index.ts` is a boundary. Code outside that folder may import the `index.ts`, and nothing else inside it. `local/no-import-past-index` (`app/eslint-rules/no-import-past-index.js`) resolves every import specifier through TypeScript's own module resolution, using the program's compiler options (so `@/`, `@db/`, `@domain`, `@services/` and relative paths resolve identically). It then walks from the target file's folder upward, stopping at the first folder that also contains the importing file. A folder passed on that walk that holds an `index.ts` is a crossed boundary, unless the target is that folder's own `index.ts`. The rule reports the outermost crossed boundary, because that is the `index.ts` the import has to go through.

`index.tsx` is not a marker, so `src/routes/index.tsx` (a TanStack route file) creates no boundary. Type-only imports are checked like value imports, because a type behind a boundary is as private as a value. Text-pattern rules cannot express this. `no-restricted-imports` matches the specifier as written, so any glob that catches `../Other/helper/x` also catches a module's own `../components/AvatarCell/AvatarCell` [spec-writer_4: ran `npx eslint --rule '{"no-restricted-imports":["error",{"patterns":[{"group":["@/components/*/*","**/components/*/*"]}]}]}'` from `app/` on disposable probe files — observed errors on `'../components/GlassPanel/GlassPanel'` from `src/screens/`, and on the same-module `'../components/AvatarCell/AvatarCell'` inside `src/components/SortableList/components/SortableListItem/helper/`].

### A folder has an `index.ts` exactly when it hides something

In `app/src/`, a folder falls into one of three kinds:

- **Function-grouping folder.** It is named `helper`, `components`, `hooks`, `nodes`, `plugins` or `types` and sits inside another folder below the layer root. It never has an `index.ts`: its parent module's `index.ts` is already the boundary, and a grouping `index.ts` inside a module is the construct that made sibling-through-own-barrel import cycles possible.
- **Module folder.** Any other folder below a layer root, for example `src/components/Header/`, `src/screens/session/` or `src/data-access-layer/sessions/`. It has an `index.ts` exactly when it contains anything besides one main source file, its stylesheet and `__tests__/`.
- **Layer-root folder.** A direct child of `src/`. It keeps its `index.ts` only if the folder holds a file or folder that the `index.ts` does not re-export. `src/data-access-layer/index.ts` stays, because it leaves out `createAutosaveQueue.ts`, `mergeScopedEdit.ts`, `mergeUpdate.ts`, `useAutosaveQueue.ts` and `useDuplicateMutation.ts`. `src/screens/index.ts` stays, because it leaves out `screens.constants.ts` and `components/`. `src/components/index.ts`, `src/hooks/index.ts`, `src/providers/index.ts`, `src/types/index.ts` and `src/util/index.ts` re-export every entry of their folder and are deleted [spec-writer_10: `app/src/components/index.ts`, `app/src/hooks/index.ts`, `app/src/providers/index.ts`, `app/src/types/index.ts`, `app/src/util/index.ts`, `app/src/screens/index.ts`, `app/src/data-access-layer/index.ts` — as of 245a4168]. The ambient `*.d.ts` files in `src/types/` were never re-exported and stay where they are.

Every `index.ts` this spec adds uses explicit named exports, never `export *`.

### `domain/` is a pass-through boundary

`app/domain/CLAUDE.md` — Structure makes both `@domain` and `@domain/<subdomain>` sanctioned external import paths, and `domain/index.ts` re-exports each subdomain wholesale. The rule therefore takes a `passThroughDirs` option, set to the absolute path of `app/domain`. A pass-through folder is never itself a crossed boundary, but the subdomain `index.ts` files below it still are: `@domain/entities` is allowed, while `../devices/messages` imported from `domain/sync/` is reported.

### `db/`, `domain/`, `services/` and `app/util/` keep their barrels as they are

The "hides something" test in the previous decision applies only in `app/src/`. The boundary rule applies everywhere ESLint runs, so the existing `index.ts` files in `db/` and `domain/` become enforced boundaries. SF2 fixes the nine imports that cross them today: eight in `db/_sync/registry.ts` and one in `domain/sync/messages.ts`.

### Import specifier form

A specifier names the nearest path the boundary rule accepts. For each imported symbol, start at the folder of the file that declares it and walk toward the importer. The import target is the `index.ts` of the last folder with an `index.ts` passed before reaching a folder that contains the importer. When no folder on that walk has one, the target is the declaring file itself.

When the target lies in a different direct child of `src/` than the importer (for example a provider importing a component), the specifier uses the `@/` alias. When both lie in the same direct child of `src/`, it uses a relative path. A file placed directly in `src/` (such as `App.tsx`) lies in no direct child, so it always uses `@/`. `@db/`, `@domain`, `@services/` and `@util` specifiers keep their current alias. Specifiers never carry a file extension. A binding that a deleted barrel re-exported as `default as X` becomes a default import from the declaring file under the same local name.

### Cycles are enforced by `import-x/no-cycle`

`eslint-plugin-import-x` supplies `no-cycle`, and `eslint-import-resolver-typescript` lets it resolve the tsconfig `paths` aliases. Both are recorded in `.claude/knowledge/eslint.md` under the `## \`eslint-plugin-import-x\` 4.17.1 declares ESLint 10 in its peer range…` and `## \`eslint-import-resolver-typescript\` 4.4.5 provides…` headings. `no-cycle` ignores type-only imports and runs with `ignoreExternal: true` (`.claude/knowledge/eslint.md` — `## \`import-x/no-cycle\` ignores TypeScript type-only imports…`).

At `245a4168`, one strongly connected import cycle runs through `src/components/index.ts`. Once the barrels in SF4 and SF5 are gone, exactly one cycle remains: `TextEditor.tsx` → `nodes/MentionNode.tsx` → `MentionBadge.tsx` → `providers/PinnedPopupsProvider/index.ts` → `PinnedPopupsProvider.tsx` → `components/MentionPopup` → `EntityPopupBody.tsx` → `TextEditor.tsx` [spec-writer_11: ran a disposable dependency-graph script over value imports in `app/src`, `app/db`, `app/domain`, `app/services`, `app/util` with the SF4/SF5 barrels removed — observed one strongly connected component, which disappears when `MentionBadge.tsx`'s edge to `PinnedPopupsProvider/index.ts` is removed].

### Both rules land at `warn` and are promoted to `error` last

Adding either rule at `error` in SF1 would fail `npx eslint .` until SF5 is done. At `warn` the checks pass after every sub-feature, and the warnings guide the restructuring. SF6 promotes both rules once the warning count for them is zero. `local/no-wrapped-line-comments` stays at `warn` as it is today.

### The pinned-popups context and hook become their own module

`MentionBadge` needs only `usePinnedPopups`, but the provider module's `index.ts` also exports `PinnedPopupsProvider`, which renders `MentionPopup`, which renders `TextEditor`, which renders `MentionBadge`. The context, its value types and the hook move to `src/providers/PinnedPopupsContext/`. `PinnedPopupsProvider/` is left holding a single source file, so its `index.ts` is deleted and its importers name `PinnedPopupsProvider.tsx` directly. `DeleteDialogProvider` has the same context/provider/hook shape but no consumer that closes a cycle, so it keeps its shape. This split has one cause, a cycle, and is not a pattern for every provider.

### A db table definition is part of its module's public API

`db/_sync/registry.ts` reads the eight synced table definitions. Each `db/<table>/index.ts` gains an explicit named export of its `<name>Table` from `./schema`, and `registry.ts` imports the module `index.ts`. The table definitions become importable from `services/` and `src/`. This keeps the boundary rule free of exceptions. No table module imports `db/_sync/`, so the new imports add no cycle [spec-writer_12: `grep -rln "_sync" app/db app/services app/src` outside `app/db/_sync/` — found only `app/db/CLAUDE.md` and migration files, none importing `db/_sync`].

### The rule's boundary logic is tested as a pure function

`findCrossedBoundary` holds every branch of the boundary decision and takes the importer path, the target path, an `isBoundary(dir)` predicate and the pass-through list, so it is tested without a TypeScript program. The wiring around it (typed-program lookup, `ts.resolveModuleName`, skipping external and unresolved modules) has no branch that changes which boundary is reported. SF1 verifies it end to end with a disposable probe file.

## CLAUDE.md impact

- `app/CLAUDE.md` — Directory Structure (all TypeScript layers) states that every module directory and every grouping folder requires an `index.ts`, bans importing a sibling through the grouping folder's own barrel, and calls a path whose last two segments repeat a name (`ComponentName/ComponentName`) the double-name anti-pattern to avoid when a barrel exists. After this branch, a folder under `app/src/` has an `index.ts` only when it hides something (function-grouping folders `helper`, `components`, `hooks`, `nodes`, `plugins`, `types` never have one). `import { X } from './X/X'` is the normal form for a single-file module. Boundaries and cycles are enforced by the `local/no-import-past-index` and `import-x/no-cycle` rules in `app/eslint.config.js` [spec-writer_13: `app/CLAUDE.md:33-39`].
- `app/src/CLAUDE.md` — Barrel Files lists `components/`, `providers/`, `hooks/`, `util/`, `types/` and nested function-grouping folders as grouping folders requiring a barrel, and says external consumers import from exactly one level (`@/components`, `@/util`). The structure tree also shows an `index.ts` under several of those folders, and the `types/` section requires `types/index.ts`. After this branch, those five layer-root `index.ts` files and every nested function-grouping `index.ts` no longer exist. Consumers import `@/components/<Module>` (an `index.ts`) or `@/components/<Module>/<Module>` (a single-file module), and `@/util/<file>`, `@/types/<file>`, `@/hooks/<file-or-module>` and `@/providers/<Module>` likewise [spec-writer_14: `app/src/CLAUDE.md:9-42`, `:119`].
- `.claude/rules/src-components.md` — its sub-component bullets call `helper/` and `components/` within-module grouping barrels and give `export { AvatarCell } from './AvatarCell/AvatarCell'` in `components/index.ts` as the correct form. Its sibling-import bullet exists to avoid a cycle through the grouping barrel. After this branch, no `components/index.ts` or `helper/index.ts` exists inside a module, and `import-x/no-cycle` reports any cycle [spec-writer_15: `.claude/rules/src-components.md:29-35`].
- `.claude/rules/src-screens.md` — its example `import { StepSection } from './components'` names a barrel this branch deletes. After this branch, the form is `import { StepSection } from './components/StepSection'` (an `index.ts`, because `StepSection/` has internals) [spec-writer_16: `.claude/rules/src-screens.md:12`].
- `.claude/rules/src-providers.md` — it calls `providers/` a grouping folder whose `index.ts` uses explicit named exports, with every provider in a module directory with a required `index.ts`. After this branch, `src/providers/index.ts`, `src/providers/AppProviders/index.ts` and `src/providers/PinnedPopupsProvider/index.ts` no longer exist (each of those two module folders holds a single source file), and `src/providers/PinnedPopupsContext/` is a module that holds a context and hook but no provider. It exists so that `MentionBadge.tsx` can read the pinned-popups context without importing `PinnedPopupsProvider.tsx`, which renders `MentionPopup` [spec-writer_17: `.claude/rules/src-providers.md:11`].
- `.claude/rules/src-data-access-layer.md` points to `app/src/CLAUDE.md` — Barrel Files for its barrel rules. After this branch, `src/data-access-layer/pinned-order/` has no `index.ts` (it holds only `useSetPinnedOrder.ts`), and `src/data-access-layer/index.ts` re-exports `./pinned-order/useSetPinnedOrder` directly [spec-writer_18: `.claude/rules/src-data-access-layer.md:7`].
- `app/docs/CLAUDE.md` — Spec Format Extension's "Barrel instructions require explicit validation" validates barrels against the explicit-exports rule in `app/CLAUDE.md` — Directory Structure, which the first entry above changes [spec-writer_19: `app/docs/CLAUDE.md:24`].
- `app/db/CLAUDE.md` — Structure describes each table directory as "schema, types, CRUD, index" and keeps `db/_system/get.ts` and `update.ts` out of the barrel. After this branch, each synced table's `index.ts` also exports its `<name>Table` definition, which `db/_sync/registry.ts` imports through the module `index.ts` [spec-writer_20: `app/db/CLAUDE.md:5`].
- `app/domain/CLAUDE.md` — Structure's exception allowing `export *` in `domain/index.ts` is now also encoded in `app/eslint.config.js` as the `passThroughDirs` option of `local/no-import-past-index`. A change to which `domain/` import paths are sanctioned must change both [spec-writer_21: `app/domain/CLAUDE.md:28-32`].
- Testing-policy scope: `.claude/rules/src-unit-tests.md` — Testing Policy sets required test scope only for files under `app/src/`. `app/eslint-rules/` (local ESLint rules with branching logic, `no-wrapped-line-comments.js` untested) has no owning test obligation. This branch adds `app/eslint-rules/__tests__/no-import-past-index.test.js` without a rule requiring it [spec-writer_22: `.claude/rules/src-unit-tests.md:1-12`].
