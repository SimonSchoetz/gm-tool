# SF4: Documentation

Update `app/src/CLAUDE.md` to reflect the relocated directories. Create
`app/services/CLAUDE.md` and `app/domain/CLAUDE.md` as the new authoritative
homes for those layers' conventions.

## Files Affected

```text
New:
  app/services/CLAUDE.md
  app/domain/CLAUDE.md

Modified:
  app/src/CLAUDE.md
```

## Documentation Changes

### `app/src/CLAUDE.md`

**Directory tree** — remove the `domain/` and `services/` entries from the
`src/` tree. The tree entry for `services/` reads:

```
├── services/ # operations (CRUD, business logic), uses db types and domain errors
```

Remove it entirely.

The tree entry for `domain/` reads:

```
├── domain/ # business concepts (errors, types, validation)
│   ├── domainA/
│   │   ├── index.ts
│   │   ├── types.ts # domain specific types when needed
│   │   ├── validation.ts # business rules when needed
│   │   └── errors.ts
```

Remove it entirely.

**Domain Layer section** — the full `### Domain Layer` section documents what
belongs in `domain/`. Remove this section from `app/src/CLAUDE.md` entirely — its
content moves to `app/domain/CLAUDE.md`.

**TanStack Query pattern — layer responsibilities** — the bullet that reads:

```
- `services/` — business logic, wraps DB calls, throws domain errors from `/domain`
```

Replace with:

```
- `app/services/` — business logic, wraps DB calls, throws domain errors from `@domain`. Import via `@services/<file>`.
```

**Types Directory — Domain entity types** — the bullet that reads:

```
- Domain entity types — those belong in `domain/domainName/types.ts`
```

Replace `domain/domainName/types.ts` with `@domain/<domainName>/types.ts`.

No other changes to `app/src/CLAUDE.md`.

### `app/services/CLAUDE.md`

Create with the following content:

```markdown
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
```

### `app/domain/CLAUDE.md`

Create with the following content:

```markdown
# Domain

Application vocabulary layer. Owns business concepts shared between the service
layer and the frontend: error factory functions and types, domain-specific
TypeScript types, and validation rules.

`domain/` has no runtime dependencies on `services/`, `data-access-layer/`, or
`db/` — it is the vocabulary layer that everything else imports from.

## What Belongs Here

- Error factory functions and their types (see factory function pattern in root CLAUDE.md)
- Domain-specific TypeScript types not derived from the db schema
- Validation rules that express business constraints

## What Does NOT Belong Here

- Types that are purely re-exports of db types — import directly from `@db/<domain>`
- Business operations or CRUD logic — those belong in `app/services/`
- React-specific types (props, ref types) — those belong in `app/src/types/` or
  co-located with their component

## Structure

Each domain entity has its own module directory with a required `index.ts` barrel.
`domain/index.ts` is a grouping barrel — explicit named exports only, `export *` banned.

## Imports

External consumers import via `@domain` (barrel) or `@domain/<subdomain>`:

- `import { sessionCreateError } from '@domain'`
- `import { adventureNotFoundError } from '@domain/adventures'`
```
