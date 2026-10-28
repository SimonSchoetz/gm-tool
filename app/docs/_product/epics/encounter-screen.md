# Encounter Screen — PRD

**Status:** Draft, 2026-10-28. **Owner:** Simon Schötz. **Architecture:** `app/docs/_product/decisions/0001-encounter-combat-state.md` records how the combat state is stored.

## Purpose

The encounter screen becomes the GM's combat tracker: the order of everyone and everything in a fight, each combatant's HP at a glance, a combatant's whole entity one click away, notes per combatant and for the fight, and a combat log that records every HP change and takes typed messages. The GM runs a fight on one screen instead of opening entity screens and popups to look up stat blocks and tracking HP elsewhere.

It stays rule-set-agnostic: the app tracks order and HP only, so a D&D 5e fight and a Daggerheart fight use the same screen. Today an encounter has a name, a description editor, Duplicate and Delete; this PRD keeps all four.

## Goals

- Run a whole fight on one screen, with no popup needed to change HP or read an entity.
- Add combatants fast: search, filter by entity type, add several copies of one entity with automatic numbering, HP prefilled from the entity's stat block.
- Act on several combatants at once, e.g. AoE damage or a mass heal, with a different amount per target where needed.
- See every HP change in the log, and undo any of them from there.

## Non-goals

Decided during the PRD interview, not left out by accident:

- **No turn tracking:** no current-turn marker and no "turn done" checkmarks. Neither fits a spotlight system such as Daggerheart.
- **No round counter:** a new round is a message the GM types into the log. A reminder such as "reinforcements in round 3" is an encounter event in the queue.
- **No initiative values:** the order is whatever the GM drags it to.
- **No tracked values besides HP:** Stress, Armor slots, spell slots and Hope are player resources the GM does not manage.
- **No PC HP carried between encounters:** each encounter starts a PC at the HP set there.
- **No player-facing view and no hidden information:** only the GM sees the screen.
- **No simultaneous use on two devices:** a fight runs on one device.

## Terms

- **Queue** — the ordered list of combatants and encounter events in the screen's left column.
- **Queue item** — one entry in the queue: a combatant or an encounter event.
- **Combatant** — a participant in the fight. An *entity combatant* is linked to a base entity (NPC, Foe, PC, Faction, Location or Item); an *ad-hoc combatant* has only a name and HP and exists only in its encounter.
- **Encounter event** — a queue item that is not a combatant, holding a name and a note: a lair action, a legendary-action reminder, reinforcements.
- **Combat HP** — a combatant's max HP, current HP and temp HP within one encounter. It is separate from the HP in the entity's stat block, which combat never changes.
- **HP not set** — a combatant whose max HP is empty, because its entity has no single stat block HP to take it from.
- **Defeated** — a mark the GM sets and clears by hand; HP alone never defeats a combatant or brings one back.
- **Selection** — the queue items currently selected; actions in the Actions tab apply to all of them.
- **Shown item** — the queue item the middle column shows: the one clicked last.
- **Combat log** — the encounter's chat-like list of automatic entries and typed messages.
- **Revert** — undoing one automatic log entry, so the fight's values become what they would be had that entry never happened.

## Layout

```text
┌ Encounter name ──────────────────────────────────────────────┐
│┌ Queue ─────┐┌ Middle ────────────────────┐┌[Add][Actions][Log]┐│
││[▣] Goblin 1││ Global combat notes        ││ search…          ││
││[▣] Goblin 2││ (fixed height, scrolls)    ││ Foes PCs Items … ││
││[▣] Goblin 3│├────────────────────────────┤│ Goblin  [1] [+]  ││
││ ▪ Lair     ││ Goblin 3       4 / 7  +2   ││ Wolf    [1] [+]  ││
││[▣] Aria    ││ notes for Goblin 3         ││                  ││
││            ││ ────────────────────────── ││                  ││
││ Hide def.  ││ entity: content sections   ││                  ││
││ Duplicate  ││ + description (editable)   ││                  ││
││ Delete     ││                            ││                  ││
│└────────────┘└────────────────────────────┘└──────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

- **Left:** the queue, with the Hide defeated toggle and the Duplicate and Delete buttons below it, which move here from today's left sidebar.
- **Middle:** the global combat notes at the top, in a fixed-height panel that scrolls, as the notes panel of the session screen's in-game view; below them the shown item's view.
- **Right:** a sidebar with the tabs Add, Actions and Log.

## Requirements

### Queue

- **Q1.** Every combatant and encounter event of the encounter appears in one vertical list in the left column, in the GM's order.
- **Q2.** A combatant entry shows its image, or the image placeholder for an ad-hoc combatant or an entity without image; its combat name; its current HP, max HP and temp HP as numbers (`4 / 7 +2`); and a dark overlay over the image, covering the share of max HP that is missing. At 0 HP or below the overlay covers the whole image. An entry whose HP is not set shows a hint mark instead of the numbers and no overlay.
- **Q3.** An encounter event entry shows an event marker and its name, with no image and no HP.
- **Q4.** Drag and drop reorders the queue. Dragging an item that is part of the selection moves the whole selection as one block to the drop position, keeping the order they had among themselves.
- **Q5.** A newly added item goes to the end of the queue.
- **Q6.** A defeated combatant stays in the queue, dimmed. With Hide defeated on, defeated combatants are not shown; the toggle is saved per encounter. A hidden combatant keeps its place, so it reappears where it was.

### Selection

- **S1.** A click on a queue item selects only that item and makes it the shown item.
- **S2.** Cmd-click (Ctrl-click on Windows) adds an item to the selection or removes it; Shift-click selects every item from the last clicked one to this one. Either makes the clicked item the shown item.
- **S3.** Escape clears the selection and the shown item.
- **S4.** The selection is not saved: reopening the encounter starts with nothing selected.

### Shown item (middle column)

- **V1.** An entity combatant shows its combat name (editable), its combat HP and defeated mark (read-only; changed in the Actions tab), its own notes editor, and then its entity's content sections and description. The entity content is editable exactly as on the entity's screen, and an edit changes the entity itself: for every combatant of that entity, in every encounter, and outside encounters.
- **V2.** An ad-hoc combatant shows its combat name (editable), its combat HP and defeated mark, and its notes editor.
- **V3.** An encounter event shows its name (editable) and its note editor.
- **V4.** A combatant whose HP is not set shows why: its entity has no stat block with an HP value, or has more than one stat block. The hint tells the GM to set max HP in the Actions tab.
- **V5.** A combatant's notes belong to that combatant only: Goblin 3's notes are not Goblin 1's and are not saved on the Goblin entity.

### Adding (Add tab)

- **A1.** The tab lists the adventure's base entities, searched as on the entity list screens.
- **A2.** An entity-type filter offers NPCs, Foes, PCs, Factions, Locations and Items in any combination. The choice is saved on the device and applies to every encounter.
- **A3.** Each row has a quantity (default 1) and an Add button, which adds that many combatants of the entity.
- **A4.** A combatant's name shows a number only while the encounter holds two or more combatants of the same entity: one Goblin is "Goblin"; once a second exists they show as "Goblin 1" and "Goblin 2". Numbers continue from the highest one given in this encounter and are never reused, so removing Goblin 2 leaves Goblin 1 and Goblin 3. Removed combatants do not count; defeated ones do. A renamed combatant shows its own name, without a number.
- **A5.** HP prefill: when the entity has exactly one stat block section (Basic or 5e) and its HP is a number, each new combatant gets that number as max HP and current HP. With no stat block, two or more stat blocks, or an empty HP, the combatant's HP is not set (V4). HP is copied when the combatant is added; a later edit of the stat block does not change combatants already in an encounter.
- **A6.** A quick-combatant form takes a name, an optional HP and a quantity, and adds that many ad-hoc combatants. They are numbered by name as A4 numbers entity combatants.
- **A7.** A new-event form takes a name and adds an encounter event; its note is written in the middle column.
- **A8.** Each add writes one log entry, e.g. "Added Goblin ×5".

### Actions tab

- **H1.** The tab acts on the selection, one combatant or many. It lists each selected combatant with an amount field. One shared amount field fills every row, and any row can then be changed before applying, e.g. half damage for a target that saved. Encounter events in the selection are not listed.
- **H2.** Actions: Damage, Heal, Set temp HP, Set max HP, Mark defeated, Unmark defeated, Remove.
- **H3.** Damage takes temp HP first and the rest from current HP. Current HP has no floor and can go below 0.
- **H4.** Heal raises current HP up to max HP, never above, and leaves temp HP as it is.
- **H5.** Set temp HP replaces the combatant's temp HP; it does not add to it. 0 clears it.
- **H6.** Set max HP changes max HP for this encounter only. When HP was not set, current HP becomes the new max. When the new max is below current HP, current HP drops to the new max. Raising max HP leaves current HP as it is.
- **H7.** Damage and Heal are not available for a combatant whose HP is not set; its row shows the hint instead.
- **H8.** An action applied to several combatants writes one log entry listing every target with its amount.
- **H9.** Remove takes the selected items, combatants and encounter events alike, out of the queue without asking for confirmation. The removal can be reverted from the log.
- **H10.** Amounts are whole numbers of 0 or more.

### Combat log (Log tab)

- **L1.** A chat-like list, oldest at the top, scrolled to the newest entry at the bottom.
- **L2.** Automatic entries: added, removed, damage, heal, temp HP set, max HP set, marked defeated, unmarked defeated, reverted. Each shows the time it was made. Reordering, renaming and note edits are not logged.
- **L3.** A message composer at the bottom takes text with @mentions of entities, as in the app's other editors. Enter sends, Shift+Enter starts a new line. A combatant such as "Goblin 3" is plain text in a message; only its entity can be mentioned.
- **L4.** A typed message can be deleted and not edited.
- **L5.** Every automatic entry except "added" and "reverted" has a Revert action. Reverting makes the fight's values what they would be had that entry never happened, and every later entry stays in effect. The entry stays in the log, marked as reverted, a "Reverted: …" entry is added, and an entry can be reverted only once. Reverting a mass action reverts it for every target. Reverting a removal brings the items back at their old place in the queue, with their HP and notes.
- **L6.** The log stays with the encounter as the record of the fight and is never cleared.

### Global notes

- **N1.** The encounter's existing description editor becomes the global combat notes; text already written stays.

### Duplicate and Delete

- **D1.** Duplicate creates a new encounter, named as Duplicate names it today, with the same notes and a copy of every queue item still in the queue: order, combat names, numbers and notes. Each copied combatant starts at full HP: max HP as it is in the source encounter at that moment, current HP equal to it, no temp HP, not defeated. The log is not copied. This is how a fight is run again.
- **D2.** Delete removes the encounter with its queue and log, as today.

### Entity deleted

- **E1.** Deleting a base entity that has combatants keeps those combatants. They keep the entity's last-known name, their HP and their log entries, lose the image and the entity view, and from then on behave like ad-hoc combatants.

## Decisions

| Decision | Why | Source |
| --- | --- | --- |
| One combat state per encounter; it stays as the record after the fight, and a fight is run again by duplicating the encounter | One copy of combat state is the cheapest to build | proposed by Claude, accepted by Simon Schötz, 2026-10-28 |
| Every encounter is a combat; the screen becomes the combat tracker for all of them | not recorded | Simon Schötz, 2026-10-28 |
| A PC's HP lives in each encounter only; damage from an earlier fight is not carried over | not recorded | Simon Schötz, 2026-10-28 |
| A combatant's entity content is editable in the middle column, and edits change the entity itself | not recorded | Simon Schötz, 2026-10-28 |
| Turn order is manual drag and drop only; no initiative values | Fits systems without initiative, such as Daggerheart's spotlight | Simon Schötz, 2026-10-28 |
| No current-turn marker, no "turn done" checkmarks, no round counter; a new round is a typed log message | "Marking turns doesn't make sense for Daggerheart. I'd now say marking a new round is a comment in the combat log for DnD and similar systems." | Simon Schötz, 2026-10-28 |
| Round-bound reminders (reinforcements in round 3) are encounter events in the queue, like lair actions | "Reminders like Reinforcements in round 3 I consider something like a layer action that I already mentioned as non-combatant queue items" | Simon Schötz, 2026-10-28 |
| Multi-select is temporary, by Cmd/Ctrl-click; it serves group moves and group actions, and no lasting group exists | "Maybe by holding ctrl/command and click on those. That's a familiar mechanic" | Simon Schötz, 2026-10-28 |
| Shift-click selects a range | The same familiar list mechanic as Cmd/Ctrl-click | Claude's call, 2026-10-28 |
| HP is the only tracked value | "I only care about HP because that's the main indicator when somebody drops out of combat. The other things like armor slots, spell slots, ect., are player recourses. I don't manage those as a GM" | Simon Schötz, 2026-10-28 |
| Damage takes temp HP first; healing stops at max HP; current HP has no floor | not recorded | Simon Schötz, 2026-10-28 |
| Defeated is a manual mark only | not recorded | Simon Schötz, 2026-10-28 |
| A queue entry shows health as an overlay over the image plus the numbers | not recorded | Simon Schötz, 2026-10-28 |
| An encounter event holds a name and a note | not recorded | Simon Schötz, 2026-10-28 |
| Ad-hoc combatants (name and HP, this encounter only) exist next to entity combatants | not recorded | Simon Schötz, 2026-10-28 |
| A group action lists every target with the amount prefilled, editable per target | not recorded | Simon Schötz, 2026-10-28 |
| Mistakes are fixed by reverting the log entry | not recorded | Simon Schötz, 2026-10-28 |
| The existing description editor becomes the global combat notes | No new field and no data migration | proposed by Claude, accepted by Simon Schötz, 2026-10-28 |
| One device per fight, GM's eyes only | not recorded | Simon Schötz, 2026-10-28 |
| Layout: queue in a left column, middle column, Add / Actions / Log sidebar on the right | not recorded | Simon Schötz, 2026-10-28 |
| Global notes sit at the top of the middle column, as in the session in-game view | not recorded | Simon Schötz, 2026-10-28 |
| HP actions live in the Actions tab only, for one or many combatants; the middle column shows HP read-only | One HP action UI instead of two | proposed by Claude, accepted by Simon Schötz, 2026-10-28 |
| Combat HP is copied from the stat block when a combatant is added | not recorded | Simon Schötz, 2026-10-28 |
| Numbers show only while two or more combatants of an entity are in the encounter, and are never reused | not recorded | Simon Schötz, 2026-10-28 |
| A combatant can be renamed within its encounter | not recorded | Simon Schötz, 2026-10-28 |
| Log messages take @mentions of entities; combatants are not mentionable | Reuses the existing mention system unchanged | proposed by Claude, accepted by Simon Schötz, 2026-10-28 |
| Reverting an older entry undoes only that entry; later entries stay in effect | not recorded | Simon Schötz, 2026-10-28 |
| A group action is one log entry for all targets, reverted as a whole | not recorded | Simon Schötz, 2026-10-28 |
| Removal asks for no confirmation and can be reverted from the log | not recorded | Simon Schötz, 2026-10-28 |
| A revert recomputes the fight as if the entry had never happened, rather than adding the entry's amounts back to the current values | The two agree except where temp HP was set between the entry and its revert: there, adding back would leave temp HP the later setting no longer allows | Claude's call, 2026-10-28 |
| The selection and the shown item are not saved | default; no user-visible difference beyond starting empty | Claude's call, 2026-10-28 |
| Hide defeated is saved per encounter; the Add filter is saved per device for all encounters | The filter follows the app's settings table, which does not sync; one device per fight makes syncing it moot | Claude's call, 2026-10-28 |
| Set temp HP replaces, never adds; Set max HP clamps current HP down but never raises it | Temp HP from two sources does not stack in 5e; HP never above max follows the healing rule | Claude's call, 2026-10-28 |
| Typed log messages can be deleted, not edited; automatic entries can only be reverted | Messages carry no combat state, so deleting one is safe; automatic entries are the fight's state | Claude's call, 2026-10-28 |
| Combatants of a deleted entity stay, as ad-hoc combatants with the entity's last-known name | The fight and its log stay readable | Claude's call, 2026-10-28 |
| Duplicate copies the queue at full HP and leaves the log behind | Duplicate is how a fight is run again (first row) | Claude's call, 2026-10-28 |

## Open questions

- **Conditions** (poisoned, restrained, vulnerable) are not covered; until decided they go into the combatant's notes.
- **Session link:** whether a session's in-game view links to the encounters run in it is not covered.

## Suggested slices

Each slice leaves a usable screen, in this order:

1. Queue with entity combatants: the three-column layout, the Add tab with search, type filter, quantity, numbering and HP prefill, images with the HP overlay and numbers, reordering one item at a time.
2. Actions tab and log storage: Damage, Heal, Set temp HP, Set max HP, defeated marks, Remove, Hide defeated, with their automatic log entries, for one selected combatant.
3. Log tab: the list, Revert, typed messages with mentions.
4. Multi-select: Cmd/Ctrl- and Shift-click, block drag, group actions with per-target amounts.
5. Middle column: combat name, notes, and the editable entity view.
6. Ad-hoc combatants and encounter events.
7. Duplicate with the copied queue.
