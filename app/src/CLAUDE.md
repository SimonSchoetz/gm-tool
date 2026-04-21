# Frontend

Follows the global file organization conventions from the root CLAUDE.md.

## Structure

```text
src/
├── assets/
├── components/ # UI
│   ├── ComponentA/
│   │   ├── ComponentA.tsx
│   │   └── ComponentA.css
│   └── index.ts
├── domain/ # business concepts (errors, types, validation)
│   ├── domainA/
│   │   ├── index.ts
│   │   ├── types.ts # domain specific types when needed
│   │   ├── validation.ts # business rules when needed
│   │   └── errors.ts
├── hooks/ # reusable React hooks
│   ├── index.ts
│   ├── simpleHook.ts # flat file when no helpers needed
│   └── complexHook/ # directory when helpers are needed
│     ├── complexHook.ts
│     └── helper/
│       ├── helperA.ts
│       └── __tests__/
│         └── helperA.test.ts
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
├── services/ # operations (CRUD, business logic), uses db types and domain errors
│   ├── index.ts
│   └── serviceA.ts
├── styles/
│   ├── global.css
│   ├── reset.css
│   └── variables.css
├── types/
│   ├── index.ts
│   └── domain.types.ts
├── util/
│   └── utilA.ts
├── App.css
├── App.tsx
└── main.tsx
```

### Screens

- screens are what would be different pages on a website
- When they are displayed is handled in `App.tsx`
- **Any `components/` subdirectories** follow the same barrel rule as component-library `ComponentName/components/`: they are grouping folders and require an `index.ts` with explicit named exports. Sub-components within a screen are always imported from `./components`, never by direct path.
  - ✅ `import { StepSection } from './components'`
  - ❌ `import { StepSection } from './components/StepSection/StepSection'`

### Component Library

- each component has its own folder
- each component has its own `.css` file
- Pure functions (transformations, formatters, predicates) that support a component must live in `ComponentName/helper/`, one file per function — never co-located in the component file itself. Structure mirrors the hooks pattern: `helper/helperA.ts` + `helper/__tests__/helperA.test.ts`.
- Sub-components (functions that return JSX) used exclusively within a parent component belong in `ComponentName/components/`.
- `helper/` and `components/` each have an `index.ts` as a within-module grouping barrel — explicit named exports, never re-exported from the parent `ComponentName/index.ts`. A sub-component directory within `components/` only needs its own `index.ts` when it has internal sub-structure (its own `helper/` or `components/` subdirectory). A flat single-file sub-component is exported directly from the `components/` barrel.
  - ✅ `export { AvatarCell } from './AvatarCell/AvatarCell'` in `components/index.ts` — flat sub-component, no sub-directory barrel needed
  - ✅ `SortableListItem/components/AvatarCell/index.ts` exists only if `AvatarCell/` grows its own `helper/` or `components/`
  - ✅ Parent imports `import { AvatarCell } from './components'`
  - ❌ `import { AvatarCell } from '../components/AvatarCell/AvatarCell'` — double-name import, always wrong regardless of nesting depth
  - ❌ `export * from './components'` in `ComponentName/index.ts` — components/ barrel is internal, never re-exported upward

### Component Internals

**No IIFE in JSX.** An immediately-invoked function expression inside a render return (`{(() => { ... })()}`) is always a sign that logic has not been extracted. Apply the correct extraction:

- Logic that returns a primitive value → extract to a `helper/` function.
- Logic that returns JSX → extract to a sub-component in `components/`.

Never leave an IIFE in a render return.

**Props pattern — three cases, pick exactly one:**

1. `HtmlProps<'element'>` — the component is a thin styled wrapper over a native HTML element and must forward all native attributes to it.
   - ✅ `type GlassPanelProps = { radius?: RadiusSize } & HtmlProps<'div'>`
   - ❌ `DivHTMLAttributes<HTMLDivElement>` or `React.HTMLProps<HTMLDivElement>` — always use the `HtmlProps` alias, never the raw React type

2. `React.ComponentProps<typeof Parent>` — the component extends a specific existing component and must stay in sync with its prop shape.
   - ✅ `type Props = { buttonStyle?: 'danger' } & React.ComponentProps<typeof ActionContainer>`

3. `FCProps<Props>` — the component has a closed API that does not extend any HTML element or parent component. Always declare the props as a named `type Props = { ... }` and type the component assignment as `FCProps<Props>`.
   - ✅ `type Props = { onSearch: (term: string) => void; placeholder?: string }`
        `export const SearchInput: FCProps<Props> = ({ onSearch, placeholder }) => { ... }`
   - ❌ `const SearchInput = ({ onSearch }: { onSearch: () => void }) => { ... }` — inline props destructuring without FCProps
   - ❌ `const SearchInput: React.FC<Props> = ...` — use FCProps, not React.FC

**Redundant HTML attributes:** Never write an HTML attribute whose value matches the browser default. Omit it entirely — the browser supplies the default and the attribute adds no information.

- ❌ `<input type="text" />` — `type="text"` is the default
- ❌ `<button type="submit" />` — `type="submit"` is the browser default for button
- ✅ `<input />`, `<button />`
- ✅ `<input type="checkbox" />` — non-default, keep it
- ✅ `<button type="button" />` — non-default, keep it

**Variant system:**

- Variants are expressed as a union type prop and applied via a CSS modifier class. Never express variants as inline styles. Never use one boolean prop per variant when the component has — or may grow — more than one variant.
  - ✅ `buttonStyle?: 'danger'` → `cn('button-wrapper', buttonStyle && \`button-wrapper--${buttonStyle}\`)`
  - ❌ `isDanger?: boolean; isPrimary?: boolean`
  - ❌ `style={{ color: 'red' }}` to express a variant

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

When a constant is shared by two or more files within the same module directory, extract it to `ComponentName.constants.ts` at the level of the **smallest directory that contains all consumers**. A constant used only within a single file stays inlined — no constants file for single consumers.

- ✅ `DEFAULT_COLUMN_WIDTH` shared by `SortingTableHeader` and `SortableListItem` (both under `SortableList/`) → `SortableList/SortableList.constants.ts`
- ❌ A constant used only in `SortingTableHeader` → stays inlined in `SortingTableHeader.tsx`

### List Conventions

**Default sortable columns:** All entity lists support sorting by `name`, `created_at`, and `updated_at` as baseline columns. These are app-wide defaults — never re-specify them in feature stories or screen-specific specs. Domain-specific sort columns (e.g., `session_date` for sessions) are additive and require their own story or spec entry.

- ❌ BAD: Session screen spec includes `name`, `created_at`, `updated_at` as session-specific sort work — these are already covered by the baseline
- ✅ GOOD: Session screen spec adds only `session_date` as a new sort column, relying on the baseline for the rest

### Testing Policy

- **Required**: All helper functions (`ComponentName/helper/`) and all util functions (`/src/util/`) must have corresponding tests in a parallel `__tests__/` directory mirroring the file name.
- **Forbidden**: React components — files whose exported function returns JSX — must not have unit tests. Components change shape frequently; testing helpers and the data layer provides sufficient coverage at lower cost.

### Styles

- `.css` files in `/styles` are for variables and globals
- Each component and screen has their own `.css` file that lives in parallel with them

**CSS class naming — flat BEM-ish:**

- Root element: `block-name` (e.g., `button-wrapper`, `search-input`)
- Modifier: `block-name--modifier` (e.g., `button-wrapper--danger`)
- Never use the BEM element suffix (`__`). There are no `block__element` class names in this codebase.
  - ✅ `search-input`, `search-input--active`
  - ❌ `search-input__icon`, `search-input__field`

**Design token obligation:**

- All CSS property values must reference tokens from `styles/variables.css` (e.g., `var(--spacing-sm)`, `var(--radius-xl)`).
- Raw pixel, color, and `rem` values are banned in component `.css` files.
- If a needed token does not exist in `variables.css`, add it there first — never hardcode at the component level.
  - ✅ `padding: var(--spacing-sm)`
  - ❌ `padding: 8px`
  - ❌ `color: #ffffff`

**DB-sourced runtime values:** When a CSS property value comes from the database at runtime and cannot be known at build time, apply it as a CSS custom property via an inline `style` prop — never as a direct inline style property. The CSS file then consumes the custom property via `var()`. All runtime custom properties must be prefixed with `--rt-` to distinguish them from global tokens at a glance.

- ✅ `style={{ '--rt-color': color } as React.CSSProperties}` + CSS: `color: var(--rt-color)`
- ❌ `style={{ color: color }}` — raw runtime value applied directly as a style property

**No unilateral additions to `variables.css`:** Never add a new CSS variable to `variables.css` on your own. If a value appears to be reused across components and would benefit from a token, flag it to the user — they decide whether to add it. Introduce the value inline (or as a runtime custom property if DB-sourced) in the meantime.

### Domain Layer

`domain/` owns the frontend's business concepts: error types, domain-specific TypeScript types, and validation rules. It has no runtime dependencies on services, data-access-layer, or db — it is the vocabulary layer that everything else imports from.

**What belongs in `domain/`:**

- Error factory functions and their types (see root CLAUDE.md — Error types use factory functions)
- Domain-specific TypeScript types that are not derived from the db schema
- Validation rules that express business constraints (e.g. allowed values, formats)

**What does NOT belong in `domain/`:**

- Types that are purely re-exports of db types — import directly from `@db/domainName`
- Business operations or CRUD logic — those belong in `services/`
- React-specific types (props, ref types) — those belong in `types/` or co-located with their component

**Barrel requirement:** `domain/` is a grouping folder. It requires a grouping barrel (`domain/index.ts`) with explicit named exports — `export *` is banned. Each domain entity has its own module directory (`domain/domainA/`) with a required `index.ts`.

### Types Directory

`types/` owns React-infrastructure types and cross-cutting utility types that are not domain concepts: prop aliases, HTML element type aliases, and generic utility types reused across unrelated modules.

**What belongs in `types/`:**

- The `HtmlProps` alias and similar React/HTML element type helpers
- `FCProps<T>` and similar generic prop wrappers
- Any type that is infrastructure (framework-level) rather than domain-level

**What does NOT belong in `types/`:**

- Domain error types — those belong in `domain/domainName/errors.ts`
- Domain entity types — those belong in `domain/domainName/types.ts`
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

- `services/` — business logic, wraps DB calls, throws domain errors from `/domain`
- `data-access-layer/` — wraps TanStack Query hooks, exposes clean API, no try/catch
- `screens/` — UI only, no error handling, no try/catch
- Error Boundary at app level catches all unhandled async errors

**Non-negotiable rules:**

- Always add `throwOnError: true` to every `useQuery` call. Without it, query errors are silently swallowed into the query's internal error state and never surface to the Error Boundary.
- Never destructure `error` from `useQuery` and handle it locally — let it propagate.
- Never wrap `mutateAsync` in try/catch in data access hooks or screens — mutations use `throwOnError: true` via QueryClient defaults.
- Never add try/catch blocks to data access hooks or screens. If an error needs handling, it belongs in the service layer or the Error Boundary.

**Framework context is not a prop.** Never relay a value as a prop when the receiving component can obtain it directly from a framework-managed context. This prohibition covers data-fetching results, data-fetching callbacks, and routing context (URL params via `useParams`). Props are reserved for state that genuinely belongs to a parent: cross-component coordination such as tooltip visibility, modal open/close, or selection state shared between siblings. Pass a callback down only when the parent owns the coordination state and the child reports events up. If a component has a button, that component owns the button's action — it does not receive a callback from two levels up.

- ❌ BAD: `SessionScreen` fetches session data, passes it to `PrepView`, which passes it to `StepSection`, which passes it to `StepSectionHeader`
- ✅ GOOD: `StepSectionHeader` calls `useSession(sessionId)` directly; TanStack Query serves the cached value
- ❌ BAD: `SessionScreen` passes `sessionId` and `adventureId` as props to `SessionHeader`, which then passes them to `useSession`
- ✅ GOOD: `SessionHeader` calls `useParams()` directly and passes the result to `useSession`
