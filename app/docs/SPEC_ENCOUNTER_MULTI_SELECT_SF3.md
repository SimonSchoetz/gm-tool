# Sub-feature 3: Block drag

Dragging a selected entry by its handle moves every selected entry as one block to the drop position, keeping their order among themselves. While the block is held, the other selected entries leave the list and the dragged entry shows a "+N" badge, N the number of other selected entries.

## Files affected

`<queue>` is `app/src/screens/encounter/components/EncounterQueue`; `<entry>` is `<queue>/components/EncounterQueueEntry`.

New:

- `<queue>/helper/reorderIdsAsBlock.ts`, `<queue>/helper/__tests__/reorderIdsAsBlock.test.ts`
- `<queue>/helper/getBlockDragOtherIds.ts`, `<queue>/helper/__tests__/getBlockDragOtherIds.test.ts`
- `<queue>/__tests__/EncounterQueue.test.tsx`

Modified:

- `<queue>/EncounterQueue.tsx`
- `<entry>/EncounterQueueEntry.tsx`, `<entry>/EncounterQueueEntry.css`
- `<entry>/__tests__/EncounterQueueEntry.test.tsx` — `renderEntry` and `StatefulEntry` render the entry with the new required prop `otherDraggedCount`, so both gain `otherDraggedCount={0}`; no assertion goes stale

Barrels read and unchanged, explicit named exports: `<queue>/index.ts`, `<entry>/index.ts`. `<queue>/helper/` is a function-grouping folder and gets no `index.ts`.

## Frontend layer

### Helper `getBlockDragOtherIds`

Returns `selectedIds.filter((id) => id !== activeId)` when `selectedIds` includes `activeId`; otherwise an empty array (a drag of an unselected entry is a single drag). With the dragged id as the only selected one, the filter already returns an empty array, so the function carries no separate length check. Extracted because it is a branching computation from arguments alone (`.claude/rules/src-components.md` — Component Library).

```ts
export declare const getBlockDragOtherIds: (
  selectedIds: string[],
  activeId: string,
) => string[];
```

### Helper `reorderIdsAsBlock`

The drop rule is in the KAD "One reorder path serves single and block drags, and it delegates to `reorderIds`". `blockIds` includes `activeId`; its order does not matter, the result orders the block as `ids` does. The caller never passes an `overId` that is in `blockIds`.

```ts
export declare const reorderIdsAsBlock: (
  ids: string[],
  blockIds: string[],
  activeId: string,
  overId: string,
) => string[];
```

### Component `EncounterQueue` (block drag)

Purpose: holds the drag. Behavior: state `blockDrag: { activeId: string; otherIds: string[]; folded: boolean } | null`, declared with `useState` directly after the `useSensors` call and above the `loading` early return (rules of hooks).

```ts
type BlockDrag = { activeId: string; otherIds: string[]; folded: boolean };
```

- `onDragStart`: `otherIds = getBlockDragOtherIds(selectedIds, String(active.id))`; when empty, `blockDrag` stays `null`. Otherwise it is set with `folded: false` and one `requestAnimationFrame` is scheduled whose callback sets `folded: true` through a functional update that leaves `null` and an already folded state as they are. The selection is never touched.
- Rendering: while `blockDrag?.folded` is true, both the rendered entries and `SortableContext`'s `items` omit `otherIds`. Each entry gets `selected={selectedIds.includes(entry.id)}` and `otherDraggedCount={blockDrag?.activeId === entry.id ? blockDrag.otherIds.length : 0}`; the badge shows from the first commit.
- `onDragCancel`: sets `blockDrag` to `null`.
- `onDragEnd`: sets `blockDrag` to `null`, returns when there is no `over` or `over.id === active.id`, otherwise calls `reorderQueueItems(reorderIdsAsBlock(queueItems.map((item) => item.id), blockIds, activeId, overId))` with `blockIds = [activeId, ...(blockDrag?.otherIds ?? [])]`. The full list in the data-access layer's order is passed, never the shown ids, as today's comment says. The `reorderIds` import goes.
- Place a code comment at the `requestAnimationFrame` call: removing the other entries in the commit that starts the drag leaves the dragged entry above the pointer by their height, because dnd-kit measures the entry after the removal; the failure is invisible to tests (jsdom computes no layout).

UI / Visual: unchanged except the badge and the folded list.

### Component `EncounterQueueEntry` (badge)

Purpose: shows how many other entries travel with the dragged one. Behavior: new required prop `otherDraggedCount: number`; when it is above 0 the entry renders `+N` (N the count) in a `span.encounter-queue-entry-badge`. UI / Visual: `.encounter-queue-entry` gains `position: relative`; the badge is `position: absolute` at the entry's top right (`top: var(--spacing-xs)`, `right: var(--spacing-sm)`) with `background-color: var(--color-primary)`, `color: var(--color-fg)`, `padding: 0 var(--spacing-sm)`, `border-radius: var(--radius-md)`, `font-size: var(--font-size-md)`. `position: relative` changes no other element: `.encounter-queue-entry-image` is already `position: relative` and the tint positions against it.

The contract blocks above type-check and lint clean under the project's toolchain [spec-writer_13: ran `npx tsc --noEmit` and `npx eslint` from `app/` on a scratch file in `app/src/screens/encounter/helper/` holding every contract block of this spec's SF1 to SF3 with `import type { LogEntryPayload } from '@domain'` — tsc reported only `declared but never used` for the row `Props` and `BlockDrag` types; eslint reported only `local/no-unused-exports` and `@typescript-eslint/no-unused-vars` on the scratch's own declarations].

## Tests

`reorderIdsAsBlock.test.ts` covers:

- a block moved down lands directly after the dropped-on id and one moved up directly before it, with the block in the list's order — catches a drop one slot off or a reversed block
- a block with non-adjacent members comes out adjacent
- ids that are hidden or removed (in `ids`, never in the block) keep their order relative to the ids that did not move — catches a reorder over the shown ids only
- a one-id block equals `reorderIds` — catches the two drop rules drifting

On `[A, B, C, D, E, F]` with the block B, D, E: dragging D onto F gives `A C F B D E`, dragging E onto A gives `B D E A C F` [spec-writer_8: ran `node block.mjs` — `ACFBDE` and `BDEACF`].

`getBlockDragOtherIds.test.ts` covers:

- two or more selected including the dragged id: the others, in `selectedIds` order — catches a list that includes the dragged id
- the dragged id not selected: empty — catches moving a selection the user did not grab
- only the dragged id selected: empty — catches a one-entry "block" with a badge

`EncounterQueue.test.tsx` renders the queue with five combatants through the service mocks of `EncounterCombatantActionsTab.test.tsx`, drives a drag with `user.pointer` on a handle other than the first entry's (`over` is always the first entry under jsdom, `.claude/knowledge/dnd-kit.md`), and covers:

- dragging a selected entry saves one reorder in which the selected entries are adjacent in their original order and the others keep their order — catches a drag that moves the dragged entry alone or scrambles the block
- dragging an unselected entry moves only that entry and never calls `onSelect` — catches a block taken from a selection the user did not grab
- while the block is held, the other selected names are absent and the dragged entry shows `+N` — catches a missing fold or a wrong count
- Escape during the drag saves nothing and the entries return — catches a cancelled drag that still saves
- an id in `selectedIds` renders as current and the others do not; a click on an entry reports its id with the modifiers — catches a wrong `selected` mapping or an unwired `onSelect`

`EncounterQueueEntry.test.tsx` adds one test: `+N` renders for `otherDraggedCount` above 0 and nothing renders at 0 — catches the render-time branch.

## Verification

After the check rows pass, run `pnpm run mutation-check -- app/src/screens/encounter/components/EncounterQueue/EncounterQueue.tsx app/src/screens/encounter/components/EncounterQueue/helper/reorderIdsAsBlock.ts app/src/screens/encounter/components/EncounterQueue/helper/getBlockDragOtherIds.ts app/src/screens/encounter/components/EncounterQueue/components/EncounterQueueEntry/EncounterQueueEntry.tsx` and resolve every survivor.

In the browser pane in web mode (`pnpm run web`), with a queue that does not overflow and again with one that does, perform these pointer drags; a drag the pane cannot perform becomes a hand test for the user, named in the implementer's result:

[MANUAL-VERIFY] Select three entries above a fourth plus the fourth, press the fourth's handle and move the pointer: the pointer stays over the dragged entry's own handle at every move, never over a neighbour (offset 0 px between the entry's centre and the pointer in the scratch run [spec-writer_1: same run as in the KAD]). If it does not, stop and report it to the lead. The same pointer drag is repeated in the native app with `pnpm run dev`: a hand test for the user, named in the implementer's result, because the host is a WebKit webview and the scratch run drove headless Chrome only; no probe covered it.

[MANUAL-VERIFY] Queue A to F with B, D and E selected: dragging D by its handle onto F and releasing shows `A C F B D E`, and dragging E onto A shows `B D E A C F`; after a release the entries that folded are back, in those places.

[MANUAL-VERIFY] Press a selected entry's handle and release without moving: the order and the selection are as before, and the folded entries are back in their places.

[MANUAL-VERIFY] Keyboard drag on queue A to F with B and D selected: focus D's handle, press Space, ArrowDown, Space. The order is `A C E B D F` (D moves past E in the folded list `A C D E F`, then the block replaces D), and nothing throws [spec-writer_14: ran `node kb.mjs` — `reorderIdsAsBlock` as the KAD defines it, on `[A, B, C, D, E, F]`, block B and D, dragged D, dropped on E — `ACEBDF`].
