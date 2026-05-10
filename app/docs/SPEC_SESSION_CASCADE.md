# Session Creation Cascade

## Progress Tracker

- SF1: Service consolidation — inline default step creation into `createSession`; remove `initDefaultSteps`

## Key Architectural Decisions

### Cascade stays at the service layer

`db/CLAUDE.md`'s Default Placement Hierarchy governs column defaults within a single
table. Creating rows in a second table (`session_steps`) is cross-table composition —
a service layer responsibility. `sessionService.createSession()` is the single
authoritative entry point for complete session creation.

### `initDefaultSteps` is removed entirely, not made private

`initDefaultSteps` has exactly one call site: `sessionService.createSession()`. The
loop body is four lines. Inlining it removes the separately-callable surface without
introducing an unnecessary private helper.

### `LAZY_DM_STEPS` stays in `@/domain`

`LAZY_DM_STEPS` is application configuration consumed by both services and the
frontend. No migration to the DB layer.

### Error wrapping

With the loop inlined inside `createSession`'s existing `try` block, any DB error
from step creation surfaces as `sessionCreateError` — the same outcome as before
(where `initDefaultSteps` threw `sessionStepCreateError` which the outer catch
re-wrapped). Do not import `sessionStepCreateError` into `sessionService.ts`.

---

## SF1: Service consolidation

Inline the default step creation loop from `sessionStepService.initDefaultSteps()`
into `sessionService.createSession()`. Remove `initDefaultSteps` as an exported
function. Remove the now-dead `LAZY_DM_STEPS` import from `sessionStepService.ts`.
Fix the pre-existing `name ?? 'New Step'` violation in `createCustomStep`.

### Files Affected

```text
Modified:
  app/src/services/sessionService.ts
  app/src/services/sessionStepService.ts
```

### Services

#### `app/src/services/sessionService.ts`

Remove:

```typescript
import * as sessionStepService from './sessionStepService';
```

Add alongside the existing `@db/session` import:

```typescript
import * as sessionStepDb from '@db/session-step';
```

Add to the existing `@/domain` named import block:

```typescript
LAZY_DM_STEPS,
```

Replace `createSession`:

```typescript
export const createSession = async (adventureId: string): Promise<string> => {
  try {
    const newSessionId = await sessionDb.create(adventureId);
    for (let index = 0; index < LAZY_DM_STEPS.length; index++) {
      await sessionStepDb.create({
        session_id: newSessionId,
        sort_order: index,
        default_step_key: LAZY_DM_STEPS[index].key,
      });
    }
    return newSessionId;
  } catch (err) {
    throw sessionCreateError(err);
  }
};
```

All other functions in this file are unchanged.

#### `app/src/services/sessionStepService.ts`

Remove `initDefaultSteps` (the full function, lines 107–120).

Remove `LAZY_DM_STEPS` from the `@/domain` import — it is used only by
`initDefaultSteps`. `sessionStepCreateError` stays — it is used by `createStep`
and `createCustomStep`.

Fix pre-existing violation in `createCustomStep`: `name` is a nullable
user-editable column; the service layer must not supply a fallback default.
Replace:

```typescript
return await sessionStepDb.create({
  session_id: sessionId,
  sort_order: maxSortOrder + 1,
  name: name ?? 'New Step',
});
```

With:

```typescript
return await sessionStepDb.create({
  session_id: sessionId,
  sort_order: maxSortOrder + 1,
  ...(name !== undefined ? { name } : {}),
});
```

The conditional spread is required because `exactOptionalPropertyTypes: true` is
active — passing `name: undefined` to an optional property typed as `string` is
a type error.

All other functions in this file are unchanged.

## CLAUDE.md Impact

None.
