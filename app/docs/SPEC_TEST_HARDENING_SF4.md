# SF4 — Adventure, session, session step and encounter

Adventures, sessions and session steps with empty text fields start syncing, because their schemas stop rejecting `null`. The four modules' tests move onto the harness and check real rows: defaults, ordering, filtering, clearing a field with `null`, validation, cascades and duplication.

## Files affected

- Modified: `app/db/adventure/schema.ts` — `name`, `description`: `z.string().optional()` → `z.string().nullable()`; `image_id`: `z.string().nullable().optional()` → `z.string().nullable()`.
- Modified: `app/db/session/schema.ts` — `name`, `description`, `summary`, `session_date`: `z.string().optional()` → `z.string().nullable()`.
- Modified: `app/db/session-step/schema.ts` — `name`, `content`: `z.string().optional()` → `z.string().nullable()`; `default_step_key`: `z.enum(LAZY_DM_STEP_KEYS).nullable().optional()` → `z.enum(LAZY_DM_STEP_KEYS).nullable()`.
- Modified: `app/db/adventure/get.ts` — the inline id check (get.ts:5-7) replaced by `assertValidId(id, 'adventure')` from `../util`; the thrown message stays `Valid adventure ID is required`.
- Modified: `app/src/screens/adventures/components/ToAdventureBtn/ToAdventureBtn.tsx` — closed props, `aria-label` and `image_id` adjusted to the new type (see Frontend).
- Modified: `app/src/screens/adventure/components/AdventureScreenSidebar/AdventureScreenSidebar.tsx` — `image_id={adventure.image_id ?? null}` (:35) becomes `image_id={adventure.image_id}` (see Frontend).
- Modified: `app/src/routes/adventure.$adventureId.index.tsx` — `adventure.image_id ?? null` (:12) becomes `adventure.image_id` (see Frontend).
- Modified: `app/src/components/MentionPopup/components/MentionPopupContent/components/SessionPopupContent/SessionPopupContent.tsx` — `summary={session.summary ?? null}` (:20) becomes `summary={session.summary}` (see Frontend).
- Modified: `app/db/adventure/__tests__/create.test.ts`, `get.test.ts`, `get-all.test.ts`, `update.test.ts`, `remove.test.ts` — rewritten on the harness.
- Modified: `app/db/session/__tests__/create.test.ts`, `duplicate.test.ts`, `get.test.ts`, `get-all.test.ts`, `update.test.ts`, `remove.test.ts` — rewritten on the harness.
- Modified: `app/db/session-step/__tests__/create.test.ts`, `duplicate-by-session.test.ts`, `get.test.ts`, `get-all-by-session.test.ts`, `update.test.ts`, `remove.test.ts` — rewritten on the harness.
- Modified: `app/db/encounter/__tests__/create.test.ts`, `duplicate.test.ts`, `get.test.ts`, `get-all.test.ts`, `update.test.ts`, `remove.test.ts` — rewritten on the harness.

No barrel changes: `db/adventure/index.ts`, `db/session/index.ts`, `db/session-step/index.ts` and `db/encounter/index.ts` export the same functions and types, and their explicit named exports already satisfy `app/db/CLAUDE.md` — Conventions.

## Database

### Nullable columns (`schema.ts` × 3)

Per the root KAD "Sync accepts `null` in nullable text columns": no field in these three files carries `.optional()` afterwards, and every nullable column's zod is `.nullable()`. The derived row types (`Adventure`, `Session`, `SessionStep`) change for those fields from `string | undefined` (or `string | null | undefined` for `image_id` and `default_step_key`) to `string | null`, matching what the database returns. `defineTable` still wraps every field of `updateSchema` in `.optional()` itself (db/util/schema/define-table.ts:114), so an update input either omits a field or passes `null` to clear it. After the change `npx tsc --noEmit` reports only the fixtures of the test files this SF rewrites and `ToAdventureBtn.tsx`, and `npx eslint src services db domain util` reports nothing once `ToAdventureBtn.tsx` is adjusted as below [spec-writer_42: ran both on a working copy with the change applied, then reverted — observed the 10 tsc errors of the root KAD and no eslint output].

### `app/db/adventure/get.ts`

Replace the inline `if (!id || typeof id !== 'string' || id.trim() === '')` block with `assertValidId(id, 'adventure');`, imported from `../util` like `remove.ts` and `update.ts` do. Behavior is unchanged; the duplicate check goes away (root KAD "What a db test asserts").

### Test files

Every file below uses the root KAD "Test-file wiring under Vitest 5", including its dynamic import of every `@db/...` module a test calls — parent-row creators and `@db/pinned-order` as well as the unit — its clock control, and its `as unknown as <input type>` cast for invalid inputs (`UpdateAdventureInput`, `UpdateSessionInput`, `UpdateSessionStepInput`, `UpdateEncounterInput`). Parent rows come from the real module functions (`@db/adventure`'s `create`, `@db/session`'s `create`, and so on), never hand-written SQL — except `images` rows needed only as a foreign-key target, which are inserted with `db.execute` so the test does not have to mock the image file commands. A test that expects a column to be copied, reset, cleared or kept first gives it a non-default value through the module's own `update` (or at `create` where the input accepts it). Every "new `updated_at`" or "new timestamps" row sets the clock to T1 before the create and to a later T2 before the update or duplicate, and asserts the new value equals T2's ISO string while the source keeps T1's. None of these files tests `assertValidId` or `assertHasUpdateFields`.

#### Adventure

| File | Test | Defect it catches |
| --- | --- | --- |
| `create.test.ts` | creates an adventure whose name is `New adventure`, a space, and `getDateTimeString` of the frozen creation time, with `description` and `image_id` `null`, and returns the stored row's id | a name built from the wrong clock or format, a value written to the wrong column, or a returned id that is not the row's |
| `get.test.ts` | with two adventures stored, requesting the later-created one returns it | a dropped `WHERE id`, returning whichever row comes first |
| `get.test.ts` | returns `null` for an id with no adventure | returning `undefined` or the result array to callers that check for `null` |
| `get-all.test.ts` | returns all adventures, the most recently created first (three created at frozen times out of insertion order) | a missing or reversed `ORDER BY created_at DESC` |
| `update.test.ts` | with `description` first set to `'kept'`, writing a new `name` stores it with `updated_at` equal to T2 and leaves `description` `'kept'` | a column swapped, `updated_at` not bumped, or unrelated fields cleared |
| `update.test.ts` | with `description` set and `image_id` pointing at an `images` row inserted with SQL, `description: null` and `image_id: null` clear both | `null` treated as "not provided", making a field impossible to clear |
| `update.test.ts` | a numeric `name` is rejected and the row is unchanged | the `updateSchema` parse removed, letting any value reach SQL |
| `remove.test.ts` | removing an adventure deletes its sessions and their steps, its encounters, and its base entities and their content sections | a foreign key without `ON DELETE CASCADE`, leaving orphans that break lists and sync |
| `remove.test.ts` | a second adventure and its children are untouched | a DELETE without its `WHERE id` |

#### Session

| File | Test | Defect it catches |
| --- | --- | --- |
| `create.test.ts` | creates a session for the adventure with `active_view` `'prep'` and `name`, `description`, `summary`, `session_date` all `null` | the `'prep'` default lost, or a nullable column given a placeholder value |
| `create.test.ts` | an adventure id with no adventure is rejected | the foreign key not enforced |
| `duplicate.test.ts` | with the source updated to `{ name: 'n', description: 'd', summary: 's', session_date: '2026-01-01', active_view: 'ingame' }` and pinned through `@db/pinned-order`'s `setPinnedOrder('sessions', id, 3)`, the duplicate is a new session of the same adventure with a fresh id, the source's `description`, `summary`, `session_date` and `active_view`, `null` `name`, `null` `pinned_order`, and both timestamps equal to T2 | copying a column the duplicate must reset, dropping one it must keep, or reusing the source's timestamps |
| `duplicate.test.ts` | the source session is unchanged afterwards, timestamps included | the duplicate writing to its source |
| `duplicate.test.ts` | an unknown source id rejects with `Session not found: <id>` | a silent no-op returning an id for nothing |
| `get.test.ts` | with two sessions stored, requesting the later-created one returns it | a dropped `WHERE id`, returning whichever row comes first |
| `get.test.ts` | returns `null` for an id with no session | returning `undefined` to callers that check for `null` |
| `get-all.test.ts` | returns only the given adventure's sessions, the most recently created first (two adventures, sessions created at frozen times out of insertion order) | a missing `WHERE adventure_id` or a wrong `ORDER BY` |
| `update.test.ts` | writes `active_view: 'ingame'` with `updated_at` equal to T2 | the view switch not persisted, or `updated_at` not bumped |
| `update.test.ts` | with `summary` and `session_date` first set, `summary: null` and `session_date: null` clear both | `null` treated as "not provided" |
| `update.test.ts` | an `active_view` of `'bogus'` is rejected and the row is unchanged | the enum validation removed |
| `remove.test.ts` | removing a session deletes its steps and leaves the adventure's other session and its steps | the cascade to `session_steps` missing, or a DELETE without `WHERE` |

#### Session step

| File | Test | Defect it catches |
| --- | --- | --- |
| `create.test.ts` | a step created with only `session_id` and `sort_order` is stored with that `sort_order`, `checked` 0, and `null` `name`, `content` and `default_step_key` | the `checked` default lost or a missing optional field written as a value |
| `create.test.ts` | a step created with `default_step_key` and `name` stores each in its own column | optional fields dropped or swapped |
| `create.test.ts` | a `session_id` with no session is rejected | the foreign key not enforced |
| `duplicate-by-session.test.ts` | with two source steps created with `name` and `default_step_key` and then updated to `{ content: 'c', checked: 1 }`, every step is copied to the target session with a fresh id, the same `name`, `content`, `default_step_key`, `checked` and `sort_order`, and both timestamps equal to T2 (source and target are different sessions; the target starts empty) | reading the target instead of the source — copying nothing — reusing the source's ids or timestamps, or dropping a column `create` cannot set |
| `duplicate-by-session.test.ts` | the source session's steps are unchanged afterwards | moving the steps instead of copying them |
| `get.test.ts` | with two steps stored, requesting the later-created one returns it | a dropped `WHERE id`, returning whichever row comes first |
| `get.test.ts` | returns `null` for an id with no step | returning `undefined` to callers that check for `null` |
| `get-all-by-session.test.ts` | returns only the session's steps, in ascending `sort_order` (steps inserted with `sort_order` 2, 0, 1, plus a step of another session) | a missing `WHERE session_id` or `ORDER BY sort_order` — step reordering reads this order |
| `update.test.ts` | `checked: 0` and `sort_order: 0` are written over `1` | falsy values dropped, making unchecking or moving to the top impossible |
| `update.test.ts` | with `name` and `content` first set, `name: null` and `content: null` clear both | `null` treated as "not provided" |
| `update.test.ts` | a `default_step_key` outside the lazy DM keys is rejected and the row is unchanged | the enum validation removed |
| `remove.test.ts` | removes only the given step; the session's other step remains | a DELETE without `WHERE id` |

#### Encounter

| File | Test | Defect it catches |
| --- | --- | --- |
| `create.test.ts` | creates an encounter for the adventure whose name is `New Encounter`, a space, and `getDateTimeString` of the frozen creation time, with `description` `null` | the wrong name format or a value in the wrong column |
| `create.test.ts` | an adventure id with no adventure is rejected | the foreign key not enforced |
| `duplicate.test.ts` | with the source updated to `{ description: 'd' }` and pinned through `setPinnedOrder('encounters', id, 2)`, the duplicate is a new encounter of the same adventure with a fresh id, `description` `'d'`, `null` `name`, `null` `pinned_order`, and both timestamps equal to T2 | copying a column the duplicate must reset, or reusing the source's timestamps |
| `duplicate.test.ts` | the source encounter is unchanged afterwards | the duplicate writing to its source |
| `duplicate.test.ts` | an unknown source id rejects with `Encounter not found: <id>` | a silent no-op |
| `get.test.ts` | with two encounters stored, requesting the later-created one returns it | a dropped `WHERE id`, returning whichever row comes first |
| `get.test.ts` | returns `null` for an id with no encounter | returning `undefined` to callers that check for `null` |
| `get-all.test.ts` | returns only the given adventure's encounters, the most recently created first (two adventures, encounters created at frozen times out of insertion order) | a missing `WHERE` or wrong `ORDER BY` |
| `update.test.ts` | writes the given `description` with `updated_at` equal to T2 | a column swapped or `updated_at` not bumped |
| `update.test.ts` | with `description` first set, `name: null` and `description: null` clear both | `null` treated as "not provided" |
| `update.test.ts` | a numeric `description` is rejected and the row is unchanged | the `updateSchema` parse removed |
| `remove.test.ts` | removes the encounter and leaves the adventure's other encounter | a DELETE without `WHERE id` |

## Frontend

### `app/src/screens/adventures/components/ToAdventureBtn/ToAdventureBtn.tsx`

- **Purpose:** unchanged — the adventure preview card on the adventures screen, linking to the adventure.
- **Behavior:** unchanged — a `Link` to the adventure's path wrapping its `HoloImg` preview.
- **UI / Visual:** unchanged.

The change is type-level. `adventure.name` is now `string | null`, which the `Link`'s `aria-label` (typed `string | undefined`) does not accept; tsc reports it at the `Link` element (:21). Pass `aria-label={adventure.name ?? undefined}` (:24): React omits the attribute for `undefined`, which is what reached the DOM for a missing name before this change, when the runtime value was `null` under a type that claimed `undefined`. `adventure.image_id` is now `string | null`, the type `HoloImg`'s `image_id` prop takes (app/src/components/HoloImg/HoloImg.tsx:11), so `image_id={adventure.image_id ?? null}` (:27) becomes `image_id={adventure.image_id}`. `title={adventure.name ?? ''}` (:28) stays.

Active check on the touched file (root `CLAUDE.md` — Best Practices & Code Quality, "Active check on touched files"): its props are `{ adventure: Adventure } & HtmlProps<'div'>` (:14-16), but the root element is a `Link` and the component forwards no HTML attribute, which `.claude/rules/src-components.md` — Props pattern (case 3) answers with a closed `FCProps<Props>`. Change the type to `type Props = { adventure: Adventure };` and remove `HtmlProps` from the `@/types` import (`noUnusedLocals` would reject it otherwise). Modified-file scan: no inline sub-component and no `return null` in a void context (read in full, 36 lines).

### `AdventureScreenSidebar.tsx`, `adventure.$adventureId.index.tsx` and `SessionPopupContent.tsx`

- **Purpose, behavior, UI / Visual:** unchanged in all three.

Each coalesces a field this SF retypes to `string | null` with `?? null`, which after the change returns its operand unchanged; the shared rules file's Best Practices & Code Quality rule beginning "After any refactor, re-derive types bottom-up" removes it. Each receiver already takes `string | null`: `UploadImgBtn`'s `image_id` (app/src/components/UploadImgBtn/UploadImgBtn.tsx:13, `string | null` and optional), `ensureImagePainted`'s `imageId` (app/src/data-access-layer/images/ensureImagePainted.ts:6), and `EntityPopupBody`'s `summary` (app/src/components/MentionPopup/components/MentionPopupContent/components/EntityPopupBody/EntityPopupBody.tsx:8).

- `app/src/screens/adventure/components/AdventureScreenSidebar/AdventureScreenSidebar.tsx:35` — `image_id={adventure.image_id}`.
- `app/src/routes/adventure.$adventureId.index.tsx:12` — `await ensureImagePainted(context.queryClient, adventure.image_id);`.
- `app/src/components/MentionPopup/components/MentionPopupContent/components/SessionPopupContent/SessionPopupContent.tsx:20` — `summary={session.summary}`.

`EncounterPopupContent.tsx:20` keeps its `encounter.description ?? null`: the encounter schema is not changed here.

Modified-file scan and active check, each file read in full (63, 14 and 25 lines): no inline sub-component; the bare `return;` early exits in `AdventureScreenSidebar` (:22) and `SessionPopupContent` (:16) are in components that return JSX, not in void functions; `AdventureScreenSidebar` has no props and no `FCProps`, and `SessionPopupContent` declares `type Props` with `FCProps<Props>`, as `.claude/rules/src-components.md` — Props pattern requires; the route's `component` is the screen itself and its loader owns the data dependency, as `.claude/rules/src-routes.md` requires. No violation found.
