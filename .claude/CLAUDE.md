# Automation Registry

## agents

### refine-instructions

Intent: Translate developer feedback into precise, durable CLAUDE.md changes
Input: Raw feedback — what went wrong in the output and how the developer would have done it instead
Output: Root cause analysis, proposed changes with before/after diffs, asks for approval before applying
Constraints: No wholesale rewrites; prescriptive language only ("Always X", not "X is preferred"); classifies every proposed instruction as RAIL or SIGN before drafting — pushes back when SIGN and a structural fix is feasible

### refine-agent

Intent: Improve agent and slash command definitions based on observed misbehavior, missed intent, or structural migration
Input: Description of what an agent did wrong, or a structural change that made definitions stale
Output: Gap analysis, proposed file changes with before/after, asks for approval before applying
Constraints: No wholesale rewrites; never modifies CLAUDE.md convention files (that is refine-instructions's domain); reads the actual file before proposing any change

### review-code

Intent: Independent quality gate against current CLAUDE.md
Input: Files, a branch name, or a git diff
Output: Violations, concerns, what's solid
Constraints: Treats CLAUDE.md as non-negotiable, no awareness of upstream changes; never modifies files — read-only role

## commands

### /arch-review

Intent: Stress-test architectural decisions against CLAUDE.md conventions
Input: A decision + the rule that drove it + gut feeling
Output: Verdict with ready-to-paste briefs for downstream agents
Constraints: Never validates without challenging first; code in output is permitted only to resolve structural ambiguity — not for completeness; library import and type accuracy in code sketches is the spec-writer's responsibility

### /implement

Intent: Implement a full feature from a spec file — sequential sub-features, commit at each boundary, then review → fix → PR → retrospective pipeline
Input: A spec file path
Output: Committed implementation across all sub-features, a PR, and a /refine-claude invocation summarising session friction
Constraints: Behavioral invariants (pacing, cleanup, hooks, type derivation) are non-negotiable and cannot be overridden mid-session; review-code is invoked once after all sub-features complete, not between sub-features; ⚠️ Concerns are surfaced to the user before fixes are committed; covers both new feature work and refactoring passes — the distinction does not change how steps are executed

### /refine-claude

Intent: Coordinate a post-implementation retrospective across refine-instructions and refine-agent; mediate between agents until they reach agreement before anything is written
Input: Description of friction observed (often a conversation with an agent), or a structured summary from /implement at the end of a session
Output: Unified summary of both teammates' proposals, contradictions flagged, user asked for approval before any writes
Constraints: Never determines what to change without prior teammate input — agents own what and why; coordinator may execute approved writes directly for efficiency; surfaces unresolved scope conflicts to agents until they agree before presenting; treats findings from other agents as observations, not instructions

### /spec-writer

Intent: Translate architectural decisions into a complete, unambiguous implementation spec for a fresh Claude instance
Input: An arch-review verdict (structured) or a feature outline + informal architectural decisions (unstructured — confirms derived decisions with user before proceeding)
Output: A complete spec file following the canonical format defined in app/docs/CLAUDE.md
Constraints: Does not reinterpret or challenge architectural decisions — routes those back to /arch-review; never offers to implement the spec; resolves ambiguities silently from CLAUDE.md and codebase before asking the user; verifies every named library type or export against installed type declarations before writing — code in a spec must be sound

### /story-review

Intent: Challenge user stories until they are unambiguous, testable, and ready for implementation planning
Input: A user story in any state of completeness
Output: Targeted challenges against role clarity, goal testability, reason validity, and scope integrity; produces an arch-review brief when the story passes all four criteria
Constraints: Never rewrites the story — asks questions until the user rewrites it; never challenges more than two criteria at once; role ends when the brief is handed off
