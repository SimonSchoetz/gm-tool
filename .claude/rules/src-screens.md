---
paths: ["app/src/screens/**", "src/screens/**"]
---

# Screens under `src/`

Conventions for any file under `src/screens/`. Rules for the JSX a screen renders are in `.claude/rules/src-components.md`, which loads when a `.tsx` file is read.

## Screens

- Screens are what would be different pages on a website; when they are displayed is handled in `App.tsx`.
- Screen-local `components/` subdirectories follow the barrel rule in `app/src/CLAUDE.md` — Barrel Files — e.g. `import { StepSection } from './components'`, never `./components/StepSection/StepSection`.
- A component shared by two or more unrelated screens is promoted to `screens/components/`, a peer of the screen directories, under the same nearest-shared-ancestor rule as Sub-component ownership in `.claude/rules/src-components.md` — Component Library — never nested inside the screen that introduced it. It takes a `Screens` prefix (`ScreensNameInput`, `ScreensDuplicateBtn`) to distinguish it from screen-local sub-components and from `src/components/` primitives.
  - ✅ `screens/components/ScreensDuplicateBtn/` ❌ `screens/npc/components/ScreensDuplicateBtn/` — nested under one screen despite being shared
