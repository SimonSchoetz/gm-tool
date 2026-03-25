# Implement

You are the implementer and orchestrator for a full feature implementation. You read the spec, implement all sub-features sequentially under the invariants defined below, commit at each boundary, then run a review-retrospective pipeline once all sub-features are complete.

## Orchestration

### Input

A spec file path. Read the spec in full before doing anything else.

### Pre-implementation phase

Before starting any sub-feature:

1. Verify the working tree is clean: run `git status --short`. If any staged, unstaged, or untracked changes exist before implementation begins, stop and surface them to the user before proceeding. Do not commit, stash, or discard those changes without explicit user instruction — unrelated changes will be swept into the first sub-feature commit.
2. Run `npx tsc --noEmit` and `npx vitest run`.
3. If both are clean: proceed to the implementation phase.
4. If errors or failures surface: assess whether the current spec will resolve them as part of implementation.
   - If yes: inform the user and proceed to the implementation phase without a fix.
   - If no: present the errors to the user and propose a fix following all established conventions and instructions. Do not apply the fix until the user approves.
5. If the user approves the fix: apply it, commit it (`chore(<branch>): fix pre-existing errors before spec work`), then proceed to the implementation phase.

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

#### Review and fix

After all sub-features are committed:

1. Spawn the `code-reviewer` agent. Pass it the branch name so it can diff against main. Wait for its full output.
2. Surface all ❌ Violations and ⚠️ Concerns to the user together. For each item, state what it is and propose what you would do to fix it. Do not apply any fix until the user approves. Ask whether each concern should be addressed now or deferred.
3. Apply only the approved fixes. Apply the same invariants from this file to each fix.
4. Run `npx tsc --noEmit` and `npx vitest run`. Resolve every error and failure.
5. Commit all approved fixes in a single commit: `fix(<branch>): address review violations`.

Implementation is complete when the user has approved the fixes and confirmed the branch is ready.

#### Consulting arch-review and spec-writer

If during the implementation phase the user asks for input on a proposed fix — whether it is architecturally sound, or whether the spec needs revision — invoke the `architect` or `spec-writer` agent to aid the discussion. Present their output to the user before acting. Do not resolve architectural or spec questions unilaterally.

### Post-implementation phase

This phase runs only when friction occurred during the session. Friction includes: pre-implementation errors that required user discussion, ambiguities surfaced during implementation, review violations that required decisions, or unexpected agent behavior.

If the entire session was frictionless — pre-implementation passed cleanly, implementation matched the spec without ambiguity, and review produced no violations — skip this phase and proceed directly to Cleanup.

When friction did occur, produce a friction summary covering:

- Every friction event: what happened, which phase it occurred in, how it was resolved
- The source of each friction event: was it a gap in an agent/command definition, a reasoning error, or a missing CLAUDE.md rule?
- Any decision made under ambiguity — what the question was, what was chosen, why

Pass the summary to `/refine-claude`. It will coordinate with its agents, present proposed changes to the user for approval, and apply them once approved. Do not apply instruction or agent definition changes yourself — your role ends when you hand off the summary and the user approves the verdict.

### Cleanup

After the post-implementation phase (or directly after the review and fix on the happy path):

1. Shut down all agents that were spawned during this session.
2. Move the implemented spec file into `.archive/` at the same relative path. Use `mv` to move the file, then `git rm <original-path>` to remove it from tracking. Do not use `git mv` — the destination is covered by `.gitignore` and must not be tracked.
3. Update `app/docs/_product/backlog.md` to reflect the completed work.
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
