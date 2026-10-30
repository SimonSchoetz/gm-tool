# Sub-feature 8: Documentation: feature page, glossary, domain scaffold

The feature page covers the sixth slice, the glossary names the new terms, and the domain scaffold's encounter bullet describes the middle column and the Add tab as they are after sub-features 5 to 7. These are not instruction files (`app/docs/CLAUDE.md` — Spec Format Extension, domain scaffold; the feature page and glossary are plain documents), so they are edited in this branch.

## Files affected

Modified:

- `app/docs/features/encounter-queue.md`
- `app/docs/glossary.md`
- `app/docs/_product/domain-scaffold.md`

## Documentation

Line numbers are those of the files at commit 8447bb15 [spec-writer_8: `grep -n` of each quoted phrase below in `app/docs/features/encounter-queue.md` and `app/docs/glossary.md` — found at the lines named; `app/docs/_product/domain-scaffold.md` read through whole].

`app/docs/features/encounter-queue.md`. The page keeps its structure (How it works, Failure, Where the user waits, Data, Rules, Open points, Where to look); each new Rules row carries the Why and the Source the story's Decisions table gives for the decision and names the test that pins it or says it is hand-checked.

- Purpose (line 3): the page now covers all six slices; the sentences "Ad-hoc combatants and encounter events follow in the last slice, and no release ships before all six are merged" and "the first five of six slices" are replaced by a sentence for the sixth slice: random combatants, encounter events and Duplicate with the queue.
- How it works, new steps after step 28, each a statement of the acceptance criteria that is not already a step: the Entities / Other and Event / Random Combatant switches and their start values; the random combatant form (name, HP, quantity, Add disabled while the name is blank, the HP is not empty or a whole number of 0 or more, or the quantity is invalid; Enter adds); the event form; the `Added` log lines for both; numbering of random combatants and that events are never numbered; the event queue entry (icon tile, no HP, no tint, never hidden by Hide defeated); the event view in the middle column (name field `Event name`, notes `Event notes...`, `Untitled Event` for a blank name, a rename and notes write no log entry); events taking part in selection, drag and order; the Actions tab with events (the muted `Remove also removes:` line, events-only selection); Remove and Revert for events; Duplicate copying the queue at full HP with an empty log.
- Edited steps: step 1 (line 11) says "the shown item's view" and that the Add tab is open on its Entities switch when the encounter opens; step 2 (line 12) places the entity list under the Entities switch; step 11 (line 21) says the shared field shows with two or more selected combatants, events never counting, and describes the events-only case; step 15 (line 25) says Remove takes every selected item, events included; step 23 (line 33) reads `Click an entry in the queue to show it here.`.
- Failure (lines 40 to 51): the pending-Add bullet names the two new Add buttons; a bullet "A Duplicate within about 500 ms of the last keystroke of a rename or note copies the stored state without that edit"; a bullet that a failure part-way through Duplicate leaves the new encounter with part of its queue.
- Where the user waits (line 53): "the Add tab shows the loading icon until the adventure's entities have loaded" becomes: the Entities panel shows the loading icon until the entities have loaded, and the switch and both forms never wait.
- Data: the Reads bullet names the source encounter's queue and log for Duplicate; the Writes bullet names the random combatant and event rows (`kind`, typed `name`, `sequence_number` for a random combatant only, `starting_max_hp` when an HP is typed) and the copied rows of Duplicate; "Columns with no reader yet" (line 59) is rewritten because `event` now has a reader and a writer; Sync (line 60) drops "Duplicating an encounter does not copy its queue in this slice" and says the copied queue syncs as other rows do.
- Rules: new rows for each decision of the story's Decisions table that the code carries (rows 1 to 24 and 26, 27), and these existing rows change: line 70 (Duplicate "behaves as before": it now copies the queue), lines 126 and 153 (the Add tab is open when the encounter opens: on Entities), line 164 (Remove "every selected combatant": every selected item), line 248 (the hint's wording), line 277 (`normalizeCustomName` is now `normalizeQueueItemName`, `customName.test` is `queueItemName.test`).
- Where to look (lines 287 to 292): the Domain bullet adds `normalizeQueueItemName` in place of `normalizeCustomName`, `shownEventName` and `parseRandomCombatantHp`; the Database bullet adds `duplicateByEncounter`; the Services bullet adds `addRandomCombatants`, `addEvent` and `duplicateQueue`; the Screens bullet replaces `EncounterShownCombatant` with `EncounterShownItem` (with `EncounterShownCombatant`, `EncounterShownEvent`, `EncounterEventNameField` and `EncounterItemNotes` in place of `EncounterCombatantNotes`) and replaces the `EncounterAddTab` and `EncounterAddRow` entries with `EncounterAddTab`, `EncounterAddEntities`, `EncounterAddRow`, `EncounterAddRandomCombatant`, `EncounterAddEvent`, `EncounterQuantityInput` and `useAddQuantity`, and adds `EncounterQueueEventTile` and `buildPlanRows`; the Tests bullet replaces `customName.test` with `queueItemName.test` and adds every test file of sub-features 1 to 7.
- The Open points paragraph about the migration head is unchanged and stays true: this slice adds no migration.

`app/docs/glossary.md`.

- `Queue item` (line 18): drops "Slice 1 of the encounter screen creates only combatants" and says an event and a random combatant are queue items too, an event's `name` being its own and a random combatant's being the typed name with no base entity.
- `Combatant` (line 19): a combatant is made from a base entity by an Add or is a random combatant with a typed name and an optional HP.
- New entries `Random combatant` and `Event` (an encounter event: a queue item with a name and notes, no HP and no numbering, drawn with an icon tile), placed after `Combatant`.
- `Sequence number` (line 21): a random combatant is numbered among combatants of the same typed name; an event has none.
- `Encounter sidebar` (line 23): the Add tab starts with the Entities / Other switch and Other holds the Event / Random Combatant switch with the two forms.
- `Selection` (line 29) and `Shown combatant` (line 30): the selection holds queue entries of both kinds; `Shown combatant` is renamed `Shown item` and covers an event's view (name field and notes, no HP, no entity view).
- `Shared amount` (line 37): events never count towards the two selected combatants that show it.

`app/docs/_product/domain-scaffold.md`. Only the `screens/encounter/` bullet of Detail Screen Composition (line 241) changes: "the shown combatant's view" becomes "the shown item's view (`EncounterShownItem`, a combatant's or an event's)", and the tabbed sidebar clause says the Add tab opens with an Entities / Other switch. The file was read through whole: no other statement in it (the naming table, the shared columns, the layer patterns, the routes, the customization points) is about the encounter screen's queue, middle column or sidebar, so nothing else changes.

## Verification

None for a mutation run: no production source changes here. After the edits run `pnpm run markdown-lint` from the repository root and re-align a reported table with `pnpm run markdown-fix`, never by hand.
