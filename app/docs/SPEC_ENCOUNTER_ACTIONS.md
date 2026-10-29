# Spec: Encounter screen, Slice 2 — Actions tab and combat log storage

Branch `feat/encounter-actions`. The GM selects a combatant in the encounter queue and damages, heals, sets temp or max HP, marks it defeated or removes it; each action is one combat log entry, and the queue's HP, defeated mark and removals are derived from the entries. Ground documents: the story `.claude/cycles/2026-10-29-encounter-actions-lead/01-lead-story.md` (Decisions rows are cited as `row N`), the verdict `.claude/cycles/2026-10-29-encounter-actions-lead/02-architect-verdict.md` (Challenges are cited as `C<n>`), and `app/docs/_product/decisions/0001-encounter-combat-state.md` (the decision record).

## Progress tracker

- Sub-feature 1: Combat log read and derivation — the queue derives HP, defeated and removal from the log; reorder and numbering follow.
- Sub-feature 2: Selection and the tabbed sidebar — click-to-select, Escape, Add and Actions tabs, the Actions tab's row.
- Sub-feature 3: Recording a log entry — typed create, service and data-access write path with a refusing, refetch-long pending state.
- Sub-feature 4: Actions on the selected combatant — amount field, seven buttons, availability rules.
- Sub-feature 5: Hide defeated and documentation — the toggle, the feature page and the scaffold document.

No sub-feature is a Foundation sub-feature: each commits green under every `every check` row, with each new export created in the sub-feature that first imports it (`local/no-unused-exports` rejects an export nothing imports — observed for a type export and a function export alike [spec-writer_1: scratch `npx eslint` runs, `.claude/knowledge/eslint.md`]).

| File | Sub-feature |
| --- | --- |
| [SPEC_ENCOUNTER_ACTIONS_SF1.md](SPEC_ENCOUNTER_ACTIONS_SF1.md) | 1 |
| [SPEC_ENCOUNTER_ACTIONS_SF2.md](SPEC_ENCOUNTER_ACTIONS_SF2.md) | 2 |
| [SPEC_ENCOUNTER_ACTIONS_SF3.md](SPEC_ENCOUNTER_ACTIONS_SF3.md) | 3 |
| [SPEC_ENCOUNTER_ACTIONS_SF4.md](SPEC_ENCOUNTER_ACTIONS_SF4.md) | 4 |
| [SPEC_ENCOUNTER_ACTIONS_SF5.md](SPEC_ENCOUNTER_ACTIONS_SF5.md) | 5 |

## Key Architectural Decisions

### Event-sourced combat state

One `INSERT` per action; HP, defeated and removed are derived from the queue items and the encounter's log entries (decision record 0001, Option B).

### Payload shapes

`damage` and `heal` store `targets[{ queueItemId, amount }]`, `temp-hp` and `max-hp` store `targets[{ queueItemId, value }]`, `defeated`, `undefeated` and `removed` store `queueItemIds`; targets are lists even for one combatant, and no payload stores a resulting value (row 13, row 25, C7).

### Derivation contract

`deriveCombatState(items, entries)` returns per item max, current and temp HP, defeated and removed; an unreadable entry applies nothing and never throws; the reverted and unreadable outputs and the `revert` kind come with Slice 3 (row 14).

### Shared view-model

`buildQueueEntries` and `describeQueueEntryHp` live in `screens/encounter/helper/`, and `describeQueueEntryImage` in its own file in `EncounterQueueEntry/helper/`, and one hook, `useEncounterQueueEntries`, composes the reads for the queue, the Actions tab and the screen (C6).

### Reorder input

The drag handler passes the DAL's full ordered list to `reorderIds`, and `reorderIds` is unchanged (C4).

### Numbering filter order

Naming sees every non-removed item, hidden ones included, and the Hide filter runs after it (C5).

### Selection reconcile

The selection is cleared in state when its id leaves the shown ids, in one render-phase step (C3, row 8).

`useEncounterSelection` also takes the encounter id and resets the selection and the tab to `'add'` when it changes. TanStack Router keeps the screen mounted when only the route param changes (`.claude/knowledge/tanstack-router.md` — "A param change on the same route keeps the route component mounted"), and Duplicate navigates to the copy within the same route, so without the reset the copy would open on the Actions tab instead of Add (row 6).

### Both sidebar panels stay mounted

The inactive panel carries `hidden`; the container never renders only the active tab (C2).

### Amount owned by the Actions tab

The amount is `useState` in `EncounterCombatantActionsTab`, which stays mounted, never in the combatant row (C1, row 4).

### Amount parser

The amount field reads with `parseWholeNumberInput` through `parseActionAmount`, so `1e3` counts as 1000 (C14, row 24).

### Write on click

Actions write on click without the autosave delay (row 12).

### Typed create

`create` and `CreateEncounterLogEntryInput` are generic over the kind (C8).

### Pending covers the refetch

The record mutation's `onSuccess` returns the invalidation promise, so the action buttons stay disabled until the new numbers are shown (C9).

### Hide defeated saves through the autosave

The toggle writes through `updateEncounter`, about 500 ms after the click (C13, row 22).

### Escape clears the selection

A `document` keydown listener clears it, also when the press closes a dialog (C12, row 23).

### Click target is the entry root

The select handler is on the queue entry root, never on the drag handle (C11).

### A defeated combatant's image turns grey

A defeated combatant's queue entry is not dimmed; its image turns greyscale in place of the red damage tint, whatever its HP, and unmarking brings back its colours and the tint its HP gives; the grey is the one HP 0 or below already gives, and `describeQueueEntryImage` in `EncounterQueueEntry/helper/` decides it (row 15).

### The tabs look like browser tabs

The Add and Actions tabs are drawn like Chrome's tabs: the active tab joins the panel body below it with no line between, the inactive one sits behind it (row 17).

### Query keys stay outside `device*`

`encounterKeys.logEntries` is `['encounter-log-entries', encounterId]`, so the post-sync invalidation refetches it (C10).

### Tab container stays in the encounter screen

`EncounterAddSidebar` is renamed `EncounterSidebar` and hosts the tabs; nothing moves to `src/components/` (row 26).

### Component locations

`EncounterSidebarTabs` and `EncounterCombatantActionsTab` sit in `EncounterSidebar/components/`, because `EncounterSidebar` is their immediate JSX parent (`.claude/rules/src-components.md` — Sub-component ownership). The name `EncounterCombatantActionsTab` avoids reading as `EncounterActions`, the Duplicate/Delete component beside the queue.

### Tests for the composing hooks and the sidebar

`useEncounterQueueEntries` and `useEncounterLogEntries` each get a test file. The first derives a value (the `hide_defeated === 1` flag, entries withheld while any read loads), and `.claude/rules/src-unit-tests.md` requires a test for a hook in a `hooks/` folder that derives a value. The second holds the refusal guard that stops a double click writing damage twice, irreversible once stored, and no rule gives a plain-mutation data-access hook a test obligation (see CLAUDE.md impact). `EncounterSidebar` and `EncounterQueueEntry` get component tests for the tab and select behaviour their event handling decides. Each test file declares its own `vi.mock` set, because Vitest 5 throws on a `vi.mock` that is not at the top level of the file (`.claude/knowledge/vitest.md` — "Vitest 5 throws at transform time"), so a shared setup helper cannot hoist it; fixtures are shared through `src/__tests__/support/`.

### Sub-feature order

SF1 creates the seven payload schemas because `deriveCombatState` reads them; SF3 adds the write path and SF4 its only caller, so each export has an importer in the sub-feature that creates it. `useEncounterLogEntries.recordLogEntry` and `isRecording` are fields of a returned object, which the lint does not check; SF4 reads both (SF3 names this).

### Documents updated in this spec

`app/docs/features/encounter-queue.md` and `app/docs/_product/domain-scaffold.md` are edited in SF5; instruction files are not (row 19, row 27).

## CLAUDE.md impact

- `.claude/rules/src-unit-tests.md` — Component tests, the Render bullet, names `app/src/screens/encounter/components/EncounterAddSidebar/components/EncounterAddTab/__tests__/EncounterAddTab.test.tsx`; the branch moves that file to `…/EncounterSidebar/components/EncounterAddTab/__tests__/EncounterAddTab.test.tsx`, so the path no longer exists [spec-writer_8: `grep -rn EncounterAddSidebar .claude/rules` — found only `src-unit-tests.md:23`].
- `app/CLAUDE.md` — Domain Glossary, "Combat log entry", ends "Adding combatants writes an `added` entry"; after the branch every action writes a `damage`, `heal`, `temp-hp`, `max-hp`, `defeated`, `undefeated` or `removed` entry and the queue is derived from them [spec-writer_9: `grep -n "Combat log entry" app/CLAUDE.md` — found at line 71].
- `.claude/rules/src-data-access-layer.md` — Non-negotiable rules requires a test for a data-access hook with a deferred save, and for a plain `useMutation` hook names none, so `useEncounterLogEntries`' mutation-cache refusal guard (a second call in the same call stack writes nothing) has no owning test obligation; the branch tests it as `useEncounterQueueItems`' Add guard is tested, and the rule does not say why one guard needs a test and the other not [spec-writer_10: `.claude/rules/src-data-access-layer.md` — the test rule opens "A hook with a deferred save — one that calls `useAutosaveQueue` — has a test"].
- No rule states that a class setting `display` on an element carrying the `hidden` attribute defeats it, which the new sidebar panels rely on avoiding (`.claude/rules/src-css.md`, `.claude/rules/src-components.md`); the fact itself is in `.claude/knowledge/html.md`.
