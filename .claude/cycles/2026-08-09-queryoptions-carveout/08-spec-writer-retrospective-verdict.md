# Spec-writer retrospective verdict — SPEC_PREFETCH

Producing role: `spec-writer` (retrospective analysis mode). Inputs: `04-implement-friction-brief.md` and `06-implement-spec-quality-brief.md` in this cycle directory. Subject spec: `app/docs/SPEC_PREFETCH.md` (+ `SPEC_PREFETCH_SF1.md`–`SF6.md`), authored in the same session that produced this verdict.

## Original Finding

Reproduced unedited from the source briefs. Each finding is tagged with its originating source.

### Finding A — `[source: 04-implement-friction-brief.md, item 2]`

> **What happened**: `mentionPrefetchByType`'s type, copied verbatim from `SPEC_PREFETCH_SF6.md`'s code sample (`Record<string, MentionPrefetch>`), caused ESLint's `@typescript-eslint/no-unnecessary-condition` to flag the same section's required `if (!prefetch) return;` unrecognized-type guard as dead code.
>
> **Phase**: SF6 implementation.
>
> **Root cause**: `app/tsconfig.json` does not set `noUncheckedIndexedAccess`, so TypeScript types `Record<string, T>[key]` as always-`T` — never `T | undefined` — regardless of whether the key exists at runtime. The spec's literal type sample is narrower than what its own guard needs.
>
> **How resolved**: widened the value type to `Record<string, MentionPrefetch | undefined>`. This makes the type accurately reflect runtime reality with no tsconfig change (a much larger, unrelated decision) and no eslint-disable suppression, and it preserves SF6's own stated architectural intent verbatim (KAD: "the lookup must tolerate an unrecognized value") — the fix corrects a code-sample type-accuracy gap, not the spec's decision.
>
> **Source**: spec quality gap — the code sample under-specifies relative to the toolchain guarantees `/implement` itself requires (zero eslint errors before any commit). Not a reasoning error and not a missing CLAUDE.md rule — `app/CLAUDE.md`'s "code must be valid under the full toolchain configuration, not just type-declaration correct" rule already covers this class of error; the spec sample simply didn't apply it.

### Finding A' — `[source: 06-implement-spec-quality-brief.md, "Under-specified or wrong"]`

> **`SPEC_PREFETCH_SF6.md`'s `mentionPrefetchByType` code sample** declares `Record<string, MentionPrefetch>`. Under this project's `tsconfig.json` (no `noUncheckedIndexedAccess`), that type makes `mentionPrefetchByType[entityType]` always-defined to `tsc`, which makes ESLint's `@typescript-eslint/no-unnecessary-condition` flag the same section's required `if (!prefetch) return;` guard as dead code. The type should have been `Record<string, MentionPrefetch | undefined>` from the start — the spec's own KAD text ("the lookup must tolerate an unrecognized value") already implies this; the code sample just didn't carry it through to the type declaration.

Findings A and A' are the same defect reported independently by two sources. They are classified once, below.

### Finding B — `[source: 04-implement-friction-brief.md, "Concerns"; originating with code-reviewer cycle 1]`

> Code-reviewer (cycle 1) flagged that `app/docs/_product/domain-scaffold.md`'s route-file code templates (the copy-paste `createFileRoute(...)` blocks under "### Routes") weren't updated alongside the loader-requirement prose added in the same SF5 edit — a future domain scaffolded by copying the templates verbatim would silently reintroduce the flicker the new prose warns against. This was fixed inline immediately after the review loop exited (commit `c7dbc252`, "sync domain-scaffold route templates with loader requirement") rather than left open, since it directly completed SF5's own stated intent for that file. No disposition needed from the user — already resolved on this branch.

### Finding C — `[source: 04-implement-friction-brief.md, item 1]`

> **What happened**: `npx tsc --noEmit` failed on `ImagePreviewFramingOverlay.tsx` before any spec sub-feature work began. None of the failing files appear in any SF's "Files affected" list. […] **Source**: pre-existing repo state, unrelated to this spec — not a spec gap and not an implementer reasoning error.

### Finding D — `[source: 06-implement-spec-quality-brief.md, "Over-specified" and "Format observations"]`

> **Over-specified**: None identified. SF2's per-domain substitution tables and SF4/SF5's route-loader substitution tables were used exactly as intended […]
>
> **Format observations**: None. The split-file format (root index + 6 SF files) tracked cleanly against the sub-feature implementation loop with no cross-file navigation friction […]

### Finding E — `[source: this session, self-diagnosed after user challenge]`

Not present in any input brief. Recorded here because it occurred while this verdict was being produced and would otherwise survive only in a chat transcript.

On first reading `04-implement-friction-brief.md` and `06-implement-spec-quality-brief.md`, spec-writer performed the retrospective classification and delivered it as a chat reply, producing no artifact. The user challenged this ("did you update the briefs with your verdict?"), and only then was this file created. Earlier in the same session the identical failure had already occurred with a different set of findings — corrections to a tracked ESLint follow-up task were stated in chat with no persistence plan, the user challenged that too, and the fix was applied by creating `03-plan-feature-lint-guard-corrections.md`. The second occurrence therefore followed a correction that had already been made and accepted within the same session.

## Attribution Check

**Finding A/A' — attribution correct but incomplete.** Both briefs name the cause accurately: the code sample's type is narrower than its own guard requires, and `app/CLAUDE.md`'s full-toolchain-validity rule already covers the class. Finding A then states this is "not a reasoning error," which is correct with respect to the *implementer* — the implementer copied a sample it was entitled to trust. It is incorrect if read as applying to spec-writer. Spec-writer's Pre-Emission Compliance Pass carries a general gate whose text is "Enumerate every flag in `app/tsconfig.json` compilerOptions — do not stop at the `strict` bundle," and a specific gate row ("Always-true predicate") naming `@typescript-eslint/no-unnecessary-condition` as its authority. Both were run and both passed the defect through. The defect therefore has a spec-writer-side cause the briefs do not name, because neither brief has visibility into spec-writer's internal gate list.

**Finding B — attribution understated.** Brief 04 files this under "Concerns" and closes it as needing no disposition because it was fixed on the branch. The fix is not in dispute, but the framing locates the defect in the review loop's coverage rather than in the spec. The actual origin is upstream of both: `SPEC_PREFETCH_SF5.md` listed `app/docs/_product/domain-scaffold.md` under `Modified:` and prescribed the content of the edit, and the file was never read at any point during spec authoring. The prescribed edit could only describe what spec-writer assumed the file contained. That the templates existed and needed the same change was not overlooked during review — it was unknowable from the spec, because the spec was written without opening the file. Classifying this as a review-loop concern would leave the actual cause uncorrected.

**Findings C and D — attribution correct, accepted as stated.**

**Finding E — self-attribution, stated without mitigation.** One structural hypothesis was tested and rejected: that `/write-specs` omits retrospective analysis mode, leaving a main-thread operator with no route to it. It does not — `.claude/commands/write-specs.md` instructs the operator to "apply its process, output format, and behavior rules in full," which inherits retrospective mode by reference [spec-writer_1: .claude/commands/write-specs.md:3]. No command-level gap caused this failure. The cause is that the analysis was performed and then not written down, which is an execution failure and is classified as such below. A separate coordination ambiguity was found while testing the hypothesis and is recorded independently, not as a mitigating cause.

## Classification

### Finding A/A' — Application failure

The rule existed and did not fire. Two of them:

- Pre-Emission Compliance Pass, general gate 2 (Toolchain validity): "Enumerate every flag in `app/tsconfig.json` compilerOptions — do not stop at the `strict` bundle." `app/tsconfig.json` was never opened during the authoring session.
- Pre-Emission Compliance Pass, gate row "Always-true predicate": triggers on a predicate whose tested case the value's type already guarantees, with `app/eslint.config.js` as authority and `no-unnecessary-condition` as the named rule.

**Wrong mental model**: that `Record<string, T>` index access yields `T | undefined`. That is what it means at runtime, and what it would mean under a stricter configuration, so the guard and the type were written from two different assumptions without the contradiction surfacing.

**Correct mental model**: index-access nullability is a compiler-configuration fact, not a language fact, and is unknowable without reading `tsconfig.json`. Any spec code that guards an index access has a hard dependency on `noUncheckedIndexedAccess`'s value, and the guard and the type are a single decision that must be made from the same verified premise.

A second contributing failure: the gate list was run as a checklist against constructs already in view, rather than by first building each gate's population as the Pass's own population-inventory principle requires. Gate 2's instruction is literally to enumerate a file's contents; it was treated as satisfied by inspection.

### Finding B — Application failure, plus one genuine gap

**Application failure.** Root `CLAUDE.md` — Tool Use Discipline: "Verify before naming a path or describing file content in any output — regardless of who supplied it… any content claim (what a file contains, exports, or its length — even hedged) requires having read it in the current context window." Spec-writer's own Read Discipline states the same obligation from the other direction: "Every read must resolve a specific claim the spec is about to make." Prescribing an edit to `domain-scaffold.md` is a claim about that file's contents. It was made without the read.

**Wrong mental model**: that a `Modified:` entry describing *what should be added* to a file makes no claim about what the file currently contains, and so carries no read obligation.

**Correct mental model**: prescribing an edit is a stronger claim than describing content, not a weaker one — it asserts both what is absent and that nothing else in the file needs the same change. Neither half is knowable without reading the file, and the second half is the one that failed here.

**Genuine gap.** The Pre-Emission Compliance Pass has no row that fires on this. Row "Existing-code claims" triggers on the spec *stating a fact* about an existing file's current syntax or structure; row "Files-affected completeness" checks that touched files *appear* in the lists. A spec that prescribes an edit to a file it never read, while stating no explicit fact about that file, satisfies every existing row. The missing check belongs in `.claude/reference/spec-writer-gates.md` as a new gate row, triggering on any file listed under `Modified:` whose required change the spec describes, and requiring that the file was read in the current context window before the change is described — with the check covering every construct in the file that the described change's rationale applies to, not only the construct the spec had in mind. Head-of-agents owns the wording.

### Finding C — Out of domain

Pre-existing repo state, unrelated to this spec, in files no SF touches. The owning role is `/implement`'s baseline-failure triage, which classified it Major, surfaced it, and committed the fix separately before SF1 — the documented behavior, executed correctly. No spec-writer rule change.

### Finding E — Application failure, plus one genuine gap found while investigating it

**Application failure.** Three rules covered this and none fired:

- `spec-writer.md` — Retrospective analysis mode, step 6: the verdict artifact is the output, and "when the input arrived via a cycle directory, write the artifact to that same directory." The trigger condition — input that is a retrospective finding about spec-writer's own prior output — was met the moment the two briefs were read.
- Root `CLAUDE.md` — Coding style: explanatory knowledge routes to its narrowest correct scope "regardless of the channel it first surfaces in — a chat reply or review verdict routes through the same tiers as a code comment."
- Root `CLAUDE.md` — Immediate Application of Corrections: a correction reached in-session is binding "for the remainder of the current session immediately," and specifically bars reverting to the prior approach later in the same session. The first occurrence had already been corrected and the corrected behavior already performed once.

**Wrong mental model**: that retrospective mode is entered by being invoked into it — by a command, a spawn, or an explicit instruction — and that absent such an invocation, analysis of a brief is conversation. Under that model the first correction read as a one-off fix to one specific omission rather than as a rule about where analysis output belongs.

**Correct mental model**: the mode is entered by the *input*, not by the invocation. Reading an artifact that reports on spec-writer's own prior output is itself the trigger, and it fires before any analysis begins — so the artifact is opened first and the analysis is written into it, rather than composed in a reply and then considered for persistence afterward. Persistence is not a step that follows analysis; it is the medium the analysis is performed in.

**Genuine gap — ownership of the briefs is documented twice, incompatibly.** `/implement`'s registry entry states the spec quality brief is "routable directly to `/refine-claude` for spec-writer improvement." The `spec-writer` registry entry states that when its input is "a spec quality brief or a post-implementation friction brief," its output is "a verdict artifact… written to the cycle directory as the handoff artifact for a future /refine-claude session." Both describe the same artifacts. One routes them straight to `/refine-claude`; the other interposes spec-writer, which classifies them and challenges their attribution first. No command spawns spec-writer for this purpose, and `/implement` does not — so which path is canonical is undetermined by the registry, and a reader following `/implement`'s entry alone would never involve spec-writer at all. This is worth resolving regardless of Finding E, because the two paths produce materially different inputs to `/refine-claude`: the direct path hands it unchallenged findings, while the spec-writer path hands it findings whose causal attribution has been tested — this verdict overturned the stated attribution on two of five findings. Ownership note for whoever resolves it: the registry lives in `.claude/CLAUDE.md`, which is head-of-instructions' domain, while the two entries describe agent and command behavior, which is head-of-agents'. `/refine-claude` mediating between both is the correct venue rather than either acting alone.

### Finding D — Calibration observation

Zero over-specification and zero format friction across a six-SF split spec indicates the decision-vs-substitution filter and the split-format threshold are calibrated correctly for a spec of this shape. Recorded as evidence that these two mechanisms are working; no rule change warranted, and no action beyond noting that a future consolidation session should not treat either as a candidate for change on this cycle's evidence.

## Recommended Action

For a future `/refine-claude` session:

1. **Finding A/A' — no new rule.** Both governing rules already exist and are correctly worded; this was a failure to execute them. Adding a third rule restating the same obligation would dilute the gate list, which is the ratchet failure mode this project has already diagnosed. If any change is made, the candidate is a wording change to Pre-Emission general gate 2 making the tsconfig enumeration an explicit precondition with a named output (the flag list) rather than an instruction that can be silently deemed satisfied — head-of-agents owns whether that is worth the size cost.
2. **Finding B — one new gate row** in `.claude/reference/spec-writer-gates.md`, per the genuine gap above. This is the only proposal in this verdict that adds a rule.
3. **Finding E — no new rule for the failure itself; one registry resolution.** The three rules that cover the execution failure are correctly worded and a fourth restating them would dilute the set. What is actionable is the ownership ambiguity: decide whether `/implement`'s briefs route to `/refine-claude` directly or through spec-writer's retrospective mode, and make the two registry entries agree. If the spec-writer path is chosen, name what spawns it — the gap is that nothing currently does. This item spans both heads' domains and should be mediated rather than assigned.
4. **Findings C and D — no action.**

Proposals 1 and 2 concern `.claude/reference/spec-writer-gates.md` and `spec-writer.md`, which are head-of-agents' domain. Proposal 3 additionally touches the Automation Registry in `.claude/CLAUDE.md`, which is head-of-instructions' domain — it is the only item in this verdict requiring both heads to agree before anything is written.

## Note on this verdict's own provenance

Findings A–D were produced by spec-writer analyzing briefs written by another role. Finding E was produced by spec-writer analyzing its own conduct during that analysis, after a user challenge rather than self-detection. A reader weighting these findings should account for that difference: E's classification and its "wrong mental model" entry are self-reported, with no independent role having reviewed them.
