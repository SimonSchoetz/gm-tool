# SPEC: Error Classes → Factory Pattern Refactor

## Progress Tracker

- SF1: sessions — replace 6 error classes with typed factory functions; restructure `getSessionById` to remove `instanceof` guard
- SF2: session-steps — replace 6 error classes with typed factory functions; update call sites in `sessionStepService`
- SF3: adventures — replace 7 error classes with typed factory functions; update call sites in `adventureService`
- SF4: npcs — replace 6 error classes with typed factory functions; update call sites in `npcsService`
- SF5: table-config — replace 4 error classes with typed factory functions; update call sites in `tableConfigService`
- SF6: mentions — replace 1 error class with a typed factory function; update call site in `mentionSearchService`

---

## Key Architectural Decisions

### Factory pattern instead of class inheritance

All error classes use `class XxxError extends Error` (or extend a domain base class). This violates CLAUDE.md: "Classes are permitted only where a third-party framework API requires inheritance." `Error` is a JS built-in, not a framework API. The replacement: a type alias (`Error & { name: 'XxxError' }`) plus a factory arrow function that constructs a real `Error`, casts it, and sets `name`:

```ts
export type SessionLoadError = Error & { name: 'SessionLoadError' };
export const sessionLoadError = (cause?: unknown): SessionLoadError => {
  const error = new Error(`Failed to load sessions: ${cause}`) as SessionLoadError;
  error.name = 'SessionLoadError';
  return error;
};
```

### Base error classes are eliminated

Every domain has a base class (`SessionError`, `SessionStepError`, `AdventureError`, `NpcError`, `TableConfigError`) used only as an inheritance target. With no inheritance in the factory pattern, these base classes serve no purpose and are not replaced — they are deleted entirely. No service file imports these base classes. Two barrel files do re-export them: `sessions/index.ts` exports `SessionError` and `session-steps/index.ts` exports `SessionStepError`. Both re-exports must be removed.

### instanceof check in sessionService.ts must be resolved by restructuring

`sessionService.ts:26` has `if (err instanceof SessionNotFoundError) throw err`. This guard exists because `throw new SessionNotFoundError(id)` sits inside the same `try` block as the DB call, so the `catch` would otherwise re-wrap it as `SessionLoadError`. With factory-pattern types, `instanceof` on a cast intersection type does not work. The fix: move the not-found throw outside the `try/catch`, following the pattern already established in `adventureService.getAdventureById` and `npcsService.getNpcById`. No instanceof guard is needed after restructuring.

### Factory function naming convention

Factory names are the camelCase equivalent of the type name: `SessionLoadError` → `sessionLoadError`. This satisfies "arrow functions only" and "types over interfaces."

### Service call sites: constructor invocation becomes factory invocation

Every `throw new XxxError(args)` in a service file becomes `throw xxxError(args)`. Argument signatures are unchanged — the same positional arguments that previously went to the constructor go to the factory function.

### Barrel changes for sessions and session-steps

`sessions/index.ts` and `session-steps/index.ts` use explicit named exports. After the refactor:
- Remove the base class exports.
- Use `export type { XxxError }` for each type and a separate `export { xxxError }` for each factory function.

`adventures/index.ts`, `npcs/index.ts`, and `table-config/index.ts` use `export * from './errors'` — no change needed. After the refactor, the errors file only contains types and factory functions, all of which are public API with no internals to leak.

`mentions/index.ts` uses an explicit named export — update it to export both the type and the factory function.

### MentionSearchError message normalization

The `MentionSearchError` class had a fixed message `'Failed to search mentions'` and stored cause separately via `this.cause = cause`. The factory normalizes this to match all other errors: interpolate cause into the message string (`Failed to search mentions: ${cause}`). The `this.cause` property assignment is dropped.

---

## SF1: sessions — error factory refactor + service restructure

### Files affected

**Modified:**
- `app/src/domain/sessions/errors.ts`
- `app/src/domain/sessions/index.ts`
- `app/src/services/sessionService.ts`

**New:** none

### Domain layer

Replace the full contents of `app/src/domain/sessions/errors.ts`. The base class `SessionError` is deleted and not replaced.

```ts
export type SessionNotFoundError = Error & { name: 'SessionNotFoundError' };
export const sessionNotFoundError = (id: string): SessionNotFoundError => {
  const error = new Error(`Session with id ${id} not found`) as SessionNotFoundError;
  error.name = 'SessionNotFoundError';
  return error;
};

export type SessionLoadError = Error & { name: 'SessionLoadError' };
export const sessionLoadError = (cause?: unknown): SessionLoadError => {
  const error = new Error(`Failed to load sessions: ${cause}`) as SessionLoadError;
  error.name = 'SessionLoadError';
  return error;
};

export type SessionCreateError = Error & { name: 'SessionCreateError' };
export const sessionCreateError = (cause?: unknown): SessionCreateError => {
  const error = new Error(`Failed to create session: ${cause}`) as SessionCreateError;
  error.name = 'SessionCreateError';
  return error;
};

export type SessionUpdateError = Error & { name: 'SessionUpdateError' };
export const sessionUpdateError = (id: string, cause?: unknown): SessionUpdateError => {
  const error = new Error(`Failed to update session ${id}: ${cause}`) as SessionUpdateError;
  error.name = 'SessionUpdateError';
  return error;
};

export type SessionDeleteError = Error & { name: 'SessionDeleteError' };
export const sessionDeleteError = (id: string, cause?: unknown): SessionDeleteError => {
  const error = new Error(`Failed to delete session ${id}: ${cause}`) as SessionDeleteError;
  error.name = 'SessionDeleteError';
  return error;
};
```

Replace the full contents of `app/src/domain/sessions/index.ts`. Remove `SessionError`. Export each type with `export type` and each factory with a separate `export`:

```ts
export type { SessionNotFoundError } from './errors';
export { sessionNotFoundError } from './errors';
export type { SessionLoadError } from './errors';
export { sessionLoadError } from './errors';
export type { SessionCreateError } from './errors';
export { sessionCreateError } from './errors';
export type { SessionUpdateError } from './errors';
export { sessionUpdateError } from './errors';
export type { SessionDeleteError } from './errors';
export { sessionDeleteError } from './errors';
```

### Services layer

Update `app/src/services/sessionService.ts`:

1. Update the import block — drop all class names, import factory functions:
```ts
import {
  sessionNotFoundError,
  sessionLoadError,
  sessionCreateError,
  sessionUpdateError,
  sessionDeleteError,
} from '@/domain/sessions';
```

2. Restructure `getSessionById` — move the not-found throw outside the `try/catch` to eliminate the `instanceof` guard:
```ts
export const getSessionById = async (id: string): Promise<Session> => {
  let session: Session | undefined;
  try {
    session = await sessionDb.get(id);
  } catch (err) {
    throw sessionLoadError(err);
  }
  if (!session) throw sessionNotFoundError(id);
  return session;
};
```

3. Update remaining call sites (replace `new XxxError` with factory):
- `getAllSessions` catch: `throw new SessionLoadError(err)` → `throw sessionLoadError(err)`
- `createSession` catch: `throw new SessionCreateError(err)` → `throw sessionCreateError(err)`
- `updateSession` catch: `throw new SessionUpdateError(id, err)` → `throw sessionUpdateError(id, err)`
- `deleteSession` catch: `throw new SessionDeleteError(id, err)` → `throw sessionDeleteError(id, err)`

---

## SF2: session-steps — error factory refactor

### Files affected

**Modified:**
- `app/src/domain/session-steps/errors.ts`
- `app/src/domain/session-steps/index.ts`
- `app/src/services/sessionStepService.ts`

**New:** none

### Domain layer

Replace the full contents of `app/src/domain/session-steps/errors.ts`. The base class `SessionStepError` is deleted and not replaced.

Types and factory functions — message templates are unchanged from original constructors:

| Type | Factory | Signature | Message template |
|---|---|---|---|
| `SessionStepLoadError` | `sessionStepLoadError` | `(cause?: unknown)` | `Failed to load session steps: ${cause}` |
| `SessionStepCreateError` | `sessionStepCreateError` | `(cause?: unknown)` | `Failed to create session step: ${cause}` |
| `SessionStepUpdateError` | `sessionStepUpdateError` | `(id: string, cause?: unknown)` | `Failed to update session step ${id}: ${cause}` |
| `SessionStepDeleteError` | `sessionStepDeleteError` | `(id: string, cause?: unknown)` | `Failed to delete session step ${id}: ${cause}` |
| `SessionStepReorderError` | `sessionStepReorderError` | `(cause?: unknown)` | `Failed to reorder session steps: ${cause}` |

Each follows the same structure as the sessions pattern in SF1.

Replace the full contents of `app/src/domain/session-steps/index.ts`. Keep the `lazyDmSteps` exports unchanged. Remove `SessionStepError`. Add both type and factory exports for each error:

```ts
export { LAZY_DM_STEPS } from './lazyDmSteps';
export type { LazyDmStepKey, LazyDmStepDefinition } from './lazyDmSteps';
export type { SessionStepLoadError } from './errors';
export { sessionStepLoadError } from './errors';
export type { SessionStepCreateError } from './errors';
export { sessionStepCreateError } from './errors';
export type { SessionStepUpdateError } from './errors';
export { sessionStepUpdateError } from './errors';
export type { SessionStepDeleteError } from './errors';
export { sessionStepDeleteError } from './errors';
export type { SessionStepReorderError } from './errors';
export { sessionStepReorderError } from './errors';
```

### Services layer

Update `app/src/services/sessionStepService.ts` — replace the class imports with factory function imports, then replace every `throw new XxxError(args)` with `throw xxxError(args)`:

| Location | Old | New |
|---|---|---|
| `getStepsBySessionId` catch | `new SessionStepLoadError(err)` | `sessionStepLoadError(err)` |
| `createStep` catch | `new SessionStepCreateError(err)` | `sessionStepCreateError(err)` |
| `updateStep` catch | `new SessionStepUpdateError(id, err)` | `sessionStepUpdateError(id, err)` |
| `deleteStep` catch | `new SessionStepDeleteError(id, err)` | `sessionStepDeleteError(id, err)` |
| `createCustomStep` catch | `new SessionStepCreateError(err)` | `sessionStepCreateError(err)` |
| `swapStepOrder` catch | `new SessionStepReorderError(err)` | `sessionStepReorderError(err)` |
| `bulkReorderSteps` catch | `new SessionStepReorderError(err)` | `sessionStepReorderError(err)` |
| `initDefaultSteps` catch | `new SessionStepCreateError(err)` | `sessionStepCreateError(err)` |

---

## SF3: adventures — error factory refactor

### Files affected

**Modified:**
- `app/src/domain/adventures/errors.ts`
- `app/src/services/adventureService.ts`

**New:** none

Note: `app/src/domain/adventures/index.ts` uses `export * from './errors'` — no change needed. After the refactor, all exports from `errors.ts` are public API.

### Domain layer

Replace the full contents of `app/src/domain/adventures/errors.ts`. The base class `AdventureError` is deleted and not replaced. `DatabaseInitError` previously extended `AdventureError` — refactor it with the same factory pattern as all others.

Types and factory functions:

| Type | Factory | Signature | Message template |
|---|---|---|---|
| `AdventureNotFoundError` | `adventureNotFoundError` | `(id: string)` | `Adventure with id ${id} not found` |
| `AdventureLoadError` | `adventureLoadError` | `(cause?: unknown)` | `Failed to load adventures: ${cause}` |
| `AdventureCreateError` | `adventureCreateError` | `(cause?: unknown)` | `Failed to create adventure: ${cause}` |
| `AdventureUpdateError` | `adventureUpdateError` | `(id: string, cause?: unknown)` | `Failed to update adventure ${id}: ${cause}` |
| `AdventureDeleteError` | `adventureDeleteError` | `(id: string, cause?: unknown)` | `Failed to delete adventure ${id}: ${cause}` |
| `DatabaseInitError` | `databaseInitError` | `(cause?: unknown)` | `Failed to initialize database: ${cause}` |

Each follows the same structure as the sessions pattern in SF1.

### Services layer

Update `app/src/services/adventureService.ts` — replace the class imports with factory function imports, then replace every `throw new XxxError(args)` with `throw xxxError(args)`:

| Location | Old | New |
|---|---|---|
| `getAllAdventures` catch | `new AdventureLoadError(err)` | `adventureLoadError(err)` |
| `getAdventureById` not-found | `new AdventureNotFoundError(id)` | `adventureNotFoundError(id)` |
| `createAdventure` catch | `new AdventureCreateError(err)` | `adventureCreateError(err)` |
| `updateAdventure` catch | `new AdventureUpdateError(id, err)` | `adventureUpdateError(id, err)` |
| `deleteAdventure` catch | `new AdventureDeleteError(id, err)` | `adventureDeleteError(id, err)` |

Note: `getAdventureById` does not use a `try/catch` around the not-found throw (the pattern is already correct — no instanceof issue). Only the constructor call needs updating.

---

## SF4: npcs — error factory refactor

### Files affected

**Modified:**
- `app/src/domain/npcs/errors.ts`
- `app/src/services/npcsService.ts`

**New:** none

Note: `app/src/domain/npcs/index.ts` uses `export * from './errors'` — no change needed.

### Domain layer

Replace the full contents of `app/src/domain/npcs/errors.ts`. The base class `NpcError` is deleted and not replaced.

Types and factory functions:

| Type | Factory | Signature | Message template |
|---|---|---|---|
| `NpcNotFoundError` | `npcNotFoundError` | `(id: string)` | `NPC with id ${id} not found` |
| `NpcLoadError` | `npcLoadError` | `(cause?: unknown)` | `Failed to load NPCs: ${cause}` |
| `NpcCreateError` | `npcCreateError` | `(cause?: unknown)` | `Failed to create NPC: ${cause}` |
| `NpcUpdateError` | `npcUpdateError` | `(id: string, cause?: unknown)` | `Failed to update NPC ${id}: ${cause}` |
| `NpcDeleteError` | `npcDeleteError` | `(id: string, cause?: unknown)` | `Failed to delete NPC ${id}: ${cause}` |

Each follows the same structure as the sessions pattern in SF1.

### Services layer

Update `app/src/services/npcsService.ts` — replace class imports with factory function imports, then replace every `throw new XxxError(args)` with `throw xxxError(args)`:

| Location | Old | New |
|---|---|---|
| `getAllNpcs` catch | `new NpcLoadError(err)` | `npcLoadError(err)` |
| `getNpcById` not-found | `new NpcNotFoundError(id)` | `npcNotFoundError(id)` |
| `createNpc` catch | `new NpcCreateError(err)` | `npcCreateError(err)` |
| `updateNpc` catch | `new NpcUpdateError(id, err)` | `npcUpdateError(id, err)` |
| `deleteNpc` catch | `new NpcDeleteError(id, err)` | `npcDeleteError(id, err)` |

Note: `getNpcById` does not wrap the not-found throw in `try/catch` — no instanceof issue. Only the constructor call needs updating.

---

## SF5: table-config — error factory refactor

### Files affected

**Modified:**
- `app/src/domain/table-config/errors.ts`
- `app/src/services/tableConfigService.ts`

**New:** none

Note: `app/src/domain/table-config/index.ts` uses `export * from './errors'` — no change needed.

### Domain layer

Replace the full contents of `app/src/domain/table-config/errors.ts`. The base class `TableConfigError` is deleted and not replaced.

Types and factory functions:

| Type | Factory | Signature | Message template |
|---|---|---|---|
| `TableConfigNotFoundError` | `tableConfigNotFoundError` | `(id: string)` | `Table config with id ${id} not found` |
| `TableConfigLoadError` | `tableConfigLoadError` | `(cause?: unknown)` | `Failed to load table configs: ${cause}` |
| `TableConfigUpdateError` | `tableConfigUpdateError` | `(id: string, cause?: unknown)` | `Failed to update table config ${id}: ${cause}` |

Each follows the same structure as the sessions pattern in SF1.

### Services layer

Update `app/src/services/tableConfigService.ts` — replace class imports with factory function imports, then replace every `throw new XxxError(args)` with `throw xxxError(args)`:

| Location | Old | New |
|---|---|---|
| `getAllTableConfigs` catch | `new TableConfigLoadError(err)` | `tableConfigLoadError(err)` |
| `getTableConfigById` not-found | `new TableConfigNotFoundError(id)` | `tableConfigNotFoundError(id)` |
| `updateTableConfig` catch | `new TableConfigUpdateError(id, err)` | `tableConfigUpdateError(id, err)` |

Note: `getTableConfigById` does not wrap the not-found throw in `try/catch` — no instanceof issue.

---

## SF6: mentions — error factory refactor

### Files affected

**Modified:**
- `app/src/domain/mentions/errors.ts`
- `app/src/domain/mentions/index.ts`
- `app/src/services/mentionSearchService.ts`

**New:** none

### Domain layer

Replace the full contents of `app/src/domain/mentions/errors.ts`:

```ts
export type MentionSearchError = Error & { name: 'MentionSearchError' };
export const mentionSearchError = (cause?: unknown): MentionSearchError => {
  const error = new Error(`Failed to search mentions: ${cause}`) as MentionSearchError;
  error.name = 'MentionSearchError';
  return error;
};
```

Note: the original class had a fixed message `'Failed to search mentions'` and stored cause separately via `this.cause = cause`. The factory normalizes this to interpolate cause into the message string, consistent with all other errors. The `this.cause` assignment is dropped.

Replace the full contents of `app/src/domain/mentions/index.ts`:

```ts
export type { MentionSearchError } from './errors';
export { mentionSearchError } from './errors';
```

### Services layer

Update `app/src/services/mentionSearchService.ts`:

1. Update import: `MentionSearchError` → `mentionSearchError`
2. In `searchMentions` catch: `throw new MentionSearchError(err)` → `throw mentionSearchError(err)`

---

## CLAUDE.md Impact

**File:** Root `CLAUDE.md`, under "Coding style" — insert the following block immediately after the existing classes rule (the one that starts "Use modern arrow function syntax. Classes are permitted only where..."):

```
**Error types use factory functions, not classes.** Create typed errors with a factory function and type narrowing — never `class XxxError extends Error`. This aligns with "types over interfaces" and "arrow functions only." `instanceof` is not used in this codebase — all errors route to the Error Boundary via `throwOnError: true`.

// ✅ GOOD
export type SessionLoadError = Error & { name: 'SessionLoadError' };
export const sessionLoadError = (cause?: unknown): SessionLoadError => {
  const error = new Error(`Failed to load sessions: ${cause}`) as SessionLoadError;
  error.name = 'SessionLoadError';
  return error;
};

// ❌ BAD
export class SessionLoadError extends Error { ... }
```
