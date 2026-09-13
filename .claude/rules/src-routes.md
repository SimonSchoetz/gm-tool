---
paths: ["app/src/routes/**", "src/routes/**"]
---

# Routes under `src/`

Conventions for any file under `src/routes/`. TanStack Router's own file-based routing conventions govern file naming and structure; this file covers the one additional convention for a route's `component` arrow.

## Component arrow: distinguishing prop only, never data resolution

A route file's `component` arrow is reserved for wiring a compile-time-constant prop a shared screen needs to distinguish itself from sibling routes — e.g. `component: () => <BaseEntityScreen entityType='npcs' />` in `adventure.$adventureId.npc.$baseEntityId.tsx` — never for resolving data. The `loader` still owns every async data dependency; a value read from `params`, context, or a query result is never passed this way — see `.claude/rules/src-components.md` — Framework context is not a prop.
