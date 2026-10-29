# Sub-feature 5: Hide defeated and documentation

A "Hide defeated" toggle on the encounter, and the two documents this slice makes stale. Governing Key Architectural Decisions: "Hide defeated saves through the autosave", "Reorder input", "Documents updated in this spec".

## Files affected

Modified:

- `app/src/screens/encounter/components/EncounterActions/EncounterActions.tsx`.
- `app/docs/features/encounter-queue.md` — the edits in the table below.
- `app/docs/_product/domain-scaffold.md` — line 241 (the `screens/encounter/` bullet of Detail Screen Composition): both occurrences of "an Add sidebar" become "a tabbed sidebar (Add and Actions)". The rest of the file, read through, states nothing else about the encounter screen.

New:

- `app/src/screens/encounter/components/EncounterActions/EncounterActions.css`.
- `app/src/screens/encounter/components/EncounterActions/__tests__/EncounterActions.test.tsx`.

## Layered breakdown

### Frontend

**`EncounterActions`** (it already holds `useEncounter`; the folder gains a stylesheet and `__tests__/` only, so no `index.ts`)

- **Purpose** — encounter-level controls under the queue; the toggle belongs with Duplicate and Delete.
- **Behavior** — above `ScreensDuplicateBtn`, a `div` (class `encounter-actions-hide-defeated`) holds a `Checkbox` (`id='encounter-hide-defeated'`, `checked={encounter.hide_defeated === 1}`) and `<label htmlFor='encounter-hide-defeated'>Hide defeated</label>`, the pairing `EncounterAddTab` uses. `onChange` calls `updateEncounter({ hide_defeated: encounter.hide_defeated === 1 ? 0 : 1 })`: the column is a number. `updateEncounter` updates the cache at once, so the queue changes on click, and the write follows through the autosave about 500 ms later (`AUTOSAVE_DELAY_MS`); a quit inside that window loses that toggle. A defeated combatant that becomes hidden leaves the selection through `useEncounterSelection` (SF2), and the queue's reorder keeps hidden items in place through SF1's full-list input.
- **UI / Visual** — `.encounter-actions-hide-defeated { display: flex; align-items: center; gap: var(--spacing-xs); }`; no other style.

Behaviours (`EncounterActions.test.tsx`; `@services/encounterService` mocked with `getEncounterById` and `updateEncounter`; `@tanstack/react-router` mocked with `useParams: encounterRouteParams`, `useRouter` and `useNavigate` stubs; wrapper `TanstackQueryClientProvider` around `DeleteDialogProvider`; fake timers with `shouldAdvanceTime`, then `await act(() => vi.runOnlyPendingTimersAsync())`):

- Checking the box saves `hide_defeated: 1` and unchecking saves `0` — a boolean written to the number column, or the same value both ways.
- The box shows checked when the encounter's `hide_defeated` is 1 — flag shown inverted.

**Hand-off items for the human tester** (the native host only; a session cannot drive them):

[MANUAL-VERIFY] Hide defeated stays on after leaving the encounter and restarting the Tauri app, and so do HP, defeated marks and removals (AC 21, AC 23).
[MANUAL-VERIFY] On two paired devices, an action on one shows the same HP, defeated marks and removals on the other after a sync (AC 25).

[MANUAL-VERIFY] In the browser pane: with one defeated combatant between two others, Hide defeated hides it, a selected defeated combatant loses its selection on hiding, and unchecking brings it back between its neighbours.
[MANUAL-VERIFY] In the browser pane, with a hidden defeated and a removed combatant in the queue, dragging a shown entry past them leaves both in place: after unhiding, the hidden one sits where it was.

## Documentation edits (`app/docs/features/encounter-queue.md`)

The page keeps its structure and describes the screen after this slice. Edits:

| Section | Stale statement | Required state |
| --- | --- | --- |
| Purpose | HP actions, defeated marks and selection "follow in later slices" | this is the second of six slices; selection, HP actions and defeated marks are built, the Log tab, group actions, ad-hoc combatants and events follow |
| How it works | step 1 "a sidebar with a single 'Add' heading over the Add tab" | a sidebar with Add and Actions tabs, Hide defeated under the queue |
| How it works | step 6 "at current HP 0 or below, or at max HP 0 or below, the image turns grey instead" | step 6 gains: a defeated combatant's image is grey whatever its HP, in place of the red tint, and unmarking brings back its colours and the tint its HP gives |
| How it works | step 5 "in this slice" HP wording, step 9 "Nothing shows the log yet" | step 5 unchanged in meaning; steps added for selection, the seven actions, the grey defeated image, removal, Hide defeated, and the log entry each action writes; the log still has no display |
| Failure | only the Add pending guard | add: every action button disabled while an action write is pending; a refused second action; Escape clears the selection also when it closes a dialog |
| Data | Reads without the log; "Columns with no reader yet" lists `hide_defeated`; "Derived, not stored" says current HP equals max HP | add the log entries read; `hide_defeated` read and written; HP, max, temp, defeated, removed derived from the log |
| Rules | the rows beginning "The screen shows three columns", "Each queue entry shows", "The image of a combatant that has lost HP", "The queue's HP comes from", "The red tint and `+temp` are unit-tested", "The log payload module exports only", "Only the Add tab exists", "A click on a queue entry does nothing", and "Dragging a queue entry" | rewrite each to the state after this slice (an Add and Actions sidebar of browser-style tabs; tint, `+temp` and grey hand-checked now; the derivation reads the log; the payload module exports `readLogEntry`; selection exists; the drag keeps hidden and removed items in place) |
| Rules | no row for this slice's decisions | add one row for each of rows 1 to 18 and 21 to 25 of the story's Decisions table (`.claude/cycles/2026-10-29-encounter-actions-lead/01-lead-story.md`; rows 19, 20, 26 and 27 concern the spec and its structure, not the screen), same wording and source |
| Where to look | lists of files and tests | add `readLogEntry`, `parseActionAmount`, the log's `get-all-by-encounter`, `encounterLogEntryService`, `useEncounterLogEntries`, `useEncounterQueueEntries`, `useEncounterSelection`, `EncounterSidebar`, `EncounterCombatantActionsTab`, `getActionAvailability`, and their tests; `EncounterAddSidebar` becomes `EncounterSidebar`; `buildQueueEntries` and `describeQueueEntryHp` sit in `screens/encounter/helper/` |
