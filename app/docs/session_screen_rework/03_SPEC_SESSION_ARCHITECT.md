# Session Screen Implementation Spec

## Progress Tracker

- [ ] Sub-feature 1: Sessions table cleanup — rename title to name, add summary column, filter by adventure
- [ ] Sub-feature 2: Session steps data model — new table, DB CRUD, service, DAL, template init
- [ ] Sub-feature 3: Session screen and view toggle — routes, screen shell, prep/in-game toggle
- [ ] Sub-feature 4: Lazy DM step sections — step section component with header, tooltip area, editor
- [ ] Sub-feature 5: Per-step tooltip toggle — tooltip visibility, per-step and global toggle
- [ ] Sub-feature 6: Step completion checkmarks — checkbox in header, persisted per-session
- [ ] Sub-feature 7: Step rearrangement — move up/down via section header controls
- [ ] Sub-feature 8: Step deletion — delete with confirmation dialog
- [ ] Sub-feature 9: Add custom steps — add action from sidebar, scroll and focus
- [ ] Sub-feature 10: Steps navigation sidebar — sidebar component, drag-and-drop, real-time sync
- [ ] Sub-feature 11: In-Game read-only view — read-only step content, interactive checkboxes
- [ ] Sub-feature 12: In-Game session summary — editable summary editor at top of In-Game View
- [ ] Sub-feature 13: Session date picker and sort — date picker in header, sort sessions list by date
- [ ] Sub-feature 14: Lexical checkbox lists — checkbox list nodes, read-only interactivity

## Open Questions

Resolve before implementation begins:

1. **`notes` column removal**: The existing `sessions.notes` column is conceptually replaced by per-step content in the new `session_steps` table. No UI has ever surfaced this column (no session detail screen exists). Confirm: remove `notes` from the sessions schema, or keep it?

2. **Additional sort options for sessions list**: The date picker story scopes sort-by-date only. The features overview (01_USER_STORIES.md) mentions session name, created at, updated at as additional sort options but no corresponding stories exist. Should the date picker story encompass all sort options, or are the others deferred?

3. **Lexical CheckListPlugin in read-only mode**: Lexical v0.41.0 includes `CheckListPlugin` for checkbox lists. Checkbox interactivity in read-only mode (`editable: false`) likely requires custom event handling. The implementer must verify against v0.41.0 docs before building sub-feature 14. If native support is insufficient, a custom plugin is the fallback.

## Key Architectural Decisions

### Steps data model: separate `session_steps` table (not JSON column)

Each step has its own Lexical editor content (large JSON strings), needs independent debounced updates, and can be reordered/deleted/created independently. A JSON column on `sessions` would require read-modify-write for every keystroke in any step editor. A separate table gives clean per-row updates and follows the existing one-table-per-domain convention.

### Tooltip text: referenced by key, not stored per step

Each default step gets a `default_step_key` column (one of 8 enum values, null for custom steps). The frontend looks up tooltip text from a `LAZY_DM_STEPS` constant using this key. This avoids storing the same paragraph-length quotes redundantly in every session. The key also distinguishes default steps from custom ones (null key = custom = no tooltip slot).

### View toggle: component state, not URL or DB

The prep/in-game toggle is a UI concern with no persistence requirement. `useState<'prep' | 'ingame'>('prep')` in the session screen. No URL params, no DB column. Defaults to prep view on every visit.

### Tooltip visibility: ephemeral component state

Unlike step checkmarks (which explicitly require persistence across restarts), tooltip visibility has no persistence requirement. `useState<Set<string>>` tracks which step IDs have visible tooltips. Resets to all-hidden on every visit.

### Custom steps have no tooltip slot

Custom steps have no `default_step_key` and therefore no associated tooltip text from LAZY_DM_STEPS.md. The tooltip toggle button (question mark icon) is omitted from custom step headers entirely.

### `title` renamed to `name`

The DB CLAUDE.md convention states: "All entities use `name` as the primary identifier column. Use `name`, not `title`." The current sessions schema violates this. This spec corrects it.

---

## Sub-feature 1: Sessions table cleanup

Fixes convention violations in the sessions table and adds infrastructure needed by later sub-features.

### DB changes

**Schema (`db/session/schema.ts`)**:

- Rename `title` column to `name`. Keep validation: `z.string().min(1, 'Session name is required')` with refine for whitespace
- Add `summary` column: `TEXT`, optional, `z.string().optional()` (needed by sub-feature 12)
- Remove `notes` column if confirmed by open question 1
- Leave `description` and `session_date` columns unchanged (already exist, not touched by user stories)

**Migration (`db/database.ts`)**: Add to `runMigrations`:

- `ALTER TABLE sessions RENAME COLUMN title TO name`
- `ALTER TABLE sessions ADD COLUMN summary TEXT`
- `ALTER TABLE sessions DROP COLUMN notes` (if confirmed)

**Types (`db/session/types.ts`)**: No manual changes needed. Types derive from schema via Zod inference and update automatically.

**`db/session/get-all.ts`**: Add required `adventureId: string` parameter. Filter query with `WHERE adventure_id = ?`. Sessions are always accessed within an adventure context.

### Services

**`services/sessionService.ts`**:

- `getAllSessions(adventureId: string)` — pass adventureId to `sessionDb.getAll(adventureId)`
- Other functions unchanged; the column rename propagates through Zod types

### Data Access Layer

**`data-access-layer/sessions/sessionKeys.ts`**:

- Scope list key to adventure: `list: (adventureId: string) => ['sessions', adventureId] as const`

**`data-access-layer/sessions/useSessions.ts`**:

- Accept `adventureId` param, pass to service and query key

**`data-access-layer/sessions/useSession.ts`**:

- Mutation invalidation for delete needs `adventureId` to invalidate the correct list key. Accept `adventureId` as second param or derive from session data.

### Frontend

**`screens/sessions/components/SessionList.tsx`**: Replace `session.title` with `session.name`

---

## Sub-feature 2: Session steps data model

Creates the core data layer that all step-related stories depend on.

### DB changes

**New directory**: `db/session-step/`

**Schema (`db/session-step/schema.ts`)**:

Table `session_steps`:

- `id` — TEXT, PK, nanoid
- `session_id` — TEXT, NOT NULL, FK to sessions.id ON DELETE CASCADE
- `name` — TEXT, NOT NULL (editable step name)
- `content` — TEXT, optional (Lexical editor JSON string)
- `default_step_key` — TEXT, optional. Zod: `z.enum(['review_characters', 'strong_start', 'potential_scenes', 'secrets_clues', 'fantastic_locations', 'important_npcs', 'relevant_monsters', 'magic_items']).nullable().optional()`
- `checked` — INTEGER, NOT NULL, DEFAULT 0 (0 = unchecked, 1 = checked; SQLite has no boolean)
- `sort_order` — INTEGER, NOT NULL
- `created_at` — TEXT, DEFAULT CURRENT_TIMESTAMP
- `updated_at` — TEXT, DEFAULT CURRENT_TIMESTAMP

**Types (`db/session-step/types.ts`)**: Derived from schema via Zod inference. `SessionStep`, `CreateSessionStepInput`, `UpdateSessionStepInput`.

**CRUD operations**:

- `create.ts` — create a single step, return id
- `get.ts` — get a single step by id
- `get-all-by-session.ts` — get all steps for a session, ordered by `sort_order ASC`. Required param: `sessionId: string`
- `update.ts` — update a step by id
- `remove.ts` — delete a step by id

**`db/session-step/index.ts`**: Barrel export of all operations and types.

**`db/database.ts`**: Register `sessionStepTable` in `tableSchemas` array after sessions.

### Domain

**New directory**: `src/domain/session-steps/`

**`src/domain/session-steps/lazyDmSteps.ts`**:

Exports:

- `LazyDmStepKey` type — union of the 8 step key strings
- `LazyDmStepDefinition` type — `{ key: LazyDmStepKey, name: string, tooltip: string }`
- `LAZY_DM_STEPS` constant — array of 8 `LazyDmStepDefinition` objects with names and tooltip text sourced from LAZY_DM_STEPS.md

This constant is the single source of truth for default step definitions. The service uses it for template init, the frontend uses it for tooltip display.

**`src/domain/session-steps/index.ts`**: Barrel export.

### Services

**New file**: `services/sessionStepService.ts`

Functions:

- `getStepsBySessionId(sessionId)` — calls `sessionStepDb.getAllBySession(sessionId)`
- `createStep(data: CreateSessionStepInput)` — calls `sessionStepDb.create(data)`, returns id
- `updateStep(id, data: UpdateSessionStepInput)` — calls `sessionStepDb.update(id, data)`
- `deleteStep(id)` — calls `sessionStepDb.remove(id)`
- `initDefaultSteps(sessionId)` — creates 8 steps from `LAZY_DM_STEPS`, each with key, name, sort_order 0-7, checked 0

**Update `services/sessionService.ts`**:

- `createSession` calls `sessionStepService.initDefaultSteps(newSessionId)` after creating the session

### Data Access Layer

**New directory**: `data-access-layer/session-steps/`

**`sessionStepKeys.ts`**:

- `list: (sessionId: string) => ['session-steps', sessionId] as const`

**`useSessionSteps.ts`**:

- Input: `sessionId: string`
- Query: fetches all steps for the session via `sessionStepService.getStepsBySessionId`
- Returns: `{ steps, loading, updateStep, createStep, deleteStep, reorderSteps }`
- `updateStep(stepId, data)` — optimistic list cache update, per-step debounce (500ms) via ref map, then mutation
- `createStep(name?)` — mutation, invalidates list, returns new step id
- `deleteStep(stepId)` — mutation, invalidates list
- `reorderSteps(stepId, direction: 'up' | 'down')` — swaps sort_order with adjacent step, optimistic update

**`index.ts`**: Barrel export.

**Update `data-access-layer/index.ts`**: Add session-steps exports.

### Frontend

None in this sub-feature.

---

## Sub-feature 3: Session screen and view toggle

Sets up routing, the session screen layout shell, and the toggle mechanism between prep and in-game views.

### DB changes

None.

### Services

None.

### Data Access Layer

None.

### Frontend

**Routes**:

- Add to `Routes` enum in `routes/index.tsx`: `SESSIONS = 'sessions'`, `SESSION = 'session'`
- New file: `routes/adventure.$adventureId.sessions.tsx` — renders `SessionsScreen`
- New file: `routes/adventure.$adventureId.session.$sessionId.tsx` — renders `SessionScreen`

**SideBarNav**:

- Add Sessions button to `SideBarNav.tsx`, following the NPCs button pattern (disabled when no adventureId)

**Screens**:

- Update `screens/index.ts` to export `SessionScreen`
- New directory: `screens/session/`
- `screens/session/SessionScreen.tsx`:
  - Reads `sessionId` from route params
  - Uses `useSession(sessionId)` and `useSessionSteps(sessionId)`
  - `useState<'prep' | 'ingame'>('prep')` for view toggle
  - Renders `SessionHeader` (always visible) + conditional `PrepView` or `InGameView`

- `screens/session/components/SessionHeader.tsx`:
  - Session name input (editable, calls `updateSession({ name })`)
  - View toggle control (button or switch)
  - Slots for date picker (sub-feature 13)

- `screens/session/components/PrepView.tsx`:
  - Layout wrapper: steps sidebar on left (sub-feature 10) + scrollable step sections on right
  - Receives steps data and all step mutation functions
  - Global tooltip toggle button (sub-feature 5)

- `screens/session/components/InGameView.tsx`:
  - Layout wrapper: summary editor on top + read-only step sections below
  - Placeholder structure, populated in sub-features 11-12

---

## Sub-feature 4: Lazy DM step sections

Builds the step section component — the repeating unit that renders each prep step.

### DB changes

None.

### Services

None.

### Data Access Layer

None.

### Frontend

New components within `screens/session/components/`:

**`StepSection/StepSection.tsx`**:

- Props: step data, updateStep callback, deleteStep callback, reorderSteps callback, tooltip visible flag, onToggleTooltip callback, isFirst/isLast flags (for disabling move buttons)
- Renders vertically: `StepSectionHeader` + tooltip area (conditional, sub-feature 5) + `TextEditor`
- TextEditor uses `textEditorId: 'step-{step.id}'`, `value: step.content`, `onChange` calls `updateStep(step.id, { content })`

**`StepSectionHeader/StepSectionHeader.tsx`**:

- Renders horizontally: checkbox slot + name input + tooltip toggle button + move up button + move down button + delete button
- Name input: `Input` component, onChange calls `updateStep(step.id, { name })`
- Tooltip toggle: question mark icon, only rendered when `step.default_step_key !== null`
- Move/delete buttons render with icons but functional wiring comes in sub-features 6-8

---

## Sub-feature 5: Per-step tooltip toggle

Lets GMs show/hide reference tooltips per step and globally.

### DB changes

None.

### Services

None.

### Data Access Layer

None.

### Frontend

**State management**: `useState<Set<string>>` in `PrepView` — set of step IDs with visible tooltips.

**Per-step toggle**: Question mark icon in `StepSectionHeader` toggles the step's ID in/out of the set. Button only rendered for default steps (has `default_step_key`).

**Global toggle**: Button in `PrepView` header area:

- If no tooltip is currently visible (set is empty) -> add all default step IDs to set (show all)
- If any tooltip is visible (set is non-empty) -> clear set (hide all)

**Tooltip rendering**: In `StepSection`, when the step's ID is in the visible set, render a tooltip panel between the header and the editor. Content is looked up from `LAZY_DM_STEPS` constant by `step.default_step_key`.

---

## Sub-feature 6: Step completion checkmarks

Persists per-step completion so GMs can track prep progress across restarts.

### DB changes

Already handled by `checked` column in sub-feature 2.

### Services

Already handled via `updateStep(id, { checked })`.

### Data Access Layer

Already handled via `useSessionSteps.updateStep(stepId, { checked })`.

### Frontend

- Wire checkbox in `StepSectionHeader` to `updateStep(stepId, { checked: step.checked ? 0 : 1 })`
- Checkbox state reads from `step.checked`
- Checkbox remains interactive in both Prep View and In-Game View (acceptance criterion from In-Game story)

---

## Sub-feature 7: Step rearrangement

Lets GMs reorder steps via section header controls.

### DB changes

None (sort_order updates use existing `update` operation from sub-feature 2).

### Services

**`sessionStepService.ts`**: Add `swapStepOrder(sessionId, stepId, direction: 'up' | 'down')`:

- Fetches all steps for the session
- Finds the target step and its adjacent step in the given direction
- Swaps their `sort_order` values
- Updates both steps in DB

### Data Access Layer

`useSessionSteps.reorderSteps(stepId, direction)` calls `sessionStepService.swapStepOrder`, optimistically reorders the list cache.

### Frontend

- Wire move up/down chevron buttons in `StepSectionHeader`
- Disable "up" on first step (`isFirst` prop), "down" on last step (`isLast` prop)
- On click: call `reorderSteps(step.id, 'up' | 'down')`
- Order change is immediately visible in both the main area and the sidebar

---

## Sub-feature 8: Step deletion

Lets GMs permanently remove steps with explicit confirmation.

### DB changes

None (uses existing `remove` operation from sub-feature 2).

### Services

None (uses existing `deleteStep`).

### Data Access Layer

`useSessionSteps.deleteStep(stepId)` calls service, invalidates list.

### Frontend

- Wire delete button (trash icon) in `StepSectionHeader`
- On click: open `DeleteDialog` (existing component) with message: "This step and all its contents will be deleted permanently."
- On confirm: call `deleteStep(step.id)`
- Step disappears from both main area and sidebar

---

## Sub-feature 9: Add custom steps

Lets GMs add custom prep sections beyond the default 8.

### DB changes

None.

### Services

**`sessionStepService.ts`**: Add `createCustomStep(sessionId, name?)`:

- Creates a step with `name: name ?? 'New Step'`, `default_step_key: null`, `sort_order: max existing + 1`, `checked: 0`
- Returns the new step's id

### Data Access Layer

`useSessionSteps.createStep(name?)` calls `sessionStepService.createCustomStep`, invalidates list, returns new step id.

### Frontend

- Add button is the last item in Steps navigation sidebar (sub-feature 10)
- Follows existing `NewItemBtn` pattern from NPC list
- On click:
  1. Call `createStep()`, get new step id
  2. After list updates, scroll to the new section at the bottom of the main area
  3. Set focus to the new step's name input field
- Custom steps render without tooltip toggle button (no `default_step_key`)

---

## Sub-feature 10: Steps navigation sidebar

Provides in-session navigation between step sections with drag-and-drop rearrangement.

### DB changes

None.

### Services

**`sessionStepService.ts`**: Add `bulkReorderSteps(sessionId, orderedStepIds: string[])`:

- Updates `sort_order` for all steps based on array position
- Used by drag-and-drop (arbitrary reorder, not just adjacent swap)

### Data Access Layer

Add `useSessionSteps.bulkReorder(orderedStepIds)` — calls `sessionStepService.bulkReorderSteps`, optimistic cache update.

### Frontend

New component: `screens/session/components/StepsNavSidebar/StepsNavSidebar.tsx`

- Lives within the session screen, left side of `PrepView` layout
- Does NOT replace the global `SideBarNav`
- Renders a list of step items: each shows step name + checked indicator
- Clicking a step item scrolls to that step section and focuses its text editor
- Drag-and-drop rearranges sections, calls `bulkReorder` with new order
- Reflects real-time changes from step data: checked state, name edits, order changes, deletions
- Add button (`NewItemBtn`) as last item in the list (sub-feature 9)

**DnD dependency**: Check `package.json` for an existing DnD library (likely `@dnd-kit` based on existing `SortableList` component). Reuse the existing DnD pattern. If no library is installed, flag to user before adding a dependency.

---

## Sub-feature 11: In-Game read-only view

Renders session prep content as distraction-free read-only notes.

### DB changes

None.

### Services

None.

### Data Access Layer

None.

### Frontend

**`InGameView` component** (within `screens/session/components/`):

- Renders all steps in sort_order
- Each step: section header (step name as read-only text, checkbox remains interactive) + read-only content
- No tooltip sections
- No move/delete/tooltip-toggle buttons in headers
- Steps navigation sidebar remains visible and functional (same sidebar, read-only steps still navigable)

**TextEditor changes**:

- Add optional `readOnly?: boolean` prop
- Make `onChange` optional (not needed when readOnly)
- When `readOnly: true`: set `editable: false` in initialConfig, hide `FloatingToolbar`, skip `OnChangePlugin`, skip `MentionTypeaheadPlugin`
- Checkbox list items inside editor content remain interactive even in read-only mode (sub-feature 14 handles this)

---

## Sub-feature 12: In-Game session summary

Provides an editable text area for capturing in-game session notes.

### DB changes

Already handled by `summary` column added in sub-feature 1.

### Services

Already handled via `updateSession(id, { summary })`.

### Data Access Layer

Already handled via `useSession.updateSession({ summary })`.

### Frontend

**Within `InGameView`**:

- `TextEditor` positioned at the top of In-Game View, between session name and the read-only step sections
- Fixed height via CSS
- Full editing capabilities (not read-only)
- `textEditorId: 'session-summary-{sessionId}'`
- `onChange` calls `updateSession({ summary: json })` (debounced through existing `useSession` mechanism)

---

## Sub-feature 13: Session date picker and sort

Adds date selection for sessions and enables sorting the sessions list by date.

### DB changes

None. `session_date` column already exists on the sessions table.

### Services

None. Update path already supports `session_date`.

### Data Access Layer

None. Update path already supports passing `session_date`.

### Frontend

**Session header (Prep View)**:

- Date picker input in `SessionHeader`
- `onChange` calls `updateSession({ session_date: isoDateString })`

**Session header (In-Game View)**:

- Session date displayed as read-only text

**Sessions list (`SessionsScreen`)**:

- Client-side sort by `session_date` (sufficient for personal tool with small dataset)
- Date format: use existing `getDateTimeString` util if available, otherwise consistent ISO format

---

## Sub-feature 14: Lexical checkbox lists

Adds checkbox list capability to all text editors, with checkboxes remaining interactive in read-only mode.

### DB changes

None.

### Services

None.

### Data Access Layer

None.

### Frontend

**TextEditor changes**:

- Add `CheckListPlugin` from `@lexical/react/LexicalCheckListPlugin`
- Add `checklist` theme class to editor theme config
- Add checkbox list toolbar button in `FloatingToolbar`
- Add `CHECK_LIST` to markdown shortcuts transformers (verify support in v0.41.0)

**Read-only interactivity** (open question 3 — verify approach against docs):

- If `CheckListPlugin` natively supports checkbox toggling when `editable: false`: no additional work needed
- If not: create a custom `CheckboxReadOnlyPlugin` that listens for click events on checkbox DOM elements and toggles the `checked` property on the `ListItemNode` even when the editor is non-editable. This plugin is only active when `readOnly: true`

**Scope**: Applies to all text editors in the session screen — prep step editors and the in-game summary editor.

---

## CLAUDE.md Impact

- **`app/db/CLAUDE.md`**: Add `session-step/` to the directory tree listing under `db/`
- **`app/src/CLAUDE.md`**: Add `session-steps/` under `domain/` and `session-steps/` under `data-access-layer/` in the structure tree
- **Root `CLAUDE.md`**: No changes needed
