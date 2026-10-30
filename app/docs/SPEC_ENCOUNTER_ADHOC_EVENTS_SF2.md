# Sub-feature 2: Database: create-many shapes, duplicate by encounter

`createMany` accepts a random combatant (no entity) and an event beside an entity combatant, and a new `duplicateByEncounter` copies an encounter's queue items into another encounter with a per-item starting max HP. No migration and no new column: `kind` already takes `event`, and `base_entity_id`, `name`, `notes`, `custom_name`, `sequence_number` and `starting_max_hp` are nullable (`app/db/encounter-queue-item/schema.ts`).

## Files affected

Modified:

- `app/db/encounter-queue-item/types.ts` — `CreateEncounterQueueItemInput` becomes the union below; `SharedEncounterQueueItemFields` stays as it is
- `app/db/encounter-queue-item/create-many.ts` — see Database
- `app/db/encounter-queue-item/index.ts` — explicit named exports (the barrel convention of `app/db/CLAUDE.md` — Conventions): add `export { duplicateByEncounter } from './duplicate-by-encounter';` and add `CreateEncounterQueueItemInput` and `SharedEncounterQueueItemFields` to the existing `export type { … } from './types';` list
- `app/db/encounter-queue-item/__tests__/create-many.test.ts` — gains the cases below; no existing assertion goes stale, because the entity shape and its rejection of an empty `base_entity_id` are unchanged

No change: `app/db/encounter-queue-item/schema.ts`, `update.ts` (its input type already carries `name`) and `get-all-by-encounter.ts`.

New:

- `app/db/encounter-queue-item/duplicate-by-encounter.ts`
- `app/db/encounter-queue-item/__tests__/duplicate-by-encounter.test.ts`

## Database

```ts
type EncounterQueueItemPlacement = { encounter_id: string; sort_order: number };

export type CreateEncounterQueueItemInput = EncounterQueueItemPlacement &
  (
    | { kind: 'combatant'; base_entity_id: string; sequence_number: number }
    | { kind: 'combatant'; sequence_number: number }
    | { kind: 'event' }
  );

export declare const duplicateByEncounter: (
  sourceEncounterId: string,
  targetEncounterId: string,
  startingMaxHpById: ReadonlyMap<string, number | null>,
) => Promise<void>;
```

[spec-writer_1: scratch tsc and eslint run, see sub-feature 1 — the entity-combatant row built by `Array.from` still type-checks against the union, and an entity combatant without `sequence_number` and an event with one are both rejected]

- The three shapes are an entity combatant, a random combatant (a combatant with no `base_entity_id` key) and an event (no `base_entity_id` and no `sequence_number` key). A batch holds one shape, because `buildCreateManyQuery` throws on rows with differing keys; the type allows a mixed array, so a comment above `CreateEncounterQueueItemInput` in `types.ts` states that the rows of one call have one shape (the existing comment above `SharedEncounterQueueItemFields` already says a batch cannot hold different key sets).
- `createMany` calls `assertValidId` on `base_entity_id` only for a row that carries the key, and builds each row's `data` without the keys a shape lacks: an absent column is left out of the INSERT, never passed as an explicit `null` (`app/db/CLAUDE.md` — INSERT Best Practice). The type argument given to `buildCreateManyQuery` lists `base_entity_id` and `sequence_number` as optional, so excess-property checking on the `data` literal stays active.
- `duplicateByEncounter` follows `app/db/session-step/duplicate-by-session.ts` (read against `app/db/CLAUDE.md` — Duplication: it uses `buildDuplicateQuery`, `assertValidId` and a destructure of the excluded columns, so it is a compliant reference): `assertValidId` both ids (`'Encounter'`), read the source's items with `getAllByEncounter` (`sort_order` order), skip an item whose id is not a key of `startingMaxHpById`, and per kept item run one `buildDuplicateQuery('encounter_queue_items', generateId(), copiedColumns, { encounter_id: targetEncounterId, starting_max_hp: <the map's value> })` and one `execute`. `copiedColumns` is the item without `id`, `encounter_id`, `starting_max_hp`, `created_at` and `updated_at`, so `kind`, `base_entity_id`, `name`, `custom_name`, `notes`, `sequence_number` and `sort_order` are copied as stored. The map is the caller's selection of items, an input and not a limit the operation guarantees, so the WHERE-clause rule of `app/db/CLAUDE.md` — Conventions does not apply to it; the test keeps a second source item outside the map that must stay uncopied.

Cross-sub-feature wiring: `duplicateByEncounter` is called by `duplicateQueue` in sub-feature 3; the two type exports are imported by `appendQueueItems` in sub-feature 3.

## Behaviours and their defect

- `create-many.test.ts`: a batch of random combatants (no `base_entity_id` key, shared name and starting max HP) stores `base_entity_id` null, the given `sequence_number`, the name and the HP in every row. Defect: the id guard rejecting a row without an entity, which makes random combatants unaddable.
- `create-many.test.ts`: one event row stores `kind` `event`, `base_entity_id` null, `sequence_number` null, the shared name and its sort order. Defect: an event stored with a sequence number or an entity link.
- `duplicate-by-encounter.test.ts`: an entity combatant, a random combatant and an event of the source appear in the target with the same `kind`, `base_entity_id`, `name`, `custom_name`, `notes`, `sequence_number` and `sort_order`, new ids and fresh timestamps (the clock is fixed to two instants). Defect: a dropped column, which loses a rename or a note in the copy.
- `duplicate-by-encounter.test.ts`: `starting_max_hp` of every copy is the map's value, a number for one item and `null` for another, whatever the source stored. Defect: copying the stored value, which loses a Set max HP edit or gives an event an HP.
- `duplicate-by-encounter.test.ts`: a source item that is not a key of the map is not copied, and the source's own rows are all still there, read from the database directly. Defect: a removed item copied, or the source's rows moved instead of copied.
- `duplicate-by-encounter.test.ts`: an empty source id and an empty target id each reject and copy nothing. Defect: a missing id guard.

## Verification

After the check rows pass and before the commit, run `pnpm run mutation-check -- app/db/encounter-queue-item/create-many.ts app/db/encounter-queue-item/duplicate-by-encounter.ts` from the repository root and resolve every survivor.
