# Frontend

Follows the global file organization conventions from the root CLAUDE.md.

## Structure

src/
├── assets/
├── components/ # UI
│ ├── ComponentA/
│ │ ├── ComponentA.tsx
│ │ └── ComponentA.css
│ └── index.ts
├── domain/ # business concepts (errors, types, validation)
│ ├── domainA/
│ │ ├── index.ts
│ │ ├── types.ts # domain specific types when needed
│ │ ├── validation.ts # business rules when needed
│ │ └── errors.ts
├── hooks/ # reusable React hooks
│ ├── index.ts
│ ├── simpleHook.ts # flat file when no helpers needed
│ └── complexHook/ # directory when helpers are needed
│   ├── complexHook.ts
│   └── helper/
│     ├── helperA.ts
│     └── __tests__/
│       └── helperA.test.ts
├── data-access-layer/ # domain data hooks (TanStack Query)
│ ├── TanstackQueryClientProvider.tsx # QueryClient config — enables the entire layer
│ ├── domainA/
│ │ ├── index.ts
│ │ ├── domainAKeys.ts
│ │ ├── useDomainA.ts
│ │ └── useDomainAs.ts
├── routes/ # Tanstack router
├── screens/
│ ├── screenA/
│ │ ├── ScreenA.tsx
│ │ ├── ScreenA.css
│ │ └── components/
│ └── index.ts
├── services/ # operations (CRUD, business logic), uses db types and domain errors
│ └── serviceA.ts
├── styles/
│ ├── global.css
│ ├── reset.css
│ └── variables.css
├── types/
│ └── any.type.ts
├── util/
│ └── utilA.ts
├── App.css
├── App.tsx
└── main.tsx

### Screens

- screens are what would be different pages on a website
- When they are displayed is handled in `App.tsx`

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

### Testing Policy

- **Required**: All helper functions (`ComponentName/helper/`) and all util functions (`/src/util/`) must have corresponding tests in a parallel `__tests__/` directory mirroring the file name.
- **Forbidden**: React components — files whose exported function returns JSX — must not have unit tests. Components change shape frequently; testing helpers and the data layer provides sufficient coverage at lower cost.

### Styles

- `.css` files in `/styles` are for variables and globals
- each component and screen has their own `.css` file that lives in parallel with them

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
