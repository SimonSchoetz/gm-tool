# Foldable in-game steps

**Purpose.** In the session's read-only (in-game) view, each step section folds and unfolds, so the GM running a session hides the prep steps not in use and keeps the ones needed in view. Each step's fold state is kept across leaving the session, restarting the app and syncing to another device.

**Users.** The GM, as everywhere in the app.

## How it works

Happy path:

1. In the in-game view, each step section has a header row with the step's title and a chevron at its right edge. The chevron points down while the step is unfolded and right while it is folded.
2. A click anywhere on the header folds an unfolded step and unfolds a folded one. The chevron rotates between the two directions over 0.2 s, and the step's content height animates between full and zero over the same 0.2 s; folded content is not visible.
3. Hovering anywhere on the header turns the chevron from blue (`#399CBB`) to white (`#f8ffff`) and shows a pointer cursor; the header's background does not change. This is the text editor toggle's chevron look.
4. A step whose header shows no title text (no name and no default step) still has the header row with its chevron, so it folds like the others.
5. The steps nav at the left, in the in-game view, unfolds a folded step on a click, saves it as unfolded, and smooth-scrolls to it; a click on an unfolded step only scrolls. In the prep view the nav only scrolls.
6. A new step, and every step that existed before this feature, starts unfolded. Duplicating a session gives each step of the duplicate the fold state of its original.
7. The prep view is unchanged: it shows every step's content whatever the step's fold state, and a fold set in the in-game view is still there on returning to it. Toggle blocks inside a step's content fold independently of the step's own fold state.

Failure:

- A quit within about 500 ms of a fold or unfold loses it, since it saves through the session steps' autosave.
- A fold set on one device overwrites the same step's content edited on another device and not yet synced, when the fold's save is the newer one.

Where the user waits: nowhere. The fold responds at once; the database write follows about 0.5 s later.

## Data

- **Reads:** each step's fold state (the `collapsed` column of `session_steps`), with the rest of the step, through the session's steps list.
- **Writes:** the step's `collapsed` flag, 0 unfolded or 1 folded, through the session steps' autosave about 500 ms after the click; a duplicate session's steps are written with the original's flag. A fold bumps the step's `updated_at`, so the whole step row syncs as for any other step change.

## Rules

| Rule | Why | Source |
| --- | --- | --- |
| The step section's header is the click target, anywhere on it, and a click toggles the step between folded and unfolded | Matches the text editor's toggle block, which the feature follows | Simon Schötz, 2026-11-09; `InGameStepSection.test` |
| The header's chevron sits at its right edge, points down unfolded and right folded, and rotates over 0.2 s; the content height animates between full and zero over 0.2 s, and folded content is not visible | Same look and timing as the text editor's toggle | Simon Schötz, 2026-11-09; hand test |
| Hovering the header turns the chevron blue to white and shows a pointer cursor, and changes nothing else: no background change, no gradient | Matches the requested hover behaviour without a gradient across a full-width header | proposed by Claude, accepted by Simon Schötz, 2026-11-09; hand test |
| The fold state is a column of the synced `session_steps` table, so it survives leaving the session, a restart and a sync to another device; every existing and new step starts unfolded | The editor toggles' collapsed state is likewise saved in the step's synced content, and the app has no localStorage use | proposed by Claude, accepted by Simon Schötz, 2026-11-09; `create.test`, `update.test` (the `session-step` db tests); sync between devices and restart are a hand test |
| A nav click on a folded step in the in-game view unfolds it, saves that, and scrolls to it; a click on an unfolded step, or in the prep view, only scrolls | A nav click should always show the content | proposed by Claude, accepted by Simon Schötz, 2026-11-09; `SessionStepsNav.test` |
| A duplicated session copies each step's fold state | The duplicate query copies every column of a step but its id, session id and timestamps, as it does the checked state | proposed by Claude, accepted by Simon Schötz, 2026-11-09; `duplicate-by-session.test` |
| The prep view shows every step's content whatever its fold state, and shows no fold control | Folding is a feature of the in-game view only | Simon Schötz, 2026-11-09; no test |
| Toggle blocks inside a step's content fold independently of the step's own fold state | The editor's toggle state lives in the step's content, which the step section does not touch | Simon Schötz, 2026-11-09; hand test |
| A step with no title text still gets the header row with its chevron | Keeps every step foldable | Claude's call, 2026-11-09; hand test |
| The 8 px gap under a folded header stays; only the content height animates | The gap belongs to the section, not to its content | Claude's call, 2026-11-09; hand test |
| A fold saves through the session steps' autosave, so quitting within its delay can lose the last fold | One save path with every other autosaved field of a step | Claude's call, 2026-11-09; `InGameStepSection.test` |
| The synced column stays, accepting that a fold can overwrite another device's not-yet-synced content edit | The checked state already has this shape: the sync compares `updated_at` and upserts the whole row | Claude's call, 2026-11-09; no test |

## Open points

None in the open-questions register.

## Where to look

- Frontend: `InGameStepSection` (the header, chevron and body, and the fold click) with `InGameStepSectionTitle`; `SessionStepsNav` (the nav's unfold on a click); the text editor's toggle block styles are the look the fold copies.
- Data access: `useSessionSteps` (`updateStep` writes the cache at once and saves through the autosave queue).
- Database: the `session-step` module (the `collapsed` column and `duplicateBySession`) and the `add_session_step_collapsed` migration.
- Seed: Seed Session in the seeded web mode (`web-dev-mode.md`), whose last step has no title.
- Tests: `InGameStepSection.test`, `SessionStepsNav.test`, and the `session-step` db tests `create.test`, `update.test` and `duplicate-by-session.test`; `seed.test` for the Seed Session.
