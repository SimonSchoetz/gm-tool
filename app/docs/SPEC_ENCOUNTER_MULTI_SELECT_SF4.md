# Sub-feature 4: Documentation and knowledge store

The encounter queue feature page describes the single-combatant behaviour this feature replaces, and the dnd-kit knowledge file lacks two facts this feature relies on. Both are plain files, not instruction files.

## Files affected

Modified:

- `app/docs/features/encounter-queue.md` — the edits below
- `.claude/knowledge/dnd-kit.md` — the file already carries the entries written and corrected while this spec was authored (the removal offset, the idle modifier, the deferred removal, and the two jsdom drag entries); they are committed with the spec and are not edited again; add the two entries below

## Documentation layer

### `app/docs/features/encounter-queue.md`

Read the whole page first (it is the page this feature extends), then edit these statements to the multi-select behaviour, keeping the page's wording style:

- Purpose: the group actions are now part of the page (slice 4 of six); only the shown item's view, ad-hoc combatants and encounter events follow in later slices, and "third of six" becomes the slice count the page now covers.
- Happy path 7: a drag of a selected entry moves the whole selection as one block, an unselected entry moves alone; hidden and removed combatants keep their place relative to the entries that did not move.
- Happy path 10: Cmd/Ctrl-click toggles an entry, Shift-click selects the shown range from the anchor to the clicked entry (the anchor is the entry last clicked without Shift), a range never includes a combatant hidden by Hide defeated, Escape clears the selection and the anchor, a selecting click moves the Add tab to Actions and leaves the Actions and Log tabs.
- Happy path 11 and 12: buttons at the top and one row per selected combatant below them in queue order, each with name, HP and its own amount field; a shared field above the buttons from two selected on, which fills every row; Damage and Heal apply to the selected combatants whose HP is set, and every amount button is disabled while an applicable row holds no valid amount; after an action rows and shared field keep their text; a combatant that joins starts with the shared text, and the amount a lone row showed carries to the next single combatant selected.
- Happy path 14, 15, 16 and 20: Mark and Unmark apply to the combatants they can change and are disabled when none qualifies; Remove takes every selected combatant out and clears the selection; one log entry per action lists every target it changed; a revert drops the whole entry and a reverted Remove brings every listed combatant back, unselected.
- Rules rows whose first words are "Dragging a queue entry moves it", "The amount stays in the field after an action", "Selection in this slice is one combatant", "Mark defeated is disabled for a defeated combatant", "A reorder that moves an entry past hidden", "A click on a combatant selects it, shows it", "With a combatant selected the Actions tab shows one row", "The amount field takes whole numbers", "After an action the amount stays", "For a combatant whose HP is not set, Damage and Heal", "Mark defeated turns the combatant's image grey", "Remove takes the selected combatant", "Dragging a queue entry while combatants" and "Each action writes one combat log entry": restate for several combatants, and replace every `getActionAvailability.test` with `planGroupAction.test`.
- Add one Rules row per row of the Decisions table in `.claude/cycles/2026-10-29-encounter-multi-select-lead/01-lead-story.md` (rows 1 to 26), taking its Decision, Why and Source and appending the tests that cover it: `applySelectionClick.test`, `pruneSelection.test`, `useEncounterSelection.test`, `EncounterQueueEntry.test`, `EncounterQueue.test`, `reorderIdsAsBlock.test`, `getBlockDragOtherIds.test`, `planGroupAction.test`, `settleActionAmounts.test`, `useActionAmounts.test`, `EncounterCombatantActionsTab.test`; the paired-device sync stays "no test, a hand test on two devices".
- "Where to look": replace `getActionAvailability` with `planGroupAction`, add `useActionAmounts`, `settleActionAmounts`, `EncounterCombatantActionRow`, `applySelectionClick`, `pruneSelection`, `reorderIdsAsBlock` and `getBlockDragOtherIds`; in the test list replace `getActionAvailability.test` with the new test names above.

Run `pnpm run markdown-lint` from the repository root after the edit; a table it reports under MD060 is re-aligned with `pnpm run markdown-fix`.

### `.claude/knowledge/dnd-kit.md`

Add two entries in the file's entry shape (`.claude/knowledge/CLAUDE.md`): the entry on the pointer sensor's `click` suppression after an activated drag, and the entry on `SortableContext` re-measuring when its `items` change during a drag. Write the citation lines out in full as given here, because the store has no referent for a bare id:

- Heading "`@dnd-kit/core`'s pointer sensor stops propagation of the `click` that follows an activated drag". **Verified at:** @dnd-kit/core 6.3.1, 2026-10-29. **Citation:** [architect_9: `app/node_modules/.pnpm/@dnd-kit+core@6.3.1_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@dnd-kit/core/dist/core.esm.js:1495-1511` — `handleStart` adds `EventName.Click` with `stopPropagation` and `capture: true` on the document once activated].
- Heading "`SortableContext` re-measures its droppables when its `items` change during a drag". **Verified at:** @dnd-kit/sortable 10.0.0, 2026-10-29. **Citation:** [architect_10: `app/node_modules/.pnpm/@dnd-kit+sortable@10.0.0_@dnd-kit+core@6.3.1_react-dom@19.3.0_react@19.3.0__react@19.3.0__react@19.3.0/node_modules/@dnd-kit/sortable/dist/sortable.esm.js:316-320` — a layout effect calls `measureDroppableContainers(items)` when `itemsHaveChanged && isDragging`].

Each body is one to three sentences stating the heading's fact (the click suppression is what makes the click after a drop not reach the entry's click handler).

## Verification

Run `pnpm run markdown-lint` from the repository root and `npx prettier --check .` from `app/`; both pass for the two files. No mutation-check step: neither file is production source.
