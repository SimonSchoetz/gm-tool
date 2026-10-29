# Sub-feature 2: Group actions in the Actions tab

The Actions tab shows the buttons at the top and one row per selected combatant below them, with a shared amount field above the buttons from two selected combatants on. Each button records one log entry that lists every target it changes. This SF completes SF1's Foundation: run the check rows after it, and commit it with SF1 (SF1 lists the files to stage).

## Files affected

`<screen>` is `app/src/screens/encounter`; `<tab>` is `<screen>/components/EncounterSidebar/components/EncounterCombatantActionsTab`.

New:

- `<tab>/hooks/useActionAmounts.ts`, `<tab>/hooks/__tests__/useActionAmounts.test.ts`
- `<tab>/helper/settleActionAmounts.ts`, `<tab>/helper/__tests__/settleActionAmounts.test.ts`
- `<tab>/helper/planGroupAction.ts`, `<tab>/helper/__tests__/planGroupAction.test.ts`
- `<tab>/components/EncounterCombatantActionRow/EncounterCombatantActionRow.tsx`, `<tab>/components/EncounterCombatantActionRow/EncounterCombatantActionRow.css`

Modified:

- `<tab>/EncounterCombatantActionsTab.tsx`, `<tab>/EncounterCombatantActionsTab.css`
- `<tab>/__tests__/EncounterCombatantActionsTab.test.tsx` — `renderTab(selectedId)` and both `rerender(<EncounterCombatantActionsTab selectedId=… />)` calls take `selectedIds` arrays; `amountField()` finds the row field by its new label `Amount for Goblin` (the name `Amount` no longer matches); the test "keeps the amount after an action and after the selection passes through empty" goes stale in its rerender calls only

Deleted:

- `<tab>/helper/getActionAvailability.ts`, `<tab>/helper/__tests__/getActionAvailability.test.ts` — replaced by `planGroupAction`; the tab is the only importer (grep `getActionAvailability` under `app/src`, `app/docs`, `app/services`, `app/domain` — found in the tab, the two files and `app/docs/features/encounter-queue.md`, which SF4 edits)

Barrel read and unchanged: `<tab>/index.ts` is the explicit named export of the tab; `hooks/`, `helper/` and `components/` stay internal.

## Frontend layer

### Helper `settleActionAmounts`

Pure render-time step over the amounts state; returns the argument object itself when nothing changes. With exactly one id in `selectedIds`: `sharedText` becomes that id's row text when it has one, `rowTexts` becomes empty. Otherwise `rowTexts` keeps only the keys in `selectedIds` (none when nothing is selected, `sharedText` untouched). The state type lives here, since the hook imports the helper.

```ts
export type ActionAmountsState = {
  sharedText: string;
  rowTexts: Record<string, string>;
};

export declare const settleActionAmounts: (
  state: ActionAmountsState,
  selectedIds: string[],
) => ActionAmountsState;
```

### Hook `useActionAmounts`

State is `ActionAmountsState`, initially `{ sharedText: '', rowTexts: {} }`. The hook settles during render with the same set-state-in-render step as `useEncounterSelection`'s prune. `setSharedText(text)` sets `sharedText` and empties `rowTexts`; `setRowText(id, text)` sets that row's text; `amountTextOf(id)` is `rowTexts[id] ?? sharedText`. The existing Stryker comment on the initial text (`a number input reads any non-numeric text as empty…`) moves to the initial state.

```ts
export declare const useActionAmounts: (selectedIds: string[]) => {
  sharedText: string;
  amountTextOf: (id: string) => string;
  setSharedText: (text: string) => void;
  setRowText: (id: string, text: string) => void;
};
```

### Helper `planGroupAction`

Replaces `getActionAvailability`. Applicable rows per kind: Damage and Heal the rows with HP set, Set temp HP and Set max HP every row, Mark defeated the rows not defeated, Unmark defeated the rows defeated, Remove every row. The result is null when no row applies and, for the four amount kinds, when any applicable row has no valid amount; a skipped row's amount never blocks. The payload is in the stored shape, in row order: `targets[{ queueItemId, amount }]` for Damage and Heal, `targets[{ queueItemId, value }]` for Set temp HP and Set max HP, `queueItemIds` for Mark defeated, Unmark defeated and Remove. The result type is the union over kinds of `{ kind, payload }`, so `recordLogEntry(plan.kind, plan.payload)` type-checks without a cast [spec-writer_10: ran `npx tsc --noEmit` from `app/` on a scratch file holding this type, the call and a body with three `case` groups — no error; `npx eslint` on it reported only `local/no-unused-exports` on the scratch's exports].

```ts
type GroupActionKind =
  | 'damage'
  | 'heal'
  | 'temp-hp'
  | 'max-hp'
  | 'defeated'
  | 'undefeated'
  | 'removed';

export type GroupActionPlan = {
  [K in GroupActionKind]: { kind: K; payload: LogEntryPayload<K> };
}[GroupActionKind];

export declare const planGroupAction: (
  kind: GroupActionKind,
  rows: {
    id: string;
    amount: number | null;
    hasHp: boolean;
    defeated: boolean;
  }[],
) => GroupActionPlan | null;
```

`LogEntryPayload` comes from `@domain`.

### Component `EncounterCombatantActionRow`

Purpose: one selected combatant's name, HP and own amount field. Behavior: props below; the field calls `onAmountChange` with the typed text. Single file, no `index.ts`, imported by the tab as `./components/EncounterCombatantActionRow/EncounterCombatantActionRow`. UI / Visual: the name in a `clip-text` div, the HP line under it, the amount `Input` (`type='number'`, `min={0}`, `placeholder='Amount'`, `aria-label` `Amount for <name>`) on the right. The four rules `-row`, `-text`, `-hp`, `-amount` move from the tab's stylesheet unchanged into the row's stylesheet, renamed `encounter-combatant-action-row`, `-text`, `-hp`, `-amount` (`app/src/CLAUDE.md` — Styles); the amount rule keeps its parent-qualified selector so it still wins over `.input`.

```ts
type Props = {
  name: string;
  hpText: string;
  amountText: string;
  onAmountChange: (text: string) => void;
};
```

### Component `EncounterCombatantActionsTab`

Purpose: applies one action to every selected combatant. Behavior: prop `selectedIds: string[]`. Call order: `useParams`, `useEncounterQueueEntries`, `useEncounterLogEntries`, `useActionAmounts(selectedIds)`, all above the empty-state return (rules of hooks; the amounts survive an empty selection, as the held-in-this-component comment says). Rows are the entries whose id is in `selectedIds`, in queue order. Each row's plan input is `{ id, amount: parseActionAmount(amountTextOf(id)), hasHp: describeQueueEntryHp(entry) !== null, defeated: entry.defeated }`. Seven `planGroupAction` results, one per button, drive `disabled={isWriting || plan === null}`; the click goes through one `recordPlan(plan: GroupActionPlan | null)` handler (type imported from the helper) that records `recordLogEntry(plan.kind, plan.payload)`. Its `if (plan === null) return;` guard is unreachable from the UI (the button is disabled), so it carries the `// Stryker disable next-line ConditionalExpression` comment the old guards carried. With no selected entry the tab reads "Select a combatant in the queue.". Two or more selected: the shared `Input` (`type='number'`, `min={0}`, `className='number-input'`, `placeholder='Amount for all'`, `aria-label='Shared amount'`) is the first child. One selected: no shared field. Enter in any field records nothing.

UI / Visual: top to bottom — the shared field (two or more), the Damage / Heal / Set temp HP / Set max HP group, the Mark defeated / Unmark defeated / Remove group (Remove `buttonStyle='danger'`), then a `div.encounter-combatant-actions-tab-rows` holding one `EncounterCombatantActionRow` per row (`hpText` is `hp.text`, or "HP is not set. Set max HP to track it."). The stylesheet gives the tab root `flex: 1; min-height: 0` (it fills the panel, as `.encounter-log-tab` does) and the rows container `flex: 1; min-height: 0; overflow-y: auto` with `display: flex`, a column direction and `gap: var(--spacing-sm)`; the shared field, the buttons and the hint do not scroll. The old row, text, HP and amount rules leave this stylesheet. Elements whose appearance changes: the tab root (fills the panel), the new rows container, and the row elements (moved, same look).

The contract blocks above type-check and lint clean under the project's toolchain [spec-writer_13: ran `npx tsc --noEmit` and `npx eslint` from `app/` on a scratch file in `app/src/screens/encounter/helper/` holding every contract block of this spec's SF1 to SF3 with `import type { LogEntryPayload } from '@domain'` — tsc reported only `declared but never used` for the row `Props` and `BlockDrag` types; eslint reported only `local/no-unused-exports` and `@typescript-eslint/no-unused-vars` on the scratch's own declarations].

## Tests

`planGroupAction.test.ts` covers:

- Damage and Heal list only the rows with HP set, in row order, and return null when none has HP — catches a payload targeting a row the action cannot change, or an empty `targets` the schema rejects
- Set temp HP and Set max HP list every row with `value` — catches `amount` where the stored shape says `value`
- an amount action is null when any applicable row has no valid amount, and a no-HP row without an amount does not block Damage — catches a button state that drifts from the payload rule
- Mark defeated lists the not-defeated rows and is null when all are defeated, Unmark defeated the defeated rows and null when none is, Remove lists every row — catches a mirrored role left out

`settleActionAmounts.test.ts` covers:

- the same object comes back when nothing changes — catches a render loop
- a row text of an id that left the selection is dropped, the shared text stays — catches a leaked per-row amount
- exactly one selected folds its row text into `sharedText` and empties `rowTexts`, and with no row text of its own leaves `sharedText` — catches the single-row carry-over
- two or more selected keep the row texts of the selected ids — catches folding too early

`useActionAmounts.test.ts` covers:

- `setSharedText` fills every row and clears row overrides; `setRowText` changes one row — catches a shared edit that leaves stale overrides
- a rerender from two selected to one shows that row's amount, and the next single selection shows it too — catches settle not applied at render

`EncounterCombatantActionsTab.test.tsx` covers:

- typing in the shared field fills every row, and a row edited on its own keeps its text — catches rows that do not follow the shared text
- Damage with several selected writes one entry holding each row's own amount and leaves out a no-HP row — catches one write per row, the shared text used for all, or a skipped row listed
- Remove with several selected writes one entry listing every id
- Damage is disabled while an applicable row is empty but not while only a skipped row is — catches a button state that ignores which rows apply
- Mark defeated writes only the not-defeated ids and is disabled when all are defeated; Unmark defeated likewise for the defeated — catches the single-row availability rule
- after an action the rows and the shared field keep their text; a combatant that joins starts with the shared text — catches a reset
- selecting two, editing one row, then one remaining, then another single combatant shows the edited amount — catches the carry-over
- one selected shows no shared field, two show it
- every button is disabled while a write is pending; Enter writes nothing; the hint and the "HP is not set" line (kept)

The tab's static labels are all exercised by these tests (Damage, Heal, Set temp HP, Set max HP, Mark defeated, Unmark defeated, Remove).

## Verification

After the check rows pass, with SF1 complete, run `pnpm run mutation-check -- app/src/screens/encounter/components/EncounterSidebar/components/EncounterCombatantActionsTab/hooks/useActionAmounts.ts app/src/screens/encounter/components/EncounterSidebar/components/EncounterCombatantActionsTab/helper/settleActionAmounts.ts app/src/screens/encounter/components/EncounterSidebar/components/EncounterCombatantActionsTab/helper/planGroupAction.ts app/src/screens/encounter/components/EncounterSidebar/components/EncounterCombatantActionsTab/EncounterCombatantActionsTab.tsx` together with SF1's step, and resolve every survivor.

[MANUAL-VERIFY] In `pnpm run web`, with five or more combatants selected in a window short enough that the rows overflow the tab, scroll the row list: the shared field and the two button groups stay in view and only the rows move.

[MANUAL-VERIFY] With two combatants selected, the shared field's placeholder reads "Amount for all" in full, and each row's field reads "Amount" in full.
