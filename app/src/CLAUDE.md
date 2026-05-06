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

## File Organization

### Barrel Files

Two directory types exist — distinguish them before adding or deleting a barrel:

- **Module directory**: owns a single domain entity (`npcs/`, `adventures/`, `table-config/`). Always exposes its public API through an `index.ts`. This barrel is required.
- **Grouping folder**: organizes module directories but owns no domain itself (`data-access-layer/`, `components/`, `util/`, `hooks/`, `services/`). Every grouping folder under `src/` **requires** a barrel (`index.ts`) with explicit named exports — `export *` is banned in grouping barrels. External consumers always import from exactly one level: `@/components`, `@/data-access-layer`, `@/util`, etc. — never deeper. Within-module imports use the module directory barrel via relative path (`./SortableListItem`, not `@/components/SortableList/SortableListItem`). Exceptions with no barrel: `routes/` (managed by TanStack Router file conventions), `styles/` (CSS only), `assets/`.
- `@db` is an explicit exception: no grouping barrel exists at the db root. See `app/db/CLAUDE.md` — Naming for the authoritative import depth rule.
- In **module directory barrels**, `export *` is permitted when the file has a single, obvious public concern (one component + its types) with no internals to leak. Use explicit named exports when a file exports multiple distinct things or has implementation details that should stay private. The trigger: if you would have to think about whether a new export should be public, use explicit exports.
  - ✅ GOOD: `data-access-layer/npcs/index.ts` — module directory, barrel required
  - ✅ GOOD: `export { useNpcs, useNpc } from './npcs'` in a grouping barrel — explicit named exports only, never `export *`
  - ❌ BAD: missing `data-access-layer/index.ts` — grouping barrels are unconditionally required, not optional
  - ❌ BAD: `export * from './npcKeys'` in `npcs/index.ts` — accidentally leaks internal query key factories; if `npcKeys` is public API, name it explicitly

### 1 Concern → 1 File (frontend examples)

In the data-access-layer, one concern = one file:

- ✅ GOOD: `sessionKeys.ts` owns all query key factories for sessions; `useSession.ts` owns the single-entity query + mutations; `useSessions.ts` owns the collection query + mutations — no provider, TanStack Query's shared cache deduplicates across hooks
- ❌ BAD: A `DomainProvider` that owns mutations and passes them as props — TanStack Query replaces manual providers; the hooks ARE the data access layer

### Screens

- screens are what would be different pages on a website
- When they are displayed is handled in `App.tsx`
- **Any `components/` subdirectories** follow the same barrel rule as component-library `ComponentName/components/`: they are grouping folders and require an `index.ts` with explicit named exports. Sub-components within a screen are always imported from `./components`, never by direct path.
  - ✅ `import { StepSection } from './components'`
  - ❌ `import { StepSection } from './components/StepSection/StepSection'`

### providers/

**providers/** is for app-level UI infrastructure — React Context providers that wrap the app root and expose hooks. Data infrastructure (e.g., `TanstackQueryClientProvider`) stays in `data-access-layer/`. `providers/` is a grouping folder: its `index.ts` uses explicit named exports. Each provider lives in its own module directory with a required `index.ts` barrel.

### Coding Style

- TypeScript only. No JavaScript files in `src/`.
- Use modern arrow function syntax. Classes are permitted only where a third-party framework API requires inheritance — e.g., Lexical node types (extending `DecoratorNode`, `TextNode`, etc.) and `MenuOption` subclasses. Do not introduce classes for any other reason.
- **Error types use factory functions, not classes.** Create typed errors with a factory function and type narrowing — never `class XxxError extends Error`. `instanceof` is not used in this codebase — all errors route to the Error Boundary via `throwOnError: true`.

  ```ts
  // ✅ GOOD
  export type SessionLoadError = Error & { name: 'SessionLoadError' };
  export const sessionLoadError = (cause?: unknown): SessionLoadError => {
    const error = new Error(`Failed to load sessions: ${String(cause)}`) as SessionLoadError;
    error.name = 'SessionLoadError';
    return error;
  };

  // ❌ BAD
  export class SessionLoadError extends Error { ... }
  ```

- Never use `undefined` as a value in business logic — not as a return type, not as a local variable initializer, and not in a union type for a local variable that represents domain state. Use `null` for "no value yet" and explicit error types for error states. `undefined` is a language default — its presence in domain code signals a missing initialization decision.
  - ❌ BAD: `let session: Session | undefined;`
  - ✅ GOOD: `let session: Session | null = null;`
- **`useLayoutEffect` over `useEffect` only when a DOM measurement or paint-synchronous side effect is required** — the canonical case is reading layout geometry (`getBoundingClientRect`, `scrollWidth`, `offsetHeight`) and applying a state update that must not cause a visible flash. All other effects use `useEffect`. When `useLayoutEffect` is chosen, an inline comment stating the specific paint-synchronous requirement is required — "avoids flicker" alone is not sufficient.

### Component Library

- each component has its own folder
- each component has its own `.css` file
- Pure functions (transformations, formatters, predicates) that support a component must live in `ComponentName/helper/`, one file per function — never co-located in the component file itself. Structure mirrors the hooks pattern: `helper/helperA.ts` + `helper/__tests__/helperA.test.ts`.
- Sub-components (functions that return JSX) used exclusively within a parent component belong in `ComponentName/components/`, where `ComponentName` is the immediate JSX parent — the component whose render output directly contains the sub-component. Ownership is not inherited by ancestors. This rule applies at every level of nesting: a sub-component of a sub-component belongs in the sub-component's own `ComponentName/components/`, not at the screen or top-level module's `components/`. When a sub-component is rendered by two or more unrelated parents, it belongs to neither — place it as a peer module directory at the nearest shared ancestor. For top-level components in `components/`, this means a standalone `components/SubComponentName/` directory alongside its consumers, not nested under either of them.
  - ✅ `components/MentionPopup/` — domain UI components belong in `components/` regardless of consumer count; the sub-component ownership rule applies within the component library only, not to provider modules
  - ❌ `providers/PinnedPopupsProvider/components/MentionPopup/` — provider modules are infrastructure; they do not adopt domain UI components as sub-components even when they are the sole renderer

**Sub-component ownership does not apply to provider modules.** A component rendered exclusively by a provider belongs in `components/`, not inside the provider's module directory. `providers/` is infrastructure; its `components/` subdirectory (if any) is reserved for provider-internal structural fragments, not domain UI.
- `helper/` and `components/` each have an `index.ts` as a within-module grouping barrel — explicit named exports, never re-exported from the parent `ComponentName/index.ts`. A sub-component directory within `components/` only needs its own `index.ts` when it has internal sub-structure (its own `helper/` or `components/` subdirectory). A flat single-file sub-component is exported directly from the `components/` barrel.
  - ✅ `export { AvatarCell } from './AvatarCell/AvatarCell'` in `components/index.ts` — flat sub-component, no sub-directory barrel needed
  - ✅ `SortableListItem/components/AvatarCell/index.ts` exists only if `AvatarCell/` grows its own `helper/` or `components/`
  - ✅ Parent imports `import { AvatarCell } from './components'`
  - ❌ `import { AvatarCell } from '../components/AvatarCell/AvatarCell'` — double-name import, always wrong regardless of nesting depth
  - ❌ `export * from './components'` in `ComponentName/index.ts` — components/ barrel is internal, never re-exported upward
- **Sibling imports within `components/` use relative paths, never the barrel.** A component inside `components/` that needs another top-level component from the same grouping folder must import it via a relative path (e.g., `../GlassPanel/GlassPanel`) — never via `@/components`. Importing through the grouping barrel from within the folder it exports creates a circular dependency.
  - ✅ `import { GlassPanel } from '../GlassPanel/GlassPanel'` — from inside `MentionPopup/MentionPopup.tsx`
  - ❌ `import { GlassPanel } from '@/components'` — circular: the barrel exports `MentionPopup`, which imports from the barrel

### Component Internals

**No IIFE in JSX.** An immediately-invoked function expression inside a render return (`{(() => { ... })()}`) is always a sign that logic has not been extracted. Apply the correct extraction:

- Logic that returns a primitive value → extract to a `helper/` function.
- Logic that returns JSX → extract to a sub-component in `components/`.

Never leave an IIFE in a render return.

**No inline sub-components.** A named function declared inside a component body that returns JSX is a sub-component, not a helper. It must be extracted to `ComponentName/components/` exactly as if it had been defined outside the parent file. Defining it inline does not make it exempt from the ownership rule — the extraction destination is the same regardless of where the function is currently declared.

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
- Each component and screen has their own `.css` file that lives in parallel with them. When a sub-component is extracted, CSS scoped to that sub-component moves into the sub-component's directory — it does not stay in the parent's `.css` file.

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

- Error factory functions and their types (see `### Coding Style` above)
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
  - **Service layer must not supply fallback defaults for nullable or DB-defaulted columns.** A nullable column's correct value when not provided is `NULL` — supplying a fallback in the service layer misrepresents domain state. Service functions pass values through as-is or omit them; they do not apply `?? 'fallback'` or similar substitutions.
    - ❌ BAD: `name: data.name ?? 'New Session'` in a service `create` function — implies the session has a name when it doesn't
    - ✅ GOOD: `name: data.name` — pass the value through; the DB handles NULL
  - **Never replicate a DB default value at a call site.** When a column has a SQL `DEFAULT`, omit the field — the database supplies the value. When a `NOT NULL DEFAULT x` column appears non-optional at a call site, the fix is `generateCreateSchema` — never patch the call site.
    - ❌ BAD: `active_view: 'prep'` in a service `create` call because the column became non-optional
    - ✅ GOOD: omit `active_view` entirely — `generateCreateSchema` makes it optional at the schema level; the DB default fires
- `data-access-layer/` — wraps TanStack Query hooks, exposes clean API, no try/catch
- `screens/` — UI only, no error handling, no try/catch
- Error Boundary at app level catches all unhandled async errors

**Non-negotiable rules:**

- Always add `throwOnError: true` to every `useQuery` call. Without it, query errors are silently swallowed into the query's internal error state and never surface to the Error Boundary.
- Never destructure `error` from `useQuery` and handle it locally — let it propagate.
- Never wrap `mutateAsync` in try/catch in data access hooks or screens — mutations use `throwOnError: true` via QueryClient defaults.
- Never add try/catch blocks to data access hooks or screens. If an error needs handling, it belongs in the service layer or the Error Boundary.
- **Mutations close over construction-time arguments — never accept them at call time.** When a `useMutation` hook requires an entity identifier that is known when the hook is constructed (e.g., `npcId`, `sessionId`, `adventureId`), capture it in the hook's closure — never declare it as a parameter of `mutationFn`. A `mutationFn` that accepts an id parameter when that id was already available at construction time is always wrong.
  - ✅ GOOD: `const useDeleteNpc = (npcId: string) => useMutation({ mutationFn: () => npcService.deleteNpc(npcId) })`
  - ❌ BAD: `const useDeleteNpc = (npcId: string) => useMutation({ mutationFn: (id: string) => npcService.deleteNpc(id) })`

**Framework context is not a prop.** Never relay a value as a prop when the receiving component can obtain it directly from a framework-managed context. This prohibition covers data-fetching results, data-fetching callbacks, and routing context (URL params via `useParams`). Props are reserved for state that genuinely belongs to a parent: cross-component coordination such as tooltip visibility, modal open/close, or selection state shared between siblings. Pass a callback down only when the parent owns the coordination state and the child reports events up. If a component has a button, that component owns the button's action — it does not receive a callback from two levels up.

- ❌ BAD: `SessionScreen` fetches session data, passes it to `PrepView`, which passes it to `StepSection`, which passes it to `StepSectionHeader`
- ✅ GOOD: `StepSectionHeader` calls `useSession(sessionId)` directly; TanStack Query serves the cached value
- ❌ BAD: `SessionScreen` passes `sessionId` and `adventureId` as props to `SessionHeader`, which then passes them to `useSession`
- ✅ GOOD: `SessionHeader` calls `useParams()` directly and passes the result to `useSession`
