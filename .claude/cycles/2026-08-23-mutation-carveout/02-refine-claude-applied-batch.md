# Applied batch — Deferred-Dispatch Mutation Carve-Out

**Batch name:** Deferred-Dispatch Mutation Carve-Out
**Approved by:** user message "yes, apply" — 2026-08-23
**Applied:** 2026-08-23, immediately following that approval
**Mode:** Retrospective (pasted-text input; no cycle-directory pre-gate artifact existed, so the Retrospective-mode pre-write verdict gate did not apply)
**Repo state at apply time:** branch `fix/cross-entity-description-overwrite`, HEAD `4f9b28c6`
**Proposals presented:** `01-refine-claude-proposals.md` (same directory) — full verbatim `Old:`/`New:` text for every change

Nothing in this batch was applied before the approval message above. All three changes were applied together, in one pass, after it.

## Changes applied

### 1. `app/src/CLAUDE.md` — State Management & Error Handling

Replaced the "Mutations close over construction-time arguments" bullet and its two examples with the deferred-dispatch carve-out version, adding a checkable synchronous-vs-deferred test, a `.claude/knowledge/tanstack-query.md` pointer, a clause confirming the carve-out does not affect the hook's return type, and four examples (GOOD/BAD for each of the synchronous and deferred cases).

Verified after write: **44846** characters (projected 44846). Old block matched exactly once before replacement.

### 2. `CLAUDE.md` (root) — Best Practices & Code Quality

Two replacements in the same bullet group:

- Headline broadened from "When a linter or compiler finding conflicts with an intentional design goal" to "When a codified project rule — an automated linter/compiler finding, or a CLAUDE.md-documented convention — conflicts with an intentional design goal or with the implementation actually required for correctness", with "never comply silently" becoming "never resolve it silently in code".
- Final sub-bullet split into two: a new sub-bullet covering the no-suppression-mechanism case for CLAUDE.md conventions, and the existing closing sub-bullet broadened to include "or an unsurfaced workaround chosen to route around the conflict".

The ESLint and Clippy sub-bullets were not touched.

Verified after write: **28844** characters (projected 28844). Both old blocks matched exactly once each before replacement.

### 3. `.claude/agents/spec-writer.md` — Behavior Rules

Appended an exception clause to the "resolve it silently" bullet, adding the third branch for a detail that is textually resolvable from CLAUDE.md but whose silent resolution would conflict with correctness.

Verified after write: **24582** characters (projected 24582). Old block matched exactly once before replacement.

## Verification performed after applying

- All three files re-measured with `(Get-Content -Raw <path>).Length`; every figure matched its pre-approval projection exactly.
- `git diff --stat` over the three files: 3 files changed, 9 insertions(+), 6 deletions(-) — consistent with three surgical bullet-level edits and no collateral change.
- All four F1 example bullets confirmed present in the written file.
- The F3 exception clause confirmed present at `.claude/agents/spec-writer.md:127`.

## Not applied

- No application-code change. The nine duplicated comments in `app/src/data-access-layer/` remain as they were — tracked as `task_bf5de8d0`, gated on F1 having landed (which it now has). Disposition is the user's.
- No application-code commit. The batch was committed on the user's separate instruction ("everything is approved. Commit your changes") as `42455950`, `docs(cross-entity-description-overwrite):`, covering only the three rule files plus this cycle directory and `.claude/retro-log.md`. The bug-fix work in progress on this branch — the nine data-access-layer hooks and the component files — was left unstaged and uncommitted; it was never part of this session's scope. That commit also carried a one-line pre-existing prettier fix in `.claude/agents/spec-writer.md` (an italics-delimiter violation at a line untouched by F3), applied so the all-checks-pass-before-commit rule held.
- F2's "in code" scoping was deliberately not broadened. Recorded as an open item in `01-refine-claude-proposals.md` for a future session, not as a deferred part of this batch.
