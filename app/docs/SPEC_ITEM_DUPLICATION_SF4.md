# SF4 — Leaf entity duplication

Adds duplication for the six image-bearing leaf entities: NPC, PC, Foe, Faction, Location, Item. Each gets a DB duplicate operation, a domain error factory, and a service function that composes image duplication with row duplication.

Sessions are excluded — they have no `image_id` and own child rows, and are specified in SF5.

## Files affected

**New** (six sets, one per entity — `<singular>` and `<plural>` per the substitution table below):

- `app/db/<singular>/duplicate.ts`
- `app/db/<singular>/__tests__/duplicate.test.ts`

**Modified** (six sets):

- `app/db/<singular>/index.ts` — add `export { duplicate } from './duplicate'`
- `app/services/<plural>Service.ts` — add `duplicate<Singular>`
- `app/domain/<plural>/errors.ts` — add the duplicate error factory
- `app/domain/<plural>/index.ts` — add the two new exports
- `app/domain/index.ts` — add the six new error factories and their types to the grouping barrel, matching how the existing per-domain error exports are listed

## Substitution table

`db/npc/duplicate.ts`, `services/npcsService.ts`, and `domain/npcs/errors.ts` are the reference implementations. Every other entity is a pure name substitution. Verified against current conventions before being named as references.

| Token | NPC | PC | Foe | Faction | Location | Item |
| --- | --- | --- | --- | --- | --- | --- |
| `<singular>` dir | `npc` | `pc` | `foe` | `faction` | `location` | `item` |
| `<plural>` | `npcs` | `pcs` | `foes` | `factions` | `locations` | `items` |
| SQL table | `npcs` | `pcs` | `foes` | `factions` | `locations` | `items` |
| Entity type | `Npc` | `Pc` | `Foe` | `Faction` | `Location` | `Item` |
| Service fn | `duplicateNpc` | `duplicatePc` | `duplicateFoe` | `duplicateFaction` | `duplicateLocation` | `duplicateItem` |
| Getter reused | `getNpcById` | `getPcById` | `getFoeById` | `getFactionById` | `getLocationById` | `getItemById` |
| Error type | `NpcDuplicateError` | `PcDuplicateError` | `FoeDuplicateError` | `FactionDuplicateError` | `LocationDuplicateError` | `ItemDuplicateError` |
| Error factory | `npcDuplicateError` | `pcDuplicateError` | `foeDuplicateError` | `factionDuplicateError` | `locationDuplicateError` | `itemDuplicateError` |
| `assertValidId` label | `'NPC'` | `'Pc'` | `'Foe'` | `'Faction'` | `'Location'` | `'Item'` |

These labels are inconsistent across domains — `'NPC'` is fully capitalised while `'Pc'` is not — and the table reproduces each domain's existing `get.ts` value verbatim. Do not normalise them; the label appears in thrown error messages and changing it would alter existing behaviour outside this feature's scope.

## DB layer

### `db/<singular>/duplicate.ts`

Exports `duplicate(sourceId: string, imageId: string | null): Promise<string>`, returning the new row's id.

Model on the domain's own `create.ts` for imports and `buildCreateQuery` usage. The differences:

1. `assertValidId(sourceId, '<label>')`.
2. Read the source row via the domain's `get(sourceId)`. Throw `new Error(\`<Entity> not found: ${sourceId}\`)` when it is `null` — an internal invariant, exempt from the error-factory requirement per `app/CLAUDE.md`.
3. `generateId()` and `generateDbTimestamps()`.
4. Build the INSERT from **every column of the source row except** `id`, `name`, `created_at`, and `updated_at`, then add the fresh timestamps and `image_id: imageId`.

Specify the column set by exclusion, not by listing columns: the six schemas differ in which optional text columns they carry, and an explicit list would be wrong for at least one of them. Derive the copied columns from the source row object.

`name` is omitted so the column takes SQL `NULL`. Do not pass `name: null` explicitly and do not pass an empty string — `app/db/CLAUDE.md`'s INSERT best practice is to specify only the fields being set and let the database supply `NULL` for the rest.

`image_id` comes from the parameter, never from the source row. The service has already created a fresh image row by the time this is called; copying the source's `image_id` would produce the shared-image failure the Key Architectural Decisions section rules out.

`buildCreateQuery`'s type parameter constrains values to `string | number | null`. Supply the explicit type argument so excess property checking stays active, as every existing `create.ts` does.

## Service layer

### `services/<plural>Service.ts`

Add:

```ts
export const duplicate<Singular> = async (id: string): Promise<string> => {
  try {
    const source = await get<Singular>ById(id);
    const imageId = source.image_id
      ? await imageService.duplicateImage(source.image_id)
      : null;
    return await <singular>Db.duplicate(id, imageId);
  } catch (err) {
    throw <singular>DuplicateError(id, err);
  }
};
```

This is the coordinated multi-step operation `app/services/CLAUDE.md` requires to live in the service rather than the component: if the row insert fails after the image has been written, the component would otherwise be left holding an orphaned image.

Image first, then the entity row — the order `db/_sync/registry.ts` declares for parents before children.

`getNpcById` and its siblings already throw `<singular>NotFoundError` when the row is absent, so no separate existence check is needed here.

All six service files already import `imageService` as `* as imageService from '@services/imageService'`. No import statement needs adding in any of them.

## Domain layer

### `domain/<plural>/errors.ts`

Add the duplicate error factory following the pattern of the `<singular>UpdateError` already in each file — it takes the same `(id: string, cause?: unknown)` shape. Message: `` `Failed to duplicate <entity>: ${String(cause)}` `` with the id included as the existing update-error messages do in that file.

## Tests

### `db/<singular>/__tests__/duplicate.test.ts`

Follow the setup already used in that domain's `__tests__/` directory: `vi.mock('@tauri-apps/plugin-sql', ...)` at module scope, `afterEach(() => { vi.resetModules(); })`, static top-level import, and `mockSelect.mockResolvedValue([])` in `beforeEach` before anything reaches `getDatabase()`.

Required assertions, one per distinct path named in the Key Architectural Decisions section:

- `omits name so the duplicate has no name` — the INSERT's column list does not contain `name`.
- `copies every other source column` — the INSERT carries the source row's `adventure_id` and its text columns. Assert against the columns that domain's schema actually declares.
- `writes the passed image id, not the source's` — call with an `imageId` differing from the source row's `image_id`; assert the inserted value is the parameter.
- `writes null image id when passed null` — the inserted `image_id` is `null` even when the source row has one.
- `generates a fresh id and fresh timestamps` — the inserted `id` differs from `sourceId`, and `created_at` / `updated_at` differ from the source row's.
- `throws when the source row does not exist` — `get` resolves `null`; assert the thrown message.

Service functions get no test file: `app/services/` has no `__tests__/` convention in this codebase, and the required coverage is at the DB layer.
