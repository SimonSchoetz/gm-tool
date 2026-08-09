# Applied batch record — queryOptions Carve-Out

Batch name: **queryOptions Carve-Out**. Approved by user message "yes, apply", 2026-08-09. Applied 2026-08-09 to branch `docs/queryoptions-carveout` (branched from `main` at `a6b78756`).

**Not committed.** The user instructed "but do not commit" during application. All three changes are in the working tree on `docs/queryoptions-carveout`, unstaged, pending their review.

Full proposal text, diagnoses, and no-change verdicts: `01-refine-claude-proposals.md` in this directory.

## Changes applied

| # | File | Change | Before | After |
| --- | --- | --- | --- | --- |
| Q1 | `app/src/CLAUDE.md` | Barrel Files query-key rule amended in place — carve-out permitting a `queryOptions`-built factory export for a consumer structurally unable to call a hook; React components unchanged as hook-only consumers; ✅/❌ pair added | 42,261 | 43,081 |
| C1 | `app/CLAUDE.md` | Convention Discovery — one-sentence pointer routing a zero-result search to `implement.md`'s Ambiguity gate | 15,844 | 16,031 |
| G1 | `.claude/reference/spec-writer-gates.md` | New row "First-instance convention completeness" appended after the Assertion value derivation row | 17,920 | 19,008 |

Each `Old:` string was verified as exactly one occurrence in its live file before application. Every post-application size was re-measured and matches its pre-approval projection exactly. All figures via `(Get-Content -Raw <path>).Length` (pwsh 7.6.4).

`app/src/CLAUDE.md` now sits at 95.7% of its 45,000 ceiling with 1,919 characters of headroom — accepted position (a), stated on the record by head-of-instructions with reasoning recorded in the proposals file. Ceiling not breached; no compensating removal required or performed.

## Not applied

- `spec-writer.md` — no change (G2), verdict recorded in the proposals file.
- `implement.md` — no change (G3), verdict recorded in the proposals file.

## Tracked follow-up created

`task_6e608fcc` — path-scoped ESLint restriction for the `*QueryOptions` import boundary, per Proposal Quality Gate Criterion 4. Created before the summary was presented, as required.

## Measurement note

An earlier size reading of `app/src/CLAUDE.md` in this session returned 42,923 rather than 42,261. The cause was invoking PowerShell through bash, which runs Windows PowerShell 5.1 and decodes the UTF-8 file as ANSI — inflating the count on a file dense with em-dashes and ✅/❌ characters. The canonical method (the PowerShell tool, pwsh 7.6.4) returns 42,261. Any future comparison must use the canonical method on both sides, per Measurement discipline; a 662-character phantom is more than enough to make a ceiling decision come out wrong.
