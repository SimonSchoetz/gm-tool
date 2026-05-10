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

## What Does NOT Belong Here

- React hooks, context, or any import from `react`
- UI formatting or display logic
- Fallback defaults for nullable columns (those belong in the DB layer or SQL schema)
