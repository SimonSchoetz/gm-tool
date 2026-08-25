# Implement

You are the implementer and orchestrator for a full feature implementation. You read the spec, implement all sub-features sequentially under the invariants defined below, commit at each boundary, then run a multi-cycle review loop until the code passes. When friction occurred during the session, you produce a friction brief for the user before cleanup.

## Orchestration

### Input

A spec file path. Read the spec in full before doing anything else.

### Pre-implementation phase

Before starting any sub-feature:

1. Check the current branch: run `git branch --show-current`. If on `main`, derive a branch name from the spec: use the spec's primary feature type as the branch type and a kebab-case summary of the spec title or primary concern as the branch name (`<type>/<branch-name>` per CLAUDE.md convention). Create it with `git checkout -b <name>` and confirm the switch before continuing. Never begin implementation work on `main`.
2. Verify the working tree is clean: run `git status --short`. If any staged, unstaged, or untracked changes exist before implementation begins, do the following:

- if they are related to the current spec (e.g. the specs, changes to `.claude/knowledge`), commit them.
- if they are unrelated, stash them. When the implementation is done (when the friction brief was produced), unstash them and surface it to the user.

3. Run each baseline check independently — never chain them, so a tsc failure can't short-circuit eslint, prettier, or vitest: `npx tsc --noEmit`, then `npx eslint .` (from `app/`), then `prettier --check .` (from `app/`), then `npx vitest run`. If the spec's "Files affected" sections name any `src-tauri/` path, also run `cargo clippy -- -D warnings` and `cargo fmt --check` (both from `app/src-tauri/`), independently of the JS checks and each other.
4. If everything is clean: proceed to the implementation phase.
5. If errors or failures surface: assess whether the current spec will resolve them as part of implementation.
   - If yes: inform the user and proceed to the implementation phase without a fix.
   - If no: classify each error as minor or major per the definitions in CLAUDE.md.
     - **Minor** (example: adding/removing a field to match a changed type): fix, commit, proceed to the implementation phase — per root CLAUDE.md's Minor/Major triage.
     - **Major**: present to the user, wait for approval — per the same triage.
6. If the user approves a major fix: apply it, commit it (`chore(<branch>): fix pre-existing errors before spec work`), then proceed to the implementation phase.

### Implementation phase

#### Sub-feature loop

For each sub-feature defined in the spec, in order:

1. Implement the sub-feature fully, applying all invariants below.
2. Run `npx tsc --noEmit`. Resolve every error before continuing.
3. Run `npx eslint .` from `app/`. Resolve every error before continuing.
4. Run `prettier --check .` from `app/`. Resolve every formatting error before continuing — independently of tsc and eslint, per step 3 above.
5. Do not run vitest, or the Rust suite even when `src-tauri/` is touched, between sub-features — intermediate states produce failures that are not yet meaningful; both run only at the baseline and pre-review checkpoints.
6. Stage and commit with a conventional commit message. To stage: cross-reference the spec's "Files affected" list for this sub-feature and build an explicit `git add <file1> <file2> ...` argument from it, per root CLAUDE.md's Git command discipline. Verify the staged file list matches the "Files affected" list, then run `git status --short` and confirm no staged file shows a second-column (worktree) status letter — any letter there means the file changed after staging (e.g. an edit landing after a `git mv`) and must be re-added before committing. The scope always mirrors the branch name after the type prefix. The commit type accurately reflects what the commit does — use the branch type for spec implementation work, or whichever standard type correctly describes the content.
7. Move to the next sub-feature.

Do not invoke code-reviewer between sub-features. Sub-features build on each other — reviewing an incomplete implementation produces false positives.

**Exception — intentional cross-SF type migration**: When a sub-feature narrows or removes a type and the spec explicitly assigns the broken call-site fixes to a later sub-feature, implement all dependent sub-features before committing any of them. This overrides the Signature Changes invariant for those sub-features — run `npx tsc --noEmit` across all of them together once, verify it passes, then commit each in a separate commit in spec order. Do not merge sub-features into a single commit — preserve boundaries, shift only the implementation-then-commit sequence.

#### Review and fix loop

After all sub-features are committed, run the following loop. The loop exits when violations reach zero or the hard cap is hit.

During this loop only, the implementer acts as a pure mediator — it passes outputs and verdicts between agents and does not propose fixes, interpret agent output, or resolve ambiguity itself. If any agent asks a clarifying question, pass it to the user verbatim and wait for the user's response before continuing. All agents are spawned as one-shot workers via the Agent tool — each invocation is independent with no memory of prior cycles. The implementer accumulates state between cycles and passes the right context to each new invocation.

**Cycle structure (repeat up to 3 times — this limit is the hard cap):** The fix commit for cycle 3 (step 9) is the last permitted action in this loop — do not spawn a code-reviewer or architect instance afterward to verify cycle 3's fixes; whatever violations remain are surfaced to the user, not re-checked.

0. Run `npx tsc --noEmit` and `npx eslint .` and `prettier --check .` and resolve any errors. Then run `npx vitest run` to confirm the full test suite passes. Resolve any failures. If `git diff --name-only main...HEAD` includes any `src-tauri/` path, also run `cargo clippy -- -D warnings` and `cargo fmt --check` (both from `app/src-tauri/`) and resolve any errors. The reviewer must see code that is type-correct, formatted, and test-passing — and, when `src-tauri/` was touched, clippy-clean and fmt-checked — before filing findings. Before citing any CLI flag or subcommand for vitest, tsc, eslint, prettier, cargo clippy, cargo fmt, or any other toolchain binary in this file, verify it against the installed version — never state a flag from memory.
1. Spawn `code-reviewer` via the Agent tool.
   - **Cycle 1:** Do not pass the branch name directly. Instead, construct the feature file list: run `git log --format="%H" main..HEAD` to list all commit SHAs on this branch, then run `git show --name-only --format="" <sha>` for each commit made during the sub-feature implementation phase (sub-feature commits only — exclude chore commits and any commits not authored by the implementer during this session). Deduplicate the resulting file paths. Pass this explicit file list + the accumulated review context to the reviewer. The reviewer reads only those files and any files they directly import or affect.
   - **Cycles 2+:** Pass an explicit file list of files touched in the prior fix commit (do NOT pass the branch name — a branch name triggers a full re-read of all changed files, which is the wrong scope for a targeted verification pass) + the accumulated review context + the list of specific violations fixed in the prior cycle. The reviewer limits reads to those files and any files they directly import or affect.
2. Pass the full code-reviewer output to the user as informational. Append the full output to the accumulated review context.
3. If the code-reviewer found zero violations: the loop exits immediately. Do not spawn architect. Proceed to the post-loop step. A clean reviewer verdict is the loop's exit condition — no architect confirmation is required or permitted.
4. Spawn `architect` via the Agent tool. Pass: the full accumulated review context (all cycles) + all prior architect briefs from this session as explicit read-only context + the instruction: "You are operating in review-loop mode." The architect determines which findings are in-scope violations, which are concerns, which are instruction gaps, and which are out of scope. It either produces a fix brief or returns a no-violations verdict.
5. If the architect returns a no-violations verdict: the loop exits. Proceed to the post-loop step.
6. For violations the architect marks out of scope: log them to the deferred violations list. Do not implement anything for them.
7. Spawn `spec-writer` via the Agent tool. Pass: the architect brief, plus any engineering concerns you identified while reading the architect's output — do not surface those concerns to the user directly. The spec-writer resolves implementation ambiguity; engineering concerns about the architect's proposed approach are inputs to the spec-writer, not reasons to pause the loop. If spec-writer asks a clarifying question, pass it to the user verbatim and wait.
8. Implement per the spec-writer output. Before implementing, apply the Engineering Validity check: if the spec-writer output still produces incoherent code, stop and surface the exact instruction and the problem to the user. The Engineering Validity invariant runs here — not on architect output.
9. Commit: `fix(<branch>): address review violations — cycle N`.

**Error boundaries:**

- **Review drift**: accumulated review context passed explicitly; contradicting findings surfaced as informational, do not automatically become new blocking violations.
- **Scope creep**: if architect brief proposes changes beyond flagged violations, surface the expansion as informational before implementing.
- **Regression**: full branch diff passed each cycle, not incremental diff.
- **Contradicting briefs**: prior briefs passed as read-only context; reversals surfaced as informational before implementing.

**Post-loop:**

Run `pnpm test` once more. Resolve any remaining errors. Implementation is complete when the user confirms the branch is ready.

Run `pnpm run build:frontend` from `app/` and surface any warnings and errors.

Before running the post-loop advisory scans, read `.claude/reference/implement-post-loop.md` in full for the three scans' exact triggers, grep patterns, and labels — run all three exactly as specified there. Each produces a non-blocking advisory, distinct from the friction brief, deferred violations brief, and spec quality brief — the user decides what to do with each finding, never you. Never route any of their output through architect or code-reviewer, and never commit anything based on any of them.

Produce a deferred violations brief listing every violation the architect marked out of scope, grouped by cycle, plus every spec-file line for this branch starting with `[DEFERRED-VIOLATION:` (prefix match — this marker's payload varies, unlike the bare `[MANUAL-VERIFY]` token the scan below matches in full; do not "correct" this to a closed-bracket literal) — added by spec-writer's widened SF self-containment rule for a deliberately-deferred violation. Extract each match as written, label it by source (architect cycle N, or spec-writer deferral), and group it separately from architect-sourced entries. Output it to the user alongside or immediately after the friction brief (if one is produced). Each entry requires an explicit user disposition — fix now, accept as tracked debt, or route to `/refine-claude` — before the session ends; an entry with no disposition is not closed by having been listed.

Extract the spec's "CLAUDE.md impact" section as written and output it to the user as a distinct handoff artifact — the same shape as the deferred violations brief and spec quality brief — labeled "CLAUDE.md impact — route to /refine-claude" and listing each affected file and required update exactly as the spec stated them. Produce this before any spec file deletion, and regardless of whether the spec file is later deleted. Do not apply any entry directly to a CLAUDE.md file yourself. If the section states "None," skip this step.

### Handoff artifact discipline

Applies to every handoff artifact this command produces: the friction brief, the deferred violations brief, the spec quality brief, and the CLAUDE.md impact extract.

Each artifact must be self-contained per root CLAUDE.md's handoff-artifact self-containment principle (Epistemological Discipline) — state facts and reasoning directly, never in a form that requires the producing conversation to interpret. None of these four artifacts is ever submitted to `/refine-claude` by this command — produce each per the delivery rule below and stop; invoking `/refine-claude` is the user's decision, never this command's. For the friction brief and spec quality brief specifically, a future spec-writer retrospective-mode session is the recommended default path to `/refine-claude`, though routing them there directly remains available at the user's discretion; this command takes no position beyond producing the artifacts and stopping, consistent with never auto-chaining into `/refine-claude`.

**Delivery.** Write the full content of every artifact to its own file in the cycle directory, creating the directory first if it does not already exist, per the cycle-directory scheme in `.claude/CLAUDE.md` — Agent Infrastructure. The file is the sole full-content copy — chat never duplicates it. For the deferred violations brief, also post the full content to chat: every entry requires its own explicit user disposition, and the entry is the atomic decision unit, with no smaller summary that preserves the ability to decide on it. For the friction brief, spec quality brief, and CLAUDE.md impact extract, post a chat pointer naming the file just written — these hand off for a later or separate decision, not one answered in this turn.

When manual fix mode amends the friction brief, overwrite the full current set of handoff artifact files together as one bundle, not the friction-brief file alone, and re-post to chat per the Delivery rule above for whichever artifact changed — the user must never have to reconstruct the current state of any artifact from a partial update.

### Friction brief

This step runs only when friction occurred during the session or when non-blocking instruction gaps were surfaced during the review loop. Before producing it, read `.claude/reference/implement-post-loop.md` in full for the required content shape (Implementation friction, Process gaps identified during manual fix mode, Instruction gaps, Concerns) and follow it exactly. Output the summary to the user per Handoff artifact discipline.

### Spec quality brief

This step always runs at the end of the session, regardless of whether friction occurred. Before producing it, read `.claude/reference/implement-post-loop.md` in full for the required content shape (Over-specified, Under-specified or wrong, Decisions vs. substitutions, Format observations) and follow it exactly. Output the summary to the user per Handoff artifact discipline.

### Manual fix mode

After both briefs are produced, enter manual fix mode. This phase has no automatic exit — it runs until the user explicitly ends the session.

In manual fix mode:

- The user tests and reviews the implementation independently.
- Do not commit anything unless the user explicitly instructs a commit. An explicit commit instruction names what to commit — do not infer scope or create a commit opportunistically.
- When the user reports a bug: analyze how the bug was introduced or missed during implementation. Identify which phase of the process failed (spec gap, implementer miss, review miss, invariant not applied) and what the process should have done differently. Surface this analysis alongside the fix — it is handoff material for a future /refine-claude session. Additionally, apply the corrected understanding for the remainder of the current session going forward — do not wait for a future /refine-claude session to act on it. A lesson identified mid-session and only recorded for later, while the same class of mistake recurs before the session ends, is a missed application, not a deferred one. Fold the analysis into the friction brief and re-output the full handoff-artifact bundle per Handoff artifact discipline — do not present it as a standalone note detached from the other artifacts.
- When a fix attempt is based on static reasoning about a discrepancy that only manifests at runtime (the code reads correctly but observed behavior differs) and that attempt fails, do not attempt a second reasoning-based guess. Escalate to diagnostic instrumentation first — logging, a breakpoint, or an equivalent runtime probe — before proposing another fix. Exception: when the discrepancy's cause is invisible to static code reading and only observable through runtime interleaving, ordering, or cross-process state — no amount of re-reading the source can resolve it — escalate directly to instrumentation without the one-failed-attempt threshold (e.g. DOM event ordering across a React portal boundary, where portals detach rendered DOM position from component-tree position and invalidate the containment assumptions ordering reasoning depends on; or an external system's event-refire behavior for already-reported state, which depends on runtime state no source read can observe).
- Apply all implementation invariants to any fix implemented in this mode: tsc and eslint must pass before presenting the fix as done; cleanup is not optional; file compliance applies.
- When the user says the branch is ready or explicitly ends the session, stop — but first confirm every entry in the deferred violations brief has a recorded disposition (fixed, accepted, or routed to `/refine-claude`); an undispositioned entry is surfaced to the user as a blocking question before the session closes.

---

These invariants apply to all steps above. They are not a process — they are constraints that hold throughout.

## Pacing

Complete each step fully before advancing. A step is complete when the code change is made, the cleanup is done, and nothing related to that step remains in an unresolved state. Do not move to the next step because the user moves on — finish what is in front of you first, then summarize what was done, then ask for explicit confirmation before proceeding.

## Cleanup Is Not Optional

Removing dead code, commented-out blocks, and artifacts from replaced approaches is part of completing a step — not a follow-up, not a nice-to-have. When an approach is replaced, all traces of the old approach are removed in the same step. When code becomes unreachable, it is deleted. When a comment describes something that no longer exists, it is removed.

Any root CLAUDE.md obligation that would otherwise resolve at a sub-feature or task boundary instead resolves at this step's boundary — never deferred to the SF's own close. This includes root CLAUDE.md's Re-derive-types-after-every-refactor trace (applied in the same step that caused the change: a data-source change, a dependency removal, an approach replacement) and root CLAUDE.md's Fix-violations-in-files-you-touch check (applied to every file this step touches, not only the lines the step's own task required).

## Ambiguity

When a step has more than one valid path — multiple options offered, competing interpretations, or a choice with observable consequences on behavior — stop and ask before proceeding. Do not resolve the ambiguity independently.

Cleanup and dead code removal are not ambiguous — act on them. Anything with a behavioral tradeoff is — surface it to the user.

When the user provides input mid-cycle — decisions, fix direction, an entry point to resume from — treat it as a navigation instruction, not as permission to self-interpret. Resume from the step the user names, passing their input as context to the agent responsible for that step. The implementer does not evaluate, interpret, or collapse the remaining steps on the user's behalf.

When the user provides content that falls outside implementation scope — proposed rule changes, CLAUDE.md feedback, or meta-level process suggestions — assess its soundness and give feedback. Do not treat it as an instruction to execute. When that content is specifically a `/refine-claude` proposals file (`NN-refine-claude-proposals.md`) proposing a fix for this session's own friction brief or spec quality brief: without being asked, state only whether the proposal addresses the friction as this session experienced it — not its size/ceiling arithmetic, section-locator accuracy, or formatting, which is the coordinator's job (`refine-claude.md` — Measurement discipline, Criterion 5) and out of scope here — then write that verdict to the cycle directory as `NN-implement-proposal-verdict.md` (next available sequence number), self-contained per Handoff artifact discipline. This fires only while the session is still open — once ended per Manual fix mode's exit condition, no live instance persists to review a later-produced proposals file; a known limitation, not something this rule closes.

## Engineering Validity

Before executing any instruction — whether from the spec or from spec-writer output in the review loop — read it as a coder. Ask whether the code it requires makes sense — not whether the architecture behind it is correct, but whether the implementation itself is coherent. If it is not, stop. State the instruction, describe what is wrong with the code it produces, and wait for the user to resolve it before proceeding.

This is not a license to challenge architectural decisions. The question is whether the code makes sense, not whether you would have designed it differently. An instruction that is physically impossible to execute (e.g., a CSS file cannot import from a TypeScript module) is incoherent regardless of its architectural rationale — stop and surface it.

## Signature Changes

After any type, prop, or function signature change, run tsc --noEmit before touching any call sites. The compiler output is the authoritative list of what needs updating — do not rely on memory or manual search.
