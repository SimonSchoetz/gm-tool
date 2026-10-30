# Sub-feature 5: Combatant HP and the HP-not-set hint

The shown combatant's view gains its HP as the queue shows it, a muted "Defeated" label, and, where the HP is not set, the reason and where to fix it. The queue entry gains `entity`, which this sub-feature's `EncounterCombatantHp` and sub-feature 7's `EncounterCombatantEntityView` read.

## Files affected

New:

- `app/src/screens/encounter/components/EncounterShownCombatant/components/EncounterCombatantHp/EncounterCombatantHp.tsx`, `EncounterCombatantHp.css`, `index.ts`
- `…/EncounterCombatantHp/helper/describeHpNotSetHint.ts` and `helper/__tests__/describeHpNotSetHint.test.ts`

Modified:

- `app/domain/base-entity-content-sections/singleStatBlockHp.ts` and `__tests__/singleStatBlockHp.test.ts` — the test file gains cases; existing assertions are unchanged.
- `app/domain/base-entity-content-sections/index.ts` — change the `singleStatBlockHp` export line to `export { singleStatBlockHp, hpNotSetReason } from './singleStatBlockHp';` and add `export type { HpNotSetReason } from './singleStatBlockHp';`, both explicit. `domain/index.ts` re-exports the subdomain barrel with `export *`, which `app/domain/CLAUDE.md` — Structure permits, so `@domain` carries both names without an edit there.
- `app/src/screens/encounter/helper/buildQueueEntries.ts` and `helper/__tests__/buildQueueEntries.test.ts`.
- `app/src/screens/encounter/components/EncounterShownCombatant/EncounterShownCombatant.tsx` — render `EncounterCombatantHp` after the name field, keyed by the queue item id, imported by `./components/EncounterCombatantHp` (its `index.ts`).

## Domain

Contract [spec-writer_26: ran `npx tsc --noEmit` from `app/` with this block and the `describeHpNotSetHint` block below in a scratch module in `app/domain/base-entity-content-sections/` — exit 0; `npx eslint` on it reported only `local/no-unused-exports` on the three exports]:

```ts
export type HpNotSetReason = 'no-hp-value' | 'several-stat-blocks' | 'other';
export declare const hpNotSetReason: (
  sections: { type: BaseEntityContentSectionType; content: string | null }[],
) => HpNotSetReason;
```

`hpNotSetReason` sits beside `singleStatBlockHp` and shares its private `STAT_BLOCK_TYPES`. Zero stat block sections, or one whose `singleStatBlockHp` is null, gives `no-hp-value`; two or more give `several-stat-blocks`; one with an HP value gives `other` (the stat block changed after the add). Corrupt Basic content throws as `singleStatBlockHp` does, unguarded.

## Frontend

`buildQueueEntries.ts`: each entry gains `entity: { id: string; entityType: BaseEntityType } | null`, non-null exactly when the adventure's base entity lists hold the item's `base_entity_id`, read from the `entitiesById` map the function already builds. A deleted entity, and one whose delete has not reached the lists yet, give null (decision: "The entity view exists only while the entity is in the adventure's base entity lists, and the queue entry decides it" in the root Key Architectural Decisions).

`describeHpNotSetHint` returns the sentence for a combatant whose HP is not set:

```ts
export declare const describeHpNotSetHint: (state: {
  entityLinked: boolean;
  sectionsLoading: boolean;
  sections: { type: BaseEntityContentSectionType; content: string | null }[];
}) => string | null;
```

Null while `entityLinked` and `sectionsLoading`. Without a linked entity it returns "HP is not set. Set max HP in the Actions tab." whatever `sections` holds. Otherwise `hpNotSetReason(sections)` selects: `no-hp-value` gives "HP is not set: the entity has no stat block with an HP value. Set max HP in the Actions tab.", `several-stat-blocks` gives "HP is not set: the entity has more than one stat block. Set max HP in the Actions tab.", `other` gives "HP is not set. Set max HP in the Actions tab.".

`EncounterCombatantHp` — Purpose: show the shown combatant's HP read-only. Props: `{ shownItemId: string }`. Behavior: it renders nothing while `useEncounterQueueEntry(shownItemId)` is null. It calls `useBaseEntityContentSections(entry?.entity?.id ?? '')` before that guard, as the hook rules require; the query is disabled for an empty id, so no read happens without a linked entity [spec-writer_16: `app/src/data-access-layer/base-entity-content-sections/baseEntityContentSectionQueryOptions.ts:11` — `enabled: !!baseEntityId` — as of 1cbf2b90]. With HP set it shows `describeQueueEntryHp(entry).text` (`4 / 7`, `4 / 7 +2`); with HP not set it shows `describeHpNotSetHint({ entityLinked: entry.entity !== null, sectionsLoading: loading, sections })`, nothing when that is null. A muted "Defeated" label follows whichever shows while `entry.defeated`. It changes nothing: HP changes only through the Actions tab. UI / Visual: one paragraph, `encounter-combatant-hp`; the label is a span `encounter-combatant-hp-defeated` with `color: var(--color-text-muted)` and `margin-left: var(--spacing-sm)`.

## Tests — behaviours and the defect each catches

- `singleStatBlockHp.test.ts`: `hpNotSetReason` gives `no-hp-value` for no stat block and for one with an empty HP, `several-stat-blocks` for two (a Basic and a 5e count together) and `other` for one with an HP value (catches the wrong sentence for each of the three states).
- `describeHpNotSetHint.test.ts`: no linked entity gives the plain sentence even when the sections hold two stat blocks (catches the deleted-entity case showing a stat block reason); linked and loading gives null (catches a hint flashing the wrong reason while sections load); each of the three reasons gives its own sentence (catches swapped sentences).
- `buildQueueEntries.test.ts`: `entity` carries the id and type of an entity in the lists and is null for a combatant whose entity is absent or whose `base_entity_id` is null (catches an entity view for a deleted entity).

## Verification steps

After the check rows pass and before the commit, run `pnpm run mutation-check -- app/domain/base-entity-content-sections/singleStatBlockHp.ts app/src/screens/encounter/helper/buildQueueEntries.ts app/src/screens/encounter/components/EncounterShownCombatant/components/EncounterCombatantHp/helper/describeHpNotSetHint.ts` and resolve every survivor.

[MANUAL-VERIFY] In web mode, add a Foe with a Basic stat block of HP 7 and click its combatant: the middle column shows "7 / 7" under the name. Apply Damage 3 in the Actions tab: it shows "4 / 7"; set temp HP 2: "4 / 7 +2"; Mark defeated: a muted "Defeated" follows. (Reasoned from `describeQueueEntryHp`, not run.)

[MANUAL-VERIFY] In web mode, click combatants of these Foes: one without a stat block section shows "HP is not set: the entity has no stat block with an HP value. Set max HP in the Actions tab."; one added with its stat block's HP empty shows the same; one with two stat block sections shows "HP is not set: the entity has more than one stat block. Set max HP in the Actions tab."; one added before its stat block got HP 5 shows "HP is not set. Set max HP in the Actions tab."; and after deleting the entity on its own screen and returning, its combatant shows the same last sentence.
