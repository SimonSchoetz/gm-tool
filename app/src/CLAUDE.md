# Frontend

## Structure

```text
src/
├── assets/
├── components/ # UI
│   ├── ComponentA/
│   │   ├── ComponentA.tsx
│   │   └── ComponentA.css
│   └── index.ts
├── hooks/ # reusable React hooks
│   ├── index.ts
│   ├── simpleHook.ts # flat file when no helpers needed
│   └── complexHook/ # directory when helpers are needed
│     ├── complexHook.ts
│     └── helper/
│       ├── helperA.ts
│       └── __tests__/
│         └── helperA.test.ts
├── providers/ # app-level UI infrastructure providers
│   ├── ProviderA/
│   │   ├── ProviderA.tsx
│   │   └── index.ts
│   └── index.ts
├── data-access-layer/ # domain data hooks (TanStack Query)
│   ├── TanstackQueryClientProvider.tsx # QueryClient config — enables the entire layer
│   ├── domainA/
│   │   ├── index.ts
│   │   ├── domainAKeys.ts
│   │   ├── useDomainA.ts
│   │   └── useDomainAs.ts
├── routes/ # Tanstack router
├── screens/
│   ├── screenA/
│   │   ├── ScreenA.tsx
│   │   ├── ScreenA.css
│   │   └── components/
│   └── index.ts
├── styles/
│   ├── global.css
│   ├── reset.css
│   └── variables/
│       ├── border-variables.css
│       ├── color-variables.css
│       ├── dimensions-variables.css
│       ├── spacing-variables.css
│       ├── transition-variables.css
│       └── typography-variables.css
├── types/
│   ├── index.ts
│   └── domain.types.ts
├── util/
│   └── utilA.ts
├── App.css
├── App.tsx
└── main.tsx
```

## File Organization

### Barrel Files

`app/CLAUDE.md` defines module directory vs. grouping folder. In `src/`, grouping folders are `data-access-layer/`, `components/`, `util/`, `hooks/`, `services/`, `providers/`, and **any `components/`-style subdirectory at any nesting level** (a screen's local `components/`, a `ComponentName/components/`, a `ComponentName/helper/`) — the barrel-and-named-exports rule applies identically regardless of depth. External consumers always import from exactly one level: `@/components`, `@/data-access-layer`, `@/util`, etc. — never deeper. Within-module imports use the module directory barrel via relative path (`./SortableListItem`, not `@/components/SortableList/SortableListItem`). Exceptions with no barrel: `routes/` (managed by TanStack Router file conventions), `styles/` (CSS only), `assets/`.

- `@db` is an explicit exception: no grouping barrel exists at the db root. See `app/db/CLAUDE.md` — Naming for the authoritative import depth rule.
- In **module directory barrels**, `export *` is permitted when the file has a single, obvious public concern (one component + its types) with no internals to leak. Use explicit named exports when a file exports multiple distinct things or has implementation details that should stay private. The trigger: if you would have to think about whether a new export should be public, use explicit exports.
  - ✅ GOOD: `data-access-layer/npcs/index.ts` — module directory, barrel required
  - ✅ GOOD: `export { useNpcs, useNpc } from './npcs'` in a grouping barrel — explicit named exports only, never `export *`
  - ❌ BAD: missing `data-access-layer/index.ts` — grouping barrels are unconditionally required, not optional
  - ❌ BAD: `export * from './npcKeys'` in `npcs/index.ts` — accidentally leaks internal query key factories; if `npcKeys` is public API, name it explicitly
- **Query key factories (`*Keys.ts` files) are internal to the DAL module and must not appear in the module barrel's public exports.** They are an implementation detail of the hooks that use them, not part of the module's external API. The module barrel (`data-access-layer/domainA/index.ts`) exports only the hooks — never the key factories.
  - ✅ GOOD: `export { useNpc, useNpcs } from './useNpc'` — hooks are the public API
  - ❌ BAD: `export { npcKeys } from './npcKeys'` in the module barrel — key factory is internal

### Screens

- screens are what would be different pages on a website
- When they are displayed is handled in `App.tsx`
- Screen-local `components/` subdirectories follow the Barrel Files rule above (nesting-level-independent). Sub-components within a screen are always imported from `./components`, never by direct path.
  - ✅ `import { StepSection } from './components'`
  - ❌ `import { StepSection } from './components/StepSection/StepSection'`

### providers/

**providers/** is for app-level UI infrastructure — React Context providers that wrap the app root and expose hooks. Data infrastructure (e.g., `TanstackQueryClientProvider`) stays in `data-access-layer/`. `providers/` is a grouping folder: its `index.ts` uses explicit named exports. Each provider lives in its own module directory with a required `index.ts` barrel.

**Context value types must contain only what external consumers call through the hook.** A function called exclusively inside the provider's own module belongs in local scope, not on the `ContextValue` type — placing provider-internal functions there widens the public interface beyond what consumers need and obscures which operations are genuinely external.

**Before placing a hook call in any component — in artifact code or implementation — verify the component renders below every provider the hook depends on.** Reading the component file is not sufficient — trace its position in the provider tree, and re-trace after any extraction or move.

### Coding Style

- TypeScript only. No JavaScript files in `src/`.
  See [app/CLAUDE.md](../CLAUDE.md) — TypeScript Coding Style.

- **`useLayoutEffect` over `useEffect` only when a DOM measurement or paint-synchronous side effect is required** — the canonical case is reading layout geometry (`getBoundingClientRect`, `scrollWidth`, `offsetHeight`) and applying a state update that must not cause a visible flash. All other effects use `useEffect`. When `useLayoutEffect` is chosen, an inline comment stating the specific paint-synchronous requirement is required — "avoids flicker" alone is not sufficient.
  - **Exception:** `eslint-plugin-react-hooks`'s `recommended` config (active in `eslint.config.js`) includes `react-hooks/set-state-in-effect` (bans calling a state setter at the top level of an effect body) and `react-hooks/refs` (bans reading `ref.current` during render). A `useLayoutEffect` that reads a ref's layout geometry and then calls `setState` synchronously trips both. When this conflict arises, defer the `setState` call into a subscription callback registered in the effect (e.g. a `ResizeObserver` observing the measured element) instead of calling it at the effect's top level — never suppress either rule to keep the synchronous form. This accepts a brief post-paint correction in exchange for compliance. See `src/components/TextEditor/components/EditorPopup/EditorPopup.tsx`'s viewport-clamping effect.

- **Icon components imported from any third-party icon library are always bound to a name ending in `Icon`, even when the library's own exported name does not end that way.** Rename via the import alias when necessary (`import { Trash2 as Trash2Icon } from 'some-icon-library'`) — never bind the bare library name directly into JSX-consuming code. This is a first-party naming convention applied at the import boundary, independent of which icon library is in use — it applies to every icon import in `src/`, with no exception for single-use or plugin-local imports.
  - ✅ GOOD: `import { CalendarIcon } from 'lucide-react';`
  - ❌ BAD: `import { Calendar } from 'lucide-react';`

### Component Library

- each component has its own folder
- each component has its own `.css` file
- Functions that support a component must live in `ComponentName/helper/`, one file per function — never co-located in the component file itself. This covers both pure functions (transformations, formatters, predicates) and non-pure helpers (DOM/canvas mutation drivers). Structure mirrors the hooks pattern: `helper/helperA.ts` + `helper/__tests__/helperA.test.ts`.
- **Sub-component ownership**: a sub-component (a function returning JSX, used exclusively within one parent) belongs in `ComponentName/components/`, where `ComponentName` is its immediate JSX parent — not any ancestor. This applies at every nesting depth: a sub-component of a sub-component belongs to that sub-component's own `components/`, never the screen or top-level module's. When two or more unrelated parents render the same sub-component, it belongs to neither — place it as a peer module directory at the nearest shared ancestor (a standalone `components/SubComponentName/`, not nested under either consumer). **Exception — provider modules**: a component rendered exclusively by a provider still belongs in `components/`, not inside the provider's own module directory; `providers/` is infrastructure, and its `components/` (if any) holds only provider-internal structural fragments, not domain UI.
  - ✅ `components/MentionPopup/` — domain UI belongs in `components/` regardless of consumer count, even when a provider is the sole renderer
  - ❌ `providers/PinnedPopupsProvider/components/MentionPopup/` — providers never adopt domain UI as sub-components
- `helper/` and `components/` are within-module grouping barrels per Barrel Files above, with one addition: never re-export their contents from the parent `ComponentName/index.ts` — they are internal to the module. A sub-component directory within `components/` only needs its own `index.ts` when it has internal sub-structure (its own `helper/` or `components/` subdirectory); a flat single-file sub-component is exported directly from the `components/` barrel.
  - ✅ `export { AvatarCell } from './AvatarCell/AvatarCell'` in `components/index.ts` — flat sub-component, no sub-directory barrel needed
  - ✅ `SortableListItem/components/AvatarCell/index.ts` exists only if `AvatarCell/` grows its own `helper/` or `components/`
  - ✅ Parent imports `import { AvatarCell } from './components'`
  - ❌ `import { AvatarCell } from '../components/AvatarCell/AvatarCell'` — double-name import, always wrong regardless of nesting depth
  - ❌ `export * from './components'` in `ComponentName/index.ts` — components/ barrel is internal, never re-exported upward
- **A file inside any grouping folder must never import siblings through that folder's own barrel.** Barrels exist for external consumers; a file importing through a barrel it is part of creates a circular dependency. Always use a direct relative path to the sibling instead.
  - ❌ `import { GlassPanel } from '@/components'` — circular: `MentionPopup` is inside `src/components/`, which exports it; importing through `@/components` from within that folder closes the cycle
  - ❌ `import { TableConfigRow } from '../components'` — circular: `TableConfigSection` is inside `screenName/components/`, which exports it; `../components` resolves to that same barrel
  - ✅ `import { GlassPanel } from '../GlassPanel/GlassPanel'` — direct relative path, no barrel involved
  - ✅ `import { TableConfigRow } from '../TableConfigRow/TableConfigRow'` — direct relative path, no barrel involved
- **A sub-component must never import a type back from the parent module that owns it.** When a type is used by both a parent component and its `components/`-owned sub-component, the parent-owns-child direction makes a child-to-parent import a cycle in the module graph, even when `import type` erases it at compile time and `tsc` raises no error. Extract the shared type to a neutral file that both can import from — never have the sub-component reach back into the parent's file.
  - ❌ `TableEdgeHint.tsx` (in `TableEdgeHandlePlugin/components/`) importing `HintDirection` via `import type { HintDirection } from '../../TableEdgeHandlePlugin'` — the parent owns the sub-component, so an import running the other direction is backwards even though it compiles
  - ✅ Declare `HintDirection` in a neutral file (e.g. `TableEdgeHandlePlugin/types.ts` or the file where it is first needed by both), and have both `TableEdgeHandlePlugin.tsx` and `TableEdgeHint.tsx` import it from there

### Component Internals

**No IIFE in JSX.** An immediately-invoked function expression inside a render return (`{(() => { ... })()}`) is always a sign that logic has not been extracted. Apply the correct extraction:

- Logic that returns a primitive value → extract to a `helper/` function.
- Logic that returns JSX → extract to a sub-component in `components/`.

Never leave an IIFE in a render return.

**No inline sub-components.** A named function declared inside a component body that returns JSX is a sub-component, not a helper. It must be extracted to `ComponentName/components/` exactly as if it had been defined outside the parent file. Defining it inline does not make it exempt from the ownership rule — the extraction destination is the same regardless of where the function is currently declared.

**Pass props directly when no transformation, guard, renaming, or toolchain enforcement is needed — never wrap them in a named function.** A wrapper that only forwards its argument unchanged adds no logic and must not exist; inline the prop reference. This governs JSX prop wiring — not hook return types or public API boundaries, where a wrapper hides implementation details and presents a domain-typed interface. A wrapper is permitted only when it adds a transformation (`() => onClose(id)`), a guard (`() => { if (enabled) onSubmit() }`), adapts a signature mismatch (`(e: MouseEvent) => onSelect(e.currentTarget.dataset.id)`), or is required by an active ESLint rule (`() => { void handleAsync(); }` — required by `@typescript-eslint/no-misused-promises` to explicitly discard a Promise return where a synchronous callback is expected).

- ❌ BAD: `const handleMouseEnter = () => onMouseEnterBridge(); <Foo onMouseEnter={handleMouseEnter} />`
- ✅ GOOD: `<Foo onMouseEnter={onMouseEnterBridge} />`

**Before wiring a prop to any component you did not write in the current task, read its implementation file and verify the prop is forwarded to the element or sub-component where it takes effect.** A prop declared in a component's props type may not be forwarded internally — TypeScript types describe the interface surface, not the internal wiring. Passing a prop that is silently dropped is a runtime no-op with no compiler or linter error. Verify before writing the JSX; do not defer it to code review.

**Props pattern — three cases, pick exactly one:**

Selection is a strict gate — apply in order, stopping at the first match. The question at each step is "what does the root node render?", not "what props does the consumer currently pass?":

1. Does the root node render a native HTML element and forward attributes to it? → `HtmlProps<'element'>`
   - ✅ `type GlassPanelProps = { radius?: RadiusSize } & HtmlProps<'div'>`
   - ❌ `DivHTMLAttributes<HTMLDivElement>` or `React.HTMLProps<HTMLDivElement>` — always use the `HtmlProps` alias, never the raw React type

2. Does the root node render a specific existing component and stay in sync with its prop shape? → `React.ComponentProps<typeof Parent>`
   - ✅ `type Props = { buttonStyle?: 'danger' } & React.ComponentProps<typeof ActionContainer>`

3. Neither of the above? → `FCProps<Props>` — closed API. Always declare the props as a named `type Props = { ... }` and type the component assignment as `FCProps<Props>`.
   - ✅ `type Props = { onSearch: (term: string) => void; placeholder?: string }`
     `export const SearchInput: FCProps<Props> = ({ onSearch, placeholder }) => { ... }`
   - ❌ `const SearchInput = ({ onSearch }: { onSearch: () => void }) => { ... }` — inline props destructuring without FCProps
   - ❌ `const SearchInput: React.FC<Props> = ...` — use FCProps, not React.FC
   - **Zero-props exception:** when a case-3 component accepts no external props whatsoever, omit `FCProps<Props>` entirely — do not write `type Props = object` or `type Props = Record<string, never>`.
     - ✅ `export const AdventureCrumb = () => { ... }`
     - ❌ `export const AdventureCrumb: FCProps<Props> = () => { ... }` with an empty or placeholder Props body

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
  - ✅ GOOD: `className="button-wrapper"` — static, plain className is correct
  - ❌ BAD: `cn('button-wrapper')` — single static string, cn() adds no value

**UI primitive wrappers — prefer the component over the bare HTML element.** Two match types apply, checked in order:

1. **Name-match**: when a component in `src/components/` shares the exact name of a native HTML element (PascalCase vs lowercase — e.g., `Input` / `<input>`), always use the component instead of the bare element.
2. **Semantic-match**: before using a typed variant of an HTML element (e.g., `<input type="color">`), check `src/components/` for a specialized component that handles that variant. The naming pattern is `[Modifier][ElementName]` (e.g., `ColorInput`, `DateInput`). If one exists, use it — never fall back to the generic wrapper with a `type` attribute.

- When consuming either type of wrapper from inside `src/components/` (the importer is itself a sibling in the `components/` grouping folder), the barrel-circular-import rule applies — never import through `@/components`. Use a direct relative path: `import { Input } from '../Input/Input'`.
- ✅ `<Input value={val} onChange={handler} />` — name-match: `Input` component exists, use it
- ✅ `<ColorInput value={val} onChange={handler} />` — semantic-match: typed color variant covered by `ColorInput`, use it
- ❌ `<input value={val} onChange={handler} />` — bare element when a name-match wrapper exists
- ❌ `<Input type="color" value={val} onChange={handler} />` — typed variant when a semantic-match wrapper exists

### Util vs. Helper Placement

A function belongs in `/src/util/` only when **both** conditions are met:

1. It is consumed by more than one component or module
2. It is generic — no coupling to a specific domain concept, named without domain nouns

A function that fails either condition stays local to its consumer in `ComponentName/helper/`. When a helper is later needed by more than one consumer, apply in order:

1. **Sibling components within the same parent module** — promote to the parent module's `helper/`. Never import across sibling boundaries (`../SiblingComponent/helper/...` is always wrong).
2. **Unrelated components, or the helper is generic** — promote to `/src/util/` only when both util conditions are met.

- ✅ `buildGridTemplate` needed by both `SortingTableHeader` and `SortableListItem` → `SortableList/helper/buildGridTemplate.ts`
- ❌ `SortingTableHeader` importing from `../SortableListItem/helper/buildGridTemplate`

- ✅ `getDateTimeString` in `/src/util/` — generic name, no domain coupling, multiple consumers
- ❌ `formatTableLabel` in `/src/util/` — domain-specific name ("Table"), single consumer → belongs in `SortableList/helper/`

### Constants

Extraction out of the component file is triggered by either of two independent conditions — consumer count, or content kind. Neither requires the other.

**Trigger 1 — shared by 2+ consumers:** When a constant is shared by two or more TypeScript files within the same module directory, extract it to `ComponentName.constants.ts` at the level of the **smallest directory that contains all consumers**. A constant used only within a single file stays inlined under this trigger alone — no constants file for single consumers. Only TypeScript files count as consumers — a CSS file that hardcodes a numerically identical value is not a consumer and does not trigger extraction.

- ✅ `DEFAULT_COLUMN_WIDTH` shared by `SortingTableHeader` and `SortableListItem` (both under `SortableList/`) → `SortableList/SortableList.constants.ts`
- ❌ A constant used only in `SortingTableHeader` → stays inlined in `SortingTableHeader.tsx`
- ❌ `FramingOverlay.tsx` uses `200` and `FramingOverlay.css` hardcodes `200px` — the CSS file cannot import from TS; the value stays inlined in the `.tsx` file

**Trigger 2 — self-contained supporting definition:** When a type, class, or static config data is a self-contained concern that is not part of the component's render or state logic, extract it to its own file — regardless of consumer count, including single-consumer cases. This mirrors the same concern-based test already applied to `helper/` (functions) and `components/` (JSX): the definition is neither a function nor JSX, but it is still a distinct concern from the component it supports. Name the file descriptively for its domain content — never `ComponentName.constants.ts` — because the content is not literally a constant.

- ✅ `textFormattingConfig.ts` (sibling of `TextFormattingRow.tsx`, single consumer) — holds `TextFormatBtnConfig`/`HeadingBtnConfig`/`ListBtnConfig` types and their static button-config arrays; extracted because the config is a distinct concern from `TextFormattingRow`'s render/state logic, not because of consumer count
- ❌ Naming the file `TextFormattingRow.constants.ts` — the file's content is typed config data, not a constant; the descriptive name is the correct convention under Trigger 2

### List Conventions

**Default sortable columns:** All entity lists support sorting by `name`, `created_at`, and `updated_at` as baseline columns. These are app-wide defaults — never re-specify them in feature stories or screen-specific specs. Domain-specific sort columns (e.g., `session_date` for sessions) are additive and require their own story or spec entry.

- ❌ BAD: Session screen spec includes `name`, `created_at`, `updated_at` as session-specific sort work — these are already covered by the baseline
- ✅ GOOD: Session screen spec adds only `session_date` as a new sort column, relying on the baseline for the rest

### Testing Policy

- **Required**: All helper functions (`ComponentName/helper/`) and all util functions (`/src/util/`) must have corresponding tests in a parallel `__tests__/` directory mirroring the file name. Exception: a helper whose entire body consists of DOM or canvas mutations with no branching, no derived data, and no multi-step logic is exempt — it has no independently verifiable output to assert against.
- **Forbidden**: React components — files whose exported function returns JSX — must not have unit tests. Components change shape frequently; testing helpers and the data layer provides sufficient coverage at lower cost.
- **Geometry and layout calculation helper tests must assert the relationship, computed from the same imported constants the implementation uses — never bake the constants' current numeric values into a separate literal expectation.** This applies specifically to helpers whose output depends on constants under active visual tuning (spacing, offsets, clamping thresholds, and similar layout values still being adjusted for visual correctness). A test that hardcodes today's numeric output breaks — or worse, silently stops verifying the real relationship — every time the constant is tuned, even though the implementation's logic is unchanged.
  - ❌ BAD: `expect(calculateHintPosition(anchor)).toBe(anchor.top + 8)` — `8` is a copy of `HINT_OFFSET`'s current value hardcoded as a literal; a tuning pass changing `HINT_OFFSET` to `12` breaks this test with no logic change
  - ✅ GOOD: `expect(calculateHintPosition(anchor)).toBe(anchor.top + HINT_OFFSET)` — imports the same constant the implementation reads, so the assertion tracks tuning changes automatically
  - This does not apply to helpers whose expected output is not derived from a tunable constant (e.g. a string-formatting helper) — hardcoding a literal expected string there is correct.

### Styles

- `.css` files in `/styles` are for variables and globals
- Each component and screen has their own `.css` file that lives in parallel with them. When a sub-component is extracted, CSS scoped to that sub-component moves into the sub-component's directory — it does not stay in the parent's `.css` file. When CSS moves, all class names must be re-namespaced to the sub-component's own block name (its component name, kebab-cased) — class names derived from a prior parent's name are a violation.

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

**DB-sourced runtime values:** When a CSS property value comes from the database at runtime and cannot be known at build time, apply it as a CSS custom property via an inline `style` prop — never as a direct inline style property. The CSS file then consumes the custom property via `var()`. All runtime custom properties must be prefixed with `--rt-[component-name]-` to distinguish them from global tokens at a glance. When a component needs both a runtime custom property and a standard CSS property in the same `style` prop, include both in a single object cast — do not split them across two props or two casts.

- ✅ `style={{ '--rt-component-xyz-color': color, width: size } as React.CSSProperties}` + CSS: `color: var(--rt-component-xyz-color)`
- ✅ `style={{ '--rt-component-xyz-color': color } as React.CSSProperties}` + CSS: `color: var(--rt-component-xyz-color)`
- ❌ `style={{ color: color }}` — raw runtime value applied directly as a style property

**Static CSS custom properties:** When a component-scoped CSS value is not DB-sourced but also cannot use a global token (e.g., a computed layout value set via JavaScript, or an intermediate calculation shared between CSS rules within the same component), declare it as a static custom property on the component's root element. Prefix with `--[component-name]-` (kebab-cased component name, no `rt` segment) to distinguish from both global tokens and runtime values.

- ✅ `--card-flip-duration: 0.4s` (set in CSS), consumed via `var(--card-flip-duration)` within the same component — illustrative; not tied to any specific file
- ✅ `--floating-toolbar-offset: 0px` (set in JS as a style prop for a non-DB computed value), consumed via `var(--floating-toolbar-offset)` — illustrative; not tied to any specific file
- ❌ `--rt-toolbar-position: 8px` — the `--rt-` prefix signals DB-sourced; do not use it for static or JS-computed values that are not DB-derived

**No unilateral additions to `styles/variables/`:** Never add a new CSS variable to the variables folder on your own. If a value appears to be reused across components and would benefit from a token, flag it to the user — they decide whether to add it and which file it belongs in. Introduce the value inline (or as a runtime custom property if DB-sourced) in the meantime. This inline fallback is a narrow exception to the Design token obligation above — it applies only while waiting for user approval on a new token, not as a permanent state.

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
  - ❌ `types/appRoute.type.ts` if `AppRoute` is imported only in `ScreenNavBtn` — move the declaration into `ScreenNavBtn.tsx`
  - ✅ `HtmlProps` in `types/` — imported across dozens of unrelated components

**Barrel requirement:** `types/` is a grouping folder. It requires a barrel (`types/index.ts`) with explicit named exports. External consumers import from `@/types`.

## State Management & Error Handling

### TanStack Query pattern

All async data lives in TanStack Query. Data access hooks wrap `useQuery`/`useMutation` and expose a clean API. Screens and components consume the API — they own no async logic themselves.

**Layer responsibilities:**

- `app/services/` — business logic, wraps DB calls and Tauri API calls that require business logic, compose multiple operations, or need domain-typed error handling; throws domain errors from `@domain`. Import via `@services/<file>`.
  - **Service-layer conventions (no fallback defaults for nullable columns, no replicating a DB `DEFAULT` value at a call site) are documented in `app/services/CLAUDE.md`** — do not duplicate them here.
- `data-access-layer/` — wraps TanStack Query hooks, exposes clean API, no try/catch. Tauri API calls that are pure reads with no business logic and no domain error transformation go directly here — never through `services/`. One concern = one file: query keys, single-entity hooks, and collection hooks each own a separate file (`sessionKeys.ts`, `useSession.ts`, `useSessions.ts`) — TanStack Query's shared cache deduplicates across hooks, so no `DomainProvider` wrapping mutations is needed; the hooks are the data access layer.
- `screens/` — UI only, no error handling, no try/catch
- Error Boundary at app level catches all unhandled async errors

**Non-negotiable rules:**

- Always add `throwOnError: true` to every `useQuery` call. Without it, query errors are silently swallowed into the query's internal error state and never surface to the Error Boundary. The only permitted exception is a query explicitly designated as a non-blocking background check, where: (a) `throwOnError` is intentionally omitted — never set to `false` explicitly — with a block comment on the `useQuery` call documenting why the Error Boundary is not the correct destination, and (b) the hook's return type exposes the error as a named, typed field (e.g., `checkError: UpdateCheckError | null`) so callers can handle it locally. A non-blocking background check that does not expose its error through the return type is not an exception — it is a violation.
- Never destructure `error` from `useQuery` and handle it locally — let it propagate.
- Never wrap `mutateAsync` in try/catch in data access hooks or screens — mutations use `throwOnError: true` via QueryClient defaults.
- Never add try/catch blocks to data access hooks or screens. If an error needs handling, it belongs in the service layer or the Error Boundary.
- **Mutations close over construction-time arguments — never accept them at call time.** When a `useMutation` hook requires an entity identifier that is known when the hook is constructed (e.g., `npcId`, `sessionId`, `adventureId`), capture it in the hook's closure — never declare it as a parameter of `mutationFn`. A `mutationFn` that accepts an id parameter when that id was already available at construction time is always wrong.
  - ✅ GOOD: `const useDeleteNpc = (npcId: string) => useMutation({ mutationFn: () => npcService.deleteNpc(npcId) })`
  - ❌ BAD: `const useDeleteNpc = (npcId: string) => useMutation({ mutationFn: (id: string) => npcService.deleteNpc(id) })`

- **Hook return functions are typed to the caller's contract — never expose TanStack Query internals.** Every function on a DAL hook's return type must be declared as a named wrapper with a concrete signature reflecting exactly what the caller receives. Never re-export `mutateAsync`, `mutate`, or any other TanStack Query primitive directly. The return type must express the domain operation — not the framework's dispatch mechanism. The named wrapper is required for API hygiene — it severs the caller's dependency on TanStack Query's internal types and dispatch shape. Type compatibility between `mutateAsync` and `() => Promise<void>` is not a justification for removing the wrapper; the wrapper's purpose is to establish a boundary, not to resolve a type mismatch.
  - ✅ GOOD: `deleteNpc: () => Promise<void>` — caller sees a domain operation
  - ✅ GOOD: `updateNpc: (data: UpdateNpcData) => void` — caller sees the domain payload shape
  - ✅ GOOD: `createNpc: () => Promise<string>` — caller sees the domain return value
  - ❌ BAD: `deleteNpc: typeof deleteMutation.mutateAsync` — exposes a TanStack internal
  - ❌ BAD: `mutate: UseMutateAsyncFunction<...>` — TanStack primitive on the return type

**`useCallback` and `useMemo` are justified only when the wrapped value is read as a dependency in an effect's dependency array, or passed as a prop to a component wrapped in `React.memo`. Applying either hook by default — to event handlers, derived values, or callbacks with no such consumer — adds indirection with no referential-stability benefit and must not be done.** Before wrapping a function or computation in `useCallback`/`useMemo`, identify the specific consumer that requires referential stability. If none exists, write the function or computation as a plain `const` recomputed on every render.

- ✅ GOOD: `useCallback` wrapping `onSelect` because it is passed to `<MemoizedListItem onSelect={onSelect} />`
- ✅ GOOD: `useMemo` wrapping a derived array because it is read inside a `useEffect` dependency array
- ❌ BAD: `useCallback`-wrapping a table-row mutation handler (`handleInsertRowAbove`) that is only ever called from an inline `onClick` in the same component's JSX — no memoized child and no effect dependency reads it

**State is reserved for values with no synchronous source — anything arriving from outside React's render cycle (network/promise results, timers, subscriptions, DOM measurements). A value fully computable at render time from props, other state, or module-level constants must be derived via `useMemo` or a plain computed expression, never stored via `useState` plus a recomputing setter.** Reaching for `useState` out of habit when the value is already synchronously derivable duplicates state that render can compute directly, and desyncs the moment the derivation logic and the setter call drift apart.

- ✅ GOOD: `MentionTypeaheadPlugin.tsx` — `options` is `useState<MentionMenuOption[]>([])`, populated inside a `.then()` callback on `mentionSearchService.searchMentions(...)`, a promise with no synchronous source; a `queryGenerationRef` guard discards stale resolutions
- ❌ BAD: `SlashCommandPlugin.tsx` — `options` is `useState<SlashCommandOption[]>(SLASH_COMMAND_OPTIONS)`, updated in `onQueryChange` by synchronously filtering the static `SLASH_COMMAND_OPTIONS` import against `matchingString`; no async boundary exists anywhere in the derivation — this must be `useMemo(() => SLASH_COMMAND_OPTIONS.filter(...), [matchingString])` instead
- **Exception:** the "Controlled inputs that drive auto-save mutations" rule below stores a synchronously-available value (`npc?.name`) in `useState` anyway. This is a deliberate exception to the principle above, justified by a different concern — preventing mid-keystroke jank from query re-fetch races — not by absence of a synchronous source. Do not treat that rule as an instance of this principle; it is a documented carve-out.

**Never gate a continuous listener's state update by comparing two freshly-recomputed objects from that same live source via equality.** A `ResizeObserver` callback, scroll listener, `MutationObserver`, or `requestAnimationFrame` loop that recomputes an object on every firing (e.g. a `getBoundingClientRect()` result or a `ResizeObserverEntry`) can never produce two reference-equal objects across invocations, regardless of whether their values match. A settling check built on comparing such objects (`if (!isEqual(newRect, prevRect)) setSettledRect(newRect)`) never converges — the effect/listener/setState cycle loops forever. Apply one of two fixes instead:

- Derive and store a primitive (a number, string, or boolean) from the live source, so React's own `Object.is` bail-out on `setState` provides convergence naturally.
- When the actual distinction needed is "has this happened once yet" rather than "has this value stopped changing," use a one-shot ref or boolean flag instead of a settling comparison.

- ✅ GOOD: `EditorPopup.tsx`'s `ResizeObserver` callback calls `setHorizontalOffset` with a number returned by `calculateHorizontalClampOffset(...)` — a primitive, so React's bail-out naturally stops the cycle once the value stabilizes.
- ❌ BAD (illustrative, not a current file): storing a `settledRect` object in state and comparing it against a fresh `popup.getBoundingClientRect()` result on every `ResizeObserver` firing — `getBoundingClientRect()` allocates a new object every call, so the comparison never finds two equal references and `setSettledRect` fires indefinitely.

**Controlled inputs that drive auto-save mutations use local state for the displayed value.** When a text or date input is bound to a server value and calls a mutation on change, bind `value` to a `useState` variable — not directly to the query result. Call both the local setter and the debounced updater in `onChange`. Binding `value` directly to the query result causes the input to jump mid-keystroke when TanStack Query re-fetches after invalidation. The `?? ''` initializer is correct at this boundary: HTML inputs require a string, and the empty string represents "nothing displayed" — a distinct concept from the nullable DB column representing "nothing stored."

- ✅ GOOD:
  ```tsx
  const [name, setName] = useState(npc?.name ?? '');
  <Input
    value={name}
    onChange={(e) => {
      setName(e.target.value);
      updateNpc({ name: e.target.value });
    }}
  />;
  ```
- ❌ BAD:
  ```tsx
  <Input
    value={npc.name ?? ''}
    onChange={(e) => updateNpc({ name: e.target.value })}
  />
  ```

**Framework context is not a prop.** Never relay a value as a prop when the receiving component can obtain it directly from a framework-managed context. This prohibition covers data-fetching results, data-fetching callbacks, and routing context (URL params via `useParams`). Props are reserved for state that genuinely belongs to a parent: cross-component coordination such as tooltip visibility, modal open/close, or selection state shared between siblings. Pass a callback down only when the parent owns the coordination state and the child reports events up. If a component has a button, that component owns the button's action — it does not receive a callback from two levels up.

- ❌ BAD: `SessionScreen` fetches session data, passes it to `PrepView`, which passes it to `StepSection`, which passes it to `StepSectionHeader`
- ✅ GOOD: `StepSectionHeader` calls `useSession(sessionId)` directly; TanStack Query serves the cached value
- ❌ BAD: `SessionScreen` passes `sessionId` and `adventureId` as props to `SessionHeader`, which then passes them to `useSession`
- ✅ GOOD: `SessionHeader` calls `useParams()` directly and passes the result to `useSession`
