# SF4: Persist Active View

Add `active_view` column to `sessions`. Replace the `useState` view toggle in `SessionScreen` with DB-backed state via `useSession`. Remove `view` and `onViewChange` props from `SessionHeader`.

## Files Affected

**Modified:**
- `app/db/session/schema.ts`
- `app/db/session/index.ts`
- `app/db/database.ts`
- `app/src/screens/session/SessionScreen.tsx`
- `app/src/screens/session/components/SessionHeader.tsx`

**New:** none

Note: `app/src/services/sessionService.ts` and the DAL require no changes. `UpdateSessionInput` automatically includes `active_view` once the schema column is added, and `useSession.updateSession` already accepts any `UpdateSessionInput` partial.

## Layered Breakdown

### DB

**`app/db/session/schema.ts`**

Before the `defineTable` call, add:

```ts
export const SESSION_VIEW_VALUES = ['prep', 'ingame'] as const;
export type SessionView = typeof SESSION_VIEW_VALUES[number];
```

Add the `active_view` column to the `columns` object after `session_date`:

```ts
active_view: {
  type: 'TEXT',
  notNull: true,
  default: "'prep'",
  zod: z.enum(SESSION_VIEW_VALUES).optional(),
},
```

The `default: "'prep'"` string produces `DEFAULT 'prep'` in the generated SQL — the inner single quotes are required for SQLite string literals. The `zod: z.enum(SESSION_VIEW_VALUES).optional()` makes `active_view` optional in `CreateSessionInput` (the DB default applies when omitted) and optional in `UpdateSessionInput`. The inferred `Session.active_view` type is `'prep' | 'ingame' | undefined`. All callers read it as `session.active_view ?? 'prep'`.

**`app/db/session/index.ts`**

Add after the existing exports:

```ts
export { SESSION_VIEW_VALUES } from './schema';
export type { SessionView } from './schema';
```

All existing exports (`create`, `getAll`, `get`, `update`, `remove`, and the three types from `./types`) are unchanged.

**`app/db/database.ts`**

After the table creation loop (before `db = database`), add:

```ts
try {
  await database.execute(
    `ALTER TABLE sessions ADD COLUMN active_view TEXT NOT NULL DEFAULT 'prep'`,
  );
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  if (!message.toLowerCase().includes('duplicate column name')) {
    throw err;
  }
}
```

This runs every startup. When the column already exists, SQLite throws an error containing "duplicate column name: active_view", which is swallowed. All other errors re-throw.

### Frontend

**`app/src/screens/session/SessionScreen.tsx`**

**Purpose:** Root screen for a session. Reads `session.active_view` to decide which view to render. Manages ephemeral tooltip visibility state.

**Behavior:**
- Remove `const [view, setView] = useState<View>('prep')`.
- Add `session` to the `useSession` destructure: `const { session, loading } = useSession(sessionId, adventureId)`.
- Replace the `view === 'prep'` conditional with `(session?.active_view ?? 'prep') === 'prep'`.
- Remove `view` and `onViewChange={setView}` from the `<SessionHeader>` JSX.
- `areTooltipsVisible`, `onToggleAllTooltips`, and all tooltip-related state and logic are unchanged.
- `useState` import remains — it is still used by `visibleTooltips`.

**Dead code to remove:**
- `export type View = 'prep' | 'ingame'` — deleted entirely; no other file in this module references it after SF4
- `const [view, setView] = useState<View>('prep')`
- `view` and `onViewChange={setView}` JSX attributes on `<SessionHeader>`

**UI / Visual:** No visual change.

---

**`app/src/screens/session/components/SessionHeader.tsx`**

**Purpose:** Session header row with editable name, date picker, view toggle, and tooltip toggle button.

**Behavior:**
- Remove `view: View` and `onViewChange: (view: View) => void` from `Props`.
- `session` is already destructured from `useSession` in this component — add nothing to the `useSession` call.
- The `LabeledToggleButton` reads `value={session?.active_view ?? 'prep'}` for the current selection and calls `updateSession({ active_view: newView })` in its `onChange` handler. TypeScript infers `newView` as `'prep' | 'ingame'` from the options literal types — no explicit type annotation or cast is needed.
- `areTooltipsVisible` and `onToggleAllTooltips` props are unchanged.
- All session name and date input logic is unchanged.

**Dead code to remove:**
- `view: View` prop
- `onViewChange: (view: View) => void` prop
- `import type { View } from '../SessionScreen'`
- The `view` and `onViewChange` destructured parameters

**UI / Visual:** No visual change. The optimistic update in `useSession.updateSession` ensures the toggle responds instantly without a round-trip.
