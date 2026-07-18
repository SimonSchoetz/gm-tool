# Services

Business logic layer. Services compose DB calls, apply business rules, and
throw typed domain errors. They have no React dependencies and no UI logic.

## Conventions

- One file per domain: `adventureService.ts`, `sessionService.ts`, etc.
- Import DB layer via `@db/<domain>` namespace imports: `import * as sessionDb from '@db/session'`
- Import domain errors via `@domain` or `@domain/<subdomain>`: `import { sessionCreateError } from '@domain'`
- Import sibling services via `@services/<file>`: `import * as imageService from '@services/imageService'`
- Every exported function wraps its DB call(s) in try/catch and throws a typed
  domain error — never re-throws raw DB errors to callers
- No fallback defaults for nullable or DB-defaulted columns. A nullable column's
  correct value when not provided is NULL. Never supply `?? 'fallback'` for a
  column the DB schema defines as nullable.
- The service function that creates an entity with mandatory initialization is
  the single exported entry point — no separately-callable initialization
  function that can bypass the contract.
- **Never replicate a DB default value at a call site.** When a column has a SQL `DEFAULT`, omit the field — the database supplies the value. There is no shared, auto-generated create schema (see `app/db/CLAUDE.md`) — every domain's `db/<domain>/create.ts` declares its own ad hoc typed object literal for `buildCreateQuery`. When a `NOT NULL DEFAULT x` column appears non-optional at a service call site, the fix is in that domain's `create.ts`: its inline object type must not require the defaulted column — never patch the call site by supplying the default value manually.
  - ❌ BAD: `active_view: 'prep'` in a service `create` call because `db/session/create.ts`'s inline type requires the field
  - ✅ GOOD: omit `active_view` entirely from the service call; fix `db/session/create.ts`'s inline `buildCreateQuery` type to exclude `active_view` so the SQL `DEFAULT` fires
- **Extract coordinated multi-step operations to a service function when second-step failure would leave first-step effects in an inconsistent state.** A component must not orchestrate two service calls in sequence when the failure of the second would leave the first's effect dangling. The canonical case: deleting a stored asset (image, file) and then updating the entity FK to null — if the FK update fails, the asset is gone but the entity still references it. The **owning service is the entity whose FK column is being updated** — `npcsService` when `npc.image_id` is being nulled, `adventureService` when `adventure.image_id` is being nulled. The rule fires on the failure-inconsistency condition, not on call count alone — two independent service calls that leave no inconsistent state if one fails may remain in the component.
  - ✅ GOOD: `npcsService.removeNpcImage(npcId)` — the NPC service owns NPC image lifecycle; component calls one mutation
  - ❌ BAD: component calls `deleteImage(npc.image_id)` then `updateNpc({ image_id: null })` — service layer gap exposed at the component

## What Does NOT Belong Here

- React hooks, context, or any import from `react`
- UI formatting or display logic
- Fallback defaults for nullable columns (those belong in the DB layer or SQL schema)
