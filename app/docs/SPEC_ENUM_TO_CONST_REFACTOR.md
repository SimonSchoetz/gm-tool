# Spec: Enum → as const Refactor

## Progress Tracker

- Sub-feature 1: Routes refactor — replace `enum Routes` with `as const` object + derived `Route` type
- Sub-feature 2: Direction refactor — replace `enum Direction` in `generateZigzagPath.ts` with `as const` object + derived type
- Sub-feature 3: CLAUDE.md — add `as const over enum` convention rule

---

## Key Architectural Decisions

### as const over enum

TypeScript enums compile to runtime IIFE objects — they are not plain types and
conflict with the project's "types over interfaces" posture. An `as const` object
with a derived union type (`type Foo = (typeof Foo)[keyof typeof Foo]`) gives
identical DX: dot-access, autocomplete, type narrowing, and exhaustiveness checks.
String enums do not reverse-map, so the one feature enums add over `as const`
does not apply anywhere in this codebase.

### Consumers require no functional changes for value usage

Every `Routes.X` dot-access call site (template literals, function arguments,
string comparisons) is identical for both an enum member and an `as const` value.
Only `ScreenNavBtn.tsx` requires a change — it uses `Routes` as a type annotation
(`targetRoute: Routes | string`), which must become `Route | string`.

### Direction enum is file-local, no consumers outside generateZigzagPath.ts

The `Direction` enum in `generateZigzagPath.ts` is not exported and is used only
within that file. The refactor is self-contained to that one file.

### Route type name — AppRoute

The derived type for the `Routes` object is named `AppRoute`. This avoids a
naming collision with TanStack Router's own `Route` export (`export const Route
= createFileRoute(...)`) which already exists in `routes/index.tsx`. Both a
`const` and a `type` named `Route` can technically coexist in TypeScript's
separate namespaces, but the ambiguity is a readability hazard. `AppRoute` is
unambiguous and clearly scoped to this application's route values.

---

## Sub-feature 1: Routes Refactor

Replace `enum Routes` in `app/src/routes/index.tsx` with an `as const` object
and export a derived `Route` type. Update the one type-level consumer
(`ScreenNavBtn.tsx`).

### Files affected

Modified:
- `app/src/routes/index.tsx`
- `app/src/components/SideBarNav/components/ScreenNavBtn/ScreenNavBtn.tsx`

### Layered breakdown

#### Frontend

**`app/src/routes/index.tsx`**

Replace:
```ts
export enum Routes {
  HOME = '/',
  ADVENTURES = 'adventures',
  ADVENTURE = 'adventure',
  NPCS = 'npcs',
  NPC = 'npc',
  SESSIONS = 'sessions',
  SESSION = 'session',
  SETTINGS = 'settings',
}
```

With:
```ts
export const Routes = {
  HOME: '/',
  ADVENTURES: 'adventures',
  ADVENTURE: 'adventure',
  NPCS: 'npcs',
  NPC: 'npc',
  SESSIONS: 'sessions',
  SESSION: 'session',
  SETTINGS: 'settings',
} as const;

export type AppRoute = (typeof Routes)[keyof typeof Routes];
```

The existing `export const Route = createFileRoute(...)` line remains untouched.
No other change to this file.

**`app/src/components/SideBarNav/components/ScreenNavBtn/ScreenNavBtn.tsx`**

Update the import to also bring in the `AppRoute` type:
```ts
import { Routes } from '@/routes';
import type { AppRoute } from '@/routes';
```

Update the prop type annotation:
```ts
targetRoute: AppRoute | string;
```

No other change to this file.

---

## Sub-feature 2: Direction Refactor

Replace the file-local `enum Direction` in `generateZigzagPath.ts` with an
`as const` object and a derived type alias. This change is self-contained to one
file with no impact on any consumer.

### Files affected

Modified:
- `app/src/components/Backdrop/helper/generateZigzagPath.ts`

### Layered breakdown

#### Frontend

**`app/src/components/Backdrop/helper/generateZigzagPath.ts`**

Replace:
```ts
enum Direction {
  LEFT = -1,
  RIGHT = 1,
  DOWN = 0,
}
```

With:
```ts
const Direction = {
  LEFT: -1,
  RIGHT: 1,
  DOWN: 0,
} as const;

type Direction = (typeof Direction)[keyof typeof Direction];
```

The `Direction` object is not exported. Keep it unexported — it is file-local.

All usages of `Direction.LEFT`, `Direction.RIGHT`, and `Direction.DOWN` inside
`generateZigzagPath` are value lookups and require no changes. All comparisons
using `direction !== Direction.LEFT`, etc., remain syntactically identical and
type-check correctly against the narrowed `type Direction`.

Verify: `direction: Direction` in the `let direction` declaration is a valid type
annotation with the derived union type. The values `-1`, `1`, `0` are numeric
literals — TypeScript narrows correctly.

---

## Sub-feature 3: CLAUDE.md Convention Update

Add the `as const over enum` rule to the root `CLAUDE.md` so future implementing
instances do not introduce enums.

### Files affected

Modified:
- `/Users/simonschoetz/dev/gm-tool/CLAUDE.md`

### Layered breakdown

#### Frontend

In the **Coding style** section of `CLAUDE.md`, add the following rule
immediately after the `Error types use factory functions, not classes` block:

```md
- **`as const` over `enum`**: Use `as const` objects with derived union types instead of TypeScript enums. Enums are runtime IIFE constructs that conflict with the "types over interfaces" posture. An `as const` object gives identical DX — dot-access, autocomplete, type narrowing, exhaustive checks — without a runtime construct.
  ```ts
  // ✅ GOOD
  export const Routes = {
    ADVENTURES: 'adventures',
    SESSION: 'session',
  } as const;
  export type AppRoute = (typeof Routes)[keyof typeof Routes];

  // ❌ BAD
  export enum Routes {
    ADVENTURES = 'adventures',
    SESSION = 'session',
  }
  ```
```

---

## CLAUDE.md Impact

`/Users/simonschoetz/dev/gm-tool/CLAUDE.md` — add the `as const over enum` rule
to the Coding style section as specified in Sub-feature 3 above.
