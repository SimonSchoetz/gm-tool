# Sub-feature 2: Shown item in the selection

The selection state holds the shown combatant, and an Escape pressed in an editable element of the middle column leaves both the selection and the shown combatant alone. `useEncounterSelection` returns `shownItemId`; its consumer is `EncounterScreen` in sub-feature 4, which passes it to `EncounterShownCombatant`.

## Files affected

Modified:

- `app/src/screens/encounter/helper/applySelectionClick.ts` — `SelectionState` gains `shownItemId`.
- `app/src/screens/encounter/helper/__tests__/applySelectionClick.test.ts` — every state literal passed in and every `toEqual({ ids, anchorId })` gains `shownItemId` and goes stale without it.
- `app/src/screens/encounter/helper/pruneSelection.ts`.
- `app/src/screens/encounter/helper/__tests__/pruneSelection.test.ts` — the same stale literals and `toEqual` results.
- `app/src/screens/encounter/hooks/useEncounterSelection.ts`.
- `app/src/screens/encounter/hooks/__tests__/useEncounterSelection.test.ts` — `renderSelection` calls the hook with two arguments and stops compiling; it passes a third.
- `app/src/screens/encounter/EncounterScreen.tsx` — attaches the ref to the middle column and passes it to the hook.

New:

- `app/src/screens/encounter/helper/isEditableWithin.ts`
- `app/src/screens/encounter/helper/__tests__/isEditableWithin.test.ts`

Every `SelectionState` object literal is in the files above [spec-writer_12: `grep -rln anchorId app/src` — found only `useEncounterSelection.ts`, `pruneSelection.ts`, `applySelectionClick.ts` and their two helper tests].

## Frontend

Contracts [spec-writer_24: ran `npx tsc --noEmit` from `app/` with these three declarations in a scratch module in `app/src/screens/encounter/helper/` — exit 0; `npx eslint` on it reported only `local/no-unused-exports` on the three exports]:

```ts
export type SelectionState = {
  ids: string[];
  anchorId: string | null;
  shownItemId: string | null;
};

export declare const useEncounterSelection: (
  encounterId: string,
  shownIds: string[],
  middleColumnRef: React.RefObject<HTMLElement | null>,
) => {
  selectedIds: string[];
  shownItemId: string | null;
  activeTab: SidebarTab;
  select: (id: string, modifiers: SelectionModifiers) => void;
  setActiveTab: (tab: SidebarTab) => void;
};

export declare const isEditableWithin: (
  container: HTMLElement | null,
  target: EventTarget | null,
) => boolean;
```

- `applySelectionClick`: every branch sets `shownItemId` to the clicked id, except the toggle branch that removes the clicked id, which sets it to null when it was the shown id and keeps it otherwise. The name is `shownItemId`, never `shownId`: the hook already has a `shownIds` parameter meaning the entries the queue shows.
- `pruneSelection`: also sets `shownItemId` to null when it is not among the kept ids, and returns the same object when nothing changed, as today.
- `useEncounterSelection`: `EMPTY_SELECTION` gains `shownItemId: null`, so Escape and an encounter id change reset it. It returns `shownItemId` from the pruned state computed in the render, so a shown id that just left `shownIds` is never returned. The Escape listener clears the selection only when `event.key === 'Escape'` and `isEditableWithin(middleColumnRef.current, event.target)` is false. The ref is read inside the listener, never during render (decision: "The Escape exemption is decided from the keydown's target against the middle column element, passed to `useEncounterSelection` as a ref" in the root Key Architectural Decisions). The effect's dependency array becomes `[middleColumnRef]`; update the wording of the Stryker disable comment above it to say the array holds one ref object that never changes. A ref passed to a hook and read in an effect listener passes the lint row [spec-writer_13: `.claude/knowledge/eslint.md`, the entry beginning "`react-hooks/refs` does not fire on a hook that receives a ref object"].
- `isEditableWithin`: true exactly when `container` is non-null, `target` is an `Element` that `container` contains, and the target or one of its ancestors matches `input, textarea, [contenteditable="true"]` [spec-writer_28: ran `npx tsc --noEmit` from `app/` with a scratch module holding this rule with `container.contains(target)` after an `instanceof Element` check and `target.closest(…) !== null` — exit 0]. A rendered Lexical editor carries `contenteditable="true"`, and a read-only one `contenteditable="false"` (`.claude/knowledge/react.md`, the entry beginning "React sets `contentEditable={true}`").
- `EncounterScreen.tsx`: declare `middleColumnRef` with `useRef<HTMLDivElement | null>(null)` above the `useEncounterSelection` call (the call consumes it as an argument in the same render), put it as `ref` on the `encounter-screen-middle-column` div, and pass it as the third argument. The hook runs before the loading early return and the div mounts after it; the listener reads `.current` at event time, so the order is safe.

State transitions of the selection state (the handlers share `shownItemId`):

| Trigger | State read | State mutated | No-op when |
| --- | --- | --- | --- |
| Plain click | none | `ids` is the clicked id, `anchorId` and `shownItemId` the clicked id | never |
| Cmd/Ctrl-click on an unselected id | `ids` | the id joins `ids`; `anchorId` and `shownItemId` become the clicked id | never |
| Cmd/Ctrl-click on the selected shown id | `ids`, `shownItemId` | the id leaves `ids`; `anchorId` becomes the clicked id; `shownItemId` becomes null | never |
| Cmd/Ctrl-click on a selected id that is not shown | `ids`, `shownItemId` | the id leaves `ids`; `anchorId` becomes the clicked id; `shownItemId` stays | never |
| Shift-click with a shown anchor | `anchorId`, `shownIds` | `ids` becomes the range; `shownItemId` becomes the clicked id; `anchorId` stays | the anchor is null or not shown: it acts as a plain click |
| Prune, on every render | `shownIds` | `ids` loses unshown ids; `anchorId` and `shownItemId` become null when unshown | everything is shown: the same object returns |
| Escape outside an editable element of the middle column | `middleColumnRef`, event target | `ids`, `anchorId` and `shownItemId` reset to `EMPTY_SELECTION` | never |
| Escape inside an editable element of the middle column | `middleColumnRef`, event target | none | always |
| Encounter id changes | previous encounter id | the selection resets to `EMPTY_SELECTION` and the tab to Add | the id is unchanged |

## Tests — behaviours and the defect each catches

- `applySelectionClick.test.ts`: a plain click and a toggle that adds show the clicked id; a Shift-click shows the clicked id, with and without an anchor (each catches the shown item left on the old entry); a toggle that removes the shown id leaves nothing shown, a toggle that removes another id keeps the shown id (catches a shown entry outside the selection, and a shown entry lost by an unrelated removal); Shift wins over a toggle for the shown id too.
- `pruneSelection.test.ts`: a shown id that leaves the kept ids becomes null and a kept one stays; the same object comes back when the shown id is kept (catches a removed or hidden combatant staying in the middle column, and a needless state write on every render).
- `useEncounterSelection.test.ts`: a click shows the clicked id; Cmd-removal of the shown id and of another id; Escape clears the shown id; an encounter id change resets it; a shown id that leaves `shownIds` is not returned in the same render (catches a one-render flash of a vanished combatant). Escape dispatched on an `input` inside the column element keeps both the selection and the shown id; on a `button` inside the column, and on an `input` outside it, it clears both (catches an Escape that clears while typing, and an exemption that swallows every Escape in the column). The existing Escape and listener-removal cases stay.
- `isEditableWithin.test.ts`: null container, a target outside the container and a target that is not an element give false; an `input`, a `textarea`, a `contenteditable="true"` element and a child of one inside the container give true; a `button` and a `contenteditable="false"` element give false (catches an exemption that fires outside the column or on a non-editable element).

## Verification step

After the check rows pass and before the commit, run `pnpm run mutation-check -- app/src/screens/encounter/helper/applySelectionClick.ts app/src/screens/encounter/helper/pruneSelection.ts app/src/screens/encounter/hooks/useEncounterSelection.ts app/src/screens/encounter/helper/isEditableWithin.ts` and resolve every survivor.
