# Session Screen Implementation Spec

## Progress Tracker

- [x] Sub-feature 1: Typed layout helper — generic type that constrains table_config column references at compile time
- [x] Sub-feature 2: Apply typed layouts to seed — type each seed entry against its domain type
- [x] Sub-feature 3: Sessions table cleanup — rename title to name, add summary column, filter by adventure
- [x] Sub-feature 4: Session steps data model — new table, DB CRUD, service, DAL, template init
- [x] Sub-feature 5: Session screen and view toggle — routes, screen shell, prep/in-game toggle
- [x] Sub-feature 6: Lazy DM step sections — step section component with header, tooltip area, editor
- [x] Sub-feature 7: Per-step tooltip toggle — tooltip visibility, per-step and global toggle
- [x] Sub-feature 8: Step completion checkmarks — checkbox in header, persisted per-session
- [x] Sub-feature 9: Step rearrangement — move up/down via section header controls
- [x] Sub-feature 10: Step deletion — delete with confirmation dialog
- [x] Sub-feature 11: Add custom steps — add action from sidebar, scroll and focus
- [x] Sub-feature 12: Steps navigation sidebar — sidebar component, drag-and-drop, real-time sync
- [x] Sub-feature 13: In-Game read-only view — read-only step content, interactive checkboxes
- [x] Sub-feature 14: In-Game session summary — editable summary editor at top of In-Game View
- [ ] Sub-feature 15: Session date picker and sort — date picker in header, sort sessions list by date
- [ ] Sub-feature 16: Lexical checkbox lists — checkbox list nodes, read-only interactivity

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

### Type-safe table_config seeds

`table_config` stores column references as loose strings in its `layout` JSON (`searchable_columns`, `columns[].key`, `sort_state.column`). When a domain schema changes (column renamed/removed), nothing catches stale references in the seed. The concrete example: removing the `notes` column from `sessions` leaves `'notes'` in the sessions seed's `searchable_columns`, which would break search at runtime. Sub-features 1-2 add compile-time validation so the compiler catches these mismatches.

---

## Pre-existing convention violations fixed in scope

These exist in the current codebase and are fixed as part of the sub-features that touch the affected files:

1. **`db/session/schema.ts`** — `title` column uses `notNull: true` + `.min(1).refine()` + `updateZod`. Violates "user-editable text columns are nullable" (`db/CLAUDE.md`). Fixed in sub-feature 3.
2. **`db/session/create.ts`** — INSERT specifies all optional columns with explicit NULLs. Violates INSERT best practice (`db/CLAUDE.md`). Fixed in sub-feature 3.
3. **`screens/sessions/SessionsScreen.tsx`** — exports `SessionScreen` (singular) from file named `SessionsScreen.tsx`. Mismatches `NpcsScreen`/`NpcScreen` naming pattern. Fixed in sub-feature 3.

---

## Sub-feature 1: Typed layout helper

Creates a generic type that constrains layout column keys to `keyof` the target domain type. Lives in the table-config module as a compile-time-only tool.

### Files affected

**Modified:**
- `db/table-config/types.ts`

### DB changes

**New types in `db/table-config/types.ts`**:

```typescript
type TypedTableLayout<T> = {
  searchable_columns: Array<keyof T & string>;
  columns: Array<Omit<LayoutColumn, 'key'> & { key: keyof T & string }>;
  sort_state: { column: keyof T & string; direction: SortDirection };
};

type TypedCreateTableConfigInput<T> = Omit<CreateTableConfigInput, 'layout'> & {
  layout: TypedTableLayout<T>;
};
```

`TypedCreateTableConfigInput<T>` is a compile-time-only wrapper. It narrows `layout` column references to `keyof T` while producing the same runtime shape as `CreateTableConfigInput`. The existing `CreateTableConfigInput` (with `string` keys) remains unchanged — it is still used by the generic CRUD operations.

Export both `TypedTableLayout` and `TypedCreateTableConfigInput` from `db/table-config/types.ts`. Update `db/table-config/index.ts` barrel to include the new type exports.

---

## Sub-feature 2: Apply typed layouts to seed

Types each seed entry against its domain type so stale column references cause compile errors.

### Files affected

**Modified:**
- `db/table-config/seed.ts`

### DB changes

**`db/table-config/seed.ts`**:

Import domain types and the typed helper:

```typescript
import type { Adventure } from '@db/adventure';
import type { Npc } from '@db/npc';
import type { Session } from '@db/session';
import type { TypedCreateTableConfigInput } from './types';
```

Type each seed entry explicitly:

```typescript
const adventuresConfig: TypedCreateTableConfigInput<Adventure> = { ... };
const npcsConfig: TypedCreateTableConfigInput<Npc> = { ... };
const sessionsConfig: TypedCreateTableConfigInput<Session> = { ... };

const defaultConfigs: CreateTableConfigInput[] = [
  adventuresConfig,
  npcsConfig,
  sessionsConfig,
];
```

Each typed entry is assignable to the untyped `CreateTableConfigInput[]` array (the generic type is a narrower subtype). The compiler catches invalid column keys at the definition site.

**Verification**: After applying, the current sessions seed produces a compile error for `'notes'` in `searchable_columns` because the `Session` type (once sub-feature 3 removes the `notes` column from the schema) no longer has a `notes` field. This is the exact class of bug this sub-feature prevents.

Note: At this point the `'notes'` reference still compiles because the schema hasn't changed yet. Sub-feature 3 removes the column — the compiler will flag it there.

---

## Sub-feature 3: Sessions table cleanup

Fixes convention violations in the sessions table and adds infrastructure needed by later sub-features.

### Files affected

**Modified:**
- `db/session/schema.ts`
- `db/session/types.ts`
- `db/session/create.ts`
- `db/session/get-all.ts`
- `db/session/index.ts`
- `db/database.ts`
- `db/table-config/seed.ts`
- `src/services/sessionService.ts`
- `src/data-access-layer/sessions/sessionKeys.ts`
- `src/data-access-layer/sessions/useSession.ts`
- `src/data-access-layer/sessions/useSessions.ts`
- `src/screens/sessions/SessionsScreen.tsx`
- `src/screens/sessions/components/SessionList.tsx`

### DB changes

**Schema (`db/session/schema.ts`)**:

Remove the `title` column definition entirely. Add `name` column in its place:

```typescript
name: {
  type: 'TEXT',
  zod: z.string().optional(),
},
```

No `notNull`, no `updateZod`. Follows the nullable user-editable column convention.

Add `summary` column (needed by sub-feature 14):

```typescript
summary: {
  type: 'TEXT',
  zod: z.string().optional(),
},
```

Remove `notes` column entirely (replaced by per-step content in `session_steps`).

Leave `description` and `session_date` columns unchanged.

**Types (`db/session/types.ts`)**:

Remove `PaginationParams` and `PaginatedResponse<T>` types — unused after the `getAll` change below. Keep only the Zod-inferred types:

```typescript
export type Session = z.infer<typeof sessionTable.zodSchema>;
export type CreateSessionInput = z.infer<typeof sessionTable.createSchema>;
export type UpdateSessionInput = z.infer<typeof sessionTable.updateSchema>;
```

**`db/session/index.ts`**: Remove `PaginationParams` and `PaginatedResponse` from type exports.

**`db/session/create.ts`**: Replace `title` with `name`. Fix INSERT to follow best practice — only required fields:

```typescript
await db.execute(
  'INSERT INTO sessions (id, name, adventure_id) VALUES ($1, $2, $3)',
  [id, validated.name, validated.adventure_id],
);
```

**`db/session/get-all.ts`**: Replace pagination with adventure-scoped flat query (matches `npc/get-all.ts` pattern):

```typescript
export const getAll = async (adventureId: string): Promise<Session[]> => {
  const db = await getDatabase();
  return db.select<Session[]>(
    'SELECT * FROM sessions WHERE adventure_id = $1 ORDER BY created_at DESC',
    [adventureId],
  );
};
```

Remove all pagination logic (`DEFAULT_LIMIT`, `MAX_LIMIT`, `PaginationParams` import, count query, `PaginatedResponse` return type).

**Seed (`db/table-config/seed.ts`)**: Update the sessions seed entry:

- Remove `'notes'` from `searchable_columns` (column removed)
- Result: `searchable_columns: ['name', 'description']`

The typed helper from sub-feature 2 makes this a compile error — removing `notes` from the session schema causes `TypedCreateTableConfigInput<Session>` to reject `'notes'` as a key. Fix by removing it from the array.

Note: the seed is idempotent (skips existing rows), so existing DBs need the migration below. The seed change only affects fresh installs.

**Migration (`db/database.ts`)**: Add to `runMigrations` after existing migrations:

```typescript
// Rename title to name on sessions
const titleCol = await database.select<{ name: string }[]>(
  "SELECT name FROM pragma_table_info('sessions') WHERE name = 'title'",
);
if (titleCol && titleCol.length > 0) {
  await database.execute('ALTER TABLE sessions RENAME COLUMN title TO name');
}

// Add summary column to sessions
const summaryCol = await database.select<{ name: string }[]>(
  "SELECT name FROM pragma_table_info('sessions') WHERE name = 'summary'",
);
if (!summaryCol || summaryCol.length === 0) {
  await database.execute('ALTER TABLE sessions ADD COLUMN summary TEXT');
}

// Drop notes column from sessions
const notesCol = await database.select<{ name: string }[]>(
  "SELECT name FROM pragma_table_info('sessions') WHERE name = 'notes'",
);
if (notesCol && notesCol.length > 0) {
  await database.execute('ALTER TABLE sessions DROP COLUMN notes');
}

// Update sessions table_config: remove 'notes' from searchable_columns in layout JSON
const sessionsConfig = await database.select<{ id: string; layout: string }[]>(
  "SELECT id, layout FROM table_config WHERE table_name = 'sessions'",
);
if (sessionsConfig.length > 0) {
  const layout = JSON.parse(sessionsConfig[0].layout);
  if (layout.searchable_columns?.includes('notes')) {
    layout.searchable_columns = layout.searchable_columns.filter(
      (col: string) => col !== 'notes',
    );
    await database.execute(
      'UPDATE table_config SET layout = $1 WHERE id = $2',
      [JSON.stringify(layout), sessionsConfig[0].id],
    );
  }
}
```

### Services

**`services/sessionService.ts`**:

- `getAllSessions(adventureId: string): Promise<Session[]>` — pass adventureId to `sessionDb.getAll(adventureId)`, return result directly (no `.data` unwrap — `getAll` now returns `Session[]`)
- `createSession` — unchanged signature. `CreateSessionInput` now has `name` instead of `title` via Zod inference
- Other functions unchanged

### Data Access Layer

**`data-access-layer/sessions/sessionKeys.ts`**:

Scope list key to adventure:

```typescript
export const sessionKeys = {
  list: (adventureId: string) => ['sessions', adventureId] as const,
  detail: (sessionId: string) => ['session', sessionId] as const,
};
```

**`data-access-layer/sessions/useSessions.ts`**:

- Accept `adventureId: string` parameter
- Pass to `service.getAllSessions(adventureId)` and `sessionKeys.list(adventureId)`
- Add `enabled: !!adventureId` guard (matches `useNpcs` pattern)
- Delete mutation `onSuccess`: invalidate `sessionKeys.list(adventureId)`

**`data-access-layer/sessions/useSession.ts`**:

- Accept `adventureId: string` as second parameter: `useSession(sessionId: string, adventureId: string)`
- Delete mutation `onSuccess`: invalidate `sessionKeys.list(adventureId)` (requires adventureId to build the correct list key)
- Update mutation `onSuccess` remains unchanged (invalidates detail key)

### Frontend

**`screens/sessions/SessionsScreen.tsx`**: Rename export from `SessionScreen` to `SessionsScreen`.

**`screens/sessions/components/SessionList.tsx`**: Replace `session.title` with `session.name`.

---

## Sub-feature 4: Session steps data model

Creates the core data layer that all step-related stories depend on.

### Files affected

**Created:**
- `db/session-step/schema.ts`
- `db/session-step/types.ts`
- `db/session-step/create.ts`
- `db/session-step/get.ts`
- `db/session-step/get-all-by-session.ts`
- `db/session-step/update.ts`
- `db/session-step/remove.ts`
- `db/session-step/index.ts`
- `src/domain/session-steps/lazyDmSteps.ts`
- `src/domain/session-steps/index.ts`
- `src/services/sessionStepService.ts`
- `src/data-access-layer/session-steps/sessionStepKeys.ts`
- `src/data-access-layer/session-steps/useSessionSteps.ts`
- `src/data-access-layer/session-steps/index.ts`

**Modified:**
- `db/database.ts`
- `src/services/sessionService.ts`
- `src/data-access-layer/index.ts`

### DB changes

**New directory**: `db/session-step/`

**Schema (`db/session-step/schema.ts`)**:

Table `session_steps`:

```typescript
id: {
  type: 'TEXT',
  primaryKey: true,
  zod: z.string(),
},
session_id: {
  type: 'TEXT',
  notNull: true,
  foreignKey: {
    table: 'sessions',
    column: 'id',
    onDelete: 'CASCADE',
  },
  zod: z.string(),
},
name: {
  type: 'TEXT',
  zod: z.string().optional(),
},
content: {
  type: 'TEXT',
  zod: z.string().optional(),
},
default_step_key: {
  type: 'TEXT',
  zod: z.enum([
    'review_characters',
    'strong_start',
    'potential_scenes',
    'secrets_clues',
    'fantastic_locations',
    'important_npcs',
    'relevant_monsters',
    'magic_items',
  ]).nullable().optional(),
},
checked: {
  type: 'INTEGER',
  notNull: true,
  default: '0',
  zod: z.number(),
},
sort_order: {
  type: 'INTEGER',
  notNull: true,
  zod: z.number(),
},
created_at: {
  type: 'TEXT',
  default: 'CURRENT_TIMESTAMP',
  zod: z.string().optional(),
},
updated_at: {
  type: 'TEXT',
  default: 'CURRENT_TIMESTAMP',
  zod: z.string().optional(),
},
```

**Types (`db/session-step/types.ts`)**: Zod-inferred types following `db/npc/types.ts` pattern:

```typescript
export type SessionStep = z.infer<typeof sessionStepTable.zodSchema>;
export type CreateSessionStepInput = z.infer<typeof sessionStepTable.createSchema>;
export type UpdateSessionStepInput = z.infer<typeof sessionStepTable.updateSchema>;
```

**CRUD operations** (follow naming from `db/CLAUDE.md`):

- `create.ts` — validate with `createSchema`, generate id via `generateId()`, insert required fields (`session_id`, `sort_order`, `checked`) plus any provided optional fields (`name`, `content`, `default_step_key`). Return id. Follow INSERT best practice.
- `get.ts` — get single step by id. Return `SessionStep | null`.
- `get-all-by-session.ts` — `getAllBySession(sessionId: string): Promise<SessionStep[]>`. Query: `SELECT * FROM session_steps WHERE session_id = $1 ORDER BY sort_order ASC`.
- `update.ts` — update step by id. Use `buildUpdateQuery()` utility. Same pattern as `db/session/update.ts`.
- `remove.ts` — delete step by id.

**`db/session-step/index.ts`**: Named exports of all CRUD operations and types (matches `db/npc/index.ts` pattern):

```typescript
export { create } from './create';
export { get } from './get';
export { getAllBySession } from './get-all-by-session';
export { update } from './update';
export { remove } from './remove';
export type { SessionStep, CreateSessionStepInput, UpdateSessionStepInput } from './types';
```

**`db/database.ts`**:

- Import `sessionStepTable` from `./session-step/schema`
- Add to `tableSchemas` array after sessions: `{ name: 'session_steps', sql: sessionStepTable.createTableSQL }`

### Domain

**New directory**: `src/domain/session-steps/`

**`src/domain/session-steps/lazyDmSteps.ts`**:

Types:

```typescript
export type LazyDmStepKey =
  | 'review_characters'
  | 'strong_start'
  | 'potential_scenes'
  | 'secrets_clues'
  | 'fantastic_locations'
  | 'important_npcs'
  | 'relevant_monsters'
  | 'magic_items';

export type LazyDmStepDefinition = {
  key: LazyDmStepKey;
  name: string;
  tooltip: string;
};
```

Export `LAZY_DM_STEPS: LazyDmStepDefinition[]` — array of 8 objects. Step names and their keys (array order = default sort_order 0–7):

| sort_order | key | name |
|---|---|---|
| 0 | `review_characters` | Review the Characters |
| 1 | `strong_start` | Create a Strong Start |
| 2 | `potential_scenes` | Outline Potential Scenes |
| 3 | `secrets_clues` | Define Secrets and Clues |
| 4 | `fantastic_locations` | Develop Fantastic Locations |
| 5 | `important_npcs` | Outline Important NPCs |
| 6 | `relevant_monsters` | Choose Relevant Monsters |
| 7 | `magic_items` | Select Magic Item Rewards |

Tooltip text sourced from `docs/session_screen_rework/LAZY_DM_STEPS.md`. This constant is the single source of truth for default step definitions — the service uses it for template init, the frontend uses it for tooltip display.

**`src/domain/session-steps/index.ts`**: Barrel export:

```typescript
export { LAZY_DM_STEPS } from './lazyDmSteps';
export type { LazyDmStepKey, LazyDmStepDefinition } from './lazyDmSteps';
```

### Services

**New file: `services/sessionStepService.ts`**

Import: `import * as sessionStepDb from '@db/session-step'`

Functions:

- `getStepsBySessionId(sessionId: string): Promise<SessionStep[]>` — calls `sessionStepDb.getAllBySession(sessionId)`
- `createStep(data: CreateSessionStepInput): Promise<string>` — calls `sessionStepDb.create(data)`, returns id
- `updateStep(id: string, data: UpdateSessionStepInput): Promise<void>` — calls `sessionStepDb.update(id, data)`
- `deleteStep(id: string): Promise<void>` — calls `sessionStepDb.remove(id)`
- `initDefaultSteps(sessionId: string): Promise<void>` — iterates `LAZY_DM_STEPS`, calls `sessionStepDb.create()` for each with: `session_id: sessionId`, `name: step.name`, `default_step_key: step.key`, `sort_order: index`, `checked: 0`

**Update `services/sessionService.ts`**:

- Import: `import * as sessionStepService from './sessionStepService'`
- `createSession` calls `sessionStepService.initDefaultSteps(newSessionId)` after creating the session, before returning the id

### Data Access Layer

**New directory**: `data-access-layer/session-steps/`

**`sessionStepKeys.ts`**:

```typescript
export const sessionStepKeys = {
  list: (sessionId: string) => ['session-steps', sessionId] as const,
};
```

No `detail` key — steps are always fetched as a list and found by id from the array.

**`useSessionSteps.ts`**:

Input: `sessionId: string`

Query: fetches all steps via `sessionStepService.getStepsBySessionId(sessionId)` with `throwOnError: true`, `enabled: !!sessionId`.

Return type:

```typescript
type UseSessionStepsReturn = {
  steps: SessionStep[];
  loading: boolean;
  updateStep: (stepId: string, data: UpdateSessionStepInput) => void;
  createStep: (name?: string) => Promise<string>;
  deleteStep: (stepId: string) => Promise<void>;
  reorderSteps: (stepId: string, direction: 'up' | 'down') => void;
};
```

**Per-step debounce for `updateStep`**: Unlike `useSession` which uses a single debounce ref pair, this hook needs per-step debouncing. Use a `useRef<Map<string, { timeout: NodeJS.Timeout; pending: UpdateSessionStepInput }>>` to track pending updates per stepId. Each call to `updateStep(stepId, data)`:

1. Optimistically updates the list cache via `queryClient.setQueryData` — finds the step by id in the array, merges data
2. Looks up or creates the entry in the per-step map for `stepId`
3. Accumulates `data` into `pending` via spread
4. Clears any existing `timeout` for that stepId
5. Sets a new 500ms timeout that flushes the accumulated `pending` via `updateMutation.mutate({ id: stepId, data: accumulated })` and removes the map entry

Cleanup: `useEffect` cleanup iterates the map and clears all timeouts on unmount.

**`createStep(name?)`**: Calls `sessionStepService.createCustomStep(sessionId, name)` (sub-feature 11 adds this service function). Invalidates list on success. Returns new step id via `mutateAsync`.

**`deleteStep(stepId)`**: Calls `sessionStepService.deleteStep(stepId)`. Invalidates list on success via `mutateAsync`.

**`reorderSteps(stepId, direction)`**: Calls `sessionStepService.swapStepOrder(sessionId, stepId, direction)` (sub-feature 9 adds this service function). Optimistically reorders the list cache by finding the two affected steps and swapping their `sort_order` values, then re-sorting the array.

Note: `createStep` and `reorderSteps` depend on service functions added in sub-features 11 and 9 respectively. The hook defines the signatures in sub-feature 4 but the service functions they call are created in later sub-features. Stub them or implement the full hook in the sub-feature that adds the corresponding service function — implementer's choice.

**`data-access-layer/session-steps/index.ts`**: Named exports:

```typescript
export { useSessionSteps } from './useSessionSteps';
export { sessionStepKeys } from './sessionStepKeys';
```

**`data-access-layer/index.ts`**: Add session-steps exports to the existing grouping barrel:

```typescript
export { useSessionSteps, sessionStepKeys } from './session-steps';
```

### Frontend

None in this sub-feature.

---

## Sub-feature 5: Session screen and view toggle

Sets up routing, the session screen layout shell, and the toggle mechanism between prep and in-game views.

### Files affected

**Created:**
- `src/routes/adventure.$adventureId.sessions.tsx`
- `src/routes/adventure.$adventureId.session.$sessionId.tsx`
- `src/screens/session/SessionScreen.tsx`
- `src/screens/session/SessionScreen.css`
- `src/screens/session/components/SessionHeader.tsx`
- `src/screens/session/components/SessionHeader.css`
- `src/screens/session/components/PrepView.tsx`
- `src/screens/session/components/PrepView.css`
- `src/screens/session/components/InGameView.tsx`
- `src/screens/session/components/InGameView.css`

**Modified:**
- `src/routes/index.tsx`
- `src/components/SideBarNav/SideBarNav.tsx`
- `src/screens/index.ts`

### Routes

Add to `Routes` enum in `routes/index.tsx`:

```typescript
SESSIONS = 'sessions',
SESSION = 'session',
```

**`routes/adventure.$adventureId.sessions.tsx`** (matches `adventure.$adventureId.npcs.tsx` pattern):

```typescript
import { createFileRoute } from '@tanstack/react-router';
import { SessionsScreen } from '@/screens';
import { Routes } from './index';

export const Route = createFileRoute(
  `/${Routes.ADVENTURE}/$adventureId/${Routes.SESSIONS}`,
)({
  component: SessionsScreen,
});
```

**`routes/adventure.$adventureId.session.$sessionId.tsx`** (matches `adventure.$adventureId.npc.$npcId.tsx` pattern):

```typescript
import { createFileRoute } from '@tanstack/react-router';
import { SessionScreen } from '@/screens';
import { Routes } from './index';

export const Route = createFileRoute(
  `/${Routes.ADVENTURE}/$adventureId/${Routes.SESSION}/$sessionId`,
)({
  component: SessionScreen,
});
```

### SideBarNav

Add Sessions button to `SideBarNav.tsx`, between the NPCs button and Settings button:

```tsx
<ScreenNavBtn
  label='Sessions'
  targetRoute={`/${Routes.ADVENTURE}/${adventureId}/${Routes.SESSIONS}`}
  isDisabled={!adventureId}
/>
```

### Screens

**`screens/index.ts`**: Add export for the new detail screen:

```typescript
export * from './session/SessionScreen';
```

The existing `export * from './sessions/SessionsScreen'` covers the renamed list export (`SessionsScreen`).

**`screens/session/SessionScreen.tsx`**:

- Reads `sessionId` and `adventureId` from route params via `useParams` (same pattern as `NpcScreen`)
- Route string: `` `/${Routes.ADVENTURE}/$adventureId/${Routes.SESSION}/$sessionId` ``
- Calls `useSession(sessionId, adventureId)` for loading/existence check only
- `useState<'prep' | 'ingame'>('prep')` for view toggle
- Renders: `SessionHeader` (always visible) + conditional `PrepView` or `InGameView`
- Passes `sessionId`, `adventureId`, and view toggle state/setter as props to `SessionHeader`
- Passes `sessionId` and `adventureId` as props to `PrepView`/`InGameView`

**`screens/session/components/SessionHeader.tsx`**:

- Props: `sessionId: string`, `adventureId: string`, `view: 'prep' | 'ingame'`, `onViewChange: (view: 'prep' | 'ingame') => void`
- Calls `useSession(sessionId, adventureId)` internally — owns session name input and date picker
- View toggle control (button or switch) — calls `onViewChange`
- `view`/`onViewChange` are the one exception to "each component fetches its own data" — the toggle coordinates sibling components (`PrepView`/`InGameView`), which is legitimate parent-owned cross-component state

**`screens/session/components/PrepView.tsx`**:

- Props: `sessionId: string`, `adventureId: string`
- Calls `useSessionSteps(sessionId)` internally
- Maps step data to `StepSection` components (sub-feature 6)
- Owns tooltip visibility state: `useState<Set<string>>` — set of step IDs with visible tooltips, initially empty
- Layout: steps sidebar on left (sub-feature 12) + scrollable step sections on right

**`screens/session/components/InGameView.tsx`**:

- Props: `sessionId: string`, `adventureId: string`
- Calls `useSessionSteps(sessionId)` and `useSession(sessionId, adventureId)` internally
- Layout: summary editor on top + read-only step sections below
- Placeholder structure until sub-features 13-14 populate it

---

## Sub-feature 6: Lazy DM step sections

Builds the step section component — the repeating unit that renders each prep step.

### Files affected

**Created:**
- `src/screens/session/components/StepSection/StepSection.tsx`
- `src/screens/session/components/StepSection/StepSection.css`
- `src/screens/session/components/StepSectionHeader/StepSectionHeader.tsx`
- `src/screens/session/components/StepSectionHeader/StepSectionHeader.css`

### Frontend

**`StepSection/StepSection.tsx`**:

- Props: `stepId: string`, `sessionId: string`, `adventureId: string`, `tooltipVisible: boolean`, `onToggleTooltip: () => void`
- Calls `useSessionSteps(sessionId)` internally — finds its own step from the array by `stepId`, gets `updateStep`
- Derives `isFirst`/`isLast` from its position in the steps array (index 0 = first, index === length-1 = last)
- Renders vertically: `StepSectionHeader` + tooltip area (conditional, sub-feature 7) + `TextEditor`
- TextEditor props:
  - `textEditorId`: `'step-${step.id}'`
  - `value`: `step.content ?? ''`
  - `adventureId`: `adventureId`
  - `onChange`: `(content) => updateStep(step.id, { content })`

**`StepSectionHeader/StepSectionHeader.tsx`**:

- Props: `stepId: string`, `sessionId: string`, `tooltipVisible: boolean`, `onToggleTooltip: () => void`, `isFirst: boolean`, `isLast: boolean`
- Calls `useSessionSteps(sessionId)` internally — finds its step, gets `updateStep`, `deleteStep`, `reorderSteps`
- Renders horizontally: checkbox + name input + tooltip toggle button + move up button + move down button + delete button
- Name input: `Input` component, `value: step.name ?? ''`, `onChange: (e) => updateStep(step.id, { name: e.target.value })`
- Tooltip toggle: question mark icon button, only rendered when `step.default_step_key !== null`, calls `onToggleTooltip`
- Checkbox: renders but is not wired until sub-feature 8
- Move buttons: render but are not wired until sub-feature 9
- Delete button: renders but is not wired until sub-feature 10

---

## Sub-feature 7: Per-step tooltip toggle

Lets GMs show/hide reference tooltips per step and globally.

### Files affected

**Modified:**
- `src/screens/session/components/PrepView.tsx`
- `src/screens/session/components/StepSection/StepSection.tsx`

### Frontend

**State management**: `useState<Set<string>>` in `PrepView` — set of step IDs with visible tooltips. Initially empty (all hidden).

**Per-step toggle**: `StepSection` receives `tooltipVisible` and `onToggleTooltip` props (already defined in sub-feature 6). `PrepView` passes:

- `tooltipVisible`: `visibleTooltips.has(step.id)`
- `onToggleTooltip`: `() => toggleTooltipForStep(step.id)` — adds/removes the step ID from the set

**Global toggle**: Button in `PrepView` header area:

- If set is empty → add all default step IDs (steps where `default_step_key !== null`) to set
- If set is non-empty → clear set

**Tooltip rendering**: In `StepSection`, when `tooltipVisible` is true and `step.default_step_key` is not null, render a tooltip panel between the header and the editor. Look up tooltip text from `LAZY_DM_STEPS` by finding the entry where `key === step.default_step_key`. Import from `@/domain/session-steps`.

---

## Sub-feature 8: Step completion checkmarks

Persists per-step completion so GMs can track prep progress across restarts.

### Files affected

**Modified:**
- `src/screens/session/components/StepSectionHeader/StepSectionHeader.tsx`

### Frontend

Wire checkbox in `StepSectionHeader`:
- `checked`: `step.checked === 1`
- `onChange`: `() => updateStep(step.id, { checked: step.checked ? 0 : 1 })`

Checkbox remains interactive in both Prep View and In-Game View (sub-feature 13).

DB, service, and DAL already support this via the `checked` column and `updateStep`.

---

## Sub-feature 9: Step rearrangement

Lets GMs reorder steps via section header controls.

### Files affected

**Modified:**
- `src/services/sessionStepService.ts`
- `src/data-access-layer/session-steps/useSessionSteps.ts`
- `src/screens/session/components/StepSectionHeader/StepSectionHeader.tsx`

### Services

**`sessionStepService.ts`**: Add `swapStepOrder(sessionId: string, stepId: string, direction: 'up' | 'down'): Promise<void>`:

- Calls `sessionStepDb.getAllBySession(sessionId)` to get all steps (sorted by sort_order)
- Finds the target step's index in the array
- Finds the adjacent step (index - 1 for `'up'`, index + 1 for `'down'`)
- If no adjacent step exists (already at boundary), return early
- Swaps `sort_order` values between the two steps
- Calls `sessionStepDb.update()` for both steps with swapped sort_order values

### Data Access Layer

Wire `reorderSteps(stepId, direction)` in `useSessionSteps` (if stubbed in sub-feature 4) — calls `sessionStepService.swapStepOrder(sessionId, stepId, direction)`. Optimistically reorders the list cache by finding the two affected steps, swapping their `sort_order` values, and re-sorting the array by `sort_order`.

### Frontend

- Wire move up/down chevron buttons in `StepSectionHeader`
- Disable "up" when `isFirst`, "down" when `isLast`
- On click: call `reorderSteps(step.id, 'up')` or `reorderSteps(step.id, 'down')`
- Order change is immediately visible via the optimistic update

---

## Sub-feature 10: Step deletion

Lets GMs permanently remove steps with explicit confirmation.

### Files affected

**Modified:**
- `src/screens/session/components/StepSectionHeader/StepSectionHeader.tsx`

### Frontend

- Wire delete button (trash icon) in `StepSectionHeader`
- On click: open `DeleteDialog` (existing component from `@/components`) via `PopUpContainer` state management (same pattern as `NpcScreen`)
- `DeleteDialog` props: `name: step.name ?? 'Untitled Step'`, `onDeletionConfirm: () => deleteStep(step.id)`
- On confirm: call `deleteStep(step.id)`, step disappears from both main area and sidebar

DB and service already support this via existing `deleteStep`/`remove`.

---

## Sub-feature 11: Add custom steps

Lets GMs add custom prep sections beyond the default 8.

### Files affected

**Modified:**
- `src/services/sessionStepService.ts`
- `src/data-access-layer/session-steps/useSessionSteps.ts`

### Services

**`sessionStepService.ts`**: Add `createCustomStep(sessionId: string, name?: string): Promise<string>`:

- Fetches all steps via `sessionStepDb.getAllBySession(sessionId)` to determine max `sort_order`
- Computes `maxSortOrder`: max of all step `sort_order` values, or -1 if no steps exist
- Calls `sessionStepDb.create({ session_id: sessionId, name: name ?? 'New Step', sort_order: maxSortOrder + 1, checked: 0 })` — `default_step_key` is omitted (defaults to null via schema)
- Returns the new step's id

### Data Access Layer

Wire `createStep(name?)` in `useSessionSteps` (if stubbed in sub-feature 4) — calls `sessionStepService.createCustomStep(sessionId, name)`. Invalidates list on success. Returns new step id via `mutateAsync`.

### Frontend

- Add button is the last item in the Steps navigation sidebar (sub-feature 12)
- Uses existing `NewItemBtn` component with `type: 'list-item'`, `label: 'Add Step'`
- On click:
  1. Call `createStep()`, await the returned step id
  2. After list query invalidation settles, scroll to the new section at the bottom of the main area
  3. Set focus to the new step's name input field
- Custom steps render without tooltip toggle button (no `default_step_key`)

---

## Sub-feature 12: Steps navigation sidebar

Provides in-session navigation between step sections with drag-and-drop rearrangement.

### Files affected

**Created:**
- `src/screens/session/components/StepsNavSidebar/StepsNavSidebar.tsx`
- `src/screens/session/components/StepsNavSidebar/StepsNavSidebar.css`

**Modified:**
- `src/services/sessionStepService.ts`
- `src/data-access-layer/session-steps/useSessionSteps.ts`
- `src/screens/session/components/PrepView.tsx`

### Services

**`sessionStepService.ts`**: Add `bulkReorderSteps(sessionId: string, orderedStepIds: string[]): Promise<void>`:

- Fetches all steps for the session via `sessionStepDb.getAllBySession(sessionId)`
- For each step whose current `sort_order` differs from its index position in `orderedStepIds`, calls `sessionStepDb.update(stepId, { sort_order: newIndex })`

### Data Access Layer

Add `bulkReorder(orderedStepIds: string[])` to `useSessionSteps` return type. Calls `sessionStepService.bulkReorderSteps(sessionId, orderedStepIds)`. Optimistically reorders the list cache to match the new order before the mutation settles.

### Frontend

**`StepsNavSidebar/StepsNavSidebar.tsx`**:

- Props: `sessionId: string`
- Calls `useSessionSteps(sessionId)` internally
- Lives within `PrepView`, left side of the layout
- Does NOT replace the global `SideBarNav`
- Renders a list of step items: each shows step name + checked indicator
- Clicking a step item scrolls to that step section in the main area
- Drag-and-drop rearranges sections, calls `bulkReorder` with new ordered ID array
- Reflects real-time changes: checked state, name edits, order changes, deletions
- `NewItemBtn` as last item in the list (sub-feature 11 — add button)

**DnD dependency**: No DnD library is currently installed. The existing `SortableList` component is column-based sorting (click-to-sort), not drag-and-drop. The sidebar needs vertical list reorder of ~8-12 items. The implementer must evaluate library options before starting this sub-feature and present the trade-off to the user before installing. Candidates:

- `@hello-pangea/dnd` — simpler API, faster integration, sufficient for vertical list reorder
- `@dnd-kit/core` + `@dnd-kit/sortable` — more customizable but requires more setup (sensors, collision detection, drag overlays)

---

## Sub-feature 13: In-Game read-only view

Renders session prep content as distraction-free read-only notes.

### Files affected

**Modified:**
- `src/screens/session/components/InGameView.tsx`
- `src/components/TextEditor/TextEditor.tsx`

### Frontend

**`InGameView` component** (shell created in sub-feature 5):

- Calls `useSessionSteps(sessionId)` internally — renders all steps in sort_order
- Each step: section header (step name as read-only text + interactive checkbox) + read-only editor content
- No tooltip sections, no move/delete/tooltip-toggle buttons in headers
- Steps navigation sidebar remains visible and functional (same `StepsNavSidebar` component)

**TextEditor changes** (`src/components/TextEditor/TextEditor.tsx`):

Current `Props` type requires `onChange` as non-optional. Change to:

```typescript
type Props = {
  value: string;
  textEditorId: string;
  adventureId: string;
  placeholder?: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
};
```

When `readOnly` is true:
- Set `editable: false` in `initialConfig`
- Do not render `FloatingToolbar`
- Do not render `OnChangePlugin`
- Do not render `MentionTypeaheadPlugin`

When `readOnly` is false or undefined: behavior unchanged.

---

## Sub-feature 14: In-Game session summary

Provides an editable text area for capturing in-game session notes.

### Files affected

**Modified:**
- `src/screens/session/components/InGameView.tsx`

### Frontend

Within `InGameView`, add a `TextEditor` at the top, between the session name display and the read-only step sections:

- `textEditorId`: `'session-summary-${sessionId}'`
- `value`: `session.summary ?? ''`
- `adventureId`: `adventureId`
- `onChange`: `(summary) => updateSession({ summary })`
- `readOnly`: omitted (defaults to false — full editing)
- Fixed height via CSS

`updateSession` comes from `useSession(sessionId, adventureId)` called within `InGameView`. The existing debounce mechanism in `useSession` handles summary saves.

DB (`summary` column) and service (`updateSession`) already support this from sub-feature 3.

---

## Sub-feature 15: Session date picker and sort

Adds date selection for sessions and enables sorting the sessions list by date.

### Files affected

**Modified:**
- `db/table-config/seed.ts`
- `db/database.ts`
- `src/screens/session/components/SessionHeader.tsx`
- `src/screens/session/components/InGameView.tsx`
- `src/screens/sessions/SessionsScreen.tsx` (or its list components)

### DB changes

**Seed (`db/table-config/seed.ts`)**: Add `session_date` column to the sessions layout:

- Add `{ key: 'session_date', label: 'Session Date', width: 250 }` to `columns` array
- The typed helper validates `'session_date'` against `keyof Session` at compile time

Note: seed is idempotent (skips existing rows), so existing DBs need the migration below.

**Migration (`db/database.ts`)**: Update the existing sessions `table_config` row to add `session_date` to the layout JSON columns array:

```typescript
// Add session_date column to sessions table_config layout
const sessionsConfigForDate = await database.select<{ id: string; layout: string }[]>(
  "SELECT id, layout FROM table_config WHERE table_name = 'sessions'",
);
if (sessionsConfigForDate.length > 0) {
  const layout = JSON.parse(sessionsConfigForDate[0].layout);
  const hasSessionDate = layout.columns?.some(
    (col: { key: string }) => col.key === 'session_date',
  );
  if (!hasSessionDate) {
    layout.columns.push({ key: 'session_date', label: 'Session Date', width: 250 });
    await database.execute(
      'UPDATE table_config SET layout = $1 WHERE id = $2',
      [JSON.stringify(layout), sessionsConfigForDate[0].id],
    );
  }
}
```

### Frontend

**Session header (Prep View)**: Date picker input in `SessionHeader`. `onChange` calls `updateSession({ session_date: isoDateString })`. The `session_date` column already exists — no schema changes needed.

**Session header (In-Game View)**: Session date displayed as read-only text.

**Sessions list (`SessionsScreen`)**: `session_date` is the session-specific sort column. Default sort columns (`name`, `created_at`, `updated_at`) are covered by the app-wide list convention and do not need session-specific work. All sorting is client-side.

---

## Sub-feature 16: Lexical checkbox lists

Adds checkbox list capability to all text editors, with checkboxes remaining interactive in read-only mode.

### Files affected

**Modified:**
- `src/components/TextEditor/TextEditor.tsx`
- `src/components/TextEditor/TextEditor.css`
- `src/components/TextEditor/components/FloatingToolbar/FloatingToolbar.tsx`

**Created:**
- `src/components/TextEditor/plugins/CheckboxReadOnlyPlugin.ts` (name TBD after API research)

### Frontend

**TextEditor changes**:

- Add `CheckListPlugin` from `@lexical/react/LexicalCheckListPlugin`
- Add `checklist` theme class to editor `theme` config
- Add `CHECK_LIST` to markdown shortcuts `transformers` array (verify support in installed Lexical version — check `package.json` for exact version, fetch docs for that version)
- Add checkbox list toolbar button in `FloatingToolbar`

**Read-only interactivity**: The Lexical playground confirms checkboxes are NOT interactive when `editable: false`. A custom solution is required.

The implementer must research the installed Lexical version's API to determine the best approach before implementing. Likely approach: a custom plugin that listens for click events on checkbox DOM elements and toggles the `checked` property on the `ListItemNode` even when the editor is non-editable. This plugin is only active when `readOnly: true`.

Alternative approaches may exist (DOM event interception, partial editability). Research first, implement second. Do not guess at the Lexical API — fetch the docs for the installed version.

**Scope**: Applies to all `TextEditor` instances — prep step editors and the in-game summary editor.

---

## CLAUDE.md Impact

- **`app/db/CLAUDE.md`**: Add `session-step/` to the directory tree listing under `db/`:

```
db/
├── database.ts
├── util/
├── adventure/
├── session/
├── session-step/        ← add
├── npc/
├── image/
└── table-config/
```

- **`app/db/CLAUDE.md`**: Add a convention under the seeds section: "Seed entries for `table_config` must be typed with `TypedCreateTableConfigInput<DomainType>` so that column references (`searchable_columns`, `columns[].key`, `sort_state.column`) are validated against the target table's schema at compile time."

- **`app/src/CLAUDE.md`**: The structure tree uses generic examples (`domainA/`, `screenA/`), not specific domain names. No update required unless the tree is changed to list specific domains.
