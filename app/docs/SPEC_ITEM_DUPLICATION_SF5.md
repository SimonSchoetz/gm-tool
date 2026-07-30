# SF5 — Session duplication

Adds duplication for Sessions. Unlike the six leaf entities, a Session owns child rows, so duplication copies the session row and every one of its `session_steps`.

Sessions have no `image_id` column, so no image duplication occurs here.

## Files affected

**New:**

- `app/db/session/duplicate.ts`
- `app/db/session/__tests__/duplicate.test.ts`
- `app/db/session-step/duplicate-by-session.ts`
- `app/db/session-step/__tests__/duplicate-by-session.test.ts`

**Modified:**

- `app/db/session/index.ts` — add `export { duplicate } from './duplicate'`
- `app/db/session-step/index.ts` — add `export { duplicateBySession } from './duplicate-by-session'`
- `app/services/sessionService.ts` — add `duplicateSession`
- `app/domain/sessions/errors.ts` — add `sessionDuplicateError`
- `app/domain/sessions/index.ts` — add the two new exports
- `app/domain/index.ts` — add `SessionDuplicateError` and `sessionDuplicateError` to the grouping barrel

## DB layer

### `db/session/duplicate.ts`

Exports `duplicate(sourceId: string): Promise<string>`.

Same shape as SF4's leaf `duplicate.ts` with one parameter fewer — there is no `imageId` because the `sessions` schema declares no `image_id` column.

1. `assertValidId(sourceId, 'session')` — lowercase, matching the label `db/session/get.ts` uses. Note that `db/session-step/get-all-by-session.ts` uses the capitalised `'Session'` for the same id; the two files genuinely differ. Reproduce each file's own existing label rather than normalising them, since the label appears in thrown error messages.
2. Read the source row via `get(sourceId)`; throw `new Error(\`Session not found: ${sourceId}\`)` when `null`.
3. `generateId()` and `generateDbTimestamps()`.
4. INSERT every column of the source row except `id`, `name`, `created_at`, and `updated_at`, plus the fresh timestamps.

`name` is omitted so the column takes SQL `NULL`, exactly as in SF4.

`active_view` is `NOT NULL DEFAULT 'prep'`. Copy the source row's value rather than omitting the column — the duplicate should open in the same view the original was left in, and `app/services/CLAUDE.md`'s "never replicate a DB default at a call site" rule does not apply because this is not a default being restated, it is a source value being copied.

### `db/session-step/duplicate-by-session.ts`

Exports `duplicateBySession(sourceSessionId: string, targetSessionId: string): Promise<void>`.

1. `assertValidId` on both ids, label `'Session'`.
2. Read the source steps via `getAllBySession(sourceSessionId)`. It already orders by `sort_order ASC`, so no additional ordering is needed.
3. For each step, INSERT a new row with `generateId()`, `session_id: targetSessionId`, fresh timestamps from `generateDbTimestamps()`, and the source step's `name`, `content`, `default_step_key`, `checked`, and `sort_order` copied verbatim.

This function exists rather than the service looping over `sessionStepDb.create` because `CreateSessionStepInput` accepts only `session_id`, `sort_order`, `default_step_key`, and `name` — it has no `content` and no `checked` parameter, so it cannot express a full copy. Building the INSERT here keeps the column knowledge in the DB layer that owns the table.

`sort_order` is copied rather than re-derived from array position. The two are equal for any well-formed source, but copying preserves the source's values exactly, which is what "duplicates the current state" requires.

Use `buildCreateQuery` per row with an explicit type argument, matching `db/session-step/create.ts`.

## Service layer

### `services/sessionService.ts`

Add:

```ts
export const duplicateSession = async (id: string): Promise<string> => {
  try {
    const newSessionId = await sessionDb.duplicate(id);
    await sessionStepDb.duplicateBySession(id, newSessionId);
    return newSessionId;
  } catch (err) {
    throw sessionDuplicateError(id, err);
  }
};
```

**This must not call `createSession`.** `createSession` seeds eight default `session_steps` from `LAZY_DM_STEPS` after creating the row. A duplicate that went through it would carry those eight defaults plus every copied step. `sessionDb.duplicate` is called directly for that reason.

Session row before steps — the parents-before-children order `db/_sync/registry.ts` declares, which lists `session_steps` after `sessions`.

Both calls sit inside one service function because a step-copy failure after the session row is written would leave a session with a partial step list, which is the coordinated-multi-step condition `app/services/CLAUDE.md` requires a service to own.

## Domain layer

### `domain/sessions/errors.ts`

Add `SessionDuplicateError` / `sessionDuplicateError(id: string, cause?: unknown)`, following the shape of `sessionUpdateError` already in the file. Message: `` `Failed to duplicate session ${id}: ${String(cause)}` ``.

## Tests

### `db/session/__tests__/duplicate.test.ts`

Setup per the existing files in `db/session/__tests__/`: module-scope `vi.mock('@tauri-apps/plugin-sql', ...)`, `afterEach(() => { vi.resetModules(); })`, static top-level import, `mockSelect.mockResolvedValue([])` in `beforeEach` before `getDatabase()` is reachable.

Assertions:

- `omits name so the duplicate has no name` — the INSERT column list has no `name`.
- `copies active_view from the source row` — a source with `active_view: 'ingame'` produces an INSERT carrying `'ingame'`, not the schema default.
- `copies the remaining session columns` — `adventure_id`, `description`, `summary`, and `session_date` come from the source row.
- `generates a fresh id and fresh timestamps`.
- `throws when the source session does not exist` — assert the message `Session not found: <sourceId>`.

### `db/session-step/__tests__/duplicate-by-session.test.ts`

Assertions:

- `inserts one row per source step` — three source steps produce three `mockExecute` INSERT calls.
- `attaches every copy to the target session` — each INSERT carries `targetSessionId`, never `sourceSessionId`.
- `copies content and checked, which create cannot express` — the INSERT carries the source step's `content` and `checked` values. This is the path that motivates the file's existence.
- `preserves each step's sort_order` — the inserted `sort_order` values match the source steps' values.
- `copies default_step_key` — including a source step whose `default_step_key` is `null`.
- `inserts nothing when the source session has no steps` — `getAllBySession` resolves `[]`; assert `mockExecute` was not called.
