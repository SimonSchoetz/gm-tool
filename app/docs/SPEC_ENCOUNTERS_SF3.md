# SF3 — Service layer: `encountersService.ts`

Wraps the DB layer in typed domain errors. One file. Self-contained and type-checks on its own once SF1 and SF2 are complete.

## Files affected

New:

- `app/services/encountersService.ts`

## Services

Follows `app/services/foesService.ts` with every image-handling path removed — Encounter has no `image_id` column, so `imageService` is not imported and there is no `removeEncounterImage` function.

Imports: `import * as encounterDb from '@db/encounter';`, `import type { Encounter, UpdateEncounterInput } from '@db/encounter';`, and the six error factories from `@domain/encounters`.

No `UpdateEncounterData` type alias is declared. In `foesService.ts` that alias exists solely to widen the DB input with `imgFilePath?: string` for the image-upload path; with no image path there is nothing to widen, so the service's update parameter is typed `UpdateEncounterInput` directly. `sessionService.ts`'s `updateSession(id: string, data: UpdateSessionInput)` is the precedent for an image-less domain. SF4's `useEncounter` consumes `UpdateEncounterInput` from `@db/encounter` for the same reason.

Six exported functions, each wrapping its DB call in `try`/`catch` and throwing a typed domain error — never re-throwing a raw DB error:

| Function | Signature | Behavior | Throws |
| --- | --- | --- | --- |
| `getAllEncounters` | `(adventureId: string) => Promise<Encounter[]>` | returns `encounterDb.getAll(adventureId)` | `encounterLoadError(err)` |
| `getEncounterById` | `(id: string) => Promise<Encounter>` | `encounterDb.get(id)` inside the `try`; the null check is outside it | `encounterLoadError(err)` on a DB failure, `encounterNotFoundError(id)` when the row is null |
| `createEncounter` | `(adventureId: string) => Promise<string>` | returns `encounterDb.create(adventureId)` | `encounterCreateError(err)` |
| `updateEncounter` | `(id: string, data: UpdateEncounterInput) => Promise<void>` | `encounterDb.update(id, data)` | `encounterUpdateError(id, err)` |
| `deleteEncounter` | `(id: string) => Promise<void>` | `encounterDb.remove(id)` | `encounterDeleteError(id, err)` |
| `duplicateEncounter` | `(id: string) => Promise<string>` | returns `encounterDb.duplicate(id)` | `encounterDuplicateError(id, err)` |

Two signatures deliberately differ from their `foesService.ts` counterparts, both for the same reason (see the root spec's decision on Encounter carrying no `image_id`):

- `deleteEncounter` takes only `id`. `deleteFoe(id, foe = null)` accepts a pre-fetched entity so it can read `image_id` and delete the stored asset before removing the row; with no asset to clean up there is nothing to pre-fetch, and the extra parameter would be an unread argument. `sessionService.ts`'s `deleteSession(id)` is the shape reference.
- `duplicateEncounter` performs no `imageService.duplicateImage` step and calls `encounterDb.duplicate(id)` with one argument.

`getEncounterById`'s null check stays outside the `try` block, matching `foesService.ts`: inside it, the thrown `encounterNotFoundError` would be caught and re-wrapped as a load error, collapsing two distinct failures into one.

## Tests

None. `app/services/` has no `__tests__/` convention.
