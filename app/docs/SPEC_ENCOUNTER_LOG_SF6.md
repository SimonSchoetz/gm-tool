# Sub-feature 6: Log tab: selection rule, sidebar tab, entries with Revert and Delete

The sidebar gets a third tab, Log, that lists every log line with its time and a hover Revert or Delete. The composer joins the tab in sub-feature 7.

## Files affected

Modified:

- `app/src/screens/encounter/hooks/useEncounterSelection.ts` — `SidebarTab` gains `'log'`; `select` becomes `setActiveTab((tab) => (tab === 'add' ? 'actions' : tab))` where it now calls `setActiveTab('actions')` unconditionally [spec-writer_22: `app/src/screens/encounter/hooks/useEncounterSelection.ts:44-47`]
- `app/src/screens/encounter/hooks/__tests__/useEncounterSelection.test.ts` — one new test; the existing "selects the id and switches to the Actions tab" starts on Add and stays valid
- `app/src/screens/encounter/components/EncounterSidebar/EncounterSidebar.tsx` — the `TABS` entry and the third panel
- `app/src/screens/encounter/components/EncounterSidebar/__tests__/EncounterSidebar.test.tsx` — new assertions; its existing mocks already serve the three reads the tab makes [spec-writer_30: `EncounterSidebar.test.tsx:32-36` mocks the base-entity, encounter, log-entry and queue services]
- `app/util/index.ts` — `export { getTimeString } from './getTimeString';` (explicit named, as its siblings), first consumed by `EncounterLogEntry`

New (under `app/src/screens/encounter/components/EncounterSidebar/components/EncounterLogTab/`):

- `EncounterLogTab.tsx`, `EncounterLogTab.css`, `index.ts` (explicit `export { EncounterLogTab } from './EncounterLogTab';`, since `components/` is hidden behind it)
- `components/EncounterLogEntry/EncounterLogEntry.tsx`, `EncounterLogEntry.css` and `__tests__/EncounterLogEntry.test.tsx` (no `index.ts`: one source file, its stylesheet and tests)

Wiring from earlier sub-features: this sub-feature reads `useEncounterLogLines` and `LogLine` (4), `deleteLogMessage` (3) and the `revert` kind (1).

## Frontend

### EncounterSidebar (modified)

- Purpose: host the Log tab. Behavior: `TABS` gains `{ id: 'log', label: 'Log' }` after Actions; a third `EncounterSidebarPanel` with `aria-label='Log'`, `hidden={activeTab !== 'log'}`, holds `<EncounterLogTab isOpen={activeTab === 'log'} />`; panels stay mounted when hidden as the other two do [spec-writer_23: `EncounterSidebar.tsx:32-40`]. UI / Visual: the tab row draws three tabs as it draws two.

### EncounterLogTab (new)

- Purpose: show the encounter's log, oldest at the top, scrolled to the newest entry.
- Behavior: takes `isOpen: boolean` and reads `useEncounterLogLines()`. The list area shows the loading icon in a `content-center` block while `loading`, as `EncounterAddTab` does [spec-writer_26: `app/src/screens/encounter/components/EncounterSidebar/components/EncounterAddTab/EncounterAddTab.tsx:35-39`], "No entries yet." with no lines, and otherwise a `ul` of `EncounterLogEntry` keyed by line id; the scrolling container renders in every case, so the ref is always set. A `useLayoutEffect` with dependencies `[isOpen, lastLineId]` (`lastLineId` is `lines.at(-1)?.id ?? null`, a `const` declared before the effect) sets the list's `scrollTop` to its `scrollHeight` when `isOpen`, with the comment that a hidden panel has no scroll height and the open tab must paint at the bottom. [Inline rationale: see the root file's "The Log panel stays mounted and scrolls on open".]
- UI / Visual: the root fills the panel (flex column with a gap, `flex: 1`, `min-height: 0`); the scrolling container takes the remaining height, and the `ul` has `margin`, `padding` and bullets reset as `encounter-add-tab-list` does.

### EncounterLogEntry (new)

- Purpose: one line, bubble or unreadable marker, with its time and its button.
- Behavior: takes `line: LogLine`. It reads the route's `encounterId` with `useParams` and `recordLogEntry`, `deleteLogMessage` and `isRecording` from `useEncounterLogEntries(encounterId)`. An automatic line shows its text, inside `<del>` when `isReverted`; a message line shows a read-only `TextEditor` (`textEditorId` `log-entry-<id>`, `value` the line's `editorState`); an unreadable line shows "Unreadable entry". Revert (`Button`, label "Revert") renders only for an automatic line with `isRevertible` and calls `recordLogEntry('revert', { entryId: line.id })`; Delete (`Button`, label "Delete", `buttonStyle='danger'`) renders only for a message line and calls `deleteLogMessage(line.id)`. Both are `disabled={isRecording}`, ask for no confirmation, and are always rendered when allowed. The time is `getTimeString(line.createdAt)` from `@util` in a `<time>` element.
- UI / Visual: the root is an `li` with a block class, a modifier for the line kind and a modifier when reverted. Automatic lines are compact and muted; a reverted line is struck through and muted; a message is a bubble (surface background, border, radius) in normal text colour. The time sits at the row's right, the buttons left of it, hidden with `visibility` until the row is hovered. Tokens come from `styles/variables/` (those `EncounterCombatantActionsTab.css` and `EncounterSidebarPanel.css` use); a raw value is reported to the user after the task, not added as a token. Class-name literals jsdom cannot observe carry the `// Stryker disable next-line StringLiteral` comment the Testing Policy prescribes.

## Behaviours and their defect

- `useEncounterSelection.test.ts`: a selection moves the Add tab to Actions and leaves Actions and Log where they are. Defect: a click on a queue entry pulling the GM out of the log.
- `EncounterSidebar.test.tsx`: the tabs are Add, Actions and Log in that order, and the Log panel is exposed to the accessibility tree only after the Log tab is clicked, which reports `'log'`. Defect: a missing, misplaced or always-open Log tab.
- `EncounterLogEntry.test.tsx` (mocks `@services/encounterLogEntryService` and `useParams` as `EncounterCombatantActionsTab.test.tsx` does; a message line's read-only `TextEditor` needs no provider or mock under jsdom, given a valid serialised state with one paragraph [spec-writer_24: ran `npx vitest run src/components/TextEditor/__tests__/scratch.test.tsx` in `app/` — a test rendered `<TextEditor value={…} textEditorId='log-entry-1' readOnly />` bare and found its paragraph text; scratch deleted]): a click on Revert records one `revert` entry naming the line's id and shows no confirmation. Defect: a wrong payload or a second write.
- A click on Delete deletes the message's id once. Defect: the wrong id.
- Revert and Delete of one line are disabled while another line's write is pending. Defect: a per-instance pending state, which allows a double revert.
- A reverted line is struck through and has no Revert. Defect: an entry reverted twice.
- An unreadable line reads "Unreadable entry" with a time and no buttons. Defect: Revert or Delete on an entry the app cannot read.
- A message line has no Revert and an automatic line has no Delete. Defect: a delete path for the automatic record.

[MANUAL-VERIFY] In web mode with enough Damage actions to overflow the list, switch from Actions to Log: the last line is fully visible at the list's bottom edge without scrolling.

[MANUAL-VERIFY] In web mode, put the pointer over a Damage line: a Revert button shows in that row and in no other; moving the pointer off hides it. Clicking it strikes that line through and mutes it, removes its button, and adds a last line starting "Reverted: " followed by the reverted line's text (reasoned from the line format, not run).

[MANUAL-VERIFY] In web mode, remove the second of three combatants and click Revert on its "Removed" line: the queue lists three entries and the restored one is second, unselected (reasoned from the unchanged queue order, not run).

[MANUAL-VERIFY] In web mode, the three tabs Add, Actions and Log show in that order, none clipped.

## Verification

After the check rows pass and before the commit, run `pnpm run mutation-check -- app/src/screens/encounter/hooks/useEncounterSelection.ts app/src/screens/encounter/components/EncounterSidebar/EncounterSidebar.tsx app/src/screens/encounter/components/EncounterSidebar/components/EncounterLogTab/components/EncounterLogEntry/EncounterLogEntry.tsx` from the repository root and resolve every survivor.
