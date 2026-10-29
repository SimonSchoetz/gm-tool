# Sub-feature 1: Derivation: `message` and `revert` kinds, reverted and unreadable ids

The log payload module learns the two new kinds and the revertible-kind predicate; `deriveCombatState` takes entry ids, drops reverted entries and returns the reverted and unreadable ids; `buildQueueEntries` reads the new return. The only production caller of `deriveCombatState` is `buildQueueEntries`, changed in this same sub-feature [spec-writer_10: `grep -rl deriveCombatState` over `app/src`, `app/domain`, `app/db`, `app/services` — found `buildQueueEntries.ts`, `domain/encounters/index.ts`, `deriveCombatState.ts` and its test].

## Files affected

Modified:

- `app/domain/encounters/logEntryPayloads.ts` — the `message` and `revert` schemas; `isRevertibleLogEntryKind`
- `app/domain/encounters/deriveCombatState.ts` — entries carry `id`; the return becomes an object
- `app/domain/encounters/__tests__/logEntryPayloads.test.ts` — new kinds and predicate
- `app/domain/encounters/__tests__/deriveCombatState.test.ts` — the `entry` helper gains an `id` (every entry it builds, and the literal invalid-JSON entry in the unreadable-entry test, now lacks the required field), and every `deriveCombatState(...).get('a')`, `.has('gone')` and `.size` assertion reads `.items` instead
- `app/src/screens/encounter/helper/buildQueueEntries.ts` — reads `.items`
- `app/src/screens/encounter/helper/__tests__/buildQueueEntries.test.ts` — one new test; no existing assertion goes stale

No barrel change: `domain/encounters/index.ts` already exports `deriveCombatState` by name, with explicit exports throughout [spec-writer_29: `app/domain/encounters/index.ts:1-24`]; `isRevertibleLogEntryKind` is added there in sub-feature 4, where its first consumer outside the domain sits.

## Domain

`logEntryPayloads.ts`: `message` takes `{ editorState: non-empty string }` and `revert` takes `{ entryId: non-empty string }`. `LogEntryKind` and `LogEntryPayload` widen with them, so `message` is consumed by the composer in sub-feature 7 and `revert` by `EncounterLogEntry` in sub-feature 6. `isRevertibleLogEntryKind` is true for exactly `damage`, `heal`, `temp-hp`, `max-hp`, `defeated`, `undefeated` and `removed`, backed by a module-private set; its consumer here is `deriveCombatState`.

`deriveCombatState` keeps its per-item state rules unchanged; the contract:

```ts
type DerivedItemState = {
  maxHp: number | null;
  currentHp: number | null;
  tempHp: number;
  defeated: boolean;
  removed: boolean;
};

declare function deriveCombatState(
  items: { id: string; startingMaxHp: number | null }[],
  entries: { id: string; kind: string; payload: string }[],
): {
  items: Map<string, DerivedItemState>;
  revertedEntryIds: ReadonlySet<string>;
  unreadableEntryIds: ReadonlySet<string>;
};

declare function isRevertibleLogEntryKind(kind: string): boolean;
```

[spec-writer_11: ran `npx tsc --noEmit` from `app/` with this block in a scratch `.ts` file under `app/domain/encounters/` — exit 0; ran `npx eslint` on it — only `@typescript-eslint/no-meaningless-void-operator` on the scratch's own `void` references; scratch deleted]

The derivation reads every entry first; each entry for which `readLogEntry` returns null goes to `unreadableEntryIds`. It then decides the dropped entries: a readable `revert` drops the entry its `entryId` names wherever that entry sits in the order, when that entry exists, is readable and has a revertible kind; a revert naming a `revert`, `added`, `message`, an unreadable or a missing entry drops nothing. Only dropped ids enter `revertedEntryIds`, once each however many reverts name them. Last, it applies the remaining readable entries in the given order exactly as before; `message` and `revert` change no item. A reverted `removed` entry therefore leaves its combatant in the queue with the HP, defeated mark and number the remaining entries give.

## Frontend

`buildQueueEntries.ts` passes `logEntries` as before (a database row already has `id`, `kind` and `payload`) and reads the item states from `.items`; everything else in the file is unchanged in this sub-feature.

## Behaviours and their defect

- `logEntryPayloads.test.ts`: `message` and `revert` payloads round-trip through `readLogEntry` and `serializeLogEntryPayload` and an empty string is rejected for each field. Defect caught: a stored shape that is permanent but not enforced.
- `logEntryPayloads.test.ts`: `isRevertibleLogEntryKind` accepts each of the seven kinds and rejects `added`, `message`, `revert`, an unknown name and an inherited name such as `constructor`. Defect: Revert offered for an `Added` entry, or a crash on an inherited name.
- `deriveCombatState.test.ts`: reverting an earlier Damage that a later Heal had capped restores full HP, the later Heal stays in effect, and the Damage id is in `revertedEntryIds`. Defect: a revert that undoes in place instead of replaying the remaining entries.
- `deriveCombatState.test.ts`: reverting each of Max HP, Temp HP, Defeated, Undefeated and Removed gives the state without that entry. Defect: a kind the drop does not reach.
- `deriveCombatState.test.ts`: a revert naming a `revert`, `added`, `message`, an unreadable entry or a missing id changes nothing and adds no reverted id. Defect: an ignored revert still dropping something, or throwing.
- `deriveCombatState.test.ts`: two reverts of one entry list it once and change the state as one does. Defect: a double revert toggling the entry back.
- `deriveCombatState.test.ts`: a revert placed before the entry it names still drops it. Defect: the drop depending on entry order, which a sync can change.
- `deriveCombatState.test.ts`: an unknown kind, invalid JSON and a failing payload are in `unreadableEntryIds` and a readable entry is not. Defect: the Log tab unable to tell the entries it cannot read.
- `buildQueueEntries.test.ts`: a combatant whose `removed` entry is reverted is in the queue again with its derived HP. Defect: the queue reading the state before reverts.

## Verification

After the check rows pass and before the commit, run `pnpm run mutation-check -- app/domain/encounters/logEntryPayloads.ts app/domain/encounters/deriveCombatState.ts app/src/screens/encounter/helper/buildQueueEntries.ts` from the repository root and resolve every survivor.
