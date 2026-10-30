# Sub-feature 8: Docs

The feature page, the long-living scaffold reference, the decision record, the glossary and three feature pages describe the middle column, the shown name and the content section panel; they change in the same branch. Each edit below states what the text must say afterwards; statements are located by their opening words, not by line number, because earlier edits shift lines.

## Files affected

Modified:

- `app/docs/features/encounter-queue.md`
- `app/docs/_product/domain-scaffold.md`
- `app/docs/_product/decisions/0001-encounter-combat-state.md`
- `app/docs/glossary.md`
- `app/docs/features/basic-stat-block.md`
- `app/docs/features/content-section-bodies.md`
- `app/docs/features/section-carousel-mention-click.md`

## `encounter-queue.md`

Every statement about the middle column, the shown name, the selection's Escape, the unread columns and the slice count is revised:

- Purpose paragraph: the page now covers five of six slices; the fifth shows the clicked combatant in the middle column with its editable combat name, read-only HP, own notes and its entity's editable content sections and description; ad-hoc combatants and encounter events follow in the last slice.
- How it works, step 1 (the sentence "The middle column holds the global combat notes at the top and is empty below them"): the middle column holds the global notes at the top and, below them, the shown combatant's view.
- Steps 4 and 8 and the rule row beginning "Renaming a base entity changes the shown name": a combatant the GM renamed keeps its own name when its entity is renamed or deleted.
- Step 10: a click, a Cmd/Ctrl-click that adds, and a Shift-click show the clicked entry; a Cmd/Ctrl-click that removes the shown entry leaves nothing shown and one that removes another entry leaves the shown entry; Escape clears the shown entry with the selection except while focus is in an editable element of the middle column; a removed or hidden combatant is no longer shown; reopening starts with nothing shown.
- New steps after the last: the hint "Click a combatant in the queue to show it here."; the name field (shows the queue's name; typing renames this combatant only, saved as typed, shown instantly by the queue, the Actions row and the Log lines without a number as the GM types, with the database write about 0.5 s later; the "Added" line keeps the entity's name; emptying the field, or typing exactly the automatic name, returns the automatic name; leaving or Enter restores the shown name; a renamed combatant still counts for its siblings' numbers); the HP and "Defeated" label and the three HP-not-set sentences; the combatant notes ("Combatant notes..."); the entity view and the deleted-entity case; the scroll layout, in which the content section panel shows unchanged, as on the entity screen (a section body keeps its own height and inner scroll), while the combatant notes and the description grow with their text.
- Failure: a quit within about 500 ms of the last keystroke in the name field or the notes loses that edit, as for Hide defeated.
- Data: Reads adds the entity's content sections for the HP-not-set sentence; Writes adds the rename (`custom_name`) and the notes per queue item through the autosave path, no log entry; "Columns with no reader yet" drops `custom_name` and `notes` and keeps the kind `event`; Derived adds that the shown name uses `custom_name` when set.
- Rules table: the rows beginning "A click on a combatant selects it; the middle column below the global notes is empty" and "The shown item is not built in this slice" are replaced by the shown-item rows below; the Escape rows (beginning "Selection is a set of combatants", "A click on a combatant selects only it, shows it as selected", "Escape clears the selection also when the same press closes a dialog", "Escape clears the anchor with the selection" and "Escape that cancels a drag also clears the selection") gain the middle-column exception; the row beginning "One helper, `nameQueueItems`" adds the automatic name; the row beginning "UI texts:" adds the new texts. Add one row per row 1 to 18, 22 and 23 of the Decisions table in `.claude/cycles/2026-10-30-encounter-shown-item-lead/01-lead-story.md`, in the page's Rule, Why and Source columns with that row's Decision, Why and Source text (a Why of "not recorded" stays; a text that names another row by number — rows 8, 15 and 23 — names that row's content instead, since the page has no row numbers; row 18's "about 0.5 s into typing" is replaced by row 23's wording, so one row states the rename timing: shown instantly as the GM types, database write about 0.5 s later), with the tests that cover each, plus rows for: `useEncounterQueueEntry`; `hpNotSetReason` in `domain/`; the Escape exemption by target and ref; `ScreensBaseEntityContentSectionPanel` promoted with a required entity id prop; the entry's `entity` field.
- Where to look: add `hpNotSetReason`, `updateQueueItem` (service and hook), `EncounterShownCombatant` with its sub-components, `useEncounterQueueEntry`, `isEditableWithin`, `ScreensBaseEntityContentSectionPanel`; add every new test file of sub-features 1 to 5 to the Tests bullet.

## Other documents

- `domain-scaffold.md`, Detail Screen Composition: the sentence naming `BaseEntityContentSectionPanel` names `ScreensBaseEntityContentSectionPanel` (`screens/components/`), which takes the entity id as a prop; the `screens/encounter/` bullet adds that the middle column holds the global combat notes in a fixed-height panel and, below them, the shown combatant's view in one scroll area.
- `0001-encounter-combat-state.md`: the "Shown name" bullet of Naming reads "`custom_name` when set, as typed and without a number; otherwise the entity's current name while an entity is linked; …" with the rest of its chain and the number rule applying to the derived name only; the Follow-ups bullet beginning "`BaseEntityContentSectionPanel` takes the entity id from the route" states that the component now sits in `screens/components/ScreensBaseEntityContentSectionPanel` and takes the id as a prop. Its Status stays Proposed.
- `glossary.md`: revise "Combatant" (adds the combat name and notes), "Shown name" (the rename first, without a number), "Global combat notes" (the shown combatant's view sits below) and "Selection" (Escape's exception); add "Shown combatant" (the selected entry whose view the middle column shows) and "Combat name" (the GM's rename of one combatant, stored as `custom_name`).
- `basic-stat-block.md` (Screens and components bullet), `content-section-bodies.md` (the "Screen:" bullet) and `section-carousel-mention-click.md` (the "Entity screen:" bullet): replace `BaseEntityContentSectionPanel` with `ScreensBaseEntityContentSectionPanel`. The path appears in no feature page [spec-writer_19: `grep -n "BaseEntityContentSectionPanel" app/docs/features/*.md` — found only the three component-name mentions above].

## Tests — behaviours and the defect each catches

None; documentation.
