# Encounter random combatants, events and Duplicate with the queue

The encounter screen's queue gains two kinds of item beside entity combatants: random combatants (a typed name, an optional HP, no entity) and events (a name and notes), both added from a new Entities / Other switch of the Add tab. Both take part in selection, drag, Remove and Revert, and Duplicate copies the whole queue at full HP. There is no migration and no new column. The sub-features are listed in the order to implement them; each leaves every `every check` row passing, so none is a Foundation sub-feature.

Decisions are cited by id: `C<n>` is challenge n, `Alt <letter>` an alternative, `case` the "Case For It" section and `brief` the "Refactoring brief" of `.claude/cycles/2026-10-30-encounter-adhoc-events-lead/02-architect-verdict.md`; `row <n>` is a row of the Decisions table of `.claude/cycles/2026-10-30-encounter-adhoc-events-lead/01-lead-story.md`, which also holds the acceptance criteria.

- Sub-feature 1: Domain: queue item name, event name, random combatant HP — [SPEC_ENCOUNTER_ADHOC_EVENTS_SF1.md](SPEC_ENCOUNTER_ADHOC_EVENTS_SF1.md)
- Sub-feature 2: Database: create-many shapes, duplicate by encounter — [SPEC_ENCOUNTER_ADHOC_EVENTS_SF2.md](SPEC_ENCOUNTER_ADHOC_EVENTS_SF2.md)
- Sub-feature 3: Services: random combatants, events and Duplicate with the queue — [SPEC_ENCOUNTER_ADHOC_EVENTS_SF3.md](SPEC_ENCOUNTER_ADHOC_EVENTS_SF3.md)
- Sub-feature 4: Data access layer: one add mutation for three kinds — [SPEC_ENCOUNTER_ADHOC_EVENTS_SF4.md](SPEC_ENCOUNTER_ADHOC_EVENTS_SF4.md)
- Sub-feature 5: Queue entries as a union: naming, entries, event tile, Actions tab — [SPEC_ENCOUNTER_ADHOC_EVENTS_SF5.md](SPEC_ENCOUNTER_ADHOC_EVENTS_SF5.md)
- Sub-feature 6: Middle column: shown item dispatch, event view, shared notes — [SPEC_ENCOUNTER_ADHOC_EVENTS_SF6.md](SPEC_ENCOUNTER_ADHOC_EVENTS_SF6.md)
- Sub-feature 7: Add tab: Entities / Other switch, random combatant and event forms — [SPEC_ENCOUNTER_ADHOC_EVENTS_SF7.md](SPEC_ENCOUNTER_ADHOC_EVENTS_SF7.md)
- Sub-feature 8: Documentation: feature page, glossary, domain scaffold — [SPEC_ENCOUNTER_ADHOC_EVENTS_SF8.md](SPEC_ENCOUNTER_ADHOC_EVENTS_SF8.md)

## Key Architectural Decisions

### Random combatants and events are rows of the one queue table

Both live in `encounter_queue_items` with the one `sort_order`; `kind` already takes `event` and the columns they leave empty are nullable, so there is no migration, no `SYNC_PROTOCOL_VERSION` change and no sync work (`case`; Alt A, events in a table of their own, was rejected).

### Queue entries are a union on `kind`

`buildQueueEntries` returns combatant entries and event entries as one discriminated union, so no consumer re-asks whether a nullable HP field means an event, and Hide defeated tests the kind (C6).

### Events never number, and random combatants number by their exact typed name

An event is named by `shownEventName` and kept out of both numbering passes; a random combatant is keyed by its stored `name`, exact and case-sensitive, and stored trimmed (C1, rows 12, 13).

### A combatant whose entity was deleted numbers with the random combatants of its name

Deleting a base entity empties `base_entity_id` and keeps the stored `name`, so such a combatant is a `combatant` item with a null entity and a name, exactly the shape of a random combatant. `shownCombatantNames` already keys it by `[false, name]`, and `addRandomCombatants` filters on `kind` `combatant`, `base_entity_id` null and the same name, so the display key and the numbering key agree and the two read as siblings ("Goblin 1", "Goblin 2"). The alternative, a column telling the two apart, is excluded by "no new column".

### One name rule serves custom names, event names and typed names

`normalizeCustomName` is renamed `normalizeQueueItemName`, with its test, in the same sub-feature as all five files that name it (C9).

### A random combatant's HP is parsed by its own function

`parseRandomCombatantHp` over `parseWholeNumberInput` tells empty from invalid from a number, and the HP field is a text input with numeric input mode, because a number input reports unparsable text as `''` (row 20).

### The HP field accepts what the shared whole-number parser accepts

`parseWholeNumberInput` reads `'1e3'` as 1000, `'1.'` and `'5.0'` as 1, `'+5'` and `' 5 '` as 5, `'0x10'` as 16 and `'-1'` as -1, and rejects `'abc'`, `'1.5'`, `'.5'` and `'1e400'` [spec-writer_3: ran `npx vitest run` on a scratch test in `app/domain/encounters/__tests__/` calling `parseWholeNumberInput` on those strings and throwing the results — observed `{"valid":true,"value":1000}` for `1e3`, `{"valid":true,"value":1}` for `1.`, `{"valid":true,"value":16}` for `0x10`, `{"valid":true,"value":-1}` for `-1`, `{"valid":false}` for `abc`, `1.5`, `.5` and `1e400`; scratch deleted]. The HP field keeps the one parser the amount fields use (row 8), so it accepts `'1.'` and `'0x10'` as the numbers they parse to and rejects a negative through the 0-or-more check; a stricter text grammar would be a second parser for one fact.

### One append path with three entry points

The refusal of a second add, the sort-order read and the `added` write live once in the service (`appendQueueItems`) and once in the hook (one mutation, one `add` function over a discriminated variables union) (C16).

### Every add shares one key, refreshes the log and stays pending until both refetch

`encounterKeys.addCombatants` becomes `addQueueItems`; a resolved add invalidates the queue and the log and returns both promises, so every Add button of the encounter stays disabled until the queue and the log show the new rows and the `added` line (C3, C2, rows 15, 24).

### An event's rename writes `name` through a widened update type

`UpdateQueueItemData` becomes `Pick<…, 'custom_name' | 'name' | 'notes'>` and only the event name field passes `name`; a SQL-limited operation was rejected for its second autosave queue (C8, row 14; Alt B and Alt D were rejected).

### A blank event name is stored as null, shown as `Untitled Event` and never put in the field

The field keeps what the GM typed (`name ?? ''`), shows the fallback as a placeholder, restores nothing on blur, and `normalizeQueueItemName` turns blank into `null` before the write (C10, rows 13, 27).

### The Add tab is a switch container over three mounted panels

`EncounterAddTab` holds `source` and `otherKind` in `useState`; the Entities panel and both forms stay mounted and are hidden with the `hidden` attribute, so drafts and the search text survive every switch; the inner switch mounts only while Other is open (C5, rows 1, 6, 7, 26).

### The sidebar is keyed by the encounter id

`EncounterScreen` renders `<EncounterSidebar key={encounterId} …>`, so a duplicated encounter opens on Entities and Event with empty fields (C4, row 21).

### Enter submits through `onKeyDown`

No `<form>` exists in `app/src` [spec-writer_12: `grep -rn "<form" app/src --include=*.tsx` — not found; the same search for `onKeyDown` returns files, so it can return a result], and implicit submission through the shared `Button` is unverified in jsdom and in this app's wrappers, so each field's `onKeyDown` calls the add guarded by the same `canAdd` as the button (C12, row 11).

### Quantity logic is one hook and one input

`useAddQuantity` and `EncounterQuantityInput` live as peers inside `EncounterAddTab/`, the nearest ancestor of both consumers `EncounterAddRow` and `EncounterAddRandomCombatant` (C11).

### An event draws as an icon tile in the image's place

The tile is an `ImagePlaceholderFrame` holding `BellRingIcon`, sized from one constant `QUEUE_ENTRY_IMAGE_SIZE` that the combatant image also reads; the frame takes its dimensions as a prop, as `EncounterEntityImage` does, so the size reaches it in TypeScript and the CSS custom property the brief names is not needed. The icon is half the tile (`QUEUE_ENTRY_IMAGE_SIZE / 2`), a choice no existing pattern covers (rows 2, 3, brief).

### The Actions tab lists combatants and names the events Remove also takes

The rows, the amount hook and the shared field see combatants only; `planGroupAction` takes a `PlanRow` union so an event never blocks or receives an amount; a muted line names the selected events in queue order (C7, rows 4, 22).

### The middle column dispatches on the entry's kind

`EncounterShownItem` owns the hint, the keyed scroll container and the dispatch between `EncounterShownCombatant` and `EncounterShownEvent`; `EncounterItemNotes` takes the placeholder, and the heading-sized name-field rule lives once in `EncounterShownItem.css` for both name fields (brief, rows 5, 17).

### Duplicate derives the full-HP maximum, then copies

`encounterService.duplicateEncounter` creates the encounter, then `encounterQueueService.duplicateQueue` derives each kept item's max HP from the source's log and `duplicateByEncounter` copies the rows with that max as `starting_max_hp`; there is no transaction and a failure part-way leaves a partial copy, as the platform allows (C13, rows 18, 19).

### Duplicate copies the stored state

A rename or note typed within about 500 ms before Duplicate is not in the database yet and is not copied; the encounter's own autosaves have the same window (C14, row 23).

### The add error's message covers events

`encounterQueueAddError` now covers an event Add, so its message drops the word "combatants" (`Failed to add to the encounter queue`); the error name stays, as no caller narrows by message. The two assertions that name the old message are updated in sub-feature 3.

### Instruction-file gaps stay with a refine pass

The stale entries listed under CLAUDE.md impact are not edited in this branch (row 25, brief).

## CLAUDE.md impact

- `app/CLAUDE.md` — Domain Glossary, entry "Queue item" ends "only the schema knows `event` so far", and entry "Combatant" says it is "made from a Base entity (`base_entity_id`, emptied when that entity is deleted)" [spec-writer_9: `grep -n "only the schema knows\|made from a Base entity" app/CLAUDE.md` — found on lines 69 and 70]. After this branch events are created and read by the queue, the Add tab and the middle column, and a random combatant is a `combatant` item with no Base entity from its creation, so both entries misdescribe the app; the "Queue item" entry also owes the `name` column its new reader, an event's own name.
- `.claude/rules/src-data-access-layer.md` — the rule beginning "A mutation whose pending state other components read" names `encounterKeys.addCombatants(encounterId)` in its prose and again in its GOOD example, which also places the call-time guard "in `addEntityCombatants`" [spec-writer_9: `grep -n "addCombatants" .claude/rules/src-data-access-layer.md` — found on lines 38 and 39]. The branch renames the key to `encounterKeys.addQueueItems` and moves the guard into one `add` function of `useEncounterQueueItems` that the three add functions share, so after it neither name resolves.

No other CLAUDE.md or rules file names a path, module or example this branch moves: `.claude/rules/src-unit-tests.md` names `EncounterAddTab/__tests__/EncounterAddTab.test.tsx` as a test that mocks `@db/_settings`, and the rewritten test still does [spec-writer_9: `grep -n "EncounterAddTab.test.tsx" .claude/rules/src-unit-tests.md` — found on line 23]. The long-living reference `app/docs/_product/domain-scaffold.md` is edited in sub-feature 8. No toolchain fact established while writing this spec generalizes beyond it, and the testing-policy exemption applies only to components whose criteria no component test can pin (the notes editors, whose typing jsdom does not carry: `.claude/knowledge/lexical.md:269`), so no testing-policy gap is recorded.
