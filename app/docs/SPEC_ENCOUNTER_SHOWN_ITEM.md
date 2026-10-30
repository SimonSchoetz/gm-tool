# Spec: Encounter shown combatant in the middle column

Slice 5 of the encounter screen: a click on a queue entry shows that combatant in the middle column, below the global combat notes, with its editable combat name, read-only HP, own notes and its entity's editable content sections and description.

## Progress tracker

- Sub-feature 1: Shown name and queue-item write path — the shown name honours a stored rename, and a queue item's rename and notes save through the autosave queue
- Sub-feature 2: Shown item in the selection — `shownItemId` in the selection state, and the Escape exemption in the middle column
- Sub-feature 3: Promote the content section panel — move it to `screens/components/ScreensBaseEntityContentSectionPanel` with a required entity id prop
- Sub-feature 4: Shown combatant column and name field — the container, its hint and the editable combat name
- Sub-feature 5: Combatant HP and the HP-not-set hint — read-only HP, the Defeated label and the reason sentences
- Sub-feature 6: Combatant notes — the combatant's own notes editor
- Sub-feature 7: Entity view — the entity's content section panel and description editor
- Sub-feature 8: Docs — the feature page, the scaffold reference, the decision record, the glossary and three feature pages

Each sub-feature leaves every `every check` row passing on its own, so none is a Foundation SF: a changed shared type or signature (`shownCombatantNames`'s return value, `SelectionState`, `useEncounterSelection`'s parameters) is updated with all its call sites and tests inside the sub-feature that changes it.

## Key Architectural Decisions

Ids in brackets point at an audit record: `R<n>` and `C<n>` at the rulings and challenges of `.claude/cycles/2026-10-30-encounter-shown-item-lead/02-architect-verdict.md`, `row <n>` at the Decisions table of `.claude/cycles/2026-10-30-encounter-shown-item-lead/01-lead-story.md`.

### The shown item is a selected entry held in the selection state

`SelectionState` holds `shownItemId`. A click, a Cmd/Ctrl-click that adds and a Shift-click set it to the clicked id; a Cmd/Ctrl-click that removes the shown id clears it and one that removes another id keeps it; pruning clears it when its id leaves the kept ids, so a removed combatant and one hidden by Hide defeated are no longer shown (row 5, row 8, row 15).

### Escape in an editable element of the middle column keeps the selection and the shown combatant

Escape pressed while focus is in an editable element of the middle column clears neither; everywhere else it clears both (row 16).

### The Escape exemption is decided from the keydown's target against the middle column element, passed to `useEncounterSelection` as a ref

`useEncounterSelection` keeps its one `document` `keydown` listener and skips the clear when `isEditableWithin(middleColumnRef.current, event.target)` is true. The column does not stop the event itself: that would hide Escape from every other `document` Escape listener, the dialogs' included (the feature page records that an Escape closing a dialog also clears the selection). The region is the whole middle column, the global notes included, because the exemption is stated for "an editable element of the middle column" and the global notes hold the same @ list. An editable element is an `input`, a `textarea` or a `contenteditable="true"` element. The Lexical editor's own menu stops an Escape that closes its @ list before it reaches the `document` [spec-writer_20: `app/node_modules/@lexical/react/src/shared/LexicalMenu.tsx:536-548` — `event.stopImmediatePropagation()` unless `rendersNothing`; `.claude/knowledge/lexical.md`, the entry beginning "`LexicalMenu`'s `KEY_ESCAPE_COMMAND` listener"], so the exemption decides an Escape with no list open and an Escape in the inputs.

### `shownCombatantNames` applies the rename; `shownCombatantBaseName` ignores it

`shownCombatantNames` returns `{ shownName, automaticName }` per item and applies `custom_name`; `shownCombatantBaseName` keeps ignoring it, so the "Added" log line keeps the entity's name ("Added: Goblin ×5") while every line naming one combatant shows the rename (R2, C1, row 17).

### A rename is stored trimmed; an empty name, spaces only and exactly the automatic name store null

The stored `custom_name` is the typed name trimmed, and null for an empty name, a name of spaces only and a name equal to the automatic name, so an unchanged "Goblin 3" confirmed with Enter does not freeze its number (R1, row 9).

### A renamed combatant counts for its siblings' numbering

A renamed combatant stays in the numbering count of its entity, so renaming "Goblin 1" to "Boss" leaves the other showing "Goblin 2" (row 10).

### Rename and notes save per change through the autosave queue

A change of `custom_name` or `notes` writes the queue items cache at once and saves through `useAutosaveQueue`, keyed by the queue item id, with the pending edit carrying its `encounterId`; the mutation invalidates the queue key on error only, and neither write makes a log entry (R3, C4, C5, row 11, row 18). The queue, the Actions row and the Log lines read that cache, so they show a typed name instantly as the GM types and the database write follows about 0.5 s later, the autosave delay; the user decided this timing (row 23).

### The name field composes the input hooks instead of using `SyncedInput`

The field composes `useSyncedInputValue`, `useTypographicInput` and `Input` itself and restores the shown name on blur and on Enter (C2, row 18).

### The content section panel is promoted and takes the entity id as a required prop

It moves to `screens/components/ScreensBaseEntityContentSectionPanel/` with no optional route fallback and no re-export at the old path (C6).

### The entity view exists only while the entity is in the adventure's base entity lists, and the queue entry decides it

A combatant's entity view exists only while its `base_entity_id` is in the lists `useAdventureBaseEntities` returns (R4). `buildQueueEntries` already holds that map, so each queue entry carries `entity: { id; entityType } | null`, non-null exactly in that case. The two UI consumers, `EncounterCombatantHp` (to choose the sentence) and `EncounterCombatantEntityView` (to decide whether to render), read this one field instead of each recomputing the test from the queue item and the lists. The same fact also decides numbering in `shownCombatantNames` (`isLinked`, in `domain/`), which is a separate computation in a separate layer on purpose: the entry's `entity` carries the UI's need (id and type), the numbering needs only whether the entity is linked, and the two are not merged (R4, row 21).

Neither the content section panel nor `EncounterCombatantEntityDescription` carries a `key` of its own. `EncounterShownCombatant` already keys `EncounterCombatantEntityView` by the queue item id, and a queue item's `base_entity_id` is only ever emptied (by the database when the entity is deleted), never changed to another entity, because no writer sets it after the add [spec-writer_26: `app/services/encounterQueueService.ts:60` — the add sets it, line 52 only reads it, and the one `queueItemDb.update` call, line 90, writes `sort_order`; `app/db/encounter-queue-item/schema.ts:19-24` — `onDelete: 'SET NULL'`; this slice's `updateQueueItem` writes `custom_name` and `notes` only], so an inner key could never see a changed entity id; when the entity is removed, the entry's `entity` is null and both unmount (row 19).

### The HP-not-set reason is classified in `domain/` and its sentences live in the frontend

`hpNotSetReason` sits beside `singleStatBlockHp` and shares its stat block types; the reason is read from the entity's sections at render time, not from the moment of the add; the hint shows nothing while the sections load (row 3, row 12).

### The description editor is not extracted from the entity screen

The encounter view builds its own `textEditorId` and its own `TextEditor` (C7).

### The entity view's description editor is its own component

`EncounterCombatantEntityView` renders nothing without an entity, and `useBaseEntity(entityType, entityId, adventureId)` needs a real entity type and id. A hook cannot be called conditionally, and calling it with an invented fallback type would make the unlinked case read a query that cannot exist. So the view reads the entry, returns early, and hands `entityType` and `entityId` to `EncounterCombatantEntityDescription`, whose only job is that hook call and the editor. The panel needs no such split: its hook is disabled for an empty id.

### Each shown-combatant sub-component calls its own hooks, and the queue entry is read through `useEncounterQueueEntry`

`EncounterShownCombatant` passes only the shown item id (`.claude/rules/src-components.md` — Framework context is not a prop). Three sub-components need the entry with that id, so `useEncounterQueueEntry(queueItemId)` in `screens/encounter/hooks/` holds the one lookup; a `find` repeated in three files would be duplicated logic. `EncounterCombatantNotes` reads its raw item from `useEncounterQueueItems`, because it needs the stored `notes` and `updateQueueItem` and nothing from the entry. Sub-components with local state are keyed by the queue item id so it resets when another combatant is shown.

### The middle column below the global notes is one block-layout scroll container

The global notes keep their fixed-height panel; the combatant's name, HP, notes, panel and description scroll as one area; the combatant notes and the description grow with their text; the content section panel shows unchanged, as on the entity screen, so a section body keeps its own height and inner scroll (the user decided this, row 22); `EncounterNotes` and its CSS stay untouched (C8, row 1).

## CLAUDE.md impact

- `.claude/rules/src-data-access-layer.md`, the bullet beginning "A debounced save goes through the autosave queue": it names `mergeScopedEdit` for "an edit that carries `entityType` or `adventureId` beside `data`". `useEncounterQueueItems.updateQueueItem` uses it for an edit that carries `encounterId`, so the list of scoping ids in the rule is one member short, and a reader following the rule literally would treat an `encounterId`-scoped edit as outside `mergeScopedEdit` [spec-writer_21: `.claude/rules/src-data-access-layer.md` — Non-negotiable rules, the autosave bullet — as of 1cbf2b90].
- `app/CLAUDE.md`, Domain Glossary, "Combatant": it describes a combatant by its `base_entity_id` and the `name` stored when it was added. After this change a combatant also carries `custom_name` (the GM's rename; null shows the derived name) and `notes`, both read and written [spec-writer_22: `app/db/encounter-queue-item/schema.ts:29-30` — as of 1cbf2b90], so the entry understates what a combatant holds.

## Sub-feature files

- [Sub-feature 1: Shown name and queue-item write path](SPEC_ENCOUNTER_SHOWN_ITEM_SF1.md)
- [Sub-feature 2: Shown item in the selection](SPEC_ENCOUNTER_SHOWN_ITEM_SF2.md)
- [Sub-feature 3: Promote the content section panel](SPEC_ENCOUNTER_SHOWN_ITEM_SF3.md)
- [Sub-feature 4: Shown combatant column and name field](SPEC_ENCOUNTER_SHOWN_ITEM_SF4.md)
- [Sub-feature 5: Combatant HP and the HP-not-set hint](SPEC_ENCOUNTER_SHOWN_ITEM_SF5.md)
- [Sub-feature 6: Combatant notes](SPEC_ENCOUNTER_SHOWN_ITEM_SF6.md)
- [Sub-feature 7: Entity view](SPEC_ENCOUNTER_SHOWN_ITEM_SF7.md)
- [Sub-feature 8: Docs](SPEC_ENCOUNTER_SHOWN_ITEM_SF8.md)
