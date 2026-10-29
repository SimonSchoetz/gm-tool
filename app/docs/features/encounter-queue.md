# Encounter queue

**Purpose.** The encounter screen holds a queue of combatants that the GM adds from the adventure's base entities, each showing its image, numbered name and HP, so the GM sets up a fight's order and HP on the encounter itself instead of tracking them outside the app. This is the first of six slices of the encounter screen (`_product/epics/encounter-screen.md`): it builds the combat tables and the first part of the screen on them. HP actions, defeated marks, the log tab, selection, the shown item's view, ad-hoc combatants and encounter events follow in later slices, and no release ships before all six are merged.

**Users.** The GM, as everywhere in the app.

## How it works

Happy path:

1. The encounter screen shows three columns. The left column holds the queue with Duplicate and Delete below it. The middle column holds the global combat notes at the top and is empty below them. The right column is a sidebar with a single "Add" heading over the Add tab.
2. The Add tab lists the adventure's base entities of every type by name, A to Z, each row with the entity's image (the image placeholder when it has none), its name, its type label, a quantity field and an Add button. Six boxes (NPC, Foe, PC, Faction, Location, Item) filter the list to the checked types, and none checked lists every type. The choice is saved on this device and survives leaving the encounter, opening another encounter and restarting the app. The search box narrows the list by name and description, name matches first.
3. The quantity starts at 1 and takes whole numbers from 1 to 99. Add puts that many combatants of the entity at the end of the queue and sets the quantity back to 1.
4. A combatant shows the entity's name. While an entity has one combatant in the encounter it reads "Goblin"; once a second exists both are numbered ("Goblin 1", "Goblin 2"), and further adds continue from the highest number the entity has in the encounter. A combatant of an unnamed entity reads "Untitled Combatant".
5. When the entity has exactly one stat block section (Basic or 5e) whose HP is a number, each new combatant starts with that number as its max and current HP, copied at the moment of the add. A queue entry shows `current / max`, followed by `+temp` when temp HP is above 0, and the entity's image beside them.
6. A combatant that has lost HP has its image tinted red from the bottom up, covering the share of max HP that is missing; at current HP 0 or below, or at max HP 0 or below, the image turns grey instead. A combatant whose HP is not set shows no HP text and no tint.
7. Dragging a queue entry by its handle moves it to the drop position, one entry at a time, and the new order survives leaving the encounter and restarting the app.
8. Renaming a base entity changes the shown name of its combatants in every encounter. Deleting a base entity keeps its combatants, shown with the name the entity had when they were added and the image placeholder.
9. Each Add also writes one `added` entry to the encounter's combat log naming the queue items it added. Nothing shows the log yet.

Failure:

- A quantity outside 1 to 99, or not a whole number, disables Add, and leaving the field puts back the last valid quantity.
- While an Add of the encounter is pending, every Add button of the encounter is disabled; a second Add call made in the same moment is refused, and a refused Add leaves the typed quantity as it was.
- If the `added` log entry cannot be written after the combatants were stored, the Add still counts as done and the error is swallowed, so a retry cannot add the same batch twice. The log entry is then missing.
- A failing read or write of the queue shows the app's error screen, as everywhere in the app.
- An adventure without base entities shows "This adventure has no entities yet." in the Add tab; a search without a match shows "No results found".

Where the user waits: the Add tab shows the loading icon until the adventure's entities have loaded; the screen shows the loading icon it showed before while the encounter loads. A drag reorder shows its new order at once, ahead of the write.

## Data

- **Reads:** the encounter's queue items; the adventure's base entities of all six types, from the same cached lists the entity list screens use, so any change to an entity refreshes the queue and the Add tab; an entity's content sections, at the moment of an Add, for the stat block HP; the per-device setting `encounterAddFilter`.
- **Writes:** one batch of queue items per Add, each with the encounter, the kind `combatant`, the entity, its name at that time, its sequence number, its starting max HP when the stat block gave one, and its position in the queue; one `added` entry in the combat log, its payload the list of queue item ids; a new position for every queue item on a reorder; the setting `encounterAddFilter`, a list of entity types.
- **Columns with no reader yet:** `custom_name`, `notes`, `hide_defeated` on the encounter and the kind `event` exist from this slice's migration on, because the epic has one migration; later slices read them.
- **Sync:** the queue items and the log entries sync to paired devices as other tables do, listed after the encounters. The setting is not synced. Duplicating an encounter does not copy its queue in this slice, and the copy takes the source's `hide_defeated`. Deleting an encounter deletes its queue items and log entries; deleting a base entity empties the entity link of its queue items.
- **Derived, not stored:** a combatant's current and temp HP are derived from its queue item (in this slice current HP equals max HP and temp HP is 0); the shown name is derived from the live entity.

## Rules

| Rule | Why | Source |
| --- | --- | --- |
| The screen shows three columns: the queue on the left with Duplicate and Delete below it, the global combat notes at the top of the middle column, and a right sidebar with an Add tab | The user story: set up the fight on the encounter screen | Simon Schötz, 2026-10-28; no test |
| The global combat notes are the encounter's existing description editor: text written before this change is still there and edits keep saving as before | Requirement N1 of the epic; nothing is lost or migrated | Simon Schötz, 2026-10-28; no test |
| The global combat notes sit in a fixed-height panel that scrolls, as the in-game view's notes panel of the session screen does | The same panel the app already has | Simon Schötz, 2026-10-28; no test |
| Duplicate and Delete below the queue behave as they did in the old left sidebar: Duplicate creates a new encounter named as before, Delete asks for confirmation and removes the encounter, its queue items included | Requirement D2 of the epic | Simon Schötz, 2026-10-28; the encounter `remove` test covers the queue items, the buttons and the confirmation no test |
| The Add tab lists the adventure's base entities of every type; each row shows the image (the placeholder without one), the name, the type label, a quantity field and an Add button | Requirements A1 and A3 of the epic | Simon Schötz, 2026-10-28; `EncounterAddTab.test` covers the list, the row's image no test |
| Typing in the Add tab's search narrows the list by name and description, name matches first | The entity list screens' search does the same; requirement A1 | Simon Schötz, 2026-10-28 |
| The type filter offers NPCs, Foes, PCs, Factions, Locations and Items in any combination; the choice survives leaving the encounter, opening another encounter and restarting the app on the same device | Requirement A2 of the epic | Simon Schötz, 2026-10-28; the settings `update` test and `EncounterAddTab.test` cover saving; leaving the encounter and the restart no test |
| The quantity field starts at 1 and takes whole numbers from 1 to 99; Add adds that many combatants of the entity to the end of the queue | Requirements A3 and Q5 of the epic | Simon Schötz, 2026-10-28 |
| Every Add button of the encounter is disabled while an Add write is pending, so a double click adds the quantity once | Two quick Adds would hand out the same queue position | Simon Schötz, 2026-10-28 |
| A combatant whose entity exists but has no name shows "Untitled Combatant", with its number while it has siblings | Follows the live entity, as an unnamed session step shows "Untitled Step" | Simon Schötz, 2026-10-28 |
| One combatant of an entity shows as "Goblin"; once a second exists both show a number; adding more continues from the highest number given in the encounter | Requirement A4 of the epic | Simon Schötz, 2026-10-28 |
| An entity with exactly one stat block section (Basic or 5e) whose HP is a number gives each new combatant that number as max and current HP; with no stat block, two or more, or an empty HP, the combatant's HP is not set | Requirement A5 of the epic | Simon Schötz, 2026-10-28 |
| Editing the entity's stat block HP after adding does not change combatants already in the queue | Requirement A5: the number is copied at add time | Simon Schötz, 2026-10-28; no test |
| Each queue entry shows the entity's image (the placeholder without one), its shown name and its HP as `current / max`, followed by `+temp` when temp HP is above 0 | Requirement Q2 of the epic; no HP can be lost or temp HP set in this slice, so `+temp` is covered by a unit test now and hand-checked in the next slice | Simon Schötz, 2026-10-28; `describeQueueEntryHp.test` and `buildQueueEntries.test` |
| The image of a combatant that has lost HP is tinted red from the bottom up, covering the share of max HP that is missing; at current HP 0 or below the image turns grey instead | Requirement Q2 of the epic as changed by the Decisions rows below; the tint is unit-tested now and hand-checked in the next slice, grey is hand-checked through a stat block HP of 0 or below | Simon Schötz, 2026-10-28; `describeQueueEntryHp.test` covers the share and the state, the rendered colours no test |
| A combatant whose HP is not set shows no HP text and no tint | Requirement Q2 of the epic as changed below | Simon Schötz, 2026-10-28 |
| Dragging a queue entry moves it to the drop position; the new order survives leaving the encounter and restarting the app, one entry at a time | Requirement Q4 of the epic | Simon Schötz, 2026-10-28; the service, hook and `reorderIds` tests cover the order, the drag gesture no test |
| Deleting a base entity keeps its combatants in the queue, shown with the entity's name from when they were added and the image placeholder | Requirement E1 of the epic | Simon Schötz, 2026-10-28 |
| Renaming a base entity changes the shown name of its combatants in every encounter | The shown name follows the live entity | Simon Schötz, 2026-10-28 |
| Each Add writes one `added` log entry naming the queue items added; nothing shows it yet | Requirement A8 of the epic | Simon Schötz, 2026-10-28 |
| Queue items and log entries sync to a paired device as other synced tables do | The app's tables sync | Simon Schötz, 2026-10-28; no test |
| The HP tint grows from the bottom up and is red, not a darkening | not recorded | Simon Schötz, 2026-10-28; no test |
| At current HP 0 or below the image turns grey instead of fully tinted | not recorded | Simon Schötz, 2026-10-28; `describeQueueEntryHp.test` covers the state, the colour no test |
| A combatant whose HP is not set shows nothing in place of the HP numbers, and no tint | not recorded | Simon Schötz, 2026-10-28 |
| An Add-tab row shows the entity's image, name and type label beside quantity and Add | Mixed-type results stay readable | proposed by Claude, accepted by Simon Schötz, 2026-10-28; no test |
| The red tint is translucent, so the image stays visible under it; grey is the image desaturated | "become red" and "become grey" read as a change of the image, not a cover over it | Claude's call, 2026-10-28; no test |
| The tint's share is (max − current) / max; temp HP does not count towards it | Requirement Q2 defines the share as the part of max HP that is missing | Claude's call, 2026-10-28 |
| A combatant with max HP 0 or below is shown grey, since its current HP is then 0 or below | Extends the epic's "max HP 0 shows the overlay full" row to the grey state the user chose; a stat block HP may be negative (`basic-stat-block.md`) | Claude's call, 2026-10-28 |
| A stat block HP that is a whole number, negative or 0 included, is prefilled as it is | Requirement A5: "its HP is a number" | Claude's call, 2026-10-28 |
| Temp HP shows only when above 0 (`4 / 7`, `4 / 7 +2`) | The epic's example shows `+2`; `+0` adds nothing | Claude's call, 2026-10-28 |
| Each Add writes its `added` log entry from this slice on, though the Log tab comes in a later slice | The Add write is built once, as the decision record's Writes section describes it; no user-visible difference before the Log tab | Claude's call, 2026-10-28 |
| The queue's HP comes from the decision record's derivation function from this slice on; it takes queue items only and returns per item max, current and temp HP, and no log read, `entries` parameter or defeated, removed or revert output exists until the next slice adds them with the HP kinds | A parameter and a read nothing observes is dead code | Claude's call, 2026-10-28 (architect's changed decision) |
| The red tint and `+temp` are unit-tested in this slice and hand-checked in the next; grey is hand-checked now through a stat block HP of 0 or below | No HP can be lost or temp HP set in this slice | proposed by Claude, accepted by Simon Schötz, 2026-10-28; no test (scope) |
| While an Add write is pending, every Add button of the encounter is disabled | Two quick adds of different entities cannot hand out the same sort position | proposed by Claude, accepted by Simon Schötz, 2026-10-28 |
| A combatant whose linked entity has no name shows "Untitled Combatant"; the stored name shows only once the entity is gone | Follows the live entity, as an unnamed session step shows "Untitled Step" | proposed by Claude, accepted by Simon Schötz, 2026-10-28 |
| An unnamed entity's Add-tab row shows "Untitled Combatant" | The row and the combatant it adds read alike | proposed by Claude, accepted by Simon Schötz, 2026-10-28; no test |
| The type filter's labels are the singular entity type labels (NPC, Foe, PC, Faction, Location, Item) | Reuses the app's existing labels | proposed by Claude, accepted by Simon Schötz, 2026-10-28; no test |
| Placeholders read "Global combat notes..." and "Search entities..." | default text | proposed by Claude, accepted by Simon Schötz, 2026-10-28; no test |
| Queue images 64 px, Add-row images 48 px, side columns 1.5× the preview width; tuned by bug report during hand testing | Values to start from | proposed by Claude, accepted by Simon Schötz, 2026-10-28; no test |
| A branching computation in the Add tab's type toggle lives in a helper, `toggleEntityType` | The project's component rules move a branching computation out of a handler into `helper/` | Claude's call, 2026-10-28 |
| The log payload module exports only `serializeLogEntryPayload` and its types in this slice; parse and the kind list come with their first reader | Unread exports are dead code | Claude's call, 2026-10-28; no test (the `local/no-unused-exports` lint row checks it) |
| The queue entry and the Add row render the entity image through one shared `EncounterEntityImage` component with a `size` prop; the queue keeps its tint wrapper | Image size is data-level variance, so two copies would depart from the project's sub-component ownership rule | Claude's call, 2026-10-28 (architect's changed decision); no test |
| `AvatarCell` stays its own copy; `EncounterEntityImage` gets no test | `AvatarCell` sits in `src/components/` and cannot import from `screens/`; the testing policy forbids a component test no criterion's event handling needs | Claude's call, 2026-10-28; no test |
| `useAdventureBaseEntities` is created with its first consumer, the queue display, not with the data access sub-feature | The lint rule `local/no-unused-exports` rejects an export nothing imports yet | Claude's call, 2026-10-28; no test (build order) |
| Test builders shared across test files move to the `__tests__/support/` folders of `src/` and `services/`, and the `useParams` stand-in has its own test; the one `BaseEntity` builder copy across the two layers stays, forced by the layer boundary | Shared test infrastructure is code, and a fixture defined in two test files is a defect | Claude's call, 2026-10-28; `encounterRouteParams.test` covers the stand-in |
| `EncounterQueueActions` moves to its own folder, later named `EncounterActions` | Each component has its own folder; a touched file is checked against every convention | Claude's call, 2026-10-28; no test |
| A failed `added` log write after the combatants were stored no longer reports the add as failed; a refused add does not reset the quantity; the other review findings were applied or kept as they are | The write of the combatants is not repeated on a retry; a refused add changed nothing, so the typed quantity stays | Simon Schötz, 2026-10-29 |
| `addEntityCombatants` also refuses a second call in the same call stack while an Add of the encounter is pending, resolving `false` | Two calls in one stack would both write, since the disabled buttons follow the cache only after a render | Claude's call, 2026-10-28 |
| Only the Add tab exists in this slice; Actions and Log appear in later slices | default; no user-visible difference, no release before all slices | Claude's call, 2026-10-28; no test |
| A click on a queue entry does nothing in this slice; the middle column below the global notes is empty | Selection belongs to later slices, the shown item's view to the slice after them | Claude's call, 2026-10-28; no test |
| With no type chosen in the filter, the Add tab lists every type; with nothing saved yet, no type is chosen | default; no user-visible difference — an empty list for an empty filter would hide everything | Claude's call, 2026-10-28 |
| The Add tab lists entities by name, A to Z | default; no user-visible difference | Claude's call, 2026-10-28 |
| A quantity outside 1–99, or not a whole number, disables Add; leaving the field puts back the last valid quantity | Follows the stat block number fields' revert-on-blur (`basic-stat-block.md`) | Claude's call, 2026-10-28 |
| The quantity field returns to 1 after an Add | default; no user-visible difference | Claude's call, 2026-10-28 |
| An adventure without base entities shows a one-line empty state in the Add tab; a search with no match shows the search's own empty state | default; no user-visible difference | Claude's call, 2026-10-28 |

## Open points

None in the open-questions register.

Not yet registered: whether a paired device on a build from before this feature, which does not know the two new tables, pauses sync or skips them. The sync protocol version stays at 3, and the branch did not establish how an older build treats a table it does not know. The lead takes it to the user. The sync rule in Rules above depends on it.

## Where to look

- Domain: `deriveCombatState`, `shownCombatantNames` (with `UNNAMED_ENTITY_LABEL`), `addQuantity` (`parseAddQuantity`, the quantity range), `logEntryPayloads` (`serializeLogEntryPayload`), the encounter `errors`, and `singleStatBlockHp` (the stat block HP rule).
- Database: the migration `add_encounter_queue_and_log`; the `encounter-queue-item` module (`createMany`, `getAllByEncounter`, `update`); the `encounter-log-entry` module (`create`); `buildCreateManyQuery`; the `hide_defeated` column in the encounter `schema`; the sync `registry`; the `encounterAddFilter` key in the settings `schema`.
- Services: `encounterQueueService` (`getQueueItems`, `addEntityCombatants`, `reorderQueueItems`).
- Data access: `useEncounterQueueItems` (the queue, the pending state of Add, reorder), `useAdventureBaseEntities`, `encounterKeys` and `encounterQueryOptions`.
- Screens and components: `EncounterScreen`, `EncounterActions`, `EncounterNotes`, `EncounterEntityImage`, `EncounterQueue` with `EncounterQueueEntry`, `buildQueueEntries` and `describeQueueEntryHp`, `EncounterAddSidebar` with `EncounterAddTab`, `EncounterAddRow` and the helpers `sortEntitiesByName`, `filterByEntityTypes` and `toggleEntityType`; `reorderIds`, shared with `ReorderableNavList`.
- Tests: `deriveCombatState.test`, `shownCombatantNames.test`, `addQuantity.test`, `logEntryPayloads.test`, `singleStatBlockHp.test`, the `create-many`, `get-all-by-encounter`, `update` and `create` tests of the two new db modules, `build-create-many-query.test`, the settings `update.test`, the encounter, base-entity and adventure `remove` tests and the encounter `duplicate` test, `encounterQueueService.test`, `useEncounterQueueItems.test`, `EncounterAddTab.test`, `EncounterAddRow.test`, `describeQueueEntryHp.test`, `buildQueueEntries.test`, the three Add tab helper tests, `reorderIds.test`, `encounterRouteParams.test`.
