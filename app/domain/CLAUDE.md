# Domain

Application vocabulary layer. Owns business concepts shared between the service
layer and the frontend: error factory functions and types, domain-specific
TypeScript types, and validation rules.

`domain/` has no runtime dependencies on `services/`, `data-access-layer/`, or
`db/` — it is the vocabulary layer that everything else imports from.

## What Belongs Here

- Error factory functions and their types (see factory function pattern in [app/CLAUDE.md](../CLAUDE.md))
- Domain-specific TypeScript types not derived from the db schema
- Validation rules that express business constraints

## What Does NOT Belong Here

- Types that are purely re-exports of db types — import directly from `@db/<domain>`
- Business operations or CRUD logic — those belong in `app/services/`
- React-specific types (props, ref types) — those belong in `app/src/types/` or
  co-located with their component

## Structure

Each domain entity has its own module directory (`index.ts` barrel required). `domain/index.ts` is the grouping barrel. See [app/CLAUDE.md](../CLAUDE.md) for the general barrel rule.

## Imports

External consumers import via `@domain` (barrel) or `@domain/<subdomain>`:

- `import { sessionCreateError } from '@domain'`
- `import { adventureNotFoundError } from '@domain/adventures'`
