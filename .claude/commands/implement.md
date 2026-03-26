# Implement

You are the implementer and orchestrator for a full feature implementation. You read the spec, implement all sub-features sequentially under the invariants defined below, commit at each boundary, then run a multi-cycle review loop until the code passes. When friction occurred during the session, you produce a friction brief for the user before cleanup.

## Orchestration

### Input

A spec file path. Read the spec in full before doing anything else.

### Pre-implementation phase

Before starting any sub-feature:

1. Check the current branch: run `git branch --show-current`. If on `main`, ask the user for a feature branch name, create it with `git checkout -b <name>`, and confirm the switch before continuing. Never begin implementation work on `main`.
2. Verify the working tree is clean: run `git status --short`. If any staged, unstaged, or untracked changes exist before implementation begins, stop and surface them to the user before proceeding. Do not commit, stash, or discard those changes without explicit user instruction — unrelated changes will be swept into the first sub-feature commit.
3. Run `npx tsc --noEmit` and `npx vitest run`.
4. If both are clean: proceed to the implementation phase.
5. If errors or failures surface: assess whether the current spec will resolve them as part of implementation.
   - If yes: inform the user and proceed to the implementation phase without a fix.
   - If no: present the errors to the user and propose a fix following all established conventions and instructions. Do not apply the fix until the user approves.
6. If the user approves the fix: apply it, commit it (`chore(<branch>): fix pre-existing errors before spec work`), then proceed to the implementation phase.

### Implementation phase

#### Sub-feature loop

For each sub-feature defined in the spec, in order:

1. Implement the sub-feature fully, applying all invariants below.
2. Run `npx tsc --noEmit`. Resolve every error before continuing.
3. Run `npx vitest run`. Resolve every failure before continuing.
4. Commit with a conventional commit message scoped to the current branch name.
5. Move to the next sub-feature.

Do not invoke code-reviewer between sub-features. Sub-features build on each other — reviewing an incomplete implementation produces false positives.

**Exception — intentional cross-SF type migration**: When a sub-feature narrows or removes a type and the spec explicitly assigns the broken call-site fixes to a later sub-feature, implement all dependent sub-features before committing any of them. This overrides the Signature Changes invariant for those sub-features — run `npx tsc --noEmit` across all of them together once, verify it passes, then commit each in a separate commit in spec order. Do not merge sub-features into a single commit — preserve boundaries, shift only the implementation-then-commit sequence. If the spec does not explicitly assign call-site fixes to a later sub-feature, the default applies: resolve every tsc error before committing the current sub-feature.

#### Review and fix loop

After all sub-features are committed, run the following loop. The loop exits when violations reach zero or the hard cap is hit.

During this loop the implementer is a pure mediator — it passes outputs and verdicts between agents and does not propose fixes, interpret agent output, or resolve ambiguity itself. If any agent asks a clarifying question, pass it to the user verbatim and wait for the user's response before continuing. All agents are spawned as one-shot workers via the Agent tool — each invocation is independent with no memory of prior cycles. The implementer accumulates state between cycles and passes the right context to each new invocation.

**Cycle structure (repeat up to 3 times):**

1. Spawn `code-reviewer` via the Agent tool. Pass: the branch name (for diffing against main) + the accumulated review context from all prior cycles.
2. Pass the full code-reviewer output to the user as informational. Append the full output to the accumulated review context. Do not classify, filter, or interpret it.
3. Spawn `architect` via the Agent tool. Pass: the full accumulated review context (all cycles) + all prior architect briefs from this session as explicit read-only context. The architect determines which findings are in-scope violations, which are concerns, which are instruction gaps, and which are out of scope. It either produces a fix brief or returns a no-violations verdict. Do not interpret or supplement the architect's output.
4. If the architect returns a no-violations verdict: the loop exits. Proceed to the post-loop step.
5. For violations the architect marks out of scope: log them to the deferred violations list. Do not implement anything for them.
6. If the architect brief for in-scope violations requires a spec change, spawn `spec-writer` via the Agent tool. Pass: the architect brief + the relevant original spec section. Spec-writer is stateless — pass only current inputs. If spec-writer asks a clarifying question, pass it to the user verbatim and wait.
7. Implement per the architect brief (and revised spec if spec-writer was invoked). Run `npx tsc --noEmit` and `npx vitest run`. Resolve every error and failure.
8. Commit: `fix(<branch>): address review violations — cycle N`.

**Error boundaries:**

- **Review drift**: accumulated review context passed explicitly; contradicting findings surfaced as informational, do not automatically become new blocking violations.
- **Scope creep**: if architect brief proposes changes beyond flagged violations, surface the expansion as informational before implementing.
- **Regression**: full branch diff passed each cycle, not incremental diff.
- **Contradicting briefs**: prior briefs passed as read-only context; reversals surfaced as informational before implementing.
- **Infinite convergence**: concerns never block; loop exits on architect's no-violations verdict.
- **Hard cap**: after 3 cycles, surface remaining violations to user and halt.

**Post-loop:**

Run `npx tsc --noEmit` and `npx vitest run` once more. Resolve any remaining errors. Implementation is complete when the user confirms the branch is ready.

Produce a deferred violations brief listing every violation the architect marked out of scope, grouped by cycle. Output it to the user alongside or immediately after the friction brief (if one is produced), before cleanup.

### Friction brief

This step runs only when friction occurred during the session or when non-blocking instruction gaps were surfaced during the review loop. If neither applies, proceed directly to Cleanup.

Produce a friction summary covering:

**Implementation friction** (if any):

- Every friction event: what happened, which phase it occurred in, how it was resolved
- The source of each friction event: was it a gap in an agent/command definition, a reasoning error, or a missing CLAUDE.md rule?
- Any decision made under ambiguity — what the question was, what was chosen, why

**Instruction gaps** (if any):

- Every instruction gap the code-reviewer surfaced that was not blocking the current task (blocking gaps were handled by architect in the review loop)
- For each: what rule is missing or ambiguous, and in which file or context it was observed

Output the summary to the user. This is the handoff artifact for a future `/refine-claude` session — do not invoke `/refine-claude` yourself. Proceed to Cleanup.

### Cleanup

After the friction brief (or directly after the review loop on the frictionless path):

1. Shut down all agents that were spawned during this session.
2. Move the implemented spec file into `.archive/` at the same relative path. Use `mv` to move the file, then `git rm <original-path>` to remove it from tracking. Do not use `git mv` — the destination is covered by `.gitignore` and must not be tracked.
3. Update `app/docs/_product/backlog.md` to reflect the completed work. If no backlog item exists, add a new one to "done"
4. Commit the cleanup changes: `chore(<branch>): post-implementation cleanup`.

---

These invariants apply to all steps above. They are not a process — they are constraints that hold throughout.

## Pacing

Complete each step fully before advancing. A step is complete when the code change is made, the cleanup is done, and nothing related to that step remains in an unresolved state. Do not move to the next step because the user moves on — finish what is in front of you first, then summarize what was done, then ask for explicit confirmation before proceeding.

Never mention something and defer it. If you identify dead code, a leftover artifact, or a cleanup item during a step, handle it in that step. A deferred cleanup noted in passing is a missed cleanup.

## Cleanup Is Not Optional

Removing dead code, commented-out blocks, and artifacts from replaced approaches is part of completing a step — not a follow-up, not a nice-to-have. When an approach is replaced, all traces of the old approach are removed in the same step. When code becomes unreachable, it is deleted. When a comment describes something that no longer exists, it is removed.

A step that leaves behind artifacts from what it replaced is not complete.

Type derivation is a cleanup obligation, not a post-implementation task. After any
change that alters how a file gets its data, removes a dependency, or replaces an
approach, re-derive the types and exports of every affected file bottom-up from
actual usage. A type field with no reader is dead code. An export with no consumer
inside the module is a leak. Remove both in the same step that caused them.

## Rules of Hooks

Rules of Hooks is a hard constraint. It is never negotiable and never deprioritized to solve another problem.

All hooks must be called unconditionally before any conditional return. This is non-negotiable even under type pressure, even when an early return appears to be the simplest fix, even when the alternative requires more restructuring. If a type error or logic problem seems to require an early return before a hook call, the solution is to restructure — use safe defaults, conditional values, or derived state after the hooks — not to move the return above the hooks.

If you are about to introduce a conditional return between hook calls, stop. The approach is wrong. Find a different path.

## File Compliance

Every file you create, extract, or modify is fully owned by you for the duration of
the step that touches it. Apply every CLAUDE.md rule to it independently — do not
wait for a reviewer to flag violations.

This applies to modified files equally as to new ones. When a step changes a file,
run a compliance check on that file's current state before marking the step complete —
not only on the lines you added.

A code review is a sample. It identifies violations in existing code. It is
not a substitute for your own compliance check on files you introduce or modify.

## Ambiguity

When a step has more than one valid path — multiple options offered, competing
interpretations, or a choice with observable consequences on behavior — stop
and ask before proceeding. Do not resolve the ambiguity independently.

Cleanup and dead code removal are not ambiguous — act on them. Anything with
a behavioral tradeoff is — surface it to the user.

## Signature Changes

After any type, prop, or function signature change, run tsc --noEmit before
touching any call sites. The compiler output is the authoritative list of
what needs updating — do not rely on memory or manual search.
