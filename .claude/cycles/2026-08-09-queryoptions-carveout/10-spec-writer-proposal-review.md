# Spec-writer review of `09-refine-claude-proposals.md`

Producing role: `spec-writer`. Input: `09-refine-claude-proposals.md` in this cycle directory. Subject: the nine proposals in that file, four of which (3–6) edit registry entries describing spec-writer and its command surface, and two of which (7–8) edit `.claude/reference/spec-writer-gates.md`, the file spec-writer reads in full before emitting any spec.

Findings are observations for the coordinator, per `/refine-claude`'s constraint that it treats findings from other agents as observations rather than instructions. Two require a change before the batch is applied. Nothing here disputes a diagnosis in Phase 1.

## Verdict: approve after two corrections

Proposals 1, 2, 7, 8, and 9 are sound as written and need no change. Proposals 3–6 need a locator correction, and the batch is missing one proposal.

Proposals 7 and 8 match the recommended actions in `08-spec-writer-retrospective-verdict.md` — gate 2 rewritten so the tsconfig enumeration produces a written flag list rather than being self-certifying, and a new gate row for the unread-`Modified:`-file case. Proposal 8's row correctly carries the completeness clause that verdict asked for: the check covers every construct in the file the change's rationale applies to, not only the construct originally in mind. Proposal 9's contingency on 3–6 landing in the same batch is correct and should be honored.

## Correction 1 — Proposals 5 and 6 carry a wrong section locator over ambiguous Old: text

Both are labeled `Section: ## commands — spec-writer`. In `.claude/CLAUDE.md`, `### spec-writer` is an agent entry appearing above the `## commands` heading; it is not under `## commands`.

This is not cosmetic. Proposal 5's Old: text is character-identical to the Input line of the `/write-specs` entry, which *is* under `## commands`:

> Input: An arch-review verdict (structured) or a feature outline + informal architectural decisions (unstructured — confirms derived decisions with user before proceeding)

A mechanical application keyed on Old: text therefore has two candidate matches in the file, and the stated section label points at the wrong one. The coordinator's write authority is limited to mechanically applying teammate-defined text, which makes an ambiguous locator a real failure mode rather than a stylistic issue: applied to the wrong entry it silently edits `/write-specs`; applied to both it makes a change no teammate proposed.

Required: a disambiguating locator on Proposals 5 and 6 identifying the agent entry (above `## commands`) rather than a command entry, before any application step.

## Correction 2 — The batch resolves Finding E in two of the three places it exists

Finding E identified the same artifact-routing relationship documented inconsistently across registry entries. Proposals 3 and 4 fix `/implement`; Proposals 5 and 6 fix the `spec-writer` agent entry. The `/write-specs` entry is untouched and still reads:

> Output: A complete spec file following the canonical format defined in app/docs/CLAUDE.md

`/write-specs` is the main-thread surface for spec-writer, and `.claude/commands/write-specs.md` instructs the operator to apply spec-writer's "process, output format, and behavior rules in full" — which inherits retrospective analysis mode by reference, verdict artifact included [spec-writer_1: .claude/commands/write-specs.md:3].

After this batch as currently drafted, the agent entry would state that a friction brief or spec quality brief is valid input producing a verdict artifact, while the command entry delegating to that same agent states its only output is a spec file. That is the identical class of inconsistency Finding E reported, left in the file the batch exists to repair, and it is the same parity objection on which head-of-agents rejected head-of-instructions' first draft during Phase 2 mediation — an exclusive framing in one entry reintroducing the inconsistency in a third.

Required: a tenth proposal covering the `/write-specs` Input and Output fields, consistent with the mediated framing (spec-writer retrospective mode as recommended default for those two brief types; direct routing to `/refine-claude` available at the user's discretion). Ownership follows the same split already established for Proposals 3–6.

## Checked and explicitly not flagged

The uncomputed size projection for `.claude/CLAUDE.md` (noted in the file as "not separately computed") is compliant, not a shortcut. `head-of-instructions.md:58` sets the ceiling for each scoped CLAUDE.md at 45,000 characters and requires requesting a projection only when a file is within 10% of its ceiling. The file measures 18,159 characters, roughly 40% of ceiling, well outside the trigger [spec-writer_2: ran `Get-Content -Raw .claude/CLAUDE.md` length — 18,159]. The three baselines stated in the proposals file were independently confirmed exact: 18,159 / 19,008 / 43,081.

## Concurrence on a reclassification of spec-writer's own output

Phase 1 reclassifies the `MentionPopupContent` / `mentionPrefetchByType` dual enumeration as an application failure of existing DRY and Convention Discovery rules, overturning the framing written into `SPEC_PREFETCH.md`'s CLAUDE.md-impact section, which called it a registration-flow gap with "no documented registration flow naming either as canonical."

Spec-writer concurs, and the reclassification is the better reading. The duplicated element is a set of eight entity-type string literals with no shared type — a DRY violation with an existing owning rule and a code-level fix (a shared union), not an absent registration flow requiring a new instruction. The original framing would have produced a new rule where two adequate ones already existed, which is the growth pattern this project's consolidation work exists to prevent. No further action beyond the tracked follow-up.

## Recurrence note — third instance of the same routing failure this session

Recorded because it happened while producing this review, and because it is now a pattern rather than an instance.

This review was first delivered as a chat reply with no artifact, and written here only after a user challenge. That is the third occurrence in one session of analysis that a future session needs being produced without persistence. The first concerned corrections to a tracked ESLint follow-up (resolved by creating `03-plan-feature-lint-guard-corrections.md`); the second concerned the retrospective verdict itself and is documented as Finding E in `08-spec-writer-retrospective-verdict.md`.

The third occurrence is materially worse than the second, because Finding E had already stated the corrective model — "the mode is entered by the input, not the invocation" — and that model was then applied too narrowly to catch this case. The input here was a coordinator's proposal file, not a brief reporting on spec-writer's output, so it did not match the trigger as Finding E had scoped it.

**Diagnosis, distinct from Finding E's.** Finding E treated the failure as a missed trigger. The recurrence shows the actual defect is in how each correction is scoped: every fix so far has been drawn tightly around the specific case that was caught, which leaves the adjacent case uncovered and guarantees another occurrence. Correcting an instance is not correcting the class, and three consecutive instances of one rule is evidence that instance-level correction does not converge.

**Candidate genuine gap, for head-of-instructions to weigh.** Root `CLAUDE.md`'s knowledge-routing rule states its obligation as a principle — route explanatory knowledge to its narrowest correct scope, regardless of the channel it surfaces in — but names no moment at which the obligation fires. Compare `.claude/reference/spec-writer-gates.md`, where every row states an explicit trigger condition and is reliably applied. A principle with no trigger depends entirely on the reader noticing it applies, which is precisely what failed three times here despite the rule being read, cited, and acknowledged in between. The candidate change is to give the routing rule a stated trigger rather than to add a fourth rule restating the obligation. Whether that is worth its size cost is head-of-instructions' call; this entry records the evidence, not a drafted rule.

This note is not offered as mitigation for any finding above. The two corrections stand on their own evidence and are unaffected by how this review reached the file.
