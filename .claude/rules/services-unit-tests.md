---
paths: ["app/services/**/__tests__/**", "services/**/__tests__/**"]
---

# Unit tests under `services/`

Wiring a test for a service function that mocks the `@db/<domain>` modules it calls, per `app/services/CLAUDE.md` — Testing.

## Wiring the mock

```ts
import type * as sessionDb from '@db/session';

const create = vi.hoisted(() => vi.fn<typeof sessionDb.create>());

vi.mock('@db/session', () => ({ create }));
```

- Declare one `vi.hoisted` spy per function the service calls, typed against the real module's own export (`vi.fn<typeof sessionDb.create>()`) — never an untyped `vi.fn()`, so a signature change in the DB layer breaks the test at compile time.
- The `vi.mock` factory returns only the named exports the test needs, referencing the hoisted spies for functions and inlining a plain value for a non-function export the service reads (e.g. a constant list) — never `export *` or a re-export of the real module.
- The same recipe covers any other module-level dependency the service reaches beyond `@db/<domain>` — e.g. `@tauri-apps/api/core`'s `invoke` — one hoisted spy, one `vi.mock` factory.
- Everything the service imports that isn't mocked this way — `@domain` error and message builders, sibling services — stays real: the test's subject is the service's own branching and composition, not its dependencies' internals.
- `vi.resetModules()` clears the module registry, not the hoisted spies declared above it — re-arm each spy's default resolved or rejected value in the same `beforeEach`, or a value a previous test set for it survives into the next.
