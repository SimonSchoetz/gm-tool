# Sub-feature 3: Services: random combatants, events and Duplicate with the queue

`encounterQueueService` adds random combatants and events through one shared append path, lets a rename write an event's `name`, and copies a queue; `encounterService.duplicateEncounter` calls that copy after it creates the encounter.

## Files affected

Modified:

- `app/domain/encounters/index.ts` — adds `export { encounterQueueDuplicateError } from './errors';` directly after the `encounterQueueUpdateError` line (explicit, one name per line as the file does for errors)
- `app/domain/encounters/errors.ts` — adds `encounterQueueDuplicateError(cause?)` following `encounterQueueUpdateError` in the same file (module-private type `EncounterQueueDuplicateError`, `error.name = 'EncounterQueueDuplicateError'`, message `Failed to duplicate the encounter queue: ${String(cause)}`); the message of `encounterQueueAddError` changes from `Failed to add combatants to the encounter queue: ${String(cause)}` to `Failed to add to the encounter queue: ${String(cause)}`, because the error now also covers an event Add (the two assertions that name the old message are in `encounterQueueService.test.ts`, below)
- `app/services/encounterQueueService.ts` — see Services
- `app/services/encounterService.ts` — `duplicateEncounter` also copies the queue
- `app/services/__tests__/encounterQueueService.test.ts` — the `vi.mock` factory of `@db/encounter-queue-item` gains a hoisted `duplicateByEncounter` spy and the one of `@db/encounter-log-entry` a hoisted `getAllByEncounter` spy, each typed against the real export; the two assertions that name the old add-error message (the `rejects.toThrow` regexes in `rejects quantity %s as EncounterQueueAddError before any db call` and `rejects an entity that does not exist without any write`) change from `Failed to add combatants to the encounter queue:` to `Failed to add to the encounter queue:`; new `describe` blocks for the cases below
- `app/services/__tests__/support/encounterQueueFixtures.ts` — gains `buildEncounterLogEntry(kind, payload, overrides)`, the services layer's own copy of the builder in `app/src/__tests__/support/buildEncounterLogEntry.ts` (a layer's tests import support only from their own layer), returning `EncounterLogEntry`

New:

- `app/services/__tests__/encounterService.test.ts`

## Services

[spec-writer_1: scratch tsc and eslint run, see sub-feature 1]

```ts
export declare const encounterQueueDuplicateError: (
  cause?: unknown,
) => Error & { name: 'EncounterQueueDuplicateError' };
export declare const addRandomCombatants: (
  encounterId: string,
  name: string,
  startingMaxHp: number | null,
  quantity: number,
) => Promise<void>;
export declare const addEvent: (
  encounterId: string,
  name: string,
) => Promise<void>;
export declare const duplicateQueue: (
  sourceEncounterId: string,
  targetEncounterId: string,
) => Promise<void>;
export type UpdateQueueItemData = Pick<
  UpdateEncounterQueueItemInput,
  'custom_name' | 'name' | 'notes'
>;
```

- `appendQueueItems` is module-private. It takes the encounter id and a synchronous plan `(queueItems: EncounterQueueItem[], firstSortOrder: number) => { rows: CreateEncounterQueueItemInput[]; shared: SharedEncounterQueueItemFields }`, reads the encounter's items once, computes `firstSortOrder` as the highest `sort_order` plus one (0 on an empty queue), calls `queueItemDb.createMany` with the plan's output, then writes the `added` entry with the swallow `addEntityCombatants` has today (same comment, the combatants are stored and a retry would add the batch twice). `addEntityCombatants` keeps its signature, its checks and its entity and section reads, then calls `appendQueueItems` with its sequence-number plan; its observable behavior does not change (KAD "One append path with three entry points").
- `addRandomCombatants` runs inside the same try/catch that throws `encounterQueueAddError(err)`: it validates `quantity` with `parseAddQuantity(String(quantity))` (`Invalid quantity: ${quantity}`), the name with `normalizeQueueItemName` (a `null` result throws `Name is required`), and a non-null HP with `parseRandomCombatantHp(String(startingMaxHp))` (a result that is not valid with a non-null `hp` throws `Invalid HP: ${startingMaxHp}`). Its rows are `kind: 'combatant'` with a `sequence_number` and a `sort_order` and no `base_entity_id` key; `shared` holds the trimmed `name` and, for a non-null HP (0 included), `starting_max_hp`. The first `sequence_number` is the highest `sequence_number ?? 0` among the encounter's items with `kind === 'combatant'`, `base_entity_id === null` and the same trimmed `name` (exact, case-sensitive), removed items included because the service reads every stored item, plus one. A combatant whose entity was deleted has `base_entity_id` null and a stored `name`, so it counts with random combatants of that name, as `shownCombatantNames` keys it (KAD "A combatant whose entity was deleted numbers with the random combatants of its name").
- `addEvent` validates the name as above and writes one row `kind: 'event'` with its `sort_order`, no `sequence_number` and no `base_entity_id` key; `shared` holds the trimmed `name`.
- `UpdateQueueItemData`'s comment is rewritten: only `EncounterEventNameField` passes `name`, never for a combatant, whose `name` is its numbering key and the name stored from its entity.
- `duplicateQueue` reads the source's items (`queueItemDb.getAllByEncounter`) and log entries (`logEntryDb.getAllByEncounter`, imported from `@db/encounter-log-entry`), runs `deriveCombatState` over them, builds a `Map` from the id of every item whose derived state is not removed to its derived `maxHp` (`null` for an item with no HP, an event included), and calls `queueItemDb.duplicateByEncounter(source, target, map)`. Any failure throws `encounterQueueDuplicateError(err)`.
- `encounterService.duplicateEncounter` calls `encounterDb.duplicate(id)`, then `encounterQueueService.duplicateQueue(id, newId)` (imported as `import * as encounterQueueService from '@services/encounterQueueService'`, a sibling service, with no import cycle because `encounterQueueService` does not import `encounterService`), and returns `newId`; its try/catch still throws `encounterDuplicateError(id, err)`. A failure of the queue copy leaves the new encounter and a part of its queue behind, the accepted cost of a platform with no atomic multi-call write (KAD "Duplicate derives the full-HP maximum, then copies").

Cross-sub-feature wiring: `addRandomCombatants` and `addEvent` are called by `useEncounterQueueItems` in sub-feature 4; the widened `UpdateQueueItemData` is used by `EncounterEventNameField` in sub-feature 6; `duplicateQueue` has its one caller here.

## Behaviours and their defect

- `encounterQueueService.test.ts` (random combatants): the first `sequence_number` is the highest among combatants with no entity and the same name plus one, with a gap in the existing numbers. Defect: numbering by count, or restarting at 1.
- `encounterQueueService.test.ts`: an event of the same name, an entity combatant of the same name and a random combatant of another name or another letter case do not move the number. Defect: events or entity combatants entering the numbering key.
- `encounterQueueService.test.ts`: one `createMany` call carries the quantity as rows with continuing `sort_order`, `kind` `combatant` and no `base_entity_id` key; `shared` has the trimmed name and, for HP 0, `starting_max_hp` 0, and no `starting_max_hp` key for a `null` HP. Defect: an untrimmed name breaking the numbering key, or HP 0 dropped as falsy.
- `encounterQueueService.test.ts`: a blank name, HP `-1` and `1.5`, and quantity 0 and 100 each reject as `EncounterQueueAddError` before any db call. Defect: a combatant stored with a blank name or an invalid HP.
- `encounterQueueService.test.ts`: an event add writes one row `kind` `event` with no `sequence_number` and no `base_entity_id` key and the trimmed name; a blank name rejects. Defect: an event given a number.
- `encounterQueueService.test.ts`: each of the three adds writes the `added` entry once, after the insert, with the ids `createMany` returned. Defect: an Add that writes no log line, or writes it before the rows exist.
- `encounterQueueService.test.ts` (`duplicateQueue`): the map holds the derived max HP, not the stored `starting_max_hp` (a `max-hp` entry changes it), `null` for an item without HP and for an event, and keeps a defeated item. Defect: copying the stored HP, or dropping a defeated item.
- `encounterQueueService.test.ts` (`duplicateQueue`): an item with a `removed` entry is absent from the map, and an item whose `removed` entry a `revert` dropped is present. Defect: copying removed items, or ignoring a revert.
- `encounterQueueService.test.ts` (`duplicateQueue`): the source's items and log are read for the source id and `duplicateByEncounter` receives both ids; a failing read rejects as `EncounterQueueDuplicateError`. Defect: copying into the wrong encounter, or a raw db error reaching the caller.
- `encounterQueueService.test.ts` (`duplicateQueue`): no log entry is written for either encounter. Defect: a `duplicate` line or copied log entries in the copy, whose log must start empty.
- `encounterService.test.ts`: `duplicateEncounter` creates the encounter first, then copies the queue from the source id into the new id (call order and arguments asserted on `duplicate` and `duplicateByEncounter`) and resolves the new id. Defect: a copy before the target exists, or the new id not returned.
- `encounterService.test.ts`: a failing queue copy rejects as `EncounterDuplicateError`. Defect: a half-copied encounter reported as a success.

The `encounterService.test.ts` wiring follows `.claude/rules/services-unit-tests.md`: `@db/encounter` (`duplicate`), `@db/encounter-queue-item`, `@db/encounter-log-entry`, `@db/base-entity` and `@db/base-entity-content-section` are mocked, and the sibling `encounterQueueService` stays real.

## Verification

After the check rows pass and before the commit, run `pnpm run mutation-check -- app/services/encounterQueueService.ts app/services/encounterService.ts` from the repository root and resolve every survivor.
