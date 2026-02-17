# Frontend

## Structure

database
src/
├── **tests**
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
├── services/ # operations (CRUD, business logic)m uses db types and domain errors
│ ├── serviceA.ts
│ └── index.ts
├── styles/
│ ├── global.css
│ ├── reset.css
│ └── variables.css
├── types/
│ └── any.type.ts
├── util/
│ ├── **tests**/
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
