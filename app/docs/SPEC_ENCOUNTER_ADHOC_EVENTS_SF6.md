# Sub-feature 6: Middle column: shown item dispatch, event view, shared notes

The middle column shows the clicked queue entry whichever kind it is: a new `EncounterShownItem` renders the hint, the combatant view (a random combatant included, which needs no change) or a new event view with an event name field and a notes editor. The notes editor and the heading-sized name field style are shared by both views. Events can only be created through the Add tab of sub-feature 7.

## Files affected

Modified:

- `app/src/screens/encounter/EncounterScreen.tsx` — imports `EncounterShownItem` from `./components/EncounterShownItem` and renders `<EncounterShownItem shownItemId={shownItemId} />` where it rendered `EncounterShownCombatant`

Moved (`mv` from `app/src/screens/encounter/components/EncounterShownCombatant/<path>` to `app/src/screens/encounter/components/EncounterShownItem/components/EncounterShownCombatant/<path>`, the sub-feature 5 changes to these files included):

- `index.ts` (unchanged content)
- `EncounterShownCombatant.tsx`, then update: it takes `shownItemId`, renders the fragment of its four children without the wrapper `div` (the keyed container moves to `EncounterShownItem`), no hint, no stylesheet import, and renders `<EncounterItemNotes shownItemId={shownItemId} placeholder='Combatant notes...' />` from `../EncounterItemNotes/EncounterItemNotes` in place of the combatant notes
- `components/EncounterCombatantEntityView/EncounterCombatantEntityView.tsx`, then update the two relative imports that leave the tree (`hooks/useEncounterQueueEntry`, `screens/components/ScreensBaseEntityContentSectionPanel`): each gains `../../` ahead of its existing path
- `components/EncounterCombatantEntityView/components/EncounterCombatantEntityDescription/EncounterCombatantEntityDescription.tsx` and `components/EncounterCombatantEntityView/index.ts` (unchanged content)
- `components/EncounterCombatantHp/EncounterCombatantHp.tsx`, then update the two relative imports that leave the tree (`helper/describeQueueEntryHp`, `hooks/useEncounterQueueEntry`) the same way; `EncounterCombatantHp.css`, `index.ts`, `helper/describeHpNotSetHint.ts` and `helper/__tests__/describeHpNotSetHint.test.ts` (unchanged content)
- `components/EncounterCombatantNameField/EncounterCombatantNameField.tsx`, then update the relative import of `hooks/useEncounterQueueEntry` the same way, `className='encounter-shown-item-name-field'` in place of `encounter-combatant-name-field`, and remove the stylesheet import; `index.ts`, `__tests__/EncounterCombatantNameField.test.tsx`, `helper/resolveCustomName.ts` and `helper/__tests__/resolveCustomName.test.ts` (unchanged content)
- `components/EncounterCombatantNotes/EncounterCombatantNotes.tsx` to `app/src/screens/encounter/components/EncounterShownItem/components/EncounterItemNotes/EncounterItemNotes.tsx`, then rename the component `EncounterItemNotes`, add the required prop `placeholder: string` passed to `TextEditor`, and use the class `encounter-item-notes`; its `EncounterCombatantNotes.css` to `…/EncounterItemNotes/EncounterItemNotes.css`, then rename the class
- `__tests__/EncounterShownCombatant.test.tsx` to `app/src/screens/encounter/components/EncounterShownItem/__tests__/EncounterShownItem.test.tsx`, then update: it renders `EncounterShownItem`, and its hint assertion reads `Click an entry in the queue to show it here.` (the hint's wording and owner change; its second test, the replaced combatant, now tests the keyed container of `EncounterShownItem`)

Deleted:

- `app/src/screens/encounter/components/EncounterShownCombatant/EncounterShownCombatant.css` — its container and hint rules move to `EncounterShownItem.css`; the component owns no style of its own afterwards (`app/src/CLAUDE.md` — Styles)
- `app/src/screens/encounter/components/EncounterShownCombatant/components/EncounterCombatantNameField/EncounterCombatantNameField.css` — its one rule moves to `EncounterShownItem.css`, because two name fields now share it (one home for the declarations)

New (all under `app/src/screens/encounter/components/EncounterShownItem/`):

- `EncounterShownItem.tsx`, `EncounterShownItem.css` and `index.ts` (`export { EncounterShownItem } from './EncounterShownItem';`, the module hides `components/`)
- `components/EncounterShownEvent/EncounterShownEvent.tsx` and `components/EncounterShownEvent/index.ts` (`export { EncounterShownEvent } from './EncounterShownEvent';`, the module hides `components/`)
- `components/EncounterShownEvent/components/EncounterEventNameField/EncounterEventNameField.tsx`
- `components/EncounterShownEvent/components/EncounterEventNameField/__tests__/EncounterEventNameField.test.tsx`

## Frontend

- `EncounterShownItem` (**Purpose** picks what the middle column shows below the global notes; **Behavior** the hint, the keyed container and the dispatch by kind, KAD "The middle column dispatches on the entry's kind"; **UI** one scroll area whose children stack with the existing spacing) takes `shownItemId: string | null`. It calls `useEncounterQueueEntry(shownItemId ?? '')` unconditionally (hooks never run conditionally; an empty id matches no entry, as `EncounterCombatantHp` does with `useBaseEntityContentSections`). A `null` id renders `<p className='encounter-shown-item-hint'>Click an entry in the queue to show it here.</p>`; a non-null id with no entry (the reads still loading) renders nothing with a bare `return;`; otherwise it renders `<div key={shownItemId} className='encounter-shown-item'>` holding `EncounterShownEvent` for an event entry and `EncounterShownCombatant` for a combatant entry, each with `shownItemId`. A random combatant takes the combatant branch unchanged: its HP hint for a combatant with no entity already reads `HP is not set. Set max HP in the Actions tab.` (`describeHpNotSetHint` with `entityLinked: false`), and `EncounterCombatantEntityView` renders nothing for `entity === null` (brief, row 17).
- `EncounterShownItem.css` holds four rules: `.encounter-shown-item` (`flex: 1`, `min-height: 0`, `overflow-y: auto`), `.encounter-shown-item > * + *` (`margin-top: var(--spacing-md)`), `.encounter-shown-item-hint` (`color: var(--color-text-muted)`), and `.encounter-shown-item .encounter-shown-item-name-field` (one home for the declarations of both name fields, KAD "The middle column dispatches on the entry's kind"; `font-size: var(--font-size-heading)`, `font-weight: var(--font-weight-medium)`), written as a descendant compound with a CSS comment saying it out-ranks `.input`'s `font-size` whatever the stylesheet load order. The values are those of the two deleted stylesheets, so no element changes its look: the children of the keyed container are the same siblings as before, now rendered through fragments, and `EncounterScreen.css` has no rule on these classes.
- `EncounterShownEvent` (**Purpose** the event's view; **Behavior** none of its own; **UI** the name field above the notes panel in the shared scroll area) takes `shownItemId` and renders a fragment: `EncounterEventNameField`, then `<EncounterItemNotes shownItemId={shownItemId} placeholder='Event notes...' />` (imported from `../EncounterItemNotes/EncounterItemNotes`). No HP, no entity view.
- `EncounterEventNameField` (**Purpose** renames the shown event; **Behavior** the typed text is shown and saved at once, a blank name saves `null`, the hooks run before the `null` return; **UI** the heading-sized name field of the combatant view, placeholder `Untitled Event`; KAD "A blank event name is stored as null, shown as `Untitled Event` and never put in the field") takes `shownItemId`. It reads the item with `useEncounterQueueItems(encounterId).queueItems` (as `EncounterItemNotes` does, since the entry's `name` is the shown name, `Untitled Event` for a blank one, and the field needs the stored one), holds the typed text with `useSyncedInputValue(item?.name ?? '')` and `useTypographicInput`, and on each change calls `setValue(typed)` and `updateQueueItem(shownItemId, { name: normalizeQueueItemName(typed) })`. It renders nothing (bare `return;`) for an unknown item. The `Input` has `aria-label='Event name'`, `placeholder={UNNAMED_EVENT_LABEL}`, the class `encounter-shown-item-name-field`, the synced value, and `onFocus`/`onBlur` from `focusProps`; blur restores nothing and Enter blurs. An emptied field therefore stays empty with `Untitled Event` greyed as its placeholder, and leaving it fills nothing in: the fallback is shown, never stored or put in as editable text (C10, row 27). A name of spaces only is saved as `null`, and the field keeps the spaces typed until the GM changes them.
- The rename reaches the queue and every log line at once because `updateQueueItem` writes the cached item before the autosave delay (sub-feature 4); no log entry is written.

Cross-sub-feature wiring: `UNNAMED_EVENT_LABEL` and `normalizeQueueItemName` (sub-feature 1) are consumed by `EncounterEventNameField`; the widened `UpdateQueueItemData` (sub-feature 3) by its `updateQueueItem` call.

## Behaviours and their defect

- `EncounterShownItem.test.tsx`: with `null` the hint `Click an entry in the queue to show it here.` shows and no name field does. Defect: a hint left with the old wording or owner, or fields rendered with nothing shown.
- `EncounterShownItem.test.tsx`: re-rendering with another shown id replaces the shown name field (one `Combatant name` field, the former name gone). Defect: the container not keyed, which leaves the former item's synced text in the field.
- `EncounterShownItem.test.tsx`: an event id shows an `Event name` field with the event's name and no `Combatant name` field; a combatant id shows the reverse. Defect: the combatant view drawn for an event.
- `EncounterEventNameField.test.tsx`: typing saves `{ name: <trimmed text> }` for that item once after the autosave delay, never `custom_name`. Defect: the rename written to a column the numbering reads, or saved untrimmed.
- `EncounterEventNameField.test.tsx`: emptying the field saves `{ name: null }`, the field stays empty with the placeholder `Untitled Event` and still holds nothing after Tab. Defect: the fallback put back as editable text, so the next keystroke stores `Untitled Eventx`.
- `EncounterEventNameField.test.tsx`: spaces-only text saves `{ name: null }`; Enter takes focus out of the field. Defect: a blank name stored as text.
- `EncounterEventNameField.test.tsx`: an unknown id renders no field. Defect: a field for a missing item that writes to a missing id.

[MANUAL-VERIFY] After sub-feature 7 exists, in web mode, click an event in the queue: the middle column shows the event name field with the event's name and, below it, a notes editor whose empty state reads `Event notes...`; typing text and an @mention into it and reopening the encounter shows both again (the editor is not drivable under jsdom: `.claude/knowledge/lexical.md:269`).

[MANUAL-VERIFY] In web mode, compare the event name field and the combatant name field: both show in the same heading size and weight (reasoned: both carry `encounter-shown-item-name-field`; jsdom computes no style).

## Verification

After the check rows pass and before the commit, run `pnpm run mutation-check -- app/src/screens/encounter/components/EncounterShownItem/EncounterShownItem.tsx app/src/screens/encounter/components/EncounterShownItem/components/EncounterShownEvent/components/EncounterEventNameField/EncounterEventNameField.tsx app/src/screens/encounter/components/EncounterShownItem/components/EncounterShownCombatant/components/EncounterCombatantNameField/EncounterCombatantNameField.tsx` from the repository root and resolve every survivor.
