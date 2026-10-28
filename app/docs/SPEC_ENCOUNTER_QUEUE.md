# Encounter screen, Slice 1 — combat schema and a queue of entity combatants

- Sub-feature 1: Combat schema — the two new tables with their sync triggers, `encounters.hide_defeated`, and the db modules that write and read them
- Sub-feature 2: Queue service — adding entity combatants (rows, numbers, HP prefill, `added` entry) and rewriting the queue's order
- Sub-feature 3: Queue data access — `useEncounterQueueItems` and `useAdventureBaseEntities`
- Sub-feature 4: Three-column screen — the new `EncounterScreen` layout with the combat notes, and Duplicate and Delete moved below the queue column
- Sub-feature 5: Queue display — the draggable queue of combatants with image, shown name and HP, and the shared `EncounterEntityImage` component
- Sub-feature 6: Add tab — the right sidebar that lists the adventure's base entities and adds combatants

Sub-feature files, to be implemented in this order, each committed under the `every check` rows of the root `CLAUDE.md` — Tool Use Discipline:

- [SF1](SPEC_ENCOUNTER_QUEUE_SF1.md)
- [SF2](SPEC_ENCOUNTER_QUEUE_SF2.md)
- [SF3](SPEC_ENCOUNTER_QUEUE_SF3.md)
- [SF4](SPEC_ENCOUNTER_QUEUE_SF4.md)
- [SF5](SPEC_ENCOUNTER_QUEUE_SF5.md)
- [SF6](SPEC_ENCOUNTER_QUEUE_SF6.md)

No sub-feature is a Foundation SF: SF1 changes the `Encounter` type and carries every fixture that needs the new field in the same commit, and each later sub-feature depends only on symbols that earlier sub-features have already committed.

Ground for the whole spec: the product requirements `app/docs/_product/epics/encounter-screen.md` (requirement ids such as A4 are theirs) and the decision record `app/docs/_product/decisions/0001-encounter-combat-state.md` (its Data, Derivation, Naming and Writes sections). Slice 1 builds the schema of the decision record and the first user-visible part on it; Slices 2 to 6 add HP actions, the log tab, selection, the shown item's view, ad-hoc combatants and events, and add no migration.

## Key Architectural Decisions

### Slice 1 derives HP from queue items only and reads no log entry

The combat-state derivation is a pure function in `domain/encounters/` that takes the encounter's queue items and returns per item max, current and temp HP; Add still writes its `added` entry, and no log read, `entries` parameter or defeated/removed/revert output exists until Slice 2 adds them to the same function. R1, row 11.

### The shown name follows the live entity

While a combatant's `base_entity_id` is set and that entity is in the loaded entity lists, its name is the entity's current name, or "Untitled Combatant" when that name is null; the stored `name` shows only when the combatant has no linked entity or the entity is not in the loaded lists. R2, row 14.

### Add is disabled for the whole encounter through the mutation cache

Every Add button of the encounter is disabled while any Add write of that encounter is pending, read with `useIsMutating` on a mutation key scoped to the encounter. R3, C3, row 13.

### A second Add call in the same call stack is refused at the source

`useEncounterQueueItems.addEntityCombatants` returns without writing when `queryClient.isMutating` already counts a pending Add of the encounter. The disabled buttons follow the cache after a render, so two clicks in one call stack would otherwise both write and hand out the same `sort_order` and `sequence_number`; the cache counts a mutation from the synchronous start of its `mutate` call (`.claude/knowledge/tanstack-query.md`, the entry beginning "A mutation is `pending` in the mutation cache").

### Queue and Add tab share the six existing entity list caches

One hook runs the six `baseEntityListQueryOptions(type, adventureId)` through `useQueries`; it adds no query key and no invalidation, so every existing base-entity mutation already refreshes the queue and the Add tab. C2.

### The `added` payload is `{ "queueItemIds": string[] }` with at least one id

Stored payloads are never rewritten, so this shape is permanent; `serializeLogEntryPayload` in `domain/encounters/logEntryPayloads.ts` is the one place that validates and serializes a payload per kind, and `db/encounter-log-entry/create.ts` calls it before the write. C8.

### `custom_name`, `kind` and the removed state take no part in naming or numbering

Slice 5 adds `custom_name` as the first rung of the shown name, Slice 2 adds the removed rule of A4; the columns exist from this migration on. R4.

### `reorderIds` moves to `src/util/reorderIds.ts`

It is generic, has two consumers in different module directories (`ReorderableNavList` and `EncounterQueue`), and no data-access-layer file consumes it, so `app/src/CLAUDE.md` — Util vs. Helper Placement, rung 3, applies; `ReorderableNavList/index.ts` is not extended. R5.

### The HP tint is a translucent red layer from the bottom; grey replaces it at 0 HP or below

The share is (max − current) / max and ignores temp HP; at current HP 0 or below, or at max HP 0 or below, the image is desaturated instead, with no tint; a combatant whose HP is not set shows no HP text and no tint; temp HP shows as `+temp` only above 0. Rows 1, 2, 3, 5, 6, 7, 9.

### Prefill copies a whole-number stat block HP, negatives and 0 included

Exactly one Basic or 5e stat block section whose HP is a number gives each new combatant that number as `starting_max_hp`; every other case leaves it unset; the number is copied at add time. Row 8.

### Quantity is 1 to 99 and resets to 1 after an Add

Anything outside 1 to 99, or not a whole number, disables Add, and leaving the field restores the last valid quantity. Rows 19, 20.

### Only an Add tab exists, and clicking a queue entry does nothing

The tab container is a static single "Add" header with no tab state; the middle column below the global notes is empty. Rows 15, 16.

### The type filter is a per-device `_settings` key; no chosen type lists every type

`encounterAddFilter` is a key of `_settings`, which is not synced; an empty or unsaved selection lists all six types, and the list is sorted by name A to Z with unnamed entities last. Rows 17, 18.

### Duplicate does not copy the queue in this slice

An encounter duplicated now has an empty queue; `db/encounter/duplicate.ts` is unchanged and passes every column it does not exclude as `copiedColumns`, so the copy takes the source's `hide_defeated`. C12.

### The queue entry's drag handle is the sortable activator

`EncounterQueueEntry` sets `setActivatorNodeRef` (returned by `useSortable` in `@dnd-kit/sortable` 10.0.0) on one handle element and spreads both `attributes` and `listeners` on that same element, so the element that receives the pointer and keyboard events is the registered activator. The `DndContext` uses the same pointer and keyboard sensors and `closestCenter` as `ReorderableNavList`; that sensor setup is written a second time, not extracted into a shared hook, because extracting it would change `ReorderableNavList` beyond its import path, and `ReorderableNavListItem` is not changed either.

### The queue entry and the Add row share one `EncounterEntityImage` component

The queue entry and the Add row render the entity image through one `screens/encounter/components/EncounterEntityImage/` component with a `size` prop, the queue entry keeping its tint wrapper around it; `AvatarCell` stays its own copy and `EncounterEntityImage` has no test and no `index.ts`. Rows 21, 22.

### An unnamed entity reads "Untitled Combatant" in the Add tab too

No entity list shows a placeholder for a null name today, so the Add row shows the same text the queue shows for that entity's combatants, from one exported constant `UNTITLED_COMBATANT_NAME` in `domain/encounters/shownCombatantNames.ts`.

## CLAUDE.md impact

- `app/CLAUDE.md` — Domain Glossary names neither the queue item, the combatant, the encounter event nor the combat log, nor the tables `encounter_queue_items` (`app/db/encounter-queue-item/schema.ts`) and `encounter_log_entries` (`app/db/encounter-log-entry/schema.ts`) that this branch adds; its Encounter entry describes an encounter as "a scene or set-piece within the Adventure" with no queue. The glossary of the feature pages (`app/docs/glossary.md`) already defines Defeated, Selection, Shown item, Combat log and Revert. [spec-writer_8: ran `grep -n -i "queue item\|combatant\|combat log" app/CLAUDE.md` — not found, exit 1, as of `31a0513c`]
- `app/db/CLAUDE.md` — Conventions, the bullet "Values are always bound…", lists `buildCreateQuery`, `buildUpdateQuery` and `buildDuplicateQuery` as the builders whose column names come from a typed row shape; `app/db/util/build-create-many-query.ts` is a fourth builder that interpolates its table name and column names under the same rule and is not listed. [spec-writer_9: `app/db/CLAUDE.md:28` — as of `31a0513c`]
- `.claude/rules/src-data-access-layer.md` — Non-negotiable rules has no rule for a mutation whose pending state sibling components must read across hook instances. `app/src/data-access-layer/encounters/useEncounterQueueItems.ts` reads it with `useIsMutating` on an encounter-scoped `mutationKey` and refuses a second call with `queryClient.isMutating`, because a hook-local `isPending` belongs to one hook instance and a value read from render state lags the call by a render. [spec-writer_10: `grep -n "useIsMutating\|isMutating" -r .claude/rules app/src/CLAUDE.md app/CLAUDE.md` — not found, exit 1, as of `31a0513c`]
- `.claude/rules/src-unit-tests.md` — Component tests tells a test whose component reads a query to mock "the `@services/*` module the data-access-layer hooks call". `useSetting` (`app/src/data-access-layer/settings/useSetting.ts`) calls `@db/_settings` directly, so a component test whose tree reads a setting, such as `app/src/screens/encounter/components/EncounterSidePanel/components/EncounterAddTab/__tests__/EncounterAddTab.test.tsx`, mocks `@db/_settings` instead. [spec-writer_11: `app/src/data-access-layer/settings/useSetting.ts:2` — as of `31a0513c`]
