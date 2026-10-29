# Sub-feature 1: Combat log read and derivation

The queue derives each combatant's HP, defeated mark and removal from the encounter's log entries and shows them. Nothing writes the seven new kinds yet (SF3 and SF4 do), so this sub-feature is observable through its tests only. Key Architectural Decisions that govern it: "Event-sourced combat state", "Payload shapes", "Derivation contract", "Shared view-model", "Reorder input", "Numbering filter order", "A defeated combatant's image turns grey".

## Files affected

Modified:

- `app/domain/encounters/logEntryPayloads.ts` — seven schemas, `readLogEntry`.
- `app/domain/encounters/deriveCombatState.ts` — takes entries, returns defeated and removed.
- `app/domain/encounters/errors.ts` — `encounterLogLoadError`.
- `app/domain/encounters/index.ts` — add `export { encounterLogLoadError } from './errors';` in the file's explicit-named-export style.
- `app/domain/encounters/__tests__/logEntryPayloads.test.ts` — new cases.
- `app/domain/encounters/__tests__/deriveCombatState.test.ts` — every existing call passes one argument and gains `[]` as the second; the `toEqual` assertions on the returned object gain `defeated: false, removed: false`.
- `app/db/encounter-log-entry/types.ts` — add `EncounterLogEntry`, inferred from `encounterLogEntryTable.zodSchema` as `app/db/encounter-queue-item/types.ts` does.
- `app/db/encounter-log-entry/index.ts` — add `getAllByEncounter` and `type EncounterLogEntry` as explicit named exports (`db/` bans `export *`).
- `app/src/data-access-layer/encounters/encounterKeys.ts`, `encounterQueryOptions.ts`, `index.ts` and `app/src/data-access-layer/index.ts` — key, options, hook export (explicit named exports in both barrels).
- `app/src/screens/encounter/components/EncounterQueue/EncounterQueue.tsx`, `components/EncounterQueueEntry/EncounterQueueEntry.tsx` and `EncounterQueueEntry.css`.
- `app/src/screens/encounter/components/EncounterQueue/components/EncounterQueueEntry/helper/describeQueueEntryHp.ts` — add `describeQueueEntryImage`; `helper/__tests__/describeQueueEntryHp.test.ts` — new cases for it, the existing ones stay valid (SF2 moves both files).
- `app/src/data-access-layer/encounters/__tests__/useEncounter.test.ts` — replace its local `encounterRow` with `buildEncounter({ id })` from `@/__tests__/support/buildEncounter`.

Moved:

- `mv app/src/screens/encounter/components/EncounterQueue/helper/buildQueueEntries.ts app/src/screens/encounter/helper/buildQueueEntries.ts`, then change the signature (below). Its only consumer is the new hook, whose module is `screens/encounter/`.
- `mv app/src/screens/encounter/components/EncounterQueue/helper/__tests__/buildQueueEntries.test.ts app/src/screens/encounter/helper/__tests__/buildQueueEntries.test.ts`, then update every call to the new signature.

New:

- `app/db/encounter-log-entry/get-all-by-encounter.ts` and `__tests__/get-all-by-encounter.test.ts`.
- `app/services/encounterLogEntryService.ts` (no test file: a pure delegate-and-wrap).
- `app/src/data-access-layer/encounters/useEncounterLogEntries.ts`.
- `app/src/screens/encounter/hooks/useEncounterQueueEntries.ts` and `hooks/__tests__/useEncounterQueueEntries.test.ts`.
- `app/src/__tests__/support/buildEncounterLogEntry.ts` (`buildEncounterLogEntry(kind, payload, overrides)` returning an `EncounterLogEntry`, the payload serialized with `serializeLogEntryPayload`) and `buildEncounter.ts` (`buildEncounter(overrides)` returning an `Encounter`, defaults from the `encounterRow` fixture in `useEncounter.test.ts`, `id: 'encounter-1'`).

## Layered breakdown

### Domain

`logEntryPayloads.ts` gains schemas for the kinds below, each list `.min(1)` and each number `z.int().min(0)`. `LogEntryKind` and `LogEntryPayload` stay derived from the schema table.

| Kind | Payload |
| --- | --- |
| `damage`, `heal` | `targets`: list of `{ queueItemId: string, amount: number }` |
| `temp-hp`, `max-hp` | `targets`: list of `{ queueItemId: string, value: number }` |
| `defeated`, `undefeated`, `removed` | `queueItemIds`: list of strings, as `added` has |

```ts
declare const readLogEntry: (
  kind: string,
  payload: string,
) => { [K in LogEntryKind]: { kind: K; payload: LogEntryPayload<K> } }[LogEntryKind] | null;
```

`readLogEntry` is exported and consumed by `deriveCombatState.ts` through a relative import; it is not added to `domain/encounters/index.ts`. [spec-writer_4: ran `npx tsc --noEmit` and `npx eslint <scratch file>` from `app/` on the block as a `declare` in a scratch file, with the eight schemas written out, in `app/domain/encounters/` — tsc reported nothing and eslint reported only `local/no-unused-exports` on the scratch export] It checks the kind with `Object.hasOwn` on the schema table, so an inherited name such as `constructor` reads as unknown, and never throws.

```ts
declare const deriveCombatState: (
  items: { id: string; startingMaxHp: number | null }[],
  entries: { kind: string; payload: string }[],
) => Map<string, { maxHp: number | null; currentHp: number | null; tempHp: number; defeated: boolean; removed: boolean }>;
```

Entries apply in the given order through `readLogEntry`; a `null` result applies nothing. Rules: damage on a target with `maxHp === null` changes nothing, otherwise takes temp HP first and the rest from current HP with no floor; heal on `maxHp === null` changes nothing, otherwise `currentHp = min(maxHp, currentHp + amount)` and temp HP stays; temp-hp sets `tempHp = value` whatever max HP is; max-hp sets `maxHp = value`, sets `currentHp = value` when max HP was `null`, lowers `currentHp` to `value` when it is above, else leaves it; defeated and undefeated set and clear the mark; removed sets the flag; `added` changes nothing. A target id with no item is skipped and the entry's other targets still apply. Every item stays in the Map, removed ones included.

`errors.ts`: `encounterLogLoadError(cause?)` by the factory pattern of `encounterQueueLoadError`, message `Failed to load the encounter log: …`.

Behaviours (`deriveCombatState.test.ts`; defect each catches):

- Damage drains temp HP first, then current HP below 0 — wrong order or a floor.
- Damage and heal change nothing while max HP is `null` — NaN or phantom HP.
- Heal stops at max HP and leaves temp HP — overheal or temp HP loss.
- Temp HP is replaced, also with max HP `null` — adding instead of replacing.
- Max HP: `null` start sets current; below current clamps; above leaves — H6 branches mixed up.
- Defeated, undefeated and removed set and clear their own flags only — flags crossed.
- Damage then heal near max differs from heal then damage — entries applied out of order.
- Unknown kind, invalid JSON and failing payload each apply nothing and later entries still apply — a throw hides the whole encounter.
- A target with no item is skipped, the other targets apply — one stale id drops a group action.

Behaviours (`logEntryPayloads.test.ts`): `readLogEntry` returns kind and payload for each of the seven kinds — a kind mapped to another's schema; `null` for `constructor`, invalid JSON, a negative or fractional number, an empty list — prototype lookup or too-lenient schema; `serializeLogEntryPayload` rejects the same malformed payloads — a bad payload stored for good.

### Database

`get-all-by-encounter.ts`: `SELECT * FROM encounter_log_entries WHERE encounter_id = $1 ORDER BY created_at ASC, rowid ASC` with `assertValidId(encounterId, 'Encounter')`, returning `EncounterLogEntry[]`, the shape of `encounter-queue-item/get-all-by-encounter.ts`. Behaviours (`get-all-by-encounter.test.ts`, entries made with `create` under `vi.setSystemTime`): earlier `created_at` first although inserted later — ordering by insertion; equal `created_at` keeps insertion order — ordering by the random `id`; only the given encounter's rows — missing `WHERE`; empty id rejected.

### Services

`encounterLogEntryService.ts`: `getLogEntries(encounterId): Promise<EncounterLogEntry[]>` calls `logEntryDb.getAllByEncounter` and throws `encounterLogLoadError(err)`. Import `* as logEntryDb from '@db/encounter-log-entry'`.

### Data Access Layer

`encounterKeys.logEntries(encounterId)` returns `['encounter-log-entries', encounterId]`. It must stay outside `device*` so the post-sync invalidation refetches it (it covers every query whose first key element is a string not starting with `device` [architect_3: `app/src/data-access-layer/devices/useConnectivityLifecycle.ts:153-158`, re-read at HEAD 4b966269]), and must not start with the bare element `encounter` (the comment above `queueItems` says why). `encounterLogEntriesQueryOptions(encounterId)` in `encounterQueryOptions.ts`: key above, `queryFn: getLogEntries`, `enabled: !!encounterId`, `throwOnError: true`. `useEncounterLogEntries(encounterId)` returns `{ logEntries: EncounterLogEntry[]; loading: boolean }` (empty list while loading), `loading` from `isPending`. SF3 adds `recordLogEntry` and `isRecording`.

### Frontend

`buildQueueEntries` gets the contract below. It derives over every queue item, names only the non-removed items with `shownCombatantNames` (unchanged), then drops removed items and, when `hideDefeated`, defeated ones. Hiding runs after naming, so toggling it never renumbers siblings. [spec-writer_4: ran `npx tsc --noEmit` and `npx eslint <scratch file>` from `app/` on the block as a `declare` in a scratch file, in `app/src/screens/encounter/` — tsc reported nothing and eslint reported only `local/no-unused-exports` on the scratch export]

```ts
declare const buildQueueEntries: (
  queueItems: EncounterQueueItem[],
  logEntries: EncounterLogEntry[],
  baseEntities: BaseEntity[],
  hideDefeated: boolean,
) => { id: string; name: string; imageId: string | null; maxHp: number | null; currentHp: number | null; tempHp: number; defeated: boolean }[];
```

Behaviours (`buildQueueEntries.test.ts`): a removed item is absent and its sibling loses its number — a removed combatant still counted; a hidden defeated item still counts for numbering — numbers shifting when Hide toggles; hide on drops defeated, off keeps them in place with `defeated: true` — filter direction; a damage entry changes `currentHp` — log not passed through.

`useEncounterQueueEntries()` in `hooks/` (no `index.ts`) reads `useParams` for both ids, `useEncounter`, `useEncounterQueueItems`, `useEncounterLogEntries`, `useAdventureBaseEntities`, and returns `{ entries: ReturnType<typeof buildQueueEntries>; loading: boolean }`: `loading` is true until all four reads loaded, and `entries` is `[]` while it is, so HP never shows full before the log arrives; `hideDefeated` is `encounter?.hide_defeated === 1`. Behaviours (`useEncounterQueueEntries.test.ts`, `renderHook` with `TanstackQueryClientProvider`, `@services/*` mocked, `useParams` from `encounterRouteParams`): entries stay empty while any one read is pending — partial data flashes full HP; `hide_defeated` 1 hides a defeated combatant and 0 shows it — flag read the wrong way.

`EncounterQueue.tsx`: reads `{ entries, loading }` from the hook (`../../hooks/useEncounterQueueEntries`) and `{ queueItems, reorderQueueItems }` from `useEncounterQueueItems(encounterId)`; drops `useAdventureBaseEntities` and `buildQueueEntries`. `handleDragEnd` passes `reorderIds(queueItems.map((item) => item.id), active, over)`, the full list in the DAL's order; `SortableContext` items stay the shown ids. Add a named code comment at the call: a shown-only list would rewrite `sort_order` for the shown items alone, and the cache update would drop hidden and removed items. `EncounterQueueEntry` gains `defeated: boolean` and takes its image look from `describeQueueEntryImage(hp, defeated)`: the `--down` class (`encounter-queue-entry-image--down`, `filter: grayscale(1)`) is renamed `encounter-queue-entry-image--grey` in the `.tsx` and the `.css` and applied when the look is `'grey'`, and the red tint `div` renders only when it is `'tint'`. The entry is not dimmed: its CSS sets no opacity, so no raw CSS value is added.

Rationale (KAD "A defeated combatant's image turns grey"): the look is decided by a pure function in the existing helper file, because the component tests may not assert class names (`.claude/rules/src-unit-tests.md` — Component tests, the "Assert only what the user sees or what gets saved" bullet), so the rule "defeated replaces the tint whatever the HP" can be pinned only there. It reuses the grey state HP 0 or below already gives; there is no second grey. The signature was run as a `declare` in `app/src/screens/encounter/` [spec-writer_11: ran `npx tsc --noEmit` and `npx eslint <scratch file>` from `app/` — tsc reported nothing, eslint only `local/no-unused-exports` on the scratch export].

```ts
declare const describeQueueEntryImage: (
  hp: ReturnType<typeof describeQueueEntryHp>,
  defeated: boolean,
) => 'grey' | 'tint' | 'plain';
```

`'grey'` when `defeated`, whatever `hp` is (also `null`) or when `hp.state` is `'down'`; `'tint'` when `hp.state` is `'hurt'` and not defeated; `'plain'` otherwise. Consumer: `EncounterQueueEntry.tsx` (this sub-feature). Behaviours (`describeQueueEntryHp.test.ts`): defeated with `'hurt'` HP returns `'grey'`, not `'tint'` — the tint still showing under the mark; defeated with `null` HP returns `'grey'` — the mark ignored when HP is not set; not defeated at `'hurt'` returns `'tint'` and at `'down'` returns `'grey'` — unmarking leaving the image grey or losing the tint; not defeated at `'ok'` or `null` returns `'plain'` — a grey or tinted healthy image.
