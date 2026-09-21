# Sub-feature 3: Services import form and sync-batch branch tests

`devicesService` imports the `_system` DB module the way every other service imports a DB module. The sync service's `applyBatch` gets a test for each of four behaviours no assertion pins today, and its test's fake Tauri `invoke` loses the answers no test reaches.

## Files affected

`Modified:`

- `app/services/devicesService.ts` — namespace import of `@db/_system`; import form only, no logic change
- `app/services/__tests__/syncService.test.ts` — four new tests; `answerCommand` removed in favour of a default `invoke` answer

`Deleted:` none

`New:` none

`Moved:` none

`Draft:` none

## Layered breakdown

### Services

#### `app/services/devicesService.ts`

`app/services/CLAUDE.md` — Conventions requires `@db/<domain>` namespace imports; line 4 imports `getDevice`, `updateDevice` and `DeviceData` by name. `app/services/syncService.ts` already imports the same module as `import * as systemDb from '@db/_system';`.

- Replace line 4 with `import * as systemDb from '@db/_system';` followed by `import type { DeviceData } from '@db/_system';`. That is the value-plus-type pair line 2 and line 3 already use for `@db/paired-device`.
- `getDevice()` becomes `systemDb.getDevice()` at lines 25, 42, 66 and 90; `updateDevice(...)` becomes `systemDb.updateDevice(...)` at lines 34 and 70. `DeviceData` at line 40 is unchanged.
- No test file: no function's logic changes, so `app/services/CLAUDE.md` — Testing's obligation ("applies when such a function is added or its logic changes") does not fire. The rest of the file was checked against `app/services/CLAUDE.md` — Conventions: every exported function wraps its calls in `try`/`catch` and throws a typed domain error, and the other two DB imports are already namespace imports.

#### `app/services/__tests__/syncService.test.ts`

`app/services/CLAUDE.md` — Testing: "A test that exercises a branch must assert that branch's own distinguishing effect, not merely that the call still succeeds." Wiring stays as `.claude/rules/services-unit-tests.md` states it and as the file already has it. Each new test goes inside `describe('handleSyncMessage with a sync-batch message', …)`, starts with `const { handleSyncMessage } = await import('../syncService');`, and uses the file's `upsert`, `rawBatch`, `imageFileChecks` and `sentMessages` helpers.

Remove the fake command table:

- Delete `answerCommand` (lines 41-50). In `beforeEach`, replace `invoke.mockImplementation(answerCommand);` with `invoke.mockResolvedValue(undefined);`. On the correct implementation, the only command a test's default answer is ever reached for is `'send_message'`. The `'image_file_exists'` answer is overridden by every test that triggers that command. The rejecting default cannot fail a test, because `applyBatch` swallows file-request errors inside its `try`/`catch`.
- In `'requests only the file of an image that was applied and is missing on disk'`, the override's fallback `: answerCommand(command)` becomes `: Promise.resolve(undefined)`. `'still resolves as applied and keeps the watermark when a file request fails'` does not use `answerCommand` and stays unchanged.

Add four tests. Each must fail under the named change to `app/services/syncService.ts`: apply the change, confirm the failure, then revert it.

1. `'passes force true for any peer id when this device has no stored identity'` — `getDevice.mockResolvedValue(null)`; call `handleSyncMessage(PEER_ID, rawBatch([change], 1))` with `const change = upsert('adventures', 'adventure-a', 1)`. Assert `expect(applyUpsert).toHaveBeenCalledWith('adventures', change.row, true)`, three arguments matching `applyUpsert(table.name, change.row, force)`. Defect caught: dropping the fallback in `const force = endpointId > (ownDevice?.id ?? '')` (line 178) makes the batch reject with `SyncApplyError` and apply nothing; a fallback that sorts after `'peer'` passes `false`.
2. `'requests no file for an applied image row whose file_extension is missing or not a string'` — changes `upsert('images', 'image-a', 1)` (no `file_extension`) and `upsert('images', 'image-b', 2, { file_extension: 42 })`; `applyUpsert` resolves `'applied'` (the `beforeEach` default). Assert `imageFileChecks()` equals `[]` and `sentMessages()` equals `[]`. Defect caught: removing `if (typeof extension !== 'string') continue;` (line 210) sends `image_file_exists` for both rows; narrowing it to an `undefined` check still sends it for `image-b`.
3. `'checks no file for an applied non-image row that carries a file_extension key'` — change `upsert('adventures', 'adventure-a', 1, { file_extension: 'png' })`. Assert `imageFileChecks()` equals `[]` and `sentMessages()` equals `[]`. Defect caught: dropping `table.name === 'images'` from `if (result === 'applied' && table.name === 'images')` (line 187) sends `image_file_exists` for the adventure row.
4. `'applies a second sync batch only after the first batch has finished'`:
   - Create `const firstUpsertDone = Promise.withResolvers<void>();` and `const events: string[] = [];`.
   - `applyUpsert.mockImplementation(async (_table, row) => { … })`: push `` `start ${String(row.id)}` ``, await `firstUpsertDone.promise` when `row.id === 'adventure-a'`, push `` `end ${String(row.id)}` ``, return `'applied'`.
   - Start both calls without awaiting: `const first = handleSyncMessage(PEER_ID, rawBatch([upsert('adventures', 'adventure-a', 1)], 1));` and `const second = handleSyncMessage(PEER_ID, rawBatch([upsert('adventures', 'adventure-b', 2)], 2));`.
   - Let every pending microtask run with `await new Promise((resolve) => { setTimeout(resolve, 0); });`, then call `firstUpsertDone.resolve()` and `await Promise.all([first, second]);`.
   - Assert `events` equals `['start adventure-a', 'end adventure-a', 'start adventure-b', 'end adventure-b']`.
   - Defect caught: calling `applyBatch(endpointId, message.payload)` directly instead of through `runExclusive` (line 319) starts the second batch while the first waits, giving `['start adventure-a', 'start adventure-b', 'end adventure-b', 'end adventure-a']`. The no-transaction design that the comment at lines 173-174 describes rests on that serialization.
   - `Promise.withResolvers` is declared by the compiler's `lib.es2024.promise.d.ts` [spec-writer_23: app/node_modules/typescript/lib/lib.es2024.promise.d.ts:32 — `withResolvers<T>(): PromiseWithResolvers<T>;`], which `app/tsconfig.json`'s `"lib": ["ESNext", …]` reaches through `lib.esnext.d.ts` → `lib.es2025.d.ts` → `es2024` [spec-writer_24: app/node_modules/typescript/lib/lib.esnext.d.ts:17 and lib.es2025.d.ts:17 — `/// <reference lib="es2025" />`, `/// <reference lib="es2024" />`].

## Checks

From `app/`: `npx vitest run services`, then the `every check` rows of root `CLAUDE.md` — Tool Use Discipline.
