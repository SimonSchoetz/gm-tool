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
├── providers/ # React state (context, hooks)
│ ├── providerA/
│ │ ├── index.ts
│ │ ├── ProviderA.tsx
│ │ └── useProviderA.ts
├── routes/ # Tanstack router
├── screens/
│ ├── screenA/
│ │ ├── ScreenA.tsx
│ │ ├── ScreenA.css
│ │ └── components/
│ └── index.ts
├── services/ # operations (CRUD, business logic), uses db types and domain errors
│ ├── serviceA.ts
│ └── index.ts
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
- if a component is complicated, you may add sub folders with e.g. sub components or helper functions or types. Ask, when unsure!

### Styles

- `.css` files in `/styles` are for variables and globals
- each component and screen has their own `.css` file that lives in parallel with them

## State Management & Error Handling

### TanStack Query pattern

All async data lives in TanStack Query. Providers wrap `useQuery`/`useMutation` and expose a clean API. Screens and components consume the API — they own no async logic themselves.

**Layer responsibilities:**

- `services/` — business logic, wraps DB calls, throws domain errors from `/domain`
- `providers/` — wraps TanStack Query hooks, exposes clean context API, no try/catch
- `screens/` — UI only, no error handling, no try/catch
- Error Boundary at app level catches all unhandled async errors

**Non-negotiable rules:**

- Always add `throwOnError: true` to every `useQuery` call. Without it, query errors are silently swallowed into the query's internal error state and never surface to the Error Boundary.
- Never destructure `error` from `useQuery` and handle it locally — let it propagate.
- Never wrap `mutateAsync` in try/catch in providers or screens — mutations use `throwOnError: true` via QueryClient defaults.
- Never add try/catch blocks to providers or screens. If an error needs handling, it belongs in the service layer or the Error Boundary.
