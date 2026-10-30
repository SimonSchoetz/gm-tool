# Sub-feature 5: Queue entries as a union: naming, entries, event tile, Actions tab

The queue's entries become a union on `kind`: a combatant entry (entity or random) as today, and an event entry with a name only. Events are named by their own function and never enter the combatants' numbering, the queue draws an event as an icon tile with its name, Hide defeated never hides an event, and the Actions tab lists only combatants as rows while Remove takes the selected events too. Events and random combatants can only be created through the Add tab of sub-feature 7.

## Files affected

Modified:

- `app/src/screens/encounter/helper/nameQueueItems.ts` — see Frontend
- `app/src/screens/encounter/helper/buildQueueEntries.ts` — returns the union
- `app/src/screens/encounter/components/EncounterQueue/components/EncounterQueueEntry/EncounterQueueEntry.tsx` — props become a union; the image block of an event is the tile
- `app/src/screens/encounter/components/EncounterShownCombatant/components/EncounterCombatantNameField/EncounterCombatantNameField.tsx`, `…/EncounterCombatantHp/EncounterCombatantHp.tsx` and `…/EncounterCombatantEntityView/EncounterCombatantEntityView.tsx` — each narrows the entry `useEncounterQueueEntry` returns to its combatant variant (these files move in sub-feature 6)
- `app/src/screens/encounter/components/EncounterSidebar/components/EncounterCombatantActionsTab/EncounterCombatantActionsTab.tsx` — see Frontend
- `app/src/screens/encounter/components/EncounterSidebar/components/EncounterCombatantActionsTab/EncounterCombatantActionsTab.css` — one class for the muted line
- `app/src/screens/encounter/components/EncounterSidebar/components/EncounterCombatantActionsTab/helper/planGroupAction.ts` — `PlanRow` is exported and becomes a union
- Tests, each with what goes stale: `helper/__tests__/buildQueueEntries.test.ts` — the assertions that read combatant-only fields of an entry (`entry.imageId` twice, the destructured `maxHp`/`currentHp`/`tempHp`, `entry.defeated`, `entry.currentHp`, `entry.entity`) no longer type-check on the union and narrow to `kind === 'combatant'` first; `helper/__tests__/nameQueueItems.test.ts`, `helper/__tests__/buildLogLines.test.ts` and `hooks/__tests__/useEncounterQueueEntry.test.ts` gain cases, none goes stale (all under `app/src/screens/encounter/`); `EncounterQueueEntry/__tests__/EncounterQueueEntry.test.tsx` — the JSX in `renderEntry` and `StatefulEntry` gains `kind='combatant'`; `…/EncounterCombatantActionsTab/helper/__tests__/planGroupAction.test.ts` — the `row` builder gains `kind: 'combatant' as const`; `…/EncounterCombatantActionsTab/__tests__/EncounterCombatantActionsTab.test.tsx` — `arrange` gains an `events` parameter (items built with `buildEncounterQueueItem({ kind: 'event', base_entity_id: null, sequence_number: null, name })`), no assertion goes stale; `…/EncounterCombatantNameField/__tests__/EncounterCombatantNameField.test.tsx` gains one case

New:

- `app/src/screens/encounter/components/EncounterQueue/components/EncounterQueueEntry/EncounterQueueEntry.constants.ts` — `QUEUE_ENTRY_IMAGE_SIZE = 64`, shared by `EncounterQueueEntry.tsx` (the combatant image's `size`, which was a literal) and the tile (Constants, Trigger 1, `app/src/CLAUDE.md`)
- `app/src/screens/encounter/components/EncounterQueue/components/EncounterQueueEntry/components/EncounterQueueEventTile/EncounterQueueEventTile.tsx` — no stylesheet (it owns no style of its own)
- `…/EncounterCombatantActionsTab/helper/buildPlanRows.ts` and `…/helper/__tests__/buildPlanRows.test.ts`

No change: `app/src/screens/encounter/hooks/useEncounterQueueEntry.ts` — its `QueueEntry` type is `ReturnType<typeof useEncounterQueueEntries>['entries'][number]` [spec-writer_6: `app/src/screens/encounter/hooks/useEncounterQueueEntry.ts:3-5`], so it follows the union; `…/EncounterQueue/EncounterQueue.tsx` — it passes `{...entry}` to `EncounterQueueEntry` [spec-writer_7: `…/EncounterQueue/EncounterQueue.tsx:114-120`], and a spread of the union into the union props type-checked in the scratch run; `EncounterQueueEntry.css` and `EncounterQueueEntry/index.ts` (a single named export) — nothing in them changes.

## Frontend

[spec-writer_1: scratch tsc and eslint run, see sub-feature 1 — the entry union spread into `Props` below, and the `PlanRow` union with a type-predicate filter, type-check]

```ts
type CombatantEntry = {
  kind: 'combatant';
  id: string;
  name: string;
  automaticName: string;
  entity: { id: string; entityType: BaseEntityType } | null;
  imageId: string | null;
  maxHp: number | null;
  currentHp: number | null;
  tempHp: number;
  defeated: boolean;
};
type EventEntry = { kind: 'event'; id: string; name: string };
// buildQueueEntries: both types are declared in its file and its return type is annotated (CombatantEntry | EventEntry)[], so the `kind` literal is never widened

// EncounterQueueEntry: common props plus
type KindProps =
  | {
      kind: 'combatant';
      id: string;
      name: string;
      imageId: string | null;
      maxHp: number | null;
      currentHp: number | null;
      tempHp: number;
      defeated: boolean;
    }
  | { kind: 'event'; id: string; name: string };
// Props = { selected: boolean; otherDraggedCount: number; onSelect: (id, modifiers) => void } & KindProps

// planGroupAction.ts
export type PlanRow =
  | { kind: 'event'; id: string }
  | {
      kind: 'combatant';
      id: string;
      amount: number | null;
      hasHp: boolean;
      defeated: boolean;
    };
```

- `buildQueueEntries` (KAD "Queue entries are a union on `kind`"): a removed item leaves, as today. An event becomes `{ kind: 'event', id, name }` with `name` from `nameQueueItems`. Hide defeated applies only when `kind === 'combatant'`, so an event is never hidden whatever the log says about it (C6).
- `nameQueueItems` (KAD "Events never number, and random combatants number by their exact typed name") splits the items by `kind` before both naming passes. Combatants (entity and random) go through `shownCombatantNames` as today, over all combatants and over the kept ones. An event's `shownName`, `automaticName` and `baseName` are all `shownEventName(item.name)`; its `custom_name` is ignored (C1).
- `EncounterQueueEntry` (**Purpose** one queue row of either kind; **Behavior** a click reports the entry's id and modifiers, the handle drags, the badge shows `+N`; **UI** the existing row, with the image block per kind) reads `props.kind`: the sortable shell, the handle, the click, the selected highlight and the `+N` badge serve both kinds. For a combatant the image block is unchanged (the literal `64` becomes `QUEUE_ENTRY_IMAGE_SIZE`). For an event the same wrapper `div` holds `EncounterQueueEventTile` instead of the image and the tint, the wrapper's look is `plain`, and no HP text renders (HP is derived only for a combatant).
- `EncounterQueueEventTile` (**Purpose** the event's stand-in for the combatant image; **Behavior** none, it renders; **UI** a square tile of the image's size with a centred bell icon; KAD "An event draws as an icon tile in the image's place") is an `ImagePlaceholderFrame` (`@/components/ImagePlaceholderFrame/ImagePlaceholderFrame`, which forwards its props to the `div`) with `dimensions` `{ width: QUEUE_ENTRY_IMAGE_SIZE, height: QUEUE_ENTRY_IMAGE_SIZE }` and `aria-label='Event icon'`, holding `BellRingIcon` from `lucide-react` with `size={QUEUE_ENTRY_IMAGE_SIZE / 2}`; the icon takes the entry's text colour (`currentColor`) [spec-writer_5: `.claude/knowledge/lucide-react.md` — the entry beginning "A `LucideIcon` component takes `size`"]. The tile therefore needs no stylesheet and no custom property, and it is as tall as a combatant's image (KAD "An event draws as an icon tile in the image's place").
- `EncounterCombatantActionsTab` (KAD "The Actions tab lists combatants and names the events Remove also takes") partitions `selectedEntries` into combatant entries and event entries with type-predicate filters. `useActionAmounts` receives the ids of the selected combatants only, so the partition precedes the `useActionAmounts` call, which precedes `buildPlanRows`, all above the early return for an empty selection (the hook never runs conditionally). The shared field shows when two or more combatants are selected, whatever events are selected. The rows list combatants only, built from the combatant entries as today. The plan rows come from `buildPlanRows(selectedEntries, amountTextOf)`, which keeps queue order (the `removed` entry lists ids in queue order, so the log reads `Removed: Goblin 1, Lair action`). Below the rows, while an event is selected, one muted `p` (class `encounter-combatant-actions-tab-events-note`, `font-size: var(--font-size-md)`, `color: var(--color-fg-muted)`) reads `Remove also removes:`, one space, and the event names in queue order, comma-separated. With nothing selected the hint stays `Select a combatant in the queue.`; with only events selected the buttons show, every button but Remove is disabled (no combatant row to act on) and the line shows (C7, row 4, row 22).
- `buildPlanRows(entries, amountTextOf)` maps each entry in order: an event to `{ kind: 'event', id }`, a combatant to `{ kind: 'combatant', id, amount: parseActionAmount(amountTextOf(id)), hasHp: describeQueueEntryHp(entry) !== null, defeated }`.
- `planGroupAction` (its `PlanRow` export is imported by `buildPlanRows`) filters the combatant rows first (a type predicate) and runs every kind except `removed` over them; `removed` lists every row's id. An event row therefore never blocks an amount button and never receives an amount.
- The three shown-combatant children narrow `useEncounterQueueEntry`'s result to the combatant variant (a constant holding the entry when `kind` is `combatant` and `null` otherwise) and keep their existing `return;` for `null`.

## Behaviours and their defect

- `buildQueueEntries.test.ts`: an event entry is `{ kind: 'event', id, name }` in queue order beside combatants; a random combatant (`base_entity_id` null) is a combatant entry with `entity` null, `imageId` null, its typed name and HP from `starting_max_hp`. Defect: an event given combatant fields, or a random combatant dropped.
- `buildQueueEntries.test.ts`: with Hide defeated on, an event stays even when a `defeated` entry names it, and a defeated combatant leaves; a removed event leaves and a reverted removal brings it back in its place. Defect: hiding an event on a peer's stray `defeated` entry.
- `nameQueueItems.test.ts`: an event `Grunt` beside a random combatant `Grunt` reads `Grunt` for both. Defect: events entering the numbering key (`Grunt 1`).
- `nameQueueItems.test.ts`: an emptied or spaces-only event name reads `Untitled Event` as shown, automatic and base name, and an event ignores `custom_name`. Defect: the combatant fallback `Untitled Combatant`.
- `nameQueueItems.test.ts`: random combatants (`base_entity_id` null) number by exact name (`Grunt 1`, `Grunt 2`), a removed one keeps its number while a kept sibling reads bare, and a renamed one still counts for its sibling. Defect: a null entity id read as linked.
- `buildLogLines.test.ts`: an `added` entry naming an event reads `Added: <name>`, a `removed` entry naming a combatant and an event reads `Removed: Goblin 1, Lair action`, and a blank event reads `Untitled Event`. Defect: log lines naming events as combatants.
- `useEncounterQueueEntry.test.ts`: an event's id returns its event entry, not `null`. Defect: events missing from the entries the middle column reads.
- `EncounterQueueEntry.test.tsx`: an event entry shows its name and the `Event icon` tile and none of HP text, `Damage tint` or `Greyed-out image`; a combatant entry shows no `Event icon`. Defect: the combatant image block or the tile drawn for the wrong kind.
- `EncounterQueueEntry.test.tsx`: a click on an event entry reports its id with the modifiers of the click. Defect: the click bound only to the combatant branch, which makes events unselectable.
- `planGroupAction.test.ts`: event rows are left out of Damage, Heal, Temp HP, Max HP, Mark and Unmark (an event row beside a row with an empty amount never blocks), `removed` lists every row's id in row order, and events alone give `null` for all but `removed`. Defect: an event blocking or receiving an amount action.
- `buildPlanRows.test.ts`: events map to `{ kind: 'event', id }`, combatants carry the parsed amount, `hasHp` and `defeated`, and the order of the entries is kept. Defect: events given amounts, or Remove ids reordered.
- `EncounterCombatantActionsTab.test.tsx`: with only events selected, Remove is enabled, the six other buttons are disabled, the line `Remove also removes: Lair action, Reinforcements` shows and no row or amount field shows. Defect: events-only selection showing the empty hint.
- `EncounterCombatantActionsTab.test.tsx`: one combatant and one event selected show no shared field, one row, the line, and Damage writes a `damage` entry for the combatant alone; two combatants and an event show the shared field. Defect: an event counting towards the shared field or blocking Damage.
- `EncounterCombatantActionsTab.test.tsx`: Remove with a combatant and an event writes one `removed` entry holding both ids in queue order. Defect: events left in the queue by Remove.
- `EncounterCombatantNameField.test.tsx`: given an event's id the field renders nothing. Defect: the combatant name field drawn over an event.

[MANUAL-VERIFY] After sub-feature 7 exists, in web mode, add an event and a random combatant with HP 10 and compare their queue entries: the event entry and the combatant entry have the same height and the tile has the size of the image placeholder (both are `QUEUE_ENTRY_IMAGE_SIZE`; reasoned, jsdom computes no layout).

[MANUAL-VERIFY] In web mode, Damage the random combatant to `4 / 10` through the Actions tab: its image placeholder shows the red tint over the lower share, and after Mark defeated it is grey (reasoned: the same `describeQueueEntryImage` branches as an entity combatant).

[MANUAL-VERIFY] In web mode, drag an event above a combatant, and drag a selected block that holds an event: the queue shows the new order at once and shows it again after leaving the encounter and opening it (the drag is layout-dependent and the existing block-drag hand test also runs once in the native app).

## Verification

After the check rows pass and before the commit, run `pnpm run mutation-check -- app/src/screens/encounter/helper/nameQueueItems.ts app/src/screens/encounter/helper/buildQueueEntries.ts app/src/screens/encounter/components/EncounterQueue/components/EncounterQueueEntry/EncounterQueueEntry.tsx app/src/screens/encounter/components/EncounterShownCombatant/components/EncounterCombatantNameField/EncounterCombatantNameField.tsx app/src/screens/encounter/components/EncounterSidebar/components/EncounterCombatantActionsTab/EncounterCombatantActionsTab.tsx app/src/screens/encounter/components/EncounterSidebar/components/EncounterCombatantActionsTab/helper/planGroupAction.ts app/src/screens/encounter/components/EncounterSidebar/components/EncounterCombatantActionsTab/helper/buildPlanRows.ts` from the repository root and resolve every survivor.
