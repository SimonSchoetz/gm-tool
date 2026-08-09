# Frontend

## Structure

```text
src/
├── assets/
├── components/ # UI — see Component Library below
│   └── index.ts
├── hooks/ # reusable React hooks
│   ├── index.ts
│   ├── simpleHook.ts # flat file when no helpers needed
│   └── complexHook/helper/ # directory + helper/ pattern when helpers are needed — mirrors Component Library's ComponentName/helper/ + __tests__/ layout
├── providers/ # app-level UI infrastructure providers — see providers/ below
│   └── index.ts
├── data-access-layer/ # domain data hooks (TanStack Query) — see State Management below for file-naming pattern
├── routes/ # Tanstack router — route files own data resolution via a `loader`
├── screens/ # see Screens below
│   └── index.ts
├── styles/ # global/reset CSS + variables/ (design tokens) — see Styles below
├── types/ # see Types Directory below
│   └── index.ts
├── util/ # see Util vs. Helper Placement below
├── App.css
├── App.tsx
└── main.tsx
```

## File Organization

### Barrel Files

`app/CLAUDE.md` defines module directory vs. grouping folder. In `src/`, grouping folders are `data-access-layer/`, `components/`, `util/`, `hooks/`, `services/`, `providers/`, and **any function-grouping subdirectory nested inside a module directory, at any depth and regardless of its name** — it organizes sibling files by function and owns no domain itself (e.g. `ComponentName/components/`, `ComponentName/helper/`, or a feature's `nodes/`/`plugins/`) — the barrel-and-named-exports rule applies identically regardless of depth. External consumers always import from exactly one level: `@/components`, `@/data-access-layer`, `@/util`, etc. — never deeper. Within-module imports use the module directory barrel via relative path (`./SortableListItem`, not `@/components/SortableList/SortableListItem`). Exceptions with no barrel: `routes/` (managed by TanStack Router file conventions), `styles/` (CSS only), `assets/`.

- `@db` is an explicit exception: no grouping barrel exists at the db root. See `app/db/CLAUDE.md` — Naming for the authoritative import depth rule.
- In **module directory barrels**, `export *` is permitted when the file has a single, obvious public concern (one component + its types) with no internals to leak. Use explicit named exports when a file exports multiple distinct things or has implementation details that should stay private. The trigger: if you would have to think about whether a new export should be public, use explicit exports.
  - ✅ GOOD: `data-access-layer/npcs/index.ts` — module directory, barrel required
  - ✅ GOOD: `export { useNpcs, useNpc } from './npcs'` in a grouping barrel — explicit named exports only, never `export *`
  - ❌ BAD: missing `data-access-layer/index.ts` — grouping barrels are unconditionally required, not optional
  - ❌ BAD: `export * from './npcKeys'` in `npcs/index.ts` — accidentally leaks internal query key factories; if `npcKeys` is public API, name it explicitly
- **Query key factories (`*Keys.ts`) are internal to the DAL module and never in the module barrel's public exports.** React components remain hook-only consumers (`data-access-layer/domainA/index.ts` exports `useNpc`/`useNpcs`, never `npcKeys`) — unchanged. A consumer structurally unable to call a hook (e.g. a route loader) may instead consume a `queryOptions`-built factory exported from the barrel: `queryOptions()` produces a typed options object that still encapsulates the key rather than exposing it raw, so exporting its result is not the same act as exporting the key factory.
  - ✅ GOOD: `export const npcQueryOptions = (id: string) => queryOptions({ queryKey: npcKeys.detail(id), queryFn: () => service.getNpc(id) })` exported for a loader; illustrative, not tied to any specific file
  - ❌ BAD: exporting `npcKeys` directly, or a hand-assembled `{ queryKey: npcKeys.detail(id), queryFn: ... }` object bypassing `queryOptions()` — the carve-out permits only a `queryOptions`-built factory, never the raw key or an ad hoc substitute

### Screens

- screens are what would be different pages on a website
- When they are displayed is handled in `App.tsx`
- Screen-local `components/` subdirectories follow the Barrel Files rule above (nesting-level-independent) — e.g. `import { StepSection } from './components'`, never `./components/StepSection/StepSection`.
- A component shared by two or more unrelated screens is promoted to `screens/components/` (peer of screen directories — same nearest-shared-ancestor rule as Sub-component ownership below) — never nested inside the screen that introduced it. Uses a `Screens` prefix (`ScreensNameInput`, `ScreensDuplicateBtn`) to distinguish from screen-local sub-components and `src/components/` primitives.
  - ✅ `screens/components/ScreensDuplicateBtn/` ❌ `screens/npc/components/ScreensDuplicateBtn/` — nested under one screen despite being shared

### providers/

**providers/** is for app-level UI infrastructure — React Context providers that wrap the app root and expose hooks. Data infrastructure (e.g., `TanstackQueryClientProvider`) stays in `data-access-layer/`. `providers/` is a grouping folder: its `index.ts` uses explicit named exports. Each provider lives in its own module directory with a required `index.ts` barrel.

**Context value types must contain only what external consumers call through the hook.** A function called exclusively inside the provider's own module belongs in local scope, not on the `ContextValue` type — placing provider-internal functions there widens the public interface beyond what consumers need and obscures which operations are genuinely external.

**Before placing a hook call in any component — in artifact code or implementation — verify the component renders below every provider the hook depends on.** Reading the component file is not sufficient — trace its position in the provider tree, and re-trace after any extraction or move.

### Coding Style

- TypeScript only. No JavaScript files in `src/`.
  See [app/CLAUDE.md](../CLAUDE.md) — TypeScript Coding Style.

- **`useLayoutEffect` over `useEffect` only when a DOM measurement or paint-synchronous side effect is required** — the canonical case is reading layout geometry (`getBoundingClientRect`, `scrollWidth`, `offsetHeight`) and applying a state update that must not cause a visible flash. All other effects use `useEffect`. When chosen, an inline comment stating the specific paint-synchronous requirement is required — "avoids flicker" alone is not sufficient.
  - **Exception:** `eslint-plugin-react-hooks`'s `recommended` config bans `setState` at an effect's top level (`react-hooks/set-state-in-effect`) and reading `ref.current` during render (`react-hooks/refs`) — a `useLayoutEffect` reading a ref's geometry then calling `setState` synchronously trips both. Defer the `setState` into a subscription callback registered in the effect (e.g. a `ResizeObserver` observing the element) instead — never suppress either rule to keep the synchronous form; this accepts a brief post-paint correction in exchange for compliance. See `EditorPopup.tsx`'s viewport-clamping effect.

- **Icon components imported from any third-party icon library are always bound to a name ending in `Icon`, even when the library's own exported name does not end that way.** Rename via the import alias when necessary (`import { Trash2 as Trash2Icon } from 'some-icon-library'`) — never bind the bare library name directly into JSX-consuming code. This applies to every icon import in `src/`, with no exception for single-use or plugin-local imports.
  - ✅ GOOD: `import { CalendarIcon } from 'lucide-react';`
  - ❌ BAD: `import { Calendar } from 'lucide-react';`

### Component Library

- each component has its own folder
- Each component has its own `.css` file only when it owns styles of its own — see Styles below for the full rule and the sub-component CSS-extraction convention.
- Functions that support a component must live in `ComponentName/helper/`, one file per function — never co-located in the component file itself. This covers both pure functions (transformations, formatters, predicates) and non-pure helpers (DOM/canvas mutation drivers). Structure mirrors the hooks pattern: `helper/helperA.ts` + `helper/__tests__/helperA.test.ts`.
- **Sub-component ownership**: a sub-component (a function returning JSX, used exclusively within one parent) belongs in `ComponentName/components/`, where `ComponentName` is its immediate JSX parent — not any ancestor, at every nesting depth (a sub-component's sub-component belongs to its own `components/`, never the screen or top-level module's). When two or more unrelated parents render the same sub-component, it belongs to neither — place it as a peer module directory at the nearest shared ancestor (a standalone `components/SubComponentName/`, not nested under either consumer). **Exception — provider modules**: a component rendered exclusively by a provider still belongs in `components/`, not the provider's own module directory; `providers/` is infrastructure, and its `components/` (if any) holds only provider-internal structural fragments, not domain UI.
  - ❌ `providers/PinnedPopupsProvider/components/MentionPopup/` — belongs in `components/MentionPopup/` regardless of consumer count, even when a provider is the sole renderer
- `helper/` and `components/` are within-module grouping barrels per Barrel Files above, with one addition: never re-export their contents from the parent `ComponentName/index.ts` — they are internal to the module. A sub-component directory within `components/` only needs its own `index.ts` when it has internal sub-structure (its own `helper/` or `components/` subdirectory); a flat single-file sub-component is exported directly from the `components/` barrel.
  - ✅ `export { AvatarCell } from './AvatarCell/AvatarCell'` in `components/index.ts` — flat sub-component, no sub-directory barrel needed
  - ✅ `SortableListItem/components/AvatarCell/index.ts` exists only if `AvatarCell/` grows its own `helper/` or `components/`
  - ❌ `export * from './components'` in `ComponentName/index.ts` — components/ barrel is internal, never re-exported upward
- **A file inside any grouping folder must never import siblings through that folder's own barrel.** Barrels exist for external consumers; a file importing through a barrel it is part of creates a circular dependency. Always use a direct relative path to the sibling instead.
  - ❌ `import { GlassPanel } from '@/components'` — circular: `MentionPopup` is inside `src/components/`, which exports it; importing through `@/components` from within that folder closes the cycle
  - ✅ `import { GlassPanel } from '../GlassPanel/GlassPanel'` — direct relative path, no barrel involved
  - Applies at every nesting depth, not just the `src/components/` root — e.g. a screen-local `screenName/components/` grouping folder importing a sibling through `../components` is the same cycle.
- **A sub-component must never import a type back from the parent module that owns it.** When a type is used by both a parent and its `components/`-owned sub-component, the parent-owns-child direction makes a child-to-parent import a cycle in the module graph, even when `import type` erases it at compile time with no `tsc` error. Extract the shared type to a neutral file both import from — never have the sub-component reach back into the parent's file.
  - ❌ `TableEdgeHint.tsx` (in `TableEdgeHandlePlugin/components/`) importing `HintDirection` via `import type { HintDirection } from '../../TableEdgeHandlePlugin'` — backwards even though it compiles
  - ✅ Declare `HintDirection` in a neutral file (e.g. `TableEdgeHandlePlugin/types.ts`), and have both `TableEdgeHandlePlugin.tsx` and `TableEdgeHint.tsx` import it from there

### Component Internals

**No IIFE or inline sub-components in JSX.** An IIFE inside a render return (`{(() => { ... })()}`) or a named function declared inside the component body that returns JSX are both signs extraction didn't happen. Logic returning a primitive → `helper/`; logic returning JSX → a sub-component in `components/`, exactly as if defined outside the parent file — declaring it inline does not exempt it from the ownership rule.

**Pass props directly when no transformation, guard, renaming, or toolchain enforcement is needed — never wrap them in a named function that only forwards its argument unchanged; inline the prop reference instead.** Governs JSX prop wiring only — not hook return types or public API boundaries, where a wrapper hides implementation details and presents a domain-typed interface. Permitted wrapper cases: a transformation (`() => onClose(id)`), a guard (`() => { if (enabled) onSubmit() }`), a signature adapter (`(e: MouseEvent) => onSelect(e.currentTarget.dataset.id)`), or an active ESLint requirement (`() => { void handleAsync(); }` — `@typescript-eslint/no-misused-promises` discarding a Promise where a synchronous callback is expected).

- ❌ BAD: `const handleMouseEnter = () => onMouseEnterBridge(); <Foo onMouseEnter={handleMouseEnter} />`
- ✅ GOOD: `<Foo onMouseEnter={onMouseEnterBridge} />`

**Before wiring a prop to any component you did not write in the current task, read its implementation file and verify the prop is forwarded to the element or sub-component where it takes effect.** This includes `ref` — under React 19, `ref` is an ordinary prop on function components, not separate infrastructure, so a `ref` you did not personally forward is exactly the case this rule governs. A prop declared in a component's props type may not be forwarded internally — TypeScript types describe the interface surface, not the internal wiring. Passing a prop that is silently dropped is a runtime no-op with no compiler or linter error. Verify before writing the JSX; do not defer it to code review.

**Props pattern — three cases, pick exactly one:**

Selection is a strict gate — apply in order, stopping at the first match. The question at each step is "what does the root node render?", not "what props does the consumer currently pass?":

1. Does the root node render a native HTML element and forward attributes to it? → `HtmlProps<'element'>`
   - ✅ `type GlassPanelProps = { radius?: RadiusSize } & HtmlProps<'div'>`
   - ❌ `DivHTMLAttributes<HTMLDivElement>` or `React.HTMLProps<HTMLDivElement>` — always use the `HtmlProps` alias, never the raw React type

2. Does the root node render a specific existing component and stay in sync with its prop shape? → `React.ComponentProps<typeof Parent>`
   - ✅ `type Props = { buttonStyle?: 'danger' } & React.ComponentProps<typeof ActionContainer>`

3. Neither of the above? → `FCProps<Props>` — closed API. Always declare the props as a named `type Props = { ... }` and type the component assignment as `FCProps<Props>`.
   - ✅ `type Props = { onSearch: (term: string) => void; placeholder?: string }; export const SearchInput: FCProps<Props> = ({ onSearch, placeholder }) => { ... }`
   - ❌ `const SearchInput = ({ onSearch }: { onSearch: () => void }) => { ... }` — inline destructuring without FCProps
   - ❌ `const SearchInput: React.FC<Props> = ...` — use FCProps, not React.FC
   - **Zero-props exception:** when a case-3 component accepts no external props whatsoever, omit `FCProps<Props>` entirely (✅ `export const AdventureCrumb = () => { ... }`) — do not write `type Props = object`, `type Props = Record<string, never>`, or keep an empty/placeholder `FCProps<Props>` (❌ `export const AdventureCrumb: FCProps<Props> = () => { ... }`).

**A wrapper hardcoding a value for a prop inherited via `React.ComponentProps<typeof Parent>` (case 2 above) must `Omit` that prop from its own `Props` type.** Otherwise a caller can pass a value that is silently shadowed in JSX — a runtime no-op with no compiler or linter error. Every hardcoded prop must be excluded, not just the first one added.

- ✅ `Omit<React.ComponentProps<typeof SyncedInput>, 'autoFocus' | 'className'>` when both are hardcoded
- ❌ `Omit<...,'autoFocus'>` only, while `className` is also hardcoded in JSX

**Redundant HTML attributes:** Never write an HTML attribute whose value matches the browser default. Omit it entirely — the browser supplies the default and the attribute adds no information.

- ❌ `<input type="text" />` → ✅ `<input />` — `type="text"` is the default
- ✅ `<input type="checkbox" />`, `<button type="button" />` — non-default values are kept

**Variant system:**

- Variants are expressed as a union type prop and applied via a CSS modifier class. Never express variants as inline styles. Never use one boolean prop per variant when the component has — or may grow — more than one variant.
  - ✅ `buttonStyle?: 'danger'` → `cn('button-wrapper', buttonStyle && \`button-wrapper--${buttonStyle}\`)`
  - ❌ `isDanger?: boolean; isPrimary?: boolean`
  - ❌ `style={{ color: 'red' }}` to express a variant

- **`cn()` usage — conditional and computed classes only:** Use `cn()` when class names are conditional or computed at runtime. A single static string must use `className="..."` directly — never `cn('static-string')`.
  - ✅ GOOD: `cn('button-wrapper', buttonStyle && \`button-wrapper--${buttonStyle}\`)` — conditional, cn() is correct
  - ❌ BAD: `cn('button-wrapper')` — single static string, cn() adds no value; use `className="button-wrapper"` directly

**UI primitive wrappers — prefer the component over the bare HTML element.** Two match types apply, checked in order:

1. **Name-match**: a component in `src/components/` sharing the exact name of a native HTML element (PascalCase vs lowercase — e.g., `Input` / `<input>`) is always used instead of the bare element.
2. **Semantic-match**: before a typed variant of an HTML element (e.g., `<input type="color">`), check `src/components/` for a specialized component (naming pattern `[Modifier][ElementName]`, e.g. `ColorInput`, `DateInput`) — use it, never the generic wrapper with a `type` attribute.

- The barrel-circular-import rule above applies here too when consuming a wrapper from inside `src/components/` itself.
- Name-match: ✅ `<Input value={val} onChange={handler} />` ❌ `<input value={val} onChange={handler} />`
- Semantic-match: ✅ `<ColorInput value={val} onChange={handler} />` ❌ `<Input type="color" value={val} onChange={handler} />`

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

**Trigger 1 — shared by 2+ consumers:** When a constant is shared by two or more TypeScript files within the same module directory, extract it to `ComponentName.constants.ts` at the **smallest directory containing all consumers**. A constant used only within a single file stays inlined — no constants file for single consumers. Only TypeScript files count as consumers — a CSS file hardcoding a numerically identical value is not a consumer. When consumers span more than one module directory, this trigger does not apply — see Util vs. Helper Placement below.

- ✅ `DEFAULT_COLUMN_WIDTH` shared by `SortingTableHeader` and `SortableListItem` (both under `SortableList/`) → `SortableList/SortableList.constants.ts`
- ❌ A constant used only in `SortingTableHeader` → stays inlined in `SortingTableHeader.tsx`
- ❌ `FramingOverlay.tsx` uses `200`, `FramingOverlay.css` hardcodes `200px` — CSS can't import from TS, so this stays inlined in the `.tsx` file

**Trigger 2 — self-contained supporting definition:** When a type, class, or static config data is a self-contained concern outside the component's render/state logic, extract it to its own file regardless of consumer count. Mirrors the same concern-based test already applied to `helper/` (functions) and `components/` (JSX). Name the file descriptively for its domain content — never `ComponentName.constants.ts`, since the content isn't literally a constant.

- ✅ `textFormattingConfig.ts` (sibling of `TextFormattingRow.tsx`, single consumer) — holds `TextFormatBtnConfig`/`HeadingBtnConfig`/`ListBtnConfig` types and static button-config arrays; extracted because the config is a distinct concern, not because of consumer count
- ❌ Naming the file `TextFormattingRow.constants.ts` — the content is typed config data, not a constant

### List Conventions

**Default sortable columns:** All entity lists support sorting by `name`, `created_at`, and `updated_at` as baseline columns. These are app-wide defaults — never re-specify them in feature stories or screen-specific specs. Domain-specific sort columns (e.g., `session_date` for sessions) are additive and require their own story or spec entry.

- ❌ BAD: Session screen spec includes `name`, `created_at`, `updated_at` as session-specific sort work — these are already covered by the baseline
- ✅ GOOD: Session screen spec adds only `session_date` as a new sort column, relying on the baseline for the rest

### Testing Policy

- **Required**: All helper functions (`ComponentName/helper/`) and util functions (`/src/util/`) must have corresponding tests in a parallel `__tests__/` directory mirroring the file name — including non-function data modules (e.g. a static rule table) placed in either directory, or extracted as a Constants Trigger-2 sibling file directly in a component's own directory (e.g. `textFormattingConfig.ts`, `typographicTransformers.ts`). Exception 1: a helper whose entire body is DOM/canvas mutations with no branching, derived data, or multi-step logic is exempt — no independently verifiable output to assert against. Exception 2: a static data module with no transformation logic of its own is exempt when every value it exports is already exercised by a consumer's test asserting the consumer's transformed output — a standalone test asserting the array equals itself verifies nothing beyond the source.
- **Forbidden**: React components — files whose exported function returns JSX — must not have unit tests. Components change shape frequently; testing helpers and the data layer gives sufficient logic-level coverage at lower cost — but not interaction behavior tied to the browser's native default action (e.g. `preventDefault()` in a keyboard/pointer handler), which needs a live DOM event dispatch no helper or data-layer test provides.
- **Geometry and layout calculation helper tests must assert the relationship, computed from the same imported constants the implementation uses — never bake current numeric values into a separate literal expectation.** Applies to helpers whose output depends on constants under active visual tuning (spacing, offsets, clamping thresholds). A test hardcoding today's numeric output breaks — or worse, silently stops verifying the real relationship — every time the constant is tuned, even with unchanged logic.
  - ❌ BAD: `expect(calculateHintPosition(anchor)).toBe(anchor.top + 8)` — `8` copies `HINT_OFFSET`'s current value; tuning it to `12` breaks this test with no logic change
  - ✅ GOOD: `expect(calculateHintPosition(anchor)).toBe(anchor.top + HINT_OFFSET)` — imports the same constant the implementation reads, tracking tuning changes automatically
  - Does not apply to helpers whose output isn't derived from a tunable constant (e.g. string-formatting) — a hardcoded literal expectation there is correct.

### Styles

- `.css` files in `/styles` are for variables and globals.
- A component or screen has its own `.css` file only when it owns styles of its own — static classes, tokens, or layout rules on elements it renders directly. A component that only composes existing styled primitives with no classes of its own (a thin wrapper, a pure composition component) has no `.css` file — do not create an empty placeholder speculatively. When a sub-component is extracted and owns styles, that CSS moves into the sub-component's directory — it does not stay in the parent's `.css` file — and all class names must be re-namespaced to the sub-component's own block name (its component name, kebab-cased); class names derived from a prior parent's name are a violation.

**CSS class naming — flat BEM-ish:**

- Root element: `block-name` (e.g., `button-wrapper`, `search-input`)
- Modifier: `block-name--modifier` (e.g., `button-wrapper--danger`)
- Never use the BEM element suffix (`__`). There are no `block__element` class names in this codebase.
  - ✅ `search-input`, `search-input--active`
  - ❌ `search-input__icon`, `search-input__field`

**Design token obligation:**

- All CSS property values must reference tokens from `styles/variables/` (e.g., `var(--spacing-sm)`, `var(--radius-xl)`).
- Raw pixel, color, `rem`, and unitless z-index integer values are banned in component `.css` files.
  - ✅ `padding: var(--spacing-sm)`
  - ❌ `padding: 8px`
  - ❌ `color: #ffffff`
- **`/* one-off */` — intentional CSS singularities:** When a raw CSS value does not warrant a design token — because its use-case is narrow enough that the user has decided it need not be reused — mark it with a `/* one-off */` comment on the same line. This comment is the canonical signal that the raw value is an intentional exception to the token obligation, not an oversight. A reviewer who sees `/* one-off */` must not file a violation. Whether a raw value warrants the annotation is the user's call — never the implementer's or reviewer's.
  - ✅ `border-radius: 3px; /* one-off */`
- **Raw values without `/* one-off */` are surfaced to the user after the task completes, not mid-task, and never block the commit.** Collect them during implementation and report file path, line, and value at the end of the task; the user then decides: add a token, add the annotation, or leave it. The deferred state is not a violation.

**Component-scoped custom properties:** When a CSS value cannot use a global token from `styles/variables/`, declare it as a CSS custom property on the component's root element — the prefix identifies its source. DB-sourced values (known only at runtime, cannot be known at build time) are applied via an inline `style` prop, never as a direct inline style property, and prefixed `--rt-[component-name]-` to distinguish them from global tokens at a glance; the CSS file then consumes the custom property via `var()`, and when a component needs both a runtime custom property and a standard CSS property in the same `style` prop, both go in a single object cast — never split across two props or two casts. Static component-scoped values (e.g., a computed layout value set via JavaScript, or an intermediate calculation shared between CSS rules within the same component) are prefixed `--[component-name]-` (kebab-cased, no `rt` segment) to distinguish from both global tokens and runtime values.

- ✅ `style={{ '--rt-component-xyz-color': color, width: size } as React.CSSProperties}` (combined cast) or `style={{ '--rt-component-xyz-color': color } as React.CSSProperties}` (property alone) + CSS: `color: var(--rt-component-xyz-color)`
- ❌ `style={{ color: color }}` — raw runtime value applied directly as a style property
- ✅ `--card-flip-duration: 0.4s` (set in CSS) or `--floating-toolbar-offset: 0px` (set in JS as a style prop for a non-DB computed value) — both consumed via `var(...)` within the same component; illustrative, not tied to any specific file
- ❌ `--rt-toolbar-position: 8px` — the `--rt-` prefix signals DB-sourced; do not use it for static or JS-computed values that are not DB-derived

**No unilateral additions to `styles/variables/`:** Never add a new CSS variable to the variables folder on your own. If a value appears to be reused across components and would benefit from a token, flag it to the user — they decide whether to add it and which file it belongs in. Introduce the value inline (or as a runtime custom property if DB-sourced) in the meantime. This inline fallback is temporary, pending token approval — not a permanent state.

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

**Layer responsibilities:**

- `app/services/` — business logic, wraps DB calls and Tauri API calls needing business logic, composing multiple operations, or domain-typed error handling; throws domain errors from `@domain`. Import via `@services/<file>`.
  - **Service-layer conventions (no fallback defaults for nullable columns, no replicating a DB `DEFAULT` at a call site) are documented in `app/services/CLAUDE.md`** — not duplicated here.
- `data-access-layer/` — wraps TanStack Query hooks, exposes clean API. Pure-read Tauri API calls with no business logic or domain error transformation go directly here — never through `services/`. One concern = one file: query keys, single-entity hooks, collection hooks, and a `queryOptions` factory module each own a separate file (`sessionKeys.ts`, `useSession.ts`, `useSessions.ts`, `sessionQueryOptions.ts`) — the shared cache deduplicates across hooks, so no `DomainProvider` wrapping mutations is needed. The `queryOptions` factory's own carve-out from the hook-only consumer rule is defined in Barrel Files above.
- `screens/` — UI only, no error handling
- Error Boundary at app level catches all unhandled async errors

**Non-negotiable rules:**

- Always add `throwOnError: true` to every `useQuery` call — without it, query errors are silently swallowed into the query's internal error state and never surface to the Error Boundary. Only permitted exception: a query explicitly designated as a non-blocking background check, where (a) `throwOnError` is intentionally omitted (never set to `false` explicitly) with a block comment explaining why the Error Boundary isn't the destination, and (b) the hook's return type exposes the error as a named typed field (e.g. `checkError: UpdateCheckError | null`) for local handling. A background check not exposing its error through the return type is not an exception — it's a violation.
- Never destructure `error` from `useQuery` and handle it locally — let it propagate.
- Never wrap `mutateAsync` in try/catch in data access hooks or screens — mutations use `throwOnError: true` via QueryClient defaults.
- Never add try/catch blocks to data access hooks or screens. If an error needs handling, it belongs in the service layer or the Error Boundary.
- **Mutations close over construction-time arguments — never accept them at call time.** When a `useMutation` hook requires an entity identifier that is known when the hook is constructed (e.g., `npcId`, `sessionId`, `adventureId`), capture it in the hook's closure — never declare it as a parameter of `mutationFn`. A `mutationFn` that accepts an id parameter when that id was already available at construction time is always wrong.
  - ✅ GOOD: `const useDeleteNpc = (npcId: string) => useMutation({ mutationFn: () => npcService.deleteNpc(npcId) })`
  - ❌ BAD: `const useDeleteNpc = (npcId: string) => useMutation({ mutationFn: (id: string) => npcService.deleteNpc(id) })`
- **A mutation that creates a new cache entry the user is about to navigate to (e.g. a `duplicate` operation) invalidates only the list query key — never a detail key for the new entity.** The new entity has no cached detail entry yet — the destination screen's own `useQuery` fetches it fresh on mount, so a detail-key invalidation here would be a no-op, not a fix for anything.
  - ✅ GOOD: a `duplicateMutation`'s `onSuccess` invalidates only `npcKeys.list(adventureId)` — `npcKeys.detail(newId)` was never fetched, so there is nothing to invalidate there

- **Hook return functions are typed to the caller's contract — never expose TanStack Query internals.** Every function on a DAL hook's return type must be declared as a named wrapper with a concrete signature reflecting exactly what the caller receives. Never re-export `mutateAsync`, `mutate`, or any other TanStack Query primitive directly. The return type must express the domain operation — not the framework's dispatch mechanism. The named wrapper is required for API hygiene — it severs the caller's dependency on TanStack Query's internal types and dispatch shape. Type compatibility between `mutateAsync` and `() => Promise<void>` is not a justification for removing the wrapper; the wrapper's purpose is to establish a boundary, not to resolve a type mismatch.
  - ✅ GOOD: `deleteNpc: () => Promise<void>` — caller sees a domain operation
  - ✅ GOOD: `updateNpc: (data: UpdateNpcData) => void` — caller sees the domain payload shape
  - ✅ GOOD: `createNpc: () => Promise<string>` — caller sees the domain return value
  - ❌ BAD: `deleteNpc: typeof deleteMutation.mutateAsync` — exposes a TanStack internal

**`useCallback` and `useMemo` are justified only when the wrapped value is read as a dependency in an effect's dependency array, or passed as a prop to a component wrapped in `React.memo`. Applying either hook by default — to event handlers, derived values, or callbacks with no such consumer — adds indirection with no referential-stability benefit and must not be done.** Before wrapping a function or computation in `useCallback`/`useMemo`, identify the specific consumer that requires referential stability. If none exists, write the function or computation as a plain `const` recomputed on every render.

- ✅ GOOD: `useCallback` wrapping `onSelect` because it is passed to `<MemoizedListItem onSelect={onSelect} />`
- ✅ GOOD: `useMemo` wrapping a derived array because it is read inside a `useEffect` dependency array
- ❌ BAD: `useCallback`-wrapping a table-row mutation handler (`handleInsertRowAbove`) that is only ever called from an inline `onClick` in the same component's JSX — no memoized child and no effect dependency reads it

**State is reserved for values with no synchronous source (network/promise results, timers, subscriptions, DOM measurements) — a value fully computable at render time from props, other state, or module-level constants is derived via `useMemo`/a plain expression, never `useState` plus a recomputing setter.** Reaching for `useState` out of habit duplicates state render can compute directly, and desyncs when derivation logic and the setter drift apart.

- ✅ GOOD: `MentionTypeaheadPlugin.tsx` — `options` populated inside a `.then()` on `mentionSearchService.searchMentions(...)` (no synchronous source; a `queryGenerationRef` guard discards stale resolutions)
- ❌ BAD: `SlashCommandPlugin.tsx` — `options` synchronously filters the static `SLASH_COMMAND_OPTIONS` import in `onQueryChange`; no async boundary exists — should be `useMemo(() => SLASH_COMMAND_OPTIONS.filter(...), [matchingString])`
- **Exception:** "Controlled inputs that drive auto-save mutations" below stores a synchronous value (`npc?.name`) in `useState` anyway — justified by preventing mid-keystroke jank from re-fetch races, not by absence of a synchronous source. Not an instance of this principle; a documented carve-out.

**Never gate a continuous listener's state update (ResizeObserver, scroll, MutationObserver, requestAnimationFrame) by equality-comparing two freshly-recomputed objects from the same live source** (e.g. `getBoundingClientRect()` results) — they're never reference-equal across invocations regardless of value match, so a settling check (`if (!isEqual(newRect, prevRect)) setSettledRect(newRect)`) never converges and the cycle loops forever. Fix: derive/store a primitive instead, so React's `Object.is` bail-out converges naturally — or if the real need is "has this happened once" rather than "has this stopped changing," use a one-shot ref/flag instead of a settling comparison.

- ✅ GOOD: `EditorPopup.tsx`'s `ResizeObserver` callback calls `setHorizontalOffset` with a primitive number from `calculateHorizontalClampOffset(...)` — bail-out stops the cycle once stable.
- ❌ BAD (illustrative): storing a `settledRect` object and equality-comparing it against fresh `getBoundingClientRect()` results — `getBoundingClientRect()` allocates a new object every call, so the comparison never converges.

**Controlled inputs that drive auto-save mutations use local state for the displayed value.** When a text or date input is bound to a server value and calls a mutation on change, bind `value` to a `useState` variable — not directly to the query result. Call both the local setter and the debounced updater in `onChange`. Binding `value` directly to the query result causes the input to jump mid-keystroke when TanStack Query re-fetches after invalidation. The `?? ''` initializer is correct at this boundary: HTML inputs require a string, and the empty string represents "nothing displayed" — a distinct concept from the nullable DB column representing "nothing stored."

- ✅ GOOD: `const [name, setName] = useState(npc?.name ?? ''); <Input value={name} onChange={(e) => { setName(e.target.value); updateNpc({ name: e.target.value }); }} />`
- ❌ BAD: `<Input value={npc.name ?? ''} onChange={(e) => updateNpc({ name: e.target.value })} />`

**Framework context is not a prop.** Never relay a value as a prop when the receiving component can obtain it directly from a framework-managed context. This prohibition covers data-fetching results, data-fetching callbacks, and routing context (URL params via `useParams`). Props are reserved for state that genuinely belongs to a parent: cross-component coordination such as tooltip visibility, modal open/close, or selection state shared between siblings. Pass a callback down only when the parent owns the coordination state and the child reports events up. If a component has a button, that component owns the button's action — it does not receive a callback from two levels up.

- ❌ BAD: `SessionScreen` fetches session data, passes it to `PrepView`, which passes it to `StepSection`, which passes it to `StepSectionHeader`
- ✅ GOOD: `StepSectionHeader` calls `useSession(sessionId)` directly; TanStack Query serves the cached value
- ❌ BAD: `SessionScreen` passes `sessionId` and `adventureId` as props to `SessionHeader`, which then passes them to `useSession`
- ✅ GOOD: `SessionHeader` calls `useParams()` directly and passes the result to `useSession`

### Event listener callback errors

**Every promise chain kicked off inside a Tauri event-listener callback (registered via `listen()`) must end in an explicit `.catch()` — wrapping the outer call in `void` to satisfy `no-floating-promises` is not sufficient alone.** This callback runs outside React's render cycle; a `.then()` chain with no `.catch()` becomes an unhandled promise rejection, not a caught error. Default handling is swallow-with-comment: state why the rejection is an expected, safe-to-ignore race (see `sendHello`/`pushNewChanges` in `useConnectivityLifecycle.ts`).

For a genuine unexpected failure rather than a known race, the surfacing mechanism depends on whether the listener-registering code is reachable from a live `ErrorBoundary`. When `listen()` is called from within a component, or a hook called (directly or transitively) by a component rendered under an `ErrorBoundary`, call `useErrorBoundary()` (from `react-error-boundary`) at the top level to obtain `showBoundary`, then invoke `showBoundary(error)` inside `.catch()` — the library's documented bridge for post-async errors into the same fallback UI a render-time error would hit. Reserve `console.error` for the narrower case where no hosting component or hook exists in the call chain (e.g. module-level listener setup). Never leave the chain uncaught either way.

- ✅ GOOD: `const { showBoundary } = useErrorBoundary();` at the top of the hook, then `.catch((error: unknown) => showBoundary(error))` inside the effect
- ❌ BAD: calling `useErrorBoundary()` inside the `.catch()` callback itself — hooks cannot be called outside a component or hook's synchronous render/call path
- ❌ BAD: defaulting to `console.error` for a genuine failure when the calling hook is reachable from a live `ErrorBoundary` — the boundary path is available and must be used
