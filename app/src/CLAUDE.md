# Frontend

## Structure

```text
src/
├── assets/
├── components/ # UI — see `.claude/rules/src-components.md`
│   └── index.ts
├── hooks/ # reusable React hooks
│   ├── index.ts
│   ├── simpleHook.ts # flat file when no helpers needed
│   └── complexHook/helper/ # directory + helper/ pattern when helpers are needed — mirrors the ComponentName/helper/ + __tests__/ layout in `.claude/rules/src-components.md` — Component Library
├── providers/ # app-level UI infrastructure providers — see `.claude/rules/src-providers.md`
│   └── index.ts
├── data-access-layer/ # domain data hooks (TanStack Query) — see `.claude/rules/src-data-access-layer.md`
├── routes/ # Tanstack router — route files own data resolution via a `loader` — see `.claude/rules/src-routes.md`
├── screens/ # see `.claude/rules/src-screens.md`
│   └── index.ts
├── styles/ # global/reset CSS + variables/ (design tokens) — see `.claude/rules/src-css.md`
├── types/ # see Types Directory below
│   └── index.ts
├── util/ # see Util vs. Helper Placement below
├── App.css
├── App.tsx
└── main.tsx
```

Conventions for `src/` are split by artifact kind across `.claude/rules/`, each file loading only when Claude reads or references a matching path: `src-css.md` (a stylesheet), `src-components.md` (a file that renders JSX, or a component-owned `helper/`), `src-screens.md` (a file under `screens/`), `src-routes.md` (a file under `routes/`), `src-providers.md` (a file under `providers/`), `src-data-access-layer.md` (a file under `data-access-layer/`), `src-unit-tests.md` (a `__tests__/`, `helper/` or `util/` file), `src-react-hooks.md` (a file that may call a React hook). Read one directly when you are about to create the first artifact of a kind you have not yet opened — nothing has loaded its rule yet.

## File Organization

### Barrel Files

`app/CLAUDE.md` — Directory Structure (all TypeScript layers) defines module directory vs. grouping folder. In `src/`, grouping folders are `components/`, `providers/`, `data-access-layer/`, `util/`, `hooks/`, `screens/`, `types/`, and **any function-grouping subdirectory nested inside a module directory, at any depth and regardless of its name** — it organizes sibling files by function and owns no domain itself (e.g. `ComponentName/components/`, `ComponentName/helper/`, or a feature's `nodes/`/`plugins/`) — the barrel-and-named-exports rule applies identically regardless of depth. External consumers always import from exactly one level: `@/components`, `@/data-access-layer`, `@/util`, etc. — never deeper. Within-module imports use the module directory barrel via relative path (`./SortableListItem`, not `@/components/SortableList/SortableListItem`). Exceptions with no barrel: `routes/` (managed by TanStack Router file conventions), `styles/` (CSS only), `assets/`. Before resolving any import as a within-module barrel import, check first whether source and target are siblings inside the same grouping folder — if so, the sibling-import ban in `app/CLAUDE.md` — Directory Structure (all TypeScript layers) takes precedence and requires a direct relative path instead of the barrel.

- `@db` is an explicit exception: no grouping barrel exists at the db root. See `app/db/CLAUDE.md` — Naming for the authoritative import depth rule.
- In **module directory barrels**, `export *` is permitted when the file has a single, obvious public concern (one component + its types) with no internals to leak. Use explicit named exports when a file exports multiple distinct things or has implementation details that should stay private. The trigger: if you would have to think about whether a new export should be public, use explicit exports.
  - ✅ GOOD: `data-access-layer/base-entities/index.ts` — module directory, barrel required
  - ✅ GOOD: `export { useBaseEntities, useBaseEntity } from './base-entities'` in a grouping barrel — explicit named exports only, never `export *`
  - ❌ BAD: missing `data-access-layer/index.ts` — grouping barrels are unconditionally required, not optional
  - ❌ BAD: `export * from './baseEntityKeys'` in `base-entities/index.ts` — accidentally leaks internal query key factories; if `baseEntityKeys` is public API, name it explicitly

### Coding Style

- TypeScript only. No JavaScript files in `src/`.
  See [app/CLAUDE.md](../CLAUDE.md) — TypeScript Coding Style.

### Util vs. Helper Placement

A function belongs in `/src/util/` only when **both** conditions are met:

1. It is consumed by more than one component or module
2. It is generic — no coupling to a specific domain concept, named without domain nouns

A function that fails either condition stays local to its consumer in `ComponentName/helper/`. When a helper is later needed by more than one consumer, apply in order:

1. **Sibling components within the same parent module** — promote to the parent module's `helper/`. Never import across sibling boundaries (`../SiblingComponent/helper/...` is always wrong).
2. **Unrelated components, or the helper is generic** — promote to `/src/util/` only when both util conditions are met.

**The same test governs a shared non-function value — a constant, config table, or static data module — once its consumers span more than one module directory.** Promote it to `/src/util/` under the same two conditions above, naming the file for its domain content per Constants' Trigger 2 rather than `*.constants.ts` if the content isn't literally a constant.

- ✅ `buildGridTemplate` needed by both `SortingTableHeader` and `SortableListItem` → `SortableList/helper/buildGridTemplate.ts`
- ❌ `SortingTableHeader` importing from `../SortableListItem/helper/buildGridTemplate`

- ✅ `getDateTimeString` in `/src/util/` — generic name, no domain coupling, multiple consumers
- ❌ `formatTableLabel` in `/src/util/` — domain-specific name ("Table"), single consumer → belongs in `SortableList/helper/`

### Constants

Extraction out of the component file is triggered by either of two independent conditions — consumer count, or content kind. Neither requires the other.

**Trigger 1 — shared by 2+ consumers:** When a constant is shared by two or more TypeScript files within the same module directory, extract it to `ComponentName.constants.ts` at the **smallest directory containing all consumers**. A constant used only within a single file stays inlined — no constants file for single consumers. Only TypeScript files count as consumers — a CSS file hardcoding a numerically identical value is not a consumer. When consumers span more than one module directory, this trigger does not apply — see Util vs. Helper Placement above.

- ✅ `DEFAULT_COLUMN_WIDTH` shared by `SortingTableHeader` and `SortableListItem` (both under `SortableList/`) → `SortableList/SortableList.constants.ts`
- ❌ A constant used only in `SortingTableHeader` → stays inlined in `SortingTableHeader.tsx`
- ❌ `FramingOverlay.tsx` uses `200`, `FramingOverlay.css` hardcodes `200px` — CSS can't import from TS, so this stays inlined in the `.tsx` file

**Trigger 2 — self-contained supporting definition:** When a type, class, or static config data is a self-contained concern outside the component's render/state logic, extract it to its own file regardless of consumer count. Mirrors the same concern-based test already applied to `helper/` (functions) and `components/` (JSX). Name the file descriptively for its domain content — never `ComponentName.constants.ts`, since the content isn't literally a constant.

- ✅ `textFormattingConfig.ts` (sibling of `TextFormattingRow.tsx`, single consumer) — holds `TextFormatBtnConfig`/`HeadingBtnConfig`/`ListBtnConfig` types and static button-config arrays; extracted because the config is a distinct concern, not because of consumer count
- ❌ Naming the file `TextFormattingRow.constants.ts` — the content is typed config data, not a constant

### Testing Policy

- **Forbidden**: React components — files whose exported function returns JSX — must not have unit tests. Components change shape frequently; testing helpers and the data layer gives sufficient logic-level coverage at lower cost — but not interaction behavior tied to the browser's native default action (e.g. `preventDefault()` in a keyboard/pointer handler), which needs a live DOM event dispatch no helper or data-layer test provides.

Which files under `src/` do require unit tests, and how a geometry or layout helper's test must assert, are in `.claude/rules/src-unit-tests.md` — Testing Policy, which loads when a `__tests__/`, `helper/` or `util/` path under `src/` is read.

### Styles

A component or screen has its own `.css` file only when it owns styles of its own — static classes, tokens, or layout rules on elements it renders directly. A component that only composes existing styled primitives with no classes of its own (a thin wrapper, a pure composition component) has no `.css` file — do not create an empty placeholder speculatively. When a sub-component is extracted and owns styles, that CSS moves into the sub-component's directory — it does not stay in the parent's `.css` file — and all class names must be re-namespaced to the sub-component's own block name (its component name, kebab-cased); class names derived from a prior parent's name are a violation.

What goes inside a `.css` file — the scope of `styles/`, class naming, the design token obligation with its `/* one-off */` annotation, and the ban on unilateral additions to `styles/variables/` — is in `.claude/rules/src-css.md`, which loads when a `.css` file under `src/` is read. Custom properties are declared from the component side: `.claude/rules/src-components.md` — Component-scoped custom properties.

### Types Directory

`types/` owns React-infrastructure types and cross-cutting utility types that are not domain concepts: prop aliases, HTML element type aliases, and generic utility types reused across unrelated modules.

**What belongs in `types/`:**

- The `HtmlProps` alias and similar React/HTML element type helpers
- `FCProps<T>` and similar generic prop wrappers
- Any type that is infrastructure (framework-level) rather than domain-level

**What does NOT belong in `types/`:**

- Domain error types — those belong in `domain/domainName/errors.ts`
- Domain entity types — those belong in `@domain/<domainName>/types.ts`
- Types derived from db schemas — import directly from `@db/domainName`
- Types with a single consumer — a type used in exactly one component or module must be declared in that file, not extracted to a separate `.types.ts` or any other file. `types/` is for types reused across multiple unrelated modules. When the consuming file needs to share the type with a sub-component, re-export it from the owning file.
  - ❌ `SessionScreen.types.ts` alongside `SessionScreen.tsx` — same directory does not satisfy this rule; the type must be in `SessionScreen.tsx` itself
  - ✅ `HtmlProps` in `types/` — imported across dozens of unrelated components

**Barrel requirement:** `types/` is a grouping folder. It requires a barrel (`types/index.ts`) with explicit named exports. External consumers import from `@/types`.

**Ambient module augmentation files (`*.d.ts` with no runtime `import`/`export`, e.g. `types/historyState.d.ts`) are exempt from the barrel requirement above.** `tsc` loads them automatically via the compiled file set, not via import — routing through `types/index.ts` would import a file with no runtime exports. They live directly in `types/` and are never re-exported.

## State Management & Error Handling

### TanStack Query pattern

All async data lives in TanStack Query. Data access hooks wrap `useQuery`/`useMutation` and expose a clean API. Screens and components consume the API — they own no async logic themselves.

- `screens/` — UI only, no error handling
- Error Boundary at app level catches all unhandled async errors

The hooks' own conventions — layer responsibilities, query-key encapsulation, and the non-negotiable rules for `useQuery`, `useMutation` and cache invalidation — are in `.claude/rules/src-data-access-layer.md`, which loads when a file under `src/data-access-layer/` is read. Hook-hygiene rules that fire for any file calling a React hook, regardless of data source, are in `.claude/rules/src-react-hooks.md`.

### Event listener callback errors

A promise chain started inside a Tauri `listen()` callback has its own catch-and-surface rule: `.claude/rules/src-react-hooks.md` — Event listener callback errors.
