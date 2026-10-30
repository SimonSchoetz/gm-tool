# Sub-feature 1: Domain: queue item name, event name, random combatant HP

The domain gains the vocabulary the later sub-features use: one blank-means-none rule for the name of any queue item, the shown name of an event, and the parse of a random combatant's optional HP. Nothing here changes behavior; the rename of `normalizeCustomName` updates all five files that name it in this sub-feature, so the checks pass after this commit alone.

## Files affected

Modified:

- `app/domain/encounters/index.ts` — explicit named exports, one `export { … } from` per module as the file does: replace the `normalizeCustomName` line with `normalizeQueueItemName` from `./queueItemName`; add `shownEventName` and `UNNAMED_EVENT_LABEL` from `./shownEventName`, and `parseRandomCombatantHp` from `./randomCombatantHp`
- `app/domain/encounters/shownCombatantNames.ts` — imports `normalizeQueueItemName` from `./queueItemName` and calls it where it called `normalizeCustomName`
- `app/src/screens/encounter/components/EncounterShownCombatant/components/EncounterCombatantNameField/helper/resolveCustomName.ts` — imports and calls `normalizeQueueItemName` from `@domain` (this file moves in sub-feature 6; its test `resolveCustomName.test.ts` calls only `resolveCustomName`, so no assertion goes stale)

Moved:

- `mv app/domain/encounters/customName.ts app/domain/encounters/queueItemName.ts`, then rename the export `normalizeCustomName` to `normalizeQueueItemName`
- `mv app/domain/encounters/__tests__/customName.test.ts app/domain/encounters/__tests__/queueItemName.test.ts`, then update the import path, the imported name and the `describe` title

New:

- `app/domain/encounters/shownEventName.ts`
- `app/domain/encounters/__tests__/shownEventName.test.ts`
- `app/domain/encounters/randomCombatantHp.ts`
- `app/domain/encounters/__tests__/randomCombatantHp.test.ts`

No change: `app/domain/index.ts` — `export * from './encounters'` is the form `app/domain/CLAUDE.md` — Structure sanctions for a subdomain's own barrel.

## Domain

[spec-writer_1: ran `npx tsc --noEmit` and `npx eslint <scratch files>` from `app/` over scratch `.ts` declarations of every signature and type block of sub-features 1 to 5 and 7, each placed in the directory it lands in — tsc reported nothing; eslint reported only `local/no-unused-exports` on the scratch exports; scratch deleted]

```ts
// queueItemName.ts
export declare const normalizeQueueItemName: (
  raw: string | null,
) => string | null;
// shownEventName.ts
export declare const UNNAMED_EVENT_LABEL = 'Untitled Event';
export declare const shownEventName: (name: string | null) => string;
// randomCombatantHp.ts
export declare const parseRandomCombatantHp: (
  raw: string,
) => { valid: true; hp: number | null } | { valid: false };
```

- `normalizeQueueItemName` keeps the body of `normalizeCustomName` (trimmed text, blank means `null`). The name now says it serves a custom name, an event's name and a random combatant's typed name.
- `shownEventName(name)` is `normalizeQueueItemName(name) ?? UNNAMED_EVENT_LABEL`.
- `parseRandomCombatantHp(raw)` is built on `parseWholeNumberInput` (imported from `../base-entity-content-sections`, as `actionAmount.ts` does): blank text gives `{ valid: true, hp: null }`, a whole number of 0 or more gives `{ valid: true, hp }`, any other result gives `{ valid: false }`. It is the one place that tells an empty field from an invalid one, which `parseActionAmount` cannot (KAD "A random combatant's HP is parsed by its own function").

Cross-sub-feature wiring (no consumer in this sub-feature; each symbol has a test that imports it, which the unused-exports lint counts as a use, whereas a symbol imported nowhere is reported even when `index.ts` re-exports it [spec-writer_13: ran `npx eslint` on a scratch module whose export `domain/encounters/index.ts` re-exported and nothing imported — `local/no-unused-exports` reported it; with a test importing the module directly it reported nothing; scratch removed and `index.ts` restored]):

- `shownEventName`: `nameQueueItems` in sub-feature 5.
- `UNNAMED_EVENT_LABEL`: the placeholder of `EncounterEventNameField` in sub-feature 6.
- `parseRandomCombatantHp`: `addRandomCombatants` in sub-feature 3 and `EncounterAddRandomCombatant` in sub-feature 7.

## Behaviours and their defect

- `queueItemName.test.ts` (the moved `customName.test.ts`, assertions unchanged): `null`, empty and spaces-only text give `null`; surrounding spaces are trimmed and interior ones kept. Defect: a blank name stored as text, or an interior space collapsed.
- `shownEventName.test.ts` (its expected fallback imports `UNNAMED_EVENT_LABEL`): a name shows trimmed; `null`, empty and spaces-only names show `UNNAMED_EVENT_LABEL`. Defect: an emptied event showing a blank entry, or its fallback taken from the combatant label.
- `randomCombatantHp.test.ts`: blank and spaces-only text give valid with `hp` `null`. Defect: empty read as 0, or as invalid, which silently sets HP 0 or blocks Add.
- `randomCombatantHp.test.ts`: `'0'`, `'12'` and `'1e3'` give valid with 0, 12 and 1000. Defect: 0 rejected, or the exponent form the amount fields accept rejected.
- `randomCombatantHp.test.ts`: `'abc'`, `'-1'` and `'1.5'` give invalid. Defect: invalid text read as empty, which enables Add with HP silently unset.

## Verification

After the check rows pass and before the commit, run `pnpm run mutation-check -- app/domain/encounters/queueItemName.ts app/domain/encounters/shownEventName.ts app/domain/encounters/randomCombatantHp.ts app/domain/encounters/shownCombatantNames.ts` from the repository root and resolve every survivor.
