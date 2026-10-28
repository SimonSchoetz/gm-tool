# Sub-feature 2: Queue service

Adds the service that loads the queue, adds entity combatants (rows, sort order, numbers, HP prefill, the `added` log entry) and rewrites the queue's order, with the three domain pieces it needs. SF3's `useEncounterQueueItems` wires `getQueueItems`, `addEntityCombatants` and `reorderQueueItems`; SF6's `EncounterAddRow` is the second consumer of `parseAddQuantity`.

## Files affected

Modified:

- `app/domain/encounters/errors.ts` — add `encounterQueueLoadError`, `encounterQueueAddError`, `encounterQueueReorderError`, each `(cause?: unknown)` in the shape of `encounterLoadError`, with error names `EncounterQueueLoadError`, `EncounterQueueAddError`, `EncounterQueueReorderError` and messages `Failed to load the encounter queue: ${String(cause)}`, `Failed to add combatants to the encounter queue: ${String(cause)}`, `Failed to reorder the encounter queue: ${String(cause)}`
- `app/domain/encounters/index.ts` — explicit named exports, one statement per name as the file does: the three factories and `parseAddQuantity`
- `app/domain/base-entity-content-sections/index.ts` — explicit export `singleStatBlockHp`

Deleted: none

New:

- `app/domain/encounters/addQuantity.ts`, `app/domain/encounters/__tests__/addQuantity.test.ts`
- `app/domain/base-entity-content-sections/singleStatBlockHp.ts`, `app/domain/base-entity-content-sections/__tests__/singleStatBlockHp.test.ts`
- `app/services/encounterQueueService.ts`, `app/services/__tests__/encounterQueueService.test.ts`

Moved: none

Draft: none

## Layered breakdown

### Domain

`addQuantity.ts` holds module-private `MIN_ADD_QUANTITY = 1` and `MAX_ADD_QUANTITY = 99` (the ceiling keeps one INSERT far below SQLite's 32766 bound-parameter cap [encounter-adr_32: `~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/libsqlite3-sys-0.30.1/sqlite3/sqlite3.c:13892-13893` — `# define SQLITE_MAX_VARIABLE_NUMBER 32766` unless already defined] [encounter-adr_43: ``grep -rn SQLITE_MAX_VARIABLE_NUMBER .github app/src-tauri`` — not found]) and exports `parseAddQuantity(raw: string): number | null`: the number when `parseWholeNumberInput(raw)` (imported from `'../base-entity-content-sections'`, as `domain/base-entities/errors.ts` imports its sibling) returns a valid, non-null value inside the range, else `null`. SF6 exports the two constants for the quantity input's `min` and `max`.

`singleStatBlockHp.ts` exports `singleStatBlockHp(sections: { type: string; content: string | null }[]): number | null`: when exactly one section in total has type `basic-stat-block` or `5e-stat-block`, its HP (via `parseBasicStatBlockContent(content).basicStatBlock.hp` or `readFiveEStatBlockContent(content).fiveEStatBlock.hp`, imported from the sibling files), negatives and 0 included; every other case, an empty HP included, gives `null`. Corrupt basic stat block content makes `parseBasicStatBlockContent` throw; the throw stays unguarded and reaches the Error Boundary, as opening that section on the entity screen does. C10. [spec-writer_7: ran `npx tsc --noEmit` and `npx eslint` on scratch files in `domain/encounters/`, `domain/base-entity-content-sections/` and `services/` declaring `parseAddQuantity`, `singleStatBlockHp` and the three service functions of this sub-feature — observed no type error and only the unused-export lint report]

Test behaviors:

- `addQuantity.test.ts`: accepts 1 and 99 and returns the number; rejects `'0'`, `'100'`, `''`, `'1.5'`, `'abc'`, `'-1'` with `null` — catches an off-by-one range, an empty string read as valid and a decimal truncated
- `singleStatBlockHp.test.ts`: one Basic block with HP gives it, 0 and a negative HP included — catches a falsy check that drops 0; one 5e block gives its HP; two stat blocks (two Basic, and one Basic with one 5e) give `null` — catches counting per type; no stat block and a stat block with an empty HP give `null`; a text section beside one stat block does not count — catches counting every section

### Services

`encounterQueueService.ts` imports `* as queueItemDb from '@db/encounter-queue-item'`, `* as logEntryDb from '@db/encounter-log-entry'`, `* as baseEntityDb from '@db/base-entity'`, `* as sectionDb from '@db/base-entity-content-section'`, and the domain errors, `baseEntityNotFoundError`, `parseAddQuantity` and `singleStatBlockHp` from `@domain`:

```ts
export declare const getQueueItems: (encounterId: string) => Promise<EncounterQueueItem[]>;
export declare const addEntityCombatants: (
  encounterId: string,
  entityType: BaseEntityType,
  baseEntityId: string,
  quantity: number,
) => Promise<void>;
export declare const reorderQueueItems: (orderedIds: string[]) => Promise<void>;
```

- `getQueueItems` delegates to `queueItemDb.getAllByEncounter`; a failure is wrapped as `encounterQueueLoadError`.
- `addEntityCombatants` has one try/catch that wraps any failure as `encounterQueueAddError`. In order: throw when `parseAddQuantity(String(quantity))` is `null` (this rejects 0, 100 and 1.5 before any read); `baseEntityDb.get(entityType, baseEntityId)`, throwing `baseEntityNotFoundError(entityType, baseEntityId)` for `null`; `sectionDb.getAllByBaseEntity(baseEntityId)`; `startingMaxHp = singleStatBlockHp(sections)`; `queueItemDb.getAllByEncounter(encounterId)`; the first `sort_order` is the highest existing plus 1, and 0 for an empty queue; the first `sequence_number` is the highest `sequence_number` among items whose `base_entity_id` equals `baseEntityId`, plus 1, and 1 when there is none; one `queueItemDb.createMany` of `quantity` rows with consecutive `sort_order` and `sequence_number`, `kind: 'combatant'`, `base_entity_id`, `name` set to the entity's name only when it is not `null`, and `starting_max_hp` set only when `startingMaxHp` is not `null` (the omitted key leaves the column `NULL`, `app/db/CLAUDE.md` — INSERT Best Practice); then `logEntryDb.create({ encounter_id, kind: 'added', payload: { queueItemIds: <the ids createMany returned> } })`. A failure of the log write after the insert leaves the combatants added, which the decision record accepts because the derivation does not read `added`.
- `reorderQueueItems` calls `queueItemDb.update(id, { sort_order: index })` for each id in array order, one await per call, as `sessionStepService.bulkReorderSteps` does; a failure is wrapped as `encounterQueueReorderError`.

Test behaviors (`encounterQueueService.test.ts`, mocking the four `@db` modules per `.claude/rules/services-unit-tests.md`):

- the new rows continue `sort_order` after the highest existing value, with a gap in the existing values, and start at 0 on an empty queue — catches `length` used instead of the highest value and a wrong empty case
- numbering continues from the highest `sequence_number` of the same base entity, with a gap (1 and 3 present gives 4), ignores another entity's higher numbers, and starts at 1 — catches `length + 1` and counting every item
- one `createMany` call receives all `quantity` rows, `starting_max_hp` carries the single stat block's HP and the key is absent for no stat block, two stat blocks and an empty HP, and `name` is absent for an unnamed entity — catches per-row writes and a stored `0` for "not set"
- the `added` entry is written after the insert with the ids `createMany` returned, in order, and is not written when `createMany` rejects — catches a log line for combatants that were never stored
- quantity 0, 100 and 1.5 reject as `EncounterQueueAddError` before any db call, and an entity that does not exist rejects without any write — catches a skipped guard
- `reorderQueueItems` updates each id with its array index as `sort_order`, in array order — catches an off-by-one and a reversed order
