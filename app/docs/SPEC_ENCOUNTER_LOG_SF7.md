# Sub-feature 7: Message composer and documentation

The Log tab gets its composer at the bottom, which completes the sending of typed messages, and the feature documentation is brought up to the slice.

## Files affected

Modified:

- `app/src/screens/encounter/components/EncounterSidebar/components/EncounterLogTab/EncounterLogTab.tsx` — renders `EncounterLogComposer` below the list area
- `app/src/screens/encounter/components/EncounterSidebar/__tests__/EncounterSidebar.test.tsx` — the Log panel now mounts a `TextEditor` whose `MentionTypeaheadPlugin` reads the table configs, and no test mocks `@services/tableConfigService` today [spec-writer_25: `grep -rl tableConfigService` over the `*.test.ts` and `*.test.tsx` files of `app/src` — not found], so the file gains a hoisted `getAllTableConfigs` spy resolving `[]` and `vi.mock('@services/tableConfigService', …)` serving it; the existing `useParams` stand-in already answers the plugin's `useParams({ strict: false })` with no ids [spec-writer_27: `app/src/__tests__/support/encounterRouteParams.ts:6-9` returns `{}` for any `from` but the encounter route; `MentionTypeaheadPlugin.tsx:21-22` calls `useParams({ strict: false })` and `useTableConfigs()`]
- `app/docs/features/encounter-queue.md`, `app/docs/glossary.md`, `app/docs/_product/domain-scaffold.md` — see Documentation

New (under `…/EncounterLogTab/components/EncounterLogComposer/`):

- `EncounterLogComposer.tsx`, `EncounterLogComposer.css`

## Frontend

### EncounterLogComposer (new)

- Purpose: write a message into the log from the Log tab.
- Behavior: reads the route's `encounterId` with `useParams` and `recordLogEntry` from `useEncounterLogEntries(encounterId)`, and renders `TextEditor` with `variant='message'`, `textEditorId` `encounter-log-composer-<encounterId>`, `value=''`, `placeholder='Write a message...'` and `onSubmit={(editorState) => recordLogEntry('message', { editorState })}`, so a refused write (`false`) keeps the text. No try/catch. It has no test: the component decides no criterion by event handling (Enter is decided by `SendOnEnterPlugin`, tested in sub-feature 5), and `tsc` pins the `message` kind and its payload shape through `LogEntryPayload<'message'>`.
- UI / Visual: a wrapper `div` with its own block class, border and radius from existing tokens, padding, and a maximum height with vertical scroll so a long draft scrolls instead of pushing the list away; the editor fills it. The tab root keeps the list area growing and the composer at its natural height at the bottom.

## Documentation

`app/docs/features/encounter-queue.md` (read in full): describe the slice per its opening sentence.

- Purpose paragraph: this is the third of six slices; the Log tab, Revert and typed messages are built; group actions, the shown item's view, ad-hoc combatants and encounter events remain.
- How it works: step 1 names three tabs (Add, Actions, Log); step 9 loses "Nothing shows the log yet."; step 10 says a click from the Add tab switches to Actions and from Actions or Log leaves the sidebar where it is; step 16 loses "The log still has no display."; new steps describe the Log tab (oldest first, scroll, times, line wording, "Unreadable entry"), Revert (hover button, no confirmation, struck-through entry, `Reverted:` line, restoring a removal), the removed-combatant naming, the composer and Enter, and Delete on a message.
- Failure and waiting: the unreadable-entry bullet adds that the Log tab shows "Unreadable entry"; new bullets cover the shared pending guard of Revert, Delete and send, and the two sync-race lines; the waiting paragraph adds the Log tab's loading icon.
- Data: Reads (the log is now displayed), Writes (`revert` with `entryId`, `message` with `editorState`, the delete limited to messages) and Derived (reverted and unreadable entries) are extended.
- Rules table: rewrite the rows that now misstate the page, found by their opening words: "The screen shows three columns", "Each Add writes one `added` log entry", "The queue's HP, defeated marks and removals come from", "The log payload module exports", "The sidebar has an Add tab and an Actions tab", "A click on a combatant selects it and switches", "From this slice on the derivation", "The Add / Actions tabs look like", "UI texts:", "A click on a combatant selects it, shows it", "The right sidebar has two tabs", "Each action writes one combat log entry". Add one row for each Decisions row and each Acceptance Criterion of `.claude/cycles/2026-10-29-encounter-log-lead/01-lead-story.md`, in the page's Rule, Why, Source format, naming the covering tests of sub-features 1 to 6.
- Where to look: add the new modules and tests of sub-features 1 to 7.

`app/docs/glossary.md`: "Combat log entry" loses "Nothing shows the log yet." and lists `message` and `revert`; "Encounter sidebar" names three tabs; new terms Log tab, Revert and Typed message.

`app/docs/_product/domain-scaffold.md` (read in full): its only statements about the sidebar are the two "(Add and Actions)" in the `screens/encounter/` bullet; both become "(Add, Actions and Log)".

## Behaviours and their defect

`EncounterSidebar.test.tsx` keeps its sub-feature 6 behaviours; the new mock only keeps them passing with the composer mounted (defect without it: an unmocked table-config read throwing in every sidebar test).

[MANUAL-VERIFY] In web mode, on the Log tab with an empty composer: the placeholder "Write a message..." shows; typing "Round 1" and pressing Enter empties the composer, and a bubble reading "Round 1" appears as the last line with a time in the "2:32 PM" shape (no leading zero, AM or PM), visible at the list's bottom edge without scrolling.

[MANUAL-VERIFY] In web mode: Shift+Enter inside a draft puts the caret on a second composer line and sends nothing; Enter on an empty composer and on one holding only spaces adds no line.

[MANUAL-VERIFY] In web mode: send a message with an entity mention, then click the mention in its bubble: the entity's mention popup opens showing the entity's name.

[MANUAL-VERIFY] In web mode: the pointer over a message bubble shows a Delete button; over an automatic line it shows none; one click removes the bubble at once with no dialog.

[MANUAL-VERIFY] Hand-off item for the human tester, in the Tauri app on two paired devices: after a sync the second device shows the same lines, the same reverted marks and HP, and no deleted message; after quitting and reopening the app the log is unchanged. Web mode cannot drive sync or an app restart.

The unreadable-entry criterion has no UI path and is covered by the tests of sub-features 1, 4 and 6 only.
