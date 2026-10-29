# Sub-feature 1: Selection set [FOUNDATION]

Replaces the screen's single `selectedId` with a set of selected ids plus an anchor, adds Cmd/Ctrl-click and Shift-click, and passes the set through the screen, the queue and the sidebar. [FOUNDATION: SF2 depends on this] — the sidebar passes `selectedIds` to a tab that still takes `selectedId`, so the type-check fails until SF2 lands. Do not run baseline checks after this SF alone — run only after all SFs named in the annotation are complete.

Stage as unit: this SF's files and SF2's files, committed together after SF2's check rows pass:

- `app/src/screens/encounter/helper/applySelectionClick.ts`, `app/src/screens/encounter/helper/__tests__/applySelectionClick.test.ts`
- `app/src/screens/encounter/helper/pruneSelection.ts`, `app/src/screens/encounter/helper/__tests__/pruneSelection.test.ts`
- `app/src/screens/encounter/hooks/useEncounterSelection.ts`, `app/src/screens/encounter/hooks/__tests__/useEncounterSelection.test.ts`
- `app/src/screens/encounter/EncounterScreen.tsx`
- `app/src/screens/encounter/components/EncounterQueue/EncounterQueue.tsx`
- `app/src/screens/encounter/components/EncounterQueue/components/EncounterQueueEntry/EncounterQueueEntry.tsx`, `app/src/screens/encounter/components/EncounterQueue/components/EncounterQueueEntry/EncounterQueueEntry.css`, `app/src/screens/encounter/components/EncounterQueue/components/EncounterQueueEntry/__tests__/EncounterQueueEntry.test.tsx`
- `app/src/screens/encounter/components/EncounterSidebar/EncounterSidebar.tsx`, `app/src/screens/encounter/components/EncounterSidebar/__tests__/EncounterSidebar.test.tsx`
- `app/src/screens/encounter/components/EncounterSidebar/components/EncounterCombatantActionsTab/hooks/useActionAmounts.ts`, `app/src/screens/encounter/components/EncounterSidebar/components/EncounterCombatantActionsTab/hooks/__tests__/useActionAmounts.test.ts`
- `app/src/screens/encounter/components/EncounterSidebar/components/EncounterCombatantActionsTab/helper/settleActionAmounts.ts`, `app/src/screens/encounter/components/EncounterSidebar/components/EncounterCombatantActionsTab/helper/__tests__/settleActionAmounts.test.ts`
- `app/src/screens/encounter/components/EncounterSidebar/components/EncounterCombatantActionsTab/helper/planGroupAction.ts`, `app/src/screens/encounter/components/EncounterSidebar/components/EncounterCombatantActionsTab/helper/__tests__/planGroupAction.test.ts`
- `app/src/screens/encounter/components/EncounterSidebar/components/EncounterCombatantActionsTab/components/EncounterCombatantActionRow/EncounterCombatantActionRow.tsx`, `app/src/screens/encounter/components/EncounterSidebar/components/EncounterCombatantActionsTab/components/EncounterCombatantActionRow/EncounterCombatantActionRow.css`
- `app/src/screens/encounter/components/EncounterSidebar/components/EncounterCombatantActionsTab/EncounterCombatantActionsTab.tsx`, `app/src/screens/encounter/components/EncounterSidebar/components/EncounterCombatantActionsTab/EncounterCombatantActionsTab.css`, `app/src/screens/encounter/components/EncounterSidebar/components/EncounterCombatantActionsTab/__tests__/EncounterCombatantActionsTab.test.tsx`
- deleted: `app/src/screens/encounter/components/EncounterSidebar/components/EncounterCombatantActionsTab/helper/getActionAvailability.ts`, `app/src/screens/encounter/components/EncounterSidebar/components/EncounterCombatantActionsTab/helper/__tests__/getActionAvailability.test.ts`

## Files affected

Paths below start at `app/src/screens/encounter/` (`<screen>`); `<entry>` is `<screen>/components/EncounterQueue/components/EncounterQueueEntry`.

New:

- `<screen>/helper/applySelectionClick.ts`, `<screen>/helper/__tests__/applySelectionClick.test.ts`
- `<screen>/helper/pruneSelection.ts`, `<screen>/helper/__tests__/pruneSelection.test.ts`

Modified:

- `<screen>/hooks/useEncounterSelection.ts`, `<screen>/hooks/__tests__/useEncounterSelection.test.ts` — every `selectedId` assertion becomes `selectedIds`, and each `select('a')` call gains the modifiers argument
- `<screen>/EncounterScreen.tsx`
- `<screen>/components/EncounterQueue/EncounterQueue.tsx`
- `<entry>/EncounterQueueEntry.tsx`, `<entry>/EncounterQueueEntry.css`
- `<entry>/__tests__/EncounterQueueEntry.test.tsx` — the assertion `onSelect.mock.calls` `toEqual([['item-7']])` goes stale (the call now carries the modifiers object), and `StatefulEntry`'s `onSelect={setSelectedId}` becomes `onSelect={(id) => setSelectedId(id)}` so React's state setter receives the id alone
- `<screen>/components/EncounterSidebar/EncounterSidebar.tsx`
- `<screen>/components/EncounterSidebar/__tests__/EncounterSidebar.test.tsx` — `StatefulSidebar` passes `selectedIds={[]}` in place of `selectedId={null}`

Barrels read and unchanged, each an explicit named export (`app/CLAUDE.md` — Directory Structure): `<screen>/index.ts`, `<screen>/components/EncounterQueue/index.ts`, `<entry>/index.ts`, `<screen>/components/EncounterSidebar/index.ts`.

## Frontend layer

### Helper `applySelectionClick`

Declares the two shared types (KAD: `SelectionState` and `SelectionModifiers` are declared in `applySelectionClick.ts`) and returns the next state for one click. Cases, in this order: (1) `shift` with `anchorId` shown: `ids` are the entries of `shownIds` from the anchor's index to the clicked id's index, both included, in either direction, and `anchorId` stays; (2) `shift` with no anchor or an anchor not in `shownIds`: `ids = [clickedId]`, `anchorId = clickedId`; (3) `toggle`: the id is added to `ids` when absent and removed when present, `anchorId = clickedId`; (4) otherwise `ids = [clickedId]`, `anchorId = clickedId`.

```ts
export type SelectionModifiers = { shift: boolean; toggle: boolean };
export type SelectionState = { ids: string[]; anchorId: string | null };

export declare const applySelectionClick: (
  state: SelectionState,
  shownIds: string[],
  clickedId: string,
  modifiers: SelectionModifiers,
) => SelectionState;
```

### Helper `pruneSelection`

Returns the argument object itself when every id is in `shownIds` and `anchorId` is `null` or shown; otherwise a new state with the unshown ids filtered out and `anchorId` set to `null` when it is not shown. The identity matters: the hook sets state during render only when the returned object differs.

```ts
export declare const pruneSelection: (
  state: SelectionState,
  shownIds: string[],
) => SelectionState;
```

### Hook `useEncounterSelection`

Order inside the hook: the `useState` calls, the encounter-change reset, the prune, then `selectedIds`. A module constant `EMPTY_SELECTION: SelectionState` (`{ ids: [], anchorId: null }`) is the initial state, the reset value and the Escape value. The encounter-change reset sets `EMPTY_SELECTION` and the tab `add`. The prune sets state during render when `pruneSelection` returns another object, with the existing comment kept in terms of ids: the ids are cleared in state, so they stay cleared when the combatant returns (Hide defeated off, a later revert). `selectedIds` is `shownIds.filter((id) => selection.ids.includes(id))`. Escape sets `EMPTY_SELECTION` and leaves the tab. `select` sets `applySelectionClick(current, shownIds, id, modifiers)` through a functional update and keeps today's tab rule (only the Add tab follows a selecting click), for every click including a Cmd/Ctrl-click that leaves nothing selected.

```ts
export type SidebarTab = 'add' | 'actions' | 'log';

export declare const useEncounterSelection: (
  encounterId: string,
  shownIds: string[],
) => {
  selectedIds: string[];
  activeTab: SidebarTab;
  select: (id: string, modifiers: SelectionModifiers) => void;
  setActiveTab: (tab: SidebarTab) => void;
};
```

### Component `EncounterScreen`

Purpose: coordinates the selection between the queue and the sidebar. Behavior: destructures `selectedIds` and `select` from the hook and passes `selectedIds` and `onSelect={select}` to `EncounterQueue` and `selectedIds` to `EncounterSidebar`. UI / Visual: unchanged.

### Component `EncounterQueue` (selection wiring)

Purpose: renders the queue entries. Behavior: props are `selectedIds: string[]` and `onSelect: (id: string, modifiers: SelectionModifiers) => void`; each entry gets `selected={selectedIds.includes(entry.id)}` and the unchanged `onSelect`. The import of `reorderIds` and the drag handling stay as they are until SF3. UI / Visual: unchanged.

### Component `EncounterQueueEntry`

Purpose: one queue row that reports clicks. Behavior: the click handler calls `onSelect(id, { shift: event.shiftKey, toggle: event.metaKey || event.ctrlKey })`; `shiftKey`, `metaKey` and `ctrlKey` are `boolean` on React's `MouseEvent` [spec-writer_12: `app/node_modules/@types/react/index.d.ts:2247-2260` — `ctrlKey: boolean`, `metaKey: boolean`, `shiftKey: boolean` on `MouseEvent`]. `onSelect` is typed `(id: string, modifiers: SelectionModifiers) => void`, with `SelectionModifiers` imported from `<screen>/helper/applySelectionClick`. UI / Visual: `EncounterQueueEntry.css` adds `user-select: none` to `.encounter-queue-entry`, so a Shift-click does not select page text; the handle's own declaration stays.

Cleanup found by the scan of this Modified file: `imageClassName` builds a computed class name with a template literal, and `.claude/rules/src-components.md` — Variant system requires `cn()` for computed class names, and root `CLAUDE.md` — "Active check on touched files" requires the fix in this same edit pass. It becomes ``cn('encounter-queue-entry-image', `encounter-queue-entry-image--${imageLook}`)`` with `cn` imported from `@/util/className`; prettier puts the two literals on their own lines, so the `// Stryker disable next-line StringLiteral: class names only; jsdom computes no style and component tests may not assert a class name` comment moves to sit directly above each of them.

### Component `EncounterSidebar`

Purpose: tab container. Behavior: prop `selectedId: string | null` becomes `selectedIds: string[]` and is passed to `EncounterCombatantActionsTab` as `selectedIds` (consumed in SF2). UI / Visual: unchanged.

The contract blocks above type-check and lint clean under the project's toolchain [spec-writer_13: ran `npx tsc --noEmit` and `npx eslint` from `app/` on a scratch file in `app/src/screens/encounter/helper/` holding every contract block of this spec's SF1 to SF3 with `import type { LogEntryPayload } from '@domain'` — tsc reported only `declared but never used` for the row `Props` and `BlockDrag` types; eslint reported only `local/no-unused-exports` and `@typescript-eslint/no-unused-vars` on the scratch's own declarations].

## Tests

`applySelectionClick.test.ts` covers:

- a plain click selects only the clicked id and sets the anchor — catches a selection that keeps the previous ids or leaves the anchor stale
- a toggle adds an unselected id, removes a selected one and sets the anchor to the clicked id even on removal — catches a toggle that replaces the selection or leaves the anchor behind
- a Shift-click selects the shown range with both ends, from an anchor before and from one after the clicked id, and a second Shift-click ranges from the same anchor — catches an off-by-one end, a reversed range or an anchor moved by Shift
- a Shift-click with no anchor, or with an anchor absent from `shownIds`, selects only the clicked id and anchors it — catches a range from index -1
- Shift wins when `toggle` is also true — catches a toggle that takes precedence

`pruneSelection.test.ts` covers:

- the same object comes back when nothing is dropped — catches a fresh object per render, which loops the render-time `setState`
- an unshown id is dropped and the shown ids stay — catches a prune that clears all or none
- an unshown anchor becomes `null` while a shown anchor stays — catches a stale anchor

`useEncounterSelection.test.ts` covers:

- the initial state: nothing selected, tab `add`
- a plain click selects and moves the Add tab to Actions; from Actions or Log the tab stays — as today
- a toggle click that leaves nothing selected still moves the Add tab to Actions — catches a tab switch tied to a non-empty selection
- `selectedIds` follows the order of `shownIds`, whatever order the clicks came in — catches click-order output
- Escape clears the selection and the anchor, so a Shift-click afterwards selects only the clicked id — catches an anchor that survives Escape
- a selected id that leaves `shownIds` is dropped while the others stay, and stays dropped when it returns — catches display-only hiding
- an encounter id change clears the selection, the anchor and the tab
- the Escape listener is removed on unmount

`EncounterQueueEntry.test.tsx` adds one test per modifier mapping — plain, Shift, Meta, Ctrl, Shift with Meta — asserting the modifiers object `onSelect` received, with the keys held through `user.keyboard` — catches a platform-specific key, only one of Meta and Ctrl mapped, or Shift losing to Meta.

## Verification

After SF2's check rows pass and before the shared commit, run `pnpm run mutation-check -- app/src/screens/encounter/helper/applySelectionClick.ts app/src/screens/encounter/helper/pruneSelection.ts app/src/screens/encounter/hooks/useEncounterSelection.ts app/src/screens/encounter/components/EncounterQueue/components/EncounterQueueEntry/EncounterQueueEntry.tsx app/src/screens/encounter/components/EncounterSidebar/EncounterSidebar.tsx` and resolve every survivor. `EncounterQueue.tsx` gets its test in SF3 and is run there.
