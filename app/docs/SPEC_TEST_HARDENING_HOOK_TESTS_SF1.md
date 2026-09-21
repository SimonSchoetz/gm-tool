# Sub-feature 1: Absence assertions read the test's own database

Two db tests assert that a write left no row by asking the module's own reader. A reader that fails and returns nothing would pass them too. Both switch to a raw select on the test's database, as `.claude/rules/db-unit-tests.md` requires. No production code changes.

## Files affected

`Modified:`

- `app/db/adventure/__tests__/remove.test.ts` — the first test asserts the adventure row is gone through a raw select
- `app/db/_system/__tests__/device.test.ts` — "rejects an id that is not hex and stores no device" asserts the `_system` table is unchanged through a raw select

`Deleted:` none

`New:` none

`Moved:` none

`Draft:` none

## Layered breakdown

### Database

#### `app/db/adventure/__tests__/remove.test.ts`

In `'deletes the adventure together with its sessions, steps, encounters, base entities and content sections'`:

- Replace `const { getAll } = await import('../get-all');` with `const { getDatabase } = await import('@db/database');`.
- Replace `expect(await getAll()).toEqual([]);` with an assertion that `(await getDatabase()).select<unknown[]>('SELECT id FROM adventures')` resolves to `[]`.
- Keep the `countChildRows()` assertion.
- Defect caught: a `remove` that leaves the adventure row, including when `getAll` would hide it by returning `[]` for any reason.

`'leaves a second adventure and its children untouched'` stays unchanged. Its `toEqual([keptId])` fails on a reader that returns nothing (root Key Architectural Decisions — An absence assertion that also names a kept row may stay on the reader).

#### `app/db/_system/__tests__/device.test.ts`

In `'rejects an id that is not hex and stores no device'` (lines 47-53):

- The test imports only `updateDevice` from `'../device'`, plus `getDatabase` from `'@db/database'`.
- Read `SELECT id, value FROM _system ORDER BY id` through `(await getDatabase()).select<unknown[]>(…)` before the rejected call, keep `await expect(updateDevice({ id: 'not-hex', name: null })).rejects.toThrow();`, read the same select after, and assert the two results are equal. This replaces `expect(await getDevice()).toBeNull()`.
- Defect caught: an `updateDevice` that writes the device before validating it.
- Why the whole table, not a `WHERE id = 'device'` read: a mistyped id in that clause would return `[]` both times and pass. The whole-table read is not empty before the call, because the `_system` migration seeds a `versioning` row [spec-writer_34: app/db/_migrations/1780575810242_init_system.ts:10-13 — as of 8b186f88]. The comparison does not depend on which rows the migrations seed.
- The title and the other four tests stay unchanged. `'has no device on a fresh database'` and `'reads a device row whose value is SQL NULL as no device'` are `getDevice`'s own tests of its missing-row result, not read-backs.

## Checks

From `app/`: `npx vitest run db`, then the `every check` rows of root `CLAUDE.md` — Tool Use Discipline.
