# Sub-feature 4: Shown combatant column and name field

The middle column gains the shown combatant's view below the global notes: a hint while nothing is shown, and the editable combat name when a combatant is. Sub-features 5, 6 and 7 add the HP, the notes and the entity view to the same container.

## Files affected

New:

- `app/src/screens/encounter/hooks/useEncounterQueueEntry.ts`
- `app/src/screens/encounter/hooks/__tests__/useEncounterQueueEntry.test.ts`
- `app/src/screens/encounter/components/EncounterShownCombatant/EncounterShownCombatant.tsx`, `EncounterShownCombatant.css`, `index.ts`
- `app/src/screens/encounter/components/EncounterShownCombatant/components/EncounterCombatantNameField/EncounterCombatantNameField.tsx`, `EncounterCombatantNameField.css`, `index.ts`
- `…/EncounterCombatantNameField/helper/resolveCustomName.ts` and `helper/__tests__/resolveCustomName.test.ts`
- `…/EncounterCombatantNameField/__tests__/EncounterCombatantNameField.test.tsx`

Modified:

- `app/src/screens/encounter/EncounterScreen.tsx` — destructure `shownItemId` from `useEncounterSelection` and render `<EncounterShownCombatant shownItemId={shownItemId} />` below `<EncounterNotes />`, importing it from `./components/EncounterShownCombatant`. `EncounterScreen.css` needs no change: the middle column is already a flex column with `min-height: 0` [spec-writer_15: `app/src/screens/encounter/EncounterScreen.css:25-32` — as of 1cbf2b90].

`index.ts` files export their component as one explicit named export; each folder has one because it holds `components/` or `helper/` besides its main file.

## Frontend

`useEncounterQueueEntry(queueItemId: string)` returns the entry of `useEncounterQueueEntries()` whose id matches, and null for an unknown id and while the reads load (`entries` is empty then). Three sub-components need the lookup, so it lives once here (decision: "Each shown-combatant sub-component calls its own hooks, and the queue entry is read through `useEncounterQueueEntry`" in the root Key Architectural Decisions).

`EncounterShownCombatant` — Purpose: the middle column's combatant view. Behavior: takes `shownItemId: string | null` and nothing else; every sub-component below calls its own hooks. With null it renders the muted line "Click a combatant in the queue to show it here."; otherwise a scroll container holding the sub-components, each keyed by the queue item id and imported as its folder's `index.ts` (`./components/EncounterCombatantNameField`). UI / Visual: the container scrolls vertically, takes the column's remaining height (`flex: 1`, `min-height: 0`, `overflow-y: auto`), lays its children out as blocks (not a flex or grid container, so no child is compressed) with `var(--spacing-md)` between consecutive children, and the hint uses `var(--color-text-muted)`.

`EncounterCombatantNameField` — Purpose: edit this combatant's combat name. Props: `{ shownItemId: string }`. Behavior:

- It composes `useSyncedInputValue` and `useTypographicInput` around the `Input` component as `SyncedInput` does, with `initValue` the entry's `name`; it does not use `SyncedInput` (decision: "The name field composes the input hooks instead of using `SyncedInput`" in the root Key Architectural Decisions), which has no `onBlur` and would leave the field empty after the entry is emptied (`.claude/rules/src-components.md` — Controlled inputs that drive auto-save mutations, Case 2).
- Typing calls `setValue(typed)` and `updateQueueItem(shownItemId, { custom_name: resolveCustomName(typed, entry.automaticName) })` from `useEncounterQueueItems(encounterId)`; the route's `encounterId` comes from `useParams` in the component. `updateQueueItem` writes the queue items cache at once, so the queue, the Actions row and the Log lines show the typed name instantly, and the database write follows about 0.5 s later (the user's decision, row 23).
- Leaving the field calls `focusProps.onBlur()` and then `setValue(entry.name)`. Enter blurs the input, so the same restore runs.
- It renders nothing while the entry is null. The input has `aria-label='Combatant name'` and the class `encounter-combatant-name-field`, whose stylesheet sets `font-size: var(--font-size-heading)` and `font-weight: var(--font-weight-medium)`.

`resolveCustomName(typed: string, automaticName: string): string | null` trims `typed` and returns null when the result is empty or equals `automaticName`, else the trimmed string.

## Tests — behaviours and the defect each catches

- `useEncounterQueueEntry.test.ts`: the entry with the given id comes back (catches another combatant's entry); null for an unknown id; null before the reads resolve (catches a stale or partial entry).
- `resolveCustomName.test.ts`: surrounding spaces are trimmed; empty and spaces-only give null; the automatic name, also with surrounding spaces, gives null; any other text comes back trimmed (catches a stored untrimmed name, and an unchanged "Goblin 3" confirmed with Enter freezing its number).
- `EncounterCombatantNameField.test.tsx` mocks the services the hooks call, the router's `useParams` and the three-goblin queue as `EncounterCombatantActionsTab.test.tsx` does, uses fake timers with `shouldAdvanceTime` (`.claude/rules/src-unit-tests.md` — Component tests), and asserts what the field shows and what `updateQueueItem` receives:
  - the field shows the name the queue shows for the shown item, "Goblin 3" (catches a field filled with the entity name or left empty);
  - typing another name saves exactly that trimmed name for that item id once, after the delay (catches a save of the wrong id, an untrimmed name, or one write per keystroke);
  - emptying the field saves null, and leaving the field then shows "Goblin 3" again (catches the empty field left behind that a `SyncedInput` would produce);
  - typing exactly "Goblin 3" saves null (catches a frozen number);
  - after a rename, leaving the field keeps the rename in the field (catches a restore to the automatic name);
  - Enter takes focus out of the field and restores the shown name after spaces-only text (catches an Enter that does nothing).

## Verification steps

After the check rows pass and before the commit, run `pnpm run mutation-check -- app/src/screens/encounter/hooks/useEncounterQueueEntry.ts app/src/screens/encounter/components/EncounterShownCombatant/components/EncounterCombatantNameField/helper/resolveCustomName.ts app/src/screens/encounter/components/EncounterShownCombatant/components/EncounterCombatantNameField/EncounterCombatantNameField.tsx` and resolve every survivor.

[MANUAL-VERIFY] In web mode, add three Goblins, click the third queue entry, and replace its name in the middle column with "Boss". While the field is still focused, with no wait for the save, the queue reads "Goblin 1", "Goblin 2", "Boss", and the Actions tab row reads "Boss". Mark it defeated in the Actions tab and the Log tab line reads "Defeated: Boss". No renaming line appears in the Log tab. Clear the field and click elsewhere: the field and the queue read "Goblin 3". (The names are reasoned from the `shownCombatantNames` contract in sub-feature 1, not run.)

[MANUAL-VERIFY] Hand-off to the human tester, since an agent session cannot restart the native app or pair devices: in `pnpm run dev`, rename a combatant, leave the encounter, restart the app and reopen the encounter, click the combatant, and the name field reads the rename; on a paired device the queue shows the same rename after a sync.
