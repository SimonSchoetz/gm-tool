# Sub-feature 5: Queue display

Adds the draggable queue to the left column: one entry per queue item with the entity's image, the shown (numbered) name and the HP as `current / max`, with a red tint or grey image from the HP. It adds the pure domain functions that decide HP and names, the `EncounterEntityImage` component that SF6's Add row reuses, and moves `reorderIds` to `src/util/`. SF6 exports `UNTITLED_COMBATANT_NAME` from `shownCombatantNames.ts`.

## Files affected

Modified:

- `app/domain/encounters/index.ts` — explicit exports `deriveCombatState` and `shownCombatantNames`
- `app/src/screens/encounter/EncounterScreen.tsx` — render `EncounterQueue` above `EncounterQueueActions` in the queue column (no change to `EncounterScreen.css`: the column already is a flex column with `min-height: 0`, and `EncounterQueue.css` takes the remaining height)
- `app/src/components/ReorderableNavList/ReorderableNavList.tsx` — the `reorderIds` import becomes `@/util/reorderIds`; scanned: no inline sub-component and only bare `return;` exits in void handlers; `ReorderableNavList/index.ts` needs no change, since it still exports only the component and still hides `components/`

Deleted: none

New:

- `app/domain/encounters/deriveCombatState.ts`, `shownCombatantNames.ts` and `__tests__/deriveCombatState.test.ts`, `__tests__/shownCombatantNames.test.ts`
- `app/src/screens/encounter/components/EncounterEntityImage/EncounterEntityImage.tsx`, `EncounterEntityImage.css` (no `index.ts`, no test file)
- `app/src/screens/encounter/components/EncounterQueue/EncounterQueue.tsx`, `EncounterQueue.css`, `index.ts`, `helper/buildQueueEntries.ts`, `helper/__tests__/buildQueueEntries.test.ts`
- `app/src/screens/encounter/components/EncounterQueue/components/EncounterQueueEntry/EncounterQueueEntry.tsx`, `EncounterQueueEntry.css`, `index.ts`, `helper/describeQueueEntryHp.ts`, `helper/__tests__/describeQueueEntryHp.test.ts`

Moved:

- `mv app/src/components/ReorderableNavList/helper/reorderIds.ts app/src/util/reorderIds.ts`
- `mv app/src/components/ReorderableNavList/helper/__tests__/reorderIds.test.ts app/src/util/__tests__/reorderIds.test.ts` (its `'../reorderIds'` import is unchanged); `ReorderableNavList/helper/` is then empty and removed

Draft: none

## Layered breakdown

### Domain

`deriveCombatState.ts` and `shownCombatantNames.ts` take structural inputs declared in their own files, because `domain/` never imports `db/`:

```ts
export declare const deriveCombatState: (
  items: { id: string; startingMaxHp: number | null }[],
) => Map<string, { maxHp: number | null; currentHp: number | null; tempHp: number }>;

export declare const shownCombatantNames: (
  items: { id: string; baseEntityId: string | null; name: string | null; sequenceNumber: number | null }[],
  entityNamesById: Map<string, string | null>,
) => Map<string, string>;
```

[spec-writer_14: ran `npx tsc --noEmit` and `npx eslint` on scratch files in `domain/encounters/` and `src/screens/encounter/components/EncounterQueue/helper/` declaring `deriveCombatState`, `shownCombatantNames`, `buildQueueEntries` and `describeQueueEntryHp` — observed no type error and only the unused-export lint report]

- `deriveCombatState`: one entry per item; a number `startingMaxHp` gives `maxHp` and `currentHp` equal to it and `tempHp` 0; `null` gives `null`, `null` and 0. Slice 2 adds the log parameter and the kinds to this function.
- `shownCombatantNames`: a combatant is linked when its `baseEntityId` is not `null` and `entityNamesById` has that id; an id absent from the map is not linked. Base name: linked gives the entity's name or "Untitled Combatant" when that is `null`; not linked gives `name` or "Untitled Combatant" when that is `null`. Numbering key: `baseEntityId` while linked, else `name` (items with a `null` name share one key). The number is appended after a single space only when two or more items share the key and the item's `sequenceNumber` is not `null`. The literal lives in a module-private `UNTITLED_COMBATANT_NAME`. Add a comment at the "absent from the map is not linked" rule: while the entity lists refetch after an entity delete, a combatant whose id is already gone must show its stored name, and treating it as linked would show "Untitled Combatant" instead of the stored name.

Test behaviors:

- `deriveCombatState.test.ts`: a number gives equal max and current and temp 0, with 0 and a negative number kept — catches a falsy check that turns 0 into "not set"; `null` gives `null`, `null`, 0; every item gets its own entry
- `shownCombatantNames.test.ts`: a single combatant shows its bare name; two of one entity show "Goblin 1" and "Goblin 2"; numbers keep their gap ("Goblin 1" and "Goblin 3") — catches renumbering by position; a renamed entity changes the shown name while the stored `name` stays old — catches showing the stored name for a linked entity; a linked entity with a `null` name shows "Untitled Combatant" and still numbers; a combatant whose entity is absent from the map shows its stored name — catches E1 losing the name; two entities with the same name do not share a number — catches numbering by name while linked; two combatants of a deleted entity share their stored name as numbering key and number on — catches E1 dropping the numbers; a combatant whose `sequenceNumber` is `null` shows its bare name even beside a sibling — catches "Goblin null"

### Frontend

`util/reorderIds.ts` is moved as listed (KAD "`reorderIds` moves to `src/util/reorderIds.ts`"); `ReorderableNavList.tsx` imports it from `@/util/reorderIds`.

`buildQueueEntries.ts` (in `EncounterQueue/helper/`):

```ts
export declare const buildQueueEntries: (
  queueItems: EncounterQueueItem[],
  baseEntities: BaseEntity[],
) => { id: string; name: string; imageId: string | null; maxHp: number | null; currentHp: number | null; tempHp: number }[];
```

It keeps the order of `queueItems`, builds an id-to-entity map and an id-to-name map from `baseEntities`, and joins `shownCombatantNames` and `deriveCombatState` (both from `@domain`, fed with the camelCase fields of each item). `imageId` is the linked entity's `image_id`, and `null` when the item has no entity or the entity is not in the list. The return type is inferred, not named. Test behaviors: keeps queue order; shows the entity's current name after a rename; a deleted entity's combatant keeps its stored name and gets `imageId` `null` — catches E1 showing a broken image; HP fields follow `starting_max_hp`.

`describeQueueEntryHp.ts` (in `EncounterQueueEntry/helper/`):

```ts
export declare const describeQueueEntryHp: (hp: {
  maxHp: number | null;
  currentHp: number | null;
  tempHp: number;
}) => { text: string; state: 'ok' | 'hurt' | 'down'; lostShare: number } | null;
```

`null` when `maxHp` or `currentHp` is `null`. `text` is `current / max`, followed by a space and `+<temp>` only when `tempHp` is above 0. `state` is `down` when `currentHp <= 0` or `maxHp <= 0` (checked first, `lostShare` 1), else `ok` when `currentHp >= maxHp` (`lostShare` 0), else `hurt` with `lostShare` `(maxHp - currentHp) / maxHp`. Test behaviors: `null` for an unset HP; `4 / 7` with `+2` only for temp above 0 and none for 0 — catches `+0`; the share of a hurt entry computed from max and current and ignoring temp — catches temp counted as health; `down` for current 0, a negative current, max 0 and a negative max — catches a division by zero and a missed grey case; `ok` at full HP.

`EncounterEntityImage.tsx` (props `imageId: string | null` and `size: number`; `FCProps<Props>`; the folder has no `index.ts` because it holds only its main file and its stylesheet, `app/src/CLAUDE.md` — Barrel Files, so importers use `.../EncounterEntityImage/EncounterEntityImage`)

- Purpose: the entity's image or, without one, the placeholder icon, in a square frame; shared by `EncounterQueueEntry` (this sub-feature) and `EncounterAddRow` (SF6), the two unrelated parents of the one near-identical branch, hence a peer of `EncounterQueue/` and `EncounterSidePanel/` (`.claude/rules/src-components.md` — Sub-component ownership).
- Behavior: no state and no handler. It renders `ImagePlaceholderFrame` (`@/components/ImagePlaceholderFrame/ImagePlaceholderFrame`) with `dimensions={{ width: size, height: size }}`, holding `ImageById` (`@/components/ImageById/ImageById`) with `imageId` when it is not `null` and otherwise `UserSquareIcon` from `lucide-react` with class `encounter-entity-image-icon`. It owns no size literal: each call site passes its own. Test behaviors: none, a component without an acceptance criterion that its own event handling decides (`app/src/CLAUDE.md` — Testing Policy); the Add row's component tests (SF6) render it.
- UI / Visual: `EncounterEntityImage.css` holds one rule, `.encounter-entity-image-icon`: `width: 100%`, `height: auto`, `color: var(--color-primary)`. `AvatarCell` (`app/src/components/SortableList/components/SortableListItem/components/AvatarCell/AvatarCell.tsx`) keeps its own copy of this branch and is not replaced, because it is a private sub-component of `SortableListItem` in `src/components/` and cannot import from `screens/`; its rule is not copied because its `stroke-width: 1px` is a raw value. KAD "The queue entry and the Add row share one `EncounterEntityImage` component".

  [DEFERRED-VIOLATION: `.claude/rules/src-css.md` — Design token obligation, in `app/src/components/SortableList/components/SortableListItem/components/AvatarCell/AvatarCell.css` (`stroke-width: 1px`, no `/* one-off */`)] The file belongs to another module and no part of this feature changes it, so it is reported, not fixed.

`EncounterQueueEntry.tsx` (props `id`, `name`, `imageId`, `maxHp`, `currentHp`, `tempHp`; `FCProps<Props>`)

- Purpose: one sortable queue row.
- Behavior: `useSortable({ id })`; the handle element (glyph `⠿`, class `encounter-queue-entry-handle`) receives `setActivatorNodeRef`, `attributes` and `listeners` (KAD "The queue entry's drag handle is the sortable activator"); the row has no click handler. It calls `describeQueueEntryHp` and shows the HP text only when the result is not `null`.
- UI / Visual: a row of handle, image block and a text block with the name (class `clip-text`) above the HP text. The image block is `div.encounter-queue-entry-image` (`position: relative`, `overflow: hidden`, `border-radius: var(--radius-lg)`) around `EncounterEntityImage` given `imageId` and `size` 64, imported as `../../../EncounterEntityImage/EncounterEntityImage` (the literal 64 is written here and nowhere else); for state `hurt` it also holds `div.encounter-queue-entry-tint`, absolutely placed against the bottom edge with `height: calc(var(--rt-encounter-queue-entry-hp-lost) * 100%)` and a translucent `--color-danger-rgb` background; state `down` adds the modifier `encounter-queue-entry-image--down`, which applies `filter: grayscale(…)`, and no tint. KAD "The queue entry and the Add row share one `EncounterEntityImage` component" and KAD "The HP tint is a translucent red layer from the bottom; grey replaces it at 0 HP or below".

  The row's `style` is one object cast `as React.CSSProperties` holding the sortable `transform` and `transition` and, when the HP description is not `null`, `--rt-encounter-queue-entry-hp-lost` set to `lostShare`. Every other value is a token. The tint's alpha and the grayscale amount are raw values: write them as plain numbers without `/* one-off */`, and report each with file, line and value at the end of the task (`.claude/rules/src-css.md`).

`EncounterQueue.tsx`

- Purpose: the queue column's list and its drag-and-drop frame.
- Behavior: reads `adventureId` and `encounterId` from the route; `useEncounterQueueItems(encounterId)` and `useAdventureBaseEntities(adventureId)`; while either is loading it renders the loading icon in `div.content-center`; otherwise it renders `buildQueueEntries(...)` as `EncounterQueueEntry` rows (key `id`) inside `DndContext` (`PointerSensor`, `KeyboardSensor` with `sortableKeyboardCoordinates`, `closestCenter`) and `SortableContext` (`verticalListSortingStrategy`, the entry ids). `onDragEnd` returns when there is no `over` or `active.id === over.id`, else calls `reorderQueueItems(reorderIds(ids, String(active.id), String(over.id)))`. An empty queue renders no row and no message.
- UI / Visual: `GlassPanel` (`intensity='off'`) with class `encounter-queue`, a flex column with `flex: 1`, `min-height: 0`, `overflow-y: auto` and `gap: var(--spacing-xs)`.

Test behaviors: none for the three components (a drag depends on pointer geometry and layout, which jsdom does not compute, and no other criterion is decided by their own event handling).

[MANUAL-VERIFY] Dragging an entry to another position moves it there, and the order survives leaving the encounter and returning (browser pane, web mode). It also survives restarting the app (hand test on the native host, for the human tester).

[MANUAL-VERIFY] A combatant of an entity whose single stat block has HP 0 shows `0 / 0` and a grey image with no tint, and one with no HP shows no HP text, no tint and no grey (browser pane).

[MANUAL-VERIFY] The red tint and the `+temp` text cannot be produced before Slice 2 gives a way to lose HP and set temp HP; they are unit-tested here (`describeQueueEntryHp`) and hand-checked in Slice 2 by the human tester.

[MANUAL-VERIFY] A long queue scrolls inside the left column while Duplicate and Delete stay visible below it (browser pane).

[MANUAL-VERIFY] Deleting a base entity keeps its combatants in the queue with the name they had when added and the placeholder image, and renaming the entity changes their shown name in every encounter (browser pane; web mode enforces foreign keys [spec-writer_16: ``grep -rn foreign_keys db src-tauri/src dev-data-server`` in `app/` — found only `dev-data-server/sqliteDatabase.ts:27`, `PRAGMA foreign_keys = ON`]; the test database does too, see SF1).
