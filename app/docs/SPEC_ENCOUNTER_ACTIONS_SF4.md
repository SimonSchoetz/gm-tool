# Sub-feature 4: Actions on the selected combatant

The Actions tab gets the amount field and the seven buttons, each writing one log entry. Governing Key Architectural Decisions: "Amount owned by the Actions tab", "Amount parser", "Write on click", "Payload shapes", "Pending covers the refetch".

## Files affected

Modified:

- `app/domain/encounters/index.ts` — add `parseActionAmount` to the explicit named exports (`{ parseActionAmount } from './actionAmount'`).
- `app/src/screens/encounter/components/EncounterSidebar/components/EncounterCombatantActionsTab/EncounterCombatantActionsTab.tsx` and `.css`.
- `app/src/screens/encounter/components/EncounterSidebar/EncounterSidebar.tsx` — import `./components/EncounterCombatantActionsTab` (the folder gains an `index.ts` below).

New:

- `app/domain/encounters/actionAmount.ts` and `__tests__/actionAmount.test.ts`.
- `…/EncounterCombatantActionsTab/index.ts` (`export { EncounterCombatantActionsTab } from './EncounterCombatantActionsTab';` — the folder now holds `helper/` besides its main file).
- `…/EncounterCombatantActionsTab/helper/getActionAvailability.ts` and `helper/__tests__/getActionAvailability.test.ts`.
- `…/EncounterCombatantActionsTab/__tests__/EncounterCombatantActionsTab.test.tsx`.

## Layered breakdown

### Domain

`parseActionAmount(raw): number | null`, built on `parseWholeNumberInput` as `parseAddQuantity` is (`domain/encounters/addQuantity.ts`): the number for a whole number of 0 or more, `null` for empty, invalid and negative input. `1e3` reads as 1000 because `parseWholeNumberInput` goes through `Number(raw)`, as the Add quantity does. Consumer: the Actions tab (below), through `@domain`. The signatures below were run with the other blocks of this spec [spec-writer_4: `declare` forms in `app/src/screens/encounter/`, `npx tsc --noEmit` and `npx eslint` — tsc reported nothing, eslint only `local/no-unused-exports` on the scratch export].

```ts
declare const parseActionAmount: (raw: string) => number | null;
```

Behaviours (`actionAmount.test.ts`): `0` and a large whole number return the number — a lower bound of 1 copied from the Add quantity; `1e3` returns 1000 — the agreed reading lost; empty, whitespace, `-1`, `1.5`, `abc` return `null` — a lenient parse that lets a fractional or negative amount reach the log.

### Frontend

**`helper/getActionAvailability.ts`** returns which of the seven buttons are enabled. Every button is disabled while `isRecording`.

```ts
declare const getActionAvailability: (state: {
  amount: number | null;
  hasHp: boolean;
  defeated: boolean;
  isRecording: boolean;
}) => {
  damage: boolean;
  heal: boolean;
  setTempHp: boolean;
  setMaxHp: boolean;
  markDefeated: boolean;
  unmarkDefeated: boolean;
  remove: boolean;
};
```

Damage and Heal need a parsed amount and HP set; Set temp HP and Set max HP need a parsed amount; Mark defeated needs `!defeated`; Unmark defeated needs `defeated`; Remove needs nothing else. Behaviours (`getActionAvailability.test.ts`): no amount disables the four amount buttons only — Mark and Remove blocked; HP not set disables Damage and Heal and leaves Set temp HP and Set max HP — H7 reversed; defeated flips Mark and Unmark — a no-op entry offered (L6); `isRecording` disables all seven — double click applies twice.

**`EncounterCombatantActionsTab`** (completes SF2's shell)

- **Purpose** — apply an amount or a state change to the selected combatant, each as one log entry.
- **Behavior** — owns `amountText` in `useState('')`; it lives in this component, which stays mounted, so the amount survives an action, a selection change and an empty selection in between. The amount `Input` (`type='number'`, `min={0}`, `aria-label='Amount'`) is outside any `<form>` and has no key handler, so Enter applies nothing. `parseActionAmount(amountText)` and `getActionAvailability` drive the `disabled` of the seven `Button`s, in this order and with these labels: `Damage`, `Heal`, `Set temp HP`, `Set max HP`, then `Mark defeated`, `Unmark defeated`, `Remove` (`buttonStyle='danger'`). `recordLogEntry` and `isRecording` come from `useEncounterLogEntries(encounterId)` (`useParams` for the id). Each `onClick` is `() => { void recordLogEntry(kind, payload); }` with these payloads, `id` being the selected entry's id: `damage`/`heal` `{ targets: [{ queueItemId: id, amount }] }`; `temp-hp`/`max-hp` `{ targets: [{ queueItemId: id, value: amount }] }`; `defeated` (Mark), `undefeated` (Unmark), `removed` `{ queueItemIds: [id] }`. The four amount handlers return early on a `null` amount, like `EncounterAddRow`'s `handleAdd` (unreachable through the UI, the buttons are disabled). The amount is not cleared. Remove clears the selection by itself: the entry leaves the shown ids and `useEncounterSelection` resets.
- **UI / Visual** — the SF2 row gains the amount field (`className='number-input'`, width `var(--spacing-3xl)`, centered) at its end. Below the row, two flex-wrap groups with `gap: var(--spacing-xs)`: the four amount buttons, then the three state buttons.

Behaviours (`EncounterCombatantActionsTab.test.tsx`, mocks as `EncounterSidebar.test.tsx`, with `recordLogEntry` of `@services/encounterLogEntryService` a spy and a deferred one for the pending case; queue and log data set before `render`):

- Enter in the amount field records nothing — a `<form>` or key handler firing an action.
- Each of the seven buttons records its kind with the selected id and the entered amount in the field the schema names (`amount`, `value`, or `queueItemIds`) — kind or field name swapped; the payload shape is permanent.
- The amount remains after an action, and after the selection moves to another combatant through an empty selection — state held in the row and lost on unmount.
- A button is enabled exactly when `getActionAvailability` says so for the typed amount, e.g. Damage is disabled while the field is empty and enabled after `5` — availability not wired to the parsed amount.
- All buttons are disabled while a write is pending — wired to a hook-local flag.
- Nothing selected shows the hint; a combatant without HP shows the not-set line — render branches `mutation-check` mutates.

[MANUAL-VERIFY] In the browser pane on a combatant with HP (an entity with one stat block HP): Damage 5 on `4 / 7 +2` shows `1 / 7`; the image tint grows from the bottom as HP drops, `+temp` appears and disappears, HP at or below 0 turns the image grey (Q2).
[MANUAL-VERIFY] Mark defeated turns the entry's image grey in place of the red tint at any HP (also at full HP and with HP not set) and does not dim the entry; Unmark restores the colours and the tint the HP gives, and the buttons enable and disable accordingly.
[MANUAL-VERIFY] Remove takes the entry out at once, clears the selection and leaves the amount in the field; with two Goblins, removing "Goblin 2" shows the other as "Goblin", and the next Add shows "Goblin 1" and "Goblin 3".
[MANUAL-VERIFY] With a combatant of an entity without stat block HP selected: the row says HP is not set, Damage and Heal are disabled, Set max HP then makes current HP equal the new max.
