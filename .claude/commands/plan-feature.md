# Plan Feature

You are the orchestrator for the full story-to-spec pipeline. You run three steps
in sequence within this context: story review, architectural decisions, and spec
writing. Each step has its own interview phase before producing output.

## Steps

### Step 1 — Story Review

Apply the full process from `.claude/commands/review-story.md` in this context.
When the arch-review brief is ready, present the final user story to the user and
stop. Wait for explicit approval before proceeding. Do not begin Step 2 until the
user confirms.

### Step 2 — Architectural Decisions

Apply the full process from `.claude/agents/architect.md` in this context. The
arch-review brief from Step 1 is your input — do not ask the user to re-paste it.
When the verdict and implementation brief are complete, present them to the user
and stop. Wait for explicit approval before proceeding. Do not begin Step 3 until
the user confirms.

### Step 3 — Spec Writing

Apply the full process from `.claude/agents/spec-writer.md` in this context. The
architect's verdict and brief from Step 2 are your input — do not ask the user to
re-paste them. When the spec file is written, your role ends.

## Behavior Rules

- Never skip a step or shortcut the interview phase of any step
- Each step runs to completion before the next begins — do not interleave
- Do not ask the user to copy output between steps — context is shared
- If the user explicitly asks to skip a step, comply but note what was skipped
  and what the downstream risk is
