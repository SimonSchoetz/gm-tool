# Spec: Encounter multi-select and group actions

The GM selects several queue entries on the encounter screen (Cmd/Ctrl-click, Shift-click), drags the selection as one block, and applies one action to all selected combatants with a different amount per target where needed; each group action writes one combat log entry that lists every target it changed. Only the Frontend layer changes. Branch: `feat/encounter-multi-select`.

- Sub-feature 1: Selection set [FOUNDATION] — `useEncounterSelection` holds a set of selected ids plus an anchor; plain, Cmd/Ctrl and Shift clicks edit it; the screen, queue and sidebar pass the set on
- Sub-feature 2: Group actions in the Actions tab — shared amount field, one row per selected combatant, one planned log entry per action
- Sub-feature 3: Block drag — dragging a selected entry moves the whole selection as one block, with a "+N" badge while it is held
- Sub-feature 4: Documentation and knowledge store — the encounter queue feature page and the dnd-kit facts

## Key Architectural Decisions

### Only the Frontend layer changes

A group action is one `recordLogEntry` call whose payload lists several targets. Every payload schema already holds a non-empty target array [spec-writer_3: `app/domain/encounters/logEntryPayloads.ts:3-10` — `queueItemIds`, `amountTargets` and `valueTargets` are arrays with `.min(1)`], the service writes one log row per call [spec-writer_4: `app/services/encounterLogEntryService.ts:21-31` — one `logEntryDb.create` in `recordLogEntry`], the Log tab joins several targets into one line [spec-writer_5: `app/src/screens/encounter/helper/buildLogLines.ts:42-43` — `withTargets` joins with `', '`], the derivation drops a reverted entry whole [spec-writer_6: `app/domain/encounters/deriveCombatState.ts:76-89` — `revertedEntryIds` is filled from `revert` entries and the apply loop skips a listed id], and a reorder rewrites `sort_order` from the index of every id it is given [spec-writer_7: `app/src/data-access-layer/encounters/useEncounterQueueItems.ts:88-104` — `reorderQueueItems` maps the given ids to indexes in the cache and calls the service with the same list]. No domain, db, service or data-access-layer file changes, and the Log tab, the Add tab, `buildLogLines` and the payload shapes stay as they are.

### The selection is a set of ids plus an anchor, owned by `useEncounterSelection`

State is `{ ids: string[]; anchorId: string | null }`. The hook returns `selectedIds`, `shownIds` filtered by membership, so rows, the block order and Shift ranges share the queue's order. Pure helpers (`applySelectionClick`, `pruneSelection`) hold the click rule and the pruning, so the hook only wires state, tab switching and the Escape listener.

### Cmd and Ctrl both toggle on every platform, Shift wins

Toggle is `event.metaKey || event.ctrlKey` with no platform detection, and Shift wins when both are held. row 20, ruling 2.

### The anchor is the entry last clicked without Shift

A Shift-click replaces the selection with the shown range from the anchor to the clicked entry and anchors only an entry clicked without Shift; with no shown anchor it selects the clicked entry alone; Escape clears the anchor with the selection. rows 1, 9, 10, 19.

### A selecting click of any kind switches the Add tab to Actions

The Actions and Log tabs stay where they are, also when a Cmd/Ctrl-click leaves nothing selected. row 11.

### `SelectionState` and `SelectionModifiers` are declared in `applySelectionClick.ts`

Three files use both types (the hook, the two helpers) and the queue and the entry use `SelectionModifiers`. Declaring them in the hook would make the helpers import a type back from the hook that imports them, a cycle that `import-x/no-cycle` does not report for type-only imports. `app/CLAUDE.md` — Directory Structure ("`import-x/no-cycle` ignores type-only imports … Break it by extracting the shared type to a neutral file both sides import from") requires the shared type in a neutral file, so the lowest file that needs them owns them and the others import from it.

### Amounts live in `useActionAmounts`: one shared text and per-row overrides

A combatant that joins the selection starts with the shared text, a row keeps its own text while its combatant stays selected, and whenever exactly one combatant is selected its row's amount becomes the shared amount. rows 7, 13, 14, 18, ruling 1.

### One pure function decides each button's state and its payload

`planGroupAction(kind, rows)` returns the payload an action would record or `null`, and a button is disabled exactly when `isWriting` is true or its plan is `null`. challenge 6, rows 5, 6.

### The Actions tab fills its panel and only the row list scrolls

Buttons sit at the top with the shared field above them from two selected on, the rows below, and only the row list scrolls. rows 3, 4, 8, 22, challenge 5.

### One reorder path serves single and block drags, and it delegates to `reorderIds`

`reorderIdsAsBlock` removes the block's other ids from the full list, moves the dragged id with `reorderIds` (`app/src/util/reorderIds.ts`), then replaces the dragged id in the result with the whole block in the full list's order. For a one-id block the result is `reorderIds`' own, so the drop rule has one source; `ReorderableNavList` keeps calling `reorderIds` unchanged. Hidden and removed combatants stay in the full list the whole time, so each keeps its place relative to the entries that did not move. The delegation equals the direct rule (insert the block after the dropped-on entry when the dragged entry stood before it, otherwise before) on all 3584 (block, dragged, dropped-on) cases over eight ids [spec-writer_9: ran `node block2.mjs` — cases 3584, mismatches 0].

### The other selected entries leave the list one frame after the drag starts

While a block is held, the other selected entries are removed from the rendered list and from `SortableContext`'s `items`, and the dragged entry shows "+N". The removal runs in a `requestAnimationFrame` callback set by `onDragStart`, never in the commit that starts the drag. In that commit dnd-kit measures the dragged entry after the removal, so the entry sits above the pointer by the removed entries' height; a `modifiers` entry reading the initial and current rects adds nothing, since both are measured after the removal [spec-writer_1: ran `node drive.mjs` — dragged entry's centre 120 px above the pointer with three removed entries above it, 40 px with one, 0 with the removed entries below; the modifier changed none of these]. Removed one frame later, dnd-kit subtracts the entry's rect change itself and the entry stays under the pointer, in a queue that does not overflow and in one that does [spec-writer_1: same run with the removal in a `requestAnimationFrame` callback — offset 0 at pointer moves of 0, 10, 25, 40 and 80 px]; the mechanism is `useRect` re-measuring the node on a `childList` mutation and `useRectDelta` subtracting the change from the transform handed to modifiers [architect_1: `app/node_modules/.pnpm/@dnd-kit+core@6.3.1_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@dnd-kit/core/dist/core.esm.js:2952,2960-2962` — `nodeRectDelta = useRectDelta(activeNodeRect)` is subtracted from `translate` in the transform handed to modifiers] [architect_2: same file `:2223-2225` and `:2064-2077` — `useRectDelta` compares against `useInitialValue`, the first non-null rect] [architect_3: same file `:2152-2220` — `useRect` re-measures on a `childList` mutation under `document.body` whose target contains the node]. `SortableContext` re-measures its droppables when `items` change during a drag (challenge 3), so the drop is decided against the folded list.

### A click after a drag does not run the click rule

A drag of an entry that is not selected moves only that entry and leaves the selection unchanged, and the click that follows a drop does not run the click rule. row 12, challenge 2.

### The block drag applies to every sensor

The keyboard sensor starts the same `onDragStart`, so a keyboard drag of a selected entry also moves the block. row 24.

### The saved result of a drag is pinned by a component test, where it lands is not

A `PointerSensor` drag runs under jsdom from user-event's `pointer`: `onDragStart` and `onDragEnd` fire and Escape ends the drag without `onDragEnd`, but every rect is zero, so `over` is always the first item [spec-writer_2: ran `npx vitest run` on a scratch test with a `DndContext`, a `SortableContext` of four items and `user.pointer` on a handle — `onDragEnd` reported `over` `a` for a drag of `c`; Escape before release gave no `onDragEnd`]. `EncounterQueue.test.tsx` therefore asserts what a drag saves (the selected entries end up adjacent in their original order, an unselected entry moves alone, a cancelled drag saves nothing) and never the drop position, which is layout (SF3 `[MANUAL-VERIFY]` notes).

### The queue entry sets `user-select: none`

A Shift-click would otherwise select page text. Only the handle carries it today. challenge 4.

### The middle column and the shown item are not built

A click selects and sets the anchor only. row 17.

## CLAUDE.md impact

None.

## Sub-feature files

- [SF1: Selection set](SPEC_ENCOUNTER_MULTI_SELECT_SF1.md)
- [SF2: Group actions in the Actions tab](SPEC_ENCOUNTER_MULTI_SELECT_SF2.md)
- [SF3: Block drag](SPEC_ENCOUNTER_MULTI_SELECT_SF3.md)
- [SF4: Documentation and knowledge store](SPEC_ENCOUNTER_MULTI_SELECT_SF4.md)
