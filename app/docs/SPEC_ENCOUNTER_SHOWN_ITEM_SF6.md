# Sub-feature 6: Combatant notes

The shown combatant's view gains its own notes editor. The notes belong to the queue item, not to the entity, and save through `updateQueueItem` from sub-feature 1.

## Files affected

New:

- `app/src/screens/encounter/components/EncounterShownCombatant/components/EncounterCombatantNotes/EncounterCombatantNotes.tsx`
- `app/src/screens/encounter/components/EncounterShownCombatant/components/EncounterCombatantNotes/EncounterCombatantNotes.css`

Modified:

- `app/src/screens/encounter/components/EncounterShownCombatant/EncounterShownCombatant.tsx` — render `EncounterCombatantNotes` after `EncounterCombatantHp`, keyed by the queue item id, importing it by `./components/EncounterCombatantNotes/EncounterCombatantNotes` (a single-file module has no `index.ts`: it holds its main file and its stylesheet only).

## Frontend

`EncounterCombatantNotes` — Purpose: the notes of this combatant only: Goblin 3's notes are not Goblin 1's and do not appear on the Goblin entity. Props: `{ shownItemId: string }`.

Behavior:

- It reads `encounterId` with `useParams` and calls `useEncounterQueueItems(encounterId)` for `queueItems` and `updateQueueItem`, finds its item in `queueItems`, and renders nothing when the item is not there.
- It renders a `TextEditor` with the placeholder "Combatant notes...", a `textEditorId` that contains the queue item id (the editor remounts on it), `value` the item's `notes ?? ''` (the empty string is the editor's "nothing shown" at this boundary, as in `EncounterNotes`), and `onChange` calling `updateQueueItem(item.id, { notes })`. The editor takes text and @mentions as the app's other notes editors do. No log entry is written: the write is a queue item update only.
- The editor has no fixed height, so it grows with its text inside the shell's scroll container.

UI / Visual: a `GlassPanel` with `intensity='bright'` and the class `encounter-combatant-notes` around the editor, with `padding: var(--spacing-sm)`, `padding-left: 0` (the editor's own gutter is the left padding) and `border-radius: var(--radius-lg)`. These three declarations also exist in `EncounterNotes.css` under `.encounter-notes`; the two copies are intended, because each component owns its stylesheet, `styles/` holds variables and globals only (`.claude/rules/src-css.md`), and `EncounterNotes` and its fixed-height CSS stay untouched.

## Tests — behaviours and the defect each catches

None. The component is a React component, which the testing policy forbids a test for unless its own event handling decides an acceptance criterion; here the save is decided by the `TextEditor` runtime, and a test cannot assert what a user typing into `TextEditor` saves, because the typed text never enters the editor state under jsdom (`.claude/knowledge/lexical.md`, the entry beginning "Typing into `TextEditor` with user-event under jsdom"). The write itself is pinned in sub-feature 1 (`useEncounterQueueItems.test.ts`).

## Verification steps

[MANUAL-VERIFY] In web mode, add three Goblins, click the third and type "hello" in the notes editor. Click the first Goblin: its notes editor is empty and shows the placeholder "Combatant notes...". Click the third again: "hello" is there. Open the Goblin entity's own screen: its description does not contain "hello". The Log tab has no new line from the edit.

[MANUAL-VERIFY] In web mode, type enough lines into the notes to pass the column's height: the notes panel grows with each line and the column below the global notes scrolls as one area, with no second scrollbar inside the notes panel.

[MANUAL-VERIFY] In web mode, click a combatant, put the caret in its notes, type "@" so the entity list opens and press Escape: the list closes, the middle column still shows the combatant and its queue entry keeps the selected highlight. Press Escape again with the caret in the notes: the combatant is still shown. Click a blank part of the screen outside every editor and press Escape: the middle column reads "Click a combatant in the queue to show it here." and no queue entry is highlighted. (The first Escape never reaches the document's listener, because the editor's menu stops it [spec-writer_17: `app/node_modules/@lexical/react/src/shared/LexicalMenu.tsx:536-548` — `event.stopImmediatePropagation()`]; the second is the case the exemption in sub-feature 2 decides.)

[MANUAL-VERIFY] Hand-off to the human tester, since an agent session cannot restart the native app or pair devices: in `pnpm run dev`, write a note, leave the encounter, restart the app, reopen the encounter and click the combatant: the note is there; on a paired device the same note shows after a sync.

Quitting within about 500 ms of the last keystroke loses that edit, as it does for Hide defeated; the feature page in sub-feature 8 says so.
