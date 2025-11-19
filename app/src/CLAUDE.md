# Frontend

## Structure

database
src/
├── **tests**
├── assets/
├── components/
│ ├── ComponentA/
│ │ ├── ComponentA.tsx
│ │ └── ComponentA.css
│ └── index.ts
├── data/
├── screens/
│ ├── screenA/
│ │ ├── ScreenA.tsx
│ │ ├── ComponentA.css
│ │ └── components/
│ └── index.ts
├── styles/
│ ├── global.css
│ ├── reset.css
│ └── variables.css
├── types/
├── util/
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
