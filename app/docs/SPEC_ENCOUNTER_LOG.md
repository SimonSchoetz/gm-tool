# Encounter screen, Slice 3: Log tab with Revert and typed messages

The encounter sidebar gains a Log tab that lists every log entry of the fight with its time, reverts any HP change, defeated mark or removal with one click, and takes typed messages with @mentions. The sub-features are listed in the order to implement them; each is its own file and its own commit, and each is complete under the baseline checks on its own (no Foundation SF).

- Sub-feature 1: Derivation: `message` and `revert` kinds, reverted and unreadable ids — [SPEC_ENCOUNTER_LOG_SF1.md](SPEC_ENCOUNTER_LOG_SF1.md)
- Sub-feature 2: Queue item names: shown and base names, removed combatants named — [SPEC_ENCOUNTER_LOG_SF2.md](SPEC_ENCOUNTER_LOG_SF2.md)
- Sub-feature 3: Delete path for messages: db remove, service, hook — [SPEC_ENCOUNTER_LOG_SF3.md](SPEC_ENCOUNTER_LOG_SF3.md)
- Sub-feature 4: Log lines: time helper, line builder, lines hook — [SPEC_ENCOUNTER_LOG_SF4.md](SPEC_ENCOUNTER_LOG_SF4.md)
- Sub-feature 5: TextEditor message variant with send on Enter — [SPEC_ENCOUNTER_LOG_SF5.md](SPEC_ENCOUNTER_LOG_SF5.md)
- Sub-feature 6: Log tab: selection rule, sidebar tab, entries with Revert and Delete — [SPEC_ENCOUNTER_LOG_SF6.md](SPEC_ENCOUNTER_LOG_SF6.md)
- Sub-feature 7: Message composer and documentation — [SPEC_ENCOUNTER_LOG_SF7.md](SPEC_ENCOUNTER_LOG_SF7.md)

## Key Architectural Decisions

### The log is the source of truth and a revert is one more entry

A revert is one `INSERT` of kind `revert`; the derivation alone decides which entries are in effect, and the Log tab never works that out itself (C1, row 17).

### The derivation takes entry ids and returns an object

`deriveCombatState` takes entries as `{ id, kind, payload }` and returns `{ items, revertedEntryIds, unreadableEntryIds }` instead of a `Map` (C1).

### One exported predicate names the revertible kinds

`isRevertibleLogEntryKind` in `logEntryPayloads.ts` is the single list of revertible kinds, used by the derivation and by the line builder (C1).

### Message and revert payload shapes

`message` stores `{ "editorState": string }` and `revert` stores `{ "entryId": string }`, both non-empty (R3, row 25).

### A selection moves only the Add tab

A click on a combatant switches the Add tab to Actions and leaves the Actions and Log tabs where they are (R1, row 19).

### Removed combatants are named over all queue items

A removed combatant is named by `shownCombatantNames` over every queue item, kept and removed, and only its result for removed items is used; kept items keep the queue's names (R2, row 20).

### One naming helper serves the queue and the log

`nameQueueItems` is the single home of the queue's naming and of the removed-combatant naming (C2). Two details are this spec's own: it returns, per queue item, the shown name and the base name (the shown name without its number), because the `Added` line needs the base name and a second helper would repeat the entity-name lookup; and it takes the derivation's per-item states (`ReadonlyMap<string, { removed: boolean }>`) instead of a set of removed ids, because both callers hold that map and a set would be derived from it twice.

### Times come from a `getTimeString` util

`getTimeString` is the single home of the 12-hour time format and `getDateTimeString` composes it (C3). `getDateTimeString` also composes the existing `getDateString` for its date part, because it repeats that helper's body today.

### Log lines are built in one helper and the tab only renders them

`buildLogLines` produces one `LogLine` per entry, including the wording, `isReverted` and `isRevertible`, and the components render those fields without recomputing them (C1, rows 1, 9, 10).

### Sync-race gaps degrade instead of throwing

A line leaves out a target with no queue item and shows only its label when none is left; a `Reverted` entry the derivation ignored shows as "Unreadable entry" (R4, row 22).

### The Log panel stays mounted and scrolls on open

The Log panel is hidden, not unmounted, when another tab is open, so a half-written message survives a tab switch; the scroll to the bottom is a layout effect on the tab opening and on a new last line (R5, row 12).

### The composer clears through the editor, not through `value`

After a successful send the plugin clears the editor itself, because `ExternalValueSyncPlugin` adopts a changed `value` only while the editor is unfocused and the composer is focused at Enter (C4).

### Send on Enter runs at `COMMAND_PRIORITY_BEFORE_EDITOR`, after the mention menu's own listener

`SendOnEnterPlugin` registers `KEY_ENTER_COMMAND` at `COMMAND_PRIORITY_BEFORE_EDITOR` with the prop `onSubmit` only, so the @ list's listener at `COMMAND_PRIORITY_LOW` decides first whether the menu takes the Enter; no open-menu flag, ref or `onMenuOpenChange` exists, and `MentionTypeaheadPlugin.tsx` is not touched (rows 28, 29).

### The message form is a variant of `TextEditor`

`TextEditor` gains `variant?: 'document' | 'message'` and `onSubmit`; a separate composer with its own editor cannot import `MentionNode` or `MentionTypeaheadPlugin` past the `TextEditor` barrel (C6).

### An empty message is judged by trimmed text content

The send listener tests the root's trimmed `getTextContent()`, not `editorState.isEmpty()`; `MentionNode.getTextContent` returns `@name`, so a mention-only message is not empty (C7).

### Delete shares the record mutation's key

The delete mutation uses `encounterKeys.recordLogEntry(encounterId)`, so `isRecording` and the call-time `isMutating` refusal cover Revert, Delete and send together (C9, row 13).

### The unreadable-entry criterion is verified by tests only

No UI path writes an unknown kind, invalid JSON or a bad payload (C10, row 23).

### Hand verification is split by environment

Enter, Shift+Enter, Enter with the @ list open, mention insertion and click, the hover buttons and the scroll are checked in the browser pane in web mode; the paired-device criterion is a hand test in the Tauri app (C11, row 24).

### Cmd/Ctrl+B and pasted formatted lists are not blocked

The composer's controls offer neither, and nothing blocks them (C12, row 21).

### A button's action lives in its entry component

`EncounterLogEntry` owns Revert and Delete and calls `useEncounterLogEntries` itself (C14, C15, rows 3, 4).

### The db delete is limited to messages

`remove` deletes `WHERE id = $1 AND kind = 'message'`, the one place the log's append-only promise is enforced (C16).

### Instruction-file gaps stay with a refine pass

The Domain Glossary entry in `app/CLAUDE.md` is not edited here (C13, row 26).

## CLAUDE.md impact

- `app/CLAUDE.md` — Domain Glossary, the "Combat log entry" bullet, names only actions as the writers of log entries and says `deriveCombatState` derives each combatant's HP, defeated mark and removal. After this branch the log also holds `revert` and `message` entries, a typed message is written by the Log tab, and the derivation also returns the reverted and unreadable entry ids [spec-writer_6: `grep -n "Combat log entry" app/CLAUDE.md` — found line 71]. The bullet is stale until a refine pass updates it.
- `app/db/CLAUDE.md` states no rule about a delete restricted by a column value [spec-writer_7: `grep -n "kind =" app/db/CLAUDE.md` — not found]. `db/encounter-log-entry/remove.ts` is the first delete that carries one (`AND kind = 'message'`) [spec-writer_28: `grep -rn "DELETE FROM" app/db` outside `__tests__` and `_migrations` — every other statement is `WHERE id = $1`], as the only enforcement of the log's append-only promise, so a later reader sees the clause as an omission unless the convention is recorded.
- `.claude/rules/src-data-access-layer.md`, the bullet on a mutation whose pending state other components read, describes one mutation per `mutationKey`. After this branch `useEncounterLogEntries` runs two mutations (record and delete) on one key so one guard covers both writes of the encounter's log; the rule does not say that several mutations may share a key on purpose.
- `app/src/CLAUDE.md` — Testing Policy and `.claude/rules/src-unit-tests.md` name no test obligation for a Lexical plugin file (an exported function that returns null, such as `ExternalValueSyncPlugin.ts`) [spec-writer_8: `grep -in "plugin" .claude/rules/src-unit-tests.md app/src/CLAUDE.md` — found only the folder-structure mention at `app/src/CLAUDE.md:31`, no test obligation]. `SendOnEnterPlugin.ts` has branching and an irreversible effect (a recorded message) and is drivable under jsdom (`.claude/knowledge/lexical.md`, the entry beginning "A `keydown` dispatched with `fireEvent.keyDown`"), so its test exists by this spec alone.
- Root `CLAUDE.md` — Best Practices & Code Quality, "Re-derive types, trace procedure", item 3, and the `lint` row's `local/no-unused-exports` do not say whether an import from a test file counts as a use. The rule indexes every non-declaration source file of the TypeScript program, tests included [spec-writer_9: `app/eslint-rules/no-unused-exports.js:340-348` — `usageIndexOf` builds the index from `program.getSourceFiles()` filtered only for declaration files and `node_modules`; `grep -n "__tests__\|\.test\." app/eslint-rules/no-unused-exports.js` — not found], so an export whose only importer is its own test passes the lint; this spec therefore names a production consumer for every new export and, where it sits in a later sub-feature, says which.
