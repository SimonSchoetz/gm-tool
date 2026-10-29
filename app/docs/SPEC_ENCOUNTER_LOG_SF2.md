# Sub-feature 2: Queue item names: shown and base names, removed combatants named

One helper names every queue item, kept and removed, so the queue and the log read a combatant the same way; the domain exposes the name without its number.

## Files affected

Modified:

- `app/domain/encounters/shownCombatantNames.ts` — `shownCombatantBaseName` extracted and exported; `shownCombatantNames` calls it
- `app/domain/encounters/__tests__/shownCombatantNames.test.ts` — a new `describe` for the base name; the existing assertions stay valid
- `app/domain/encounters/index.ts` — `shownCombatantBaseName` added to the existing `shownCombatantNames` export block (explicit named exports, as the file already does)
- `app/src/screens/encounter/helper/buildQueueEntries.ts` — takes the names from `nameQueueItems`; drops its own `keptItems` plus `shownCombatantNames` plus entity-name-map computation and the `shownCombatantNames` import; keeps `entitiesById` for the images; its test file needs no edit because the names it asserts are unchanged

New:

- `app/src/screens/encounter/helper/nameQueueItems.ts`
- `app/src/screens/encounter/helper/__tests__/nameQueueItems.test.ts`

## Domain

`shownCombatantBaseName(item, entityNamesById)` is today's inner `baseName` (`shownCombatantNames.ts:22-25`): the linked entity's current name, else the stored name, else `UNNAMED_ENTITY_LABEL`, never followed by a number. Its `isLinked` test moves to a module-private function both exported functions use, so the linked-or-stored rule has one home.

```ts
type NamedItem = {
  id: string;
  baseEntityId: string | null;
  name: string | null;
  sequenceNumber: number | null;
};

declare function shownCombatantBaseName(
  item: NamedItem,
  entityNamesById: Map<string, string | null>,
): string;
```

[spec-writer_12: ran `npx tsc --noEmit` from `app/` with this block in the scratch file of sub-feature 1 — exit 0; scratch deleted]

## Frontend

`nameQueueItems` is a pure helper beside `buildQueueEntries` in `screens/encounter/helper/` (shared by that file and by `buildLogLines` in sub-feature 4, so rung 1 of `app/src/CLAUDE.md` — Util vs. Helper Placement).

```ts
type QueueItemName = { shownName: string; baseName: string };

declare function nameQueueItems(
  queueItems: EncounterQueueItem[],
  combatStateItems: ReadonlyMap<string, { removed: boolean }>,
  baseEntities: BaseEntity[],
): Map<string, QueueItemName>;
```

[spec-writer_13: ran `npx tsc --noEmit` and `npx eslint` on this block with its imports (`EncounterQueueItem` from `@db/encounter-queue-item`, `BaseEntity` from `@db/base-entity`) as a scratch `.ts` file in `app/src/screens/encounter/helper/` — tsc exit 0; eslint reported only the scratch's own `void` references; scratch deleted]

It holds one entry per queue item. A non-removed item's `shownName` comes from `shownCombatantNames` over the non-removed items only, exactly as the queue shows it today. A removed item's `shownName` comes from `shownCombatantNames` over all items, and only that result is read for removed items. `baseName` is `shownCombatantBaseName` for every item. An item absent from `combatStateItems` counts as not removed. The entity-name map is built once inside the helper from `baseEntities`.

`baseName` has no reader in this sub-feature: `buildLogLines` reads it in sub-feature 4 (the `Added` line). `buildQueueEntries` reads `shownName` only.

## Behaviours and their defect

- `shownCombatantNames.test.ts`: the base name is the live entity name for a linked item, the stored name when the entity is absent, the label for no name, and carries no sequence number beside a sibling. Defect: a numbered base name, which would make the log read "Goblin 1 ×5".
- `nameQueueItems.test.ts`: with one kept Goblin and one removed sibling, the kept item reads "Goblin" and the removed item reads "Goblin 2". Defect: a removed item named among the kept items only, which drops its number.
- `nameQueueItems.test.ts`: two removed items and none kept read "Goblin 1" and "Goblin 2". Defect: both reading "Goblin" so the log cannot tell them apart.
- `nameQueueItems.test.ts`: a lone removed item that never had a sibling reads "Goblin". Defect: a number on an item with no sibling.
- `nameQueueItems.test.ts`: a kept item stays bare while its removed sibling exists, and both are numbered once the sibling is no longer removed. Defect: kept names computed over all items.
- `nameQueueItems.test.ts`: renaming the entity changes the names of kept and removed items alike. Defect: a removed item keeping a stale name.
- `nameQueueItems.test.ts`: `baseName` has no number for any item. Defect: the number leaking into `Added: <name>`.

## Verification

After the check rows pass and before the commit, run `pnpm run mutation-check -- app/domain/encounters/shownCombatantNames.ts app/src/screens/encounter/helper/nameQueueItems.ts app/src/screens/encounter/helper/buildQueueEntries.ts` from the repository root and resolve every survivor.
