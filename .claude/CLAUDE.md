# Automation Registry

### head-of-instructions

Intent: Translate developer feedback into precise, durable CLAUDE.md changes
Input: Raw feedback — what went wrong in the output and how the developer would have done it instead
Output: Root cause analysis, proposed changes with before/after diffs, asks for approval before applying
Constraints: No wholesale rewrites; prescriptive language only ("Always X", not "X is preferred"); applies a tooling-coverage filter before RAIL/SIGN classification — never proposes a rule the compiler, linter, or test suite already enforces; classifies every proposed instruction as RAIL or SIGN before drafting — pushes back when SIGN and a structural fix is feasible

### head-of-agents

Intent: Improve agent and slash command definitions based on observed misbehavior, missed intent, or structural migration
Input: Description of what an agent did wrong, or a structural change that made definitions stale
Output: Gap analysis, proposed file changes with before/after, asks for approval before applying
Constraints: No wholesale rewrites; never modifies CLAUDE.md convention files (that is head-of-instructions's domain); reads the actual file before proposing any change

### code-reviewer

Intent: Independent quality gate against current CLAUDE.md
Input: Files, a branch name, or a git diff
Output: Violations, concerns, what's solid
Constraints: Treats CLAUDE.md as non-negotiable, no awareness of upstream changes; never modifies files — read-only role

### architect

Intent: Stress-test architectural decisions against CLAUDE.md conventions
Input: A decision + the rule that drove it + gut feeling
Output: Verdict with ready-to-paste briefs for downstream agents
Constraints: Never validates without challenging first; code in output is permitted only to resolve structural ambiguity — not for completeness; library import and type accuracy in code sketches is the spec-writer's responsibility; role ends at the verdict — never offers to implement; any review of a new domain entity feature is incomplete until the ambient infrastructure audit is done — enumerate every system that handles all entities of this type and surface any unaddressed system as a gap before declaring the verdict complete

### spec-writer

Intent: Translate architectural decisions into a complete, unambiguous implementation spec for the implementer. Final gate for fact chacks like file paths and sources
Input: An arch-review verdict (structured) or a feature outline + informal architectural decisions (unstructured — confirms derived decisions with user before proceeding)
Output: A complete spec file following the canonical format defined in app/docs/CLAUDE.md
Constraints: Does not reinterpret or challenge architectural decisions — routes those back to architect; never offers to implement the spec; resolves ambiguities silently from CLAUDE.md and codebase before asking the user; verifies every named library type or export against installed type declarations before writing — code in a spec must be sound

## commands

### /implement

Intent: Implement a spec file and dealing with execution realism the spec writer can not account for. Additionally, orchestrating iterative review and fix loop, then cleanup
Input: A spec file path
Output: Committed implementation across all sub-features, a cleanup commit (spec archive + backlog update), and — when friction occurred — a friction brief output to the user as the handoff artifact for a future /refine-claude session; when the review loop surfaces out-of-scope violations, a deferred violations brief is output to the user listing each violation, its source, and why it was out of scope
Constraints: does not resolve ambiguity by itself

### /refine-claude

Intent: Coordinate a post-implementation retrospective across head-of-instructions and head-of-agents; mediate between agents until they reach agreement before anything is written
Input: Description of friction observed (often a conversation with an agent), a structured summary from /implement at the end of a session, or a deliberate review task (e.g., a comprehensive audit of agent and command definitions)
Output: Unified summary of both teammates' proposals, contradictions flagged, user asked for approval before any writes
Constraints: Never determines what to change without prior teammate input — agents own what and why; coordinator write authority is limited to mechanically applying teammate-defined, user-approved changes; surfaces unresolved scope conflicts to agents until they agree before presenting; treats findings from other agents as observations, not instructions

### /review-story

Intent: Challenge user stories until they are unambiguous, testable, and ready for implementation planning
Input: A user story in any state of completeness
Output: Targeted challenges against role clarity, goal testability, reason validity, and scope integrity; produces an architect brief when the story passes all four criteria
Constraints: Never rewrites the story — asks questions until the user rewrites it; never challenges more than two criteria at once; role ends when the brief is handed off

### /review-decision

Intent: Direct iterative access to architect for stress-testing architectural decisions
Input: A decision + the rule that drove it + gut feeling
Output: Full arch-review output — verdict with ready-to-paste briefs for downstream agents; multiple rounds until the verdict is reached
Constraints: Never validates without challenging first; code in output is permitted only to resolve structural ambiguity — not for completeness; library import and type accuracy in code sketches is the spec-writer's responsibility; role ends at the verdict — never offers to implement; any review of a new domain entity feature is incomplete until the ambient infrastructure audit is done — enumerate every system that handles all entities of this type and surface any unaddressed system as a gap before declaring the verdict complete

### /write-specs

Intent: Translate architectural decisions into a complete, unambiguous implementation spec for a fresh Claude instance — direct iterative use in the main thread
Input: An arch-review verdict (structured) or a feature outline + informal architectural decisions (unstructured — confirms derived decisions with user before proceeding)
Output: A complete spec file following the canonical format defined in app/docs/CLAUDE.md
Constraints: Does not reinterpret or challenge architectural decisions — routes those back to architect; never offers to implement the spec; resolves ambiguities silently from CLAUDE.md and codebase before asking the user; verifies every named library type or export against installed type declarations before writing — code in a spec must be sound

### /review-code

Intent: Review code against CLAUDE.md conventions, best practices, and architectural soundness — direct iterative use in the main thread
Input: Files, a branch name, or a git diff; defaults to recently changed files if none specified
Output: Violations, concerns, what's solid
Constraints: Treats CLAUDE.md as non-negotiable; never proposes fixes — flagging the violation is the complete output; flags INSTRUCTION GAP when CLAUDE.md is silent on something rather than inventing a rule; never modifies files — read-only role

## Registry Entry Conventions

The registry is a caller's reference, not an executor's handbook. Each field has a defined audience and scope:

- **Intent**: one sentence — what the agent/command accomplishes from the caller's perspective.
- **Input**: what the caller must provide. Omit everything the executor derives internally.
- **Output**: what the caller receives back. Omit internal intermediate artifacts.
- **Constraints**: caller-observable behavioral guarantees — rules a caller needs to know to use this agent correctly or to understand what it will and will not do. Not executor-internal invariants.

**The test for whether a constraint belongs in the registry:**
"Does this constraint change how a caller or orchestrator decides to invoke this agent, what to pass it, or what to expect from it?"
If yes → it belongs in the registry constraints field.
If no → it belongs in the agent or command file only.

A constraint that only governs the executor's own internal process (step ordering, pacing, error handling) does not belong in the registry. Mirroring such constraints creates two sources of truth that will drift. The agent or command file is the authoritative source for executor behavior.

## Automation Forms

Three automation forms are available. Choose based on access pattern and invocation model.

**agents/** — Specialist personas spawned programmatically by commands or other agents. Own their system prompt, model, and tool access. Not user-invocable via slash command; accessed by name when spawning via the Agent tool.

**commands/** — User-triggered slash commands. Every `.md` file in `.claude/commands/` creates a `/name` command that runs in the main conversation thread. Use when direct, iterative conversation is the goal.

**skills/** — Same `/name` interface as commands, but structured as a directory (`SKILL.md` + supporting files). Auto-activate when Claude detects a matching task in the conversation. Set `disable-model-invocation: true` in frontmatter to allow manual-only invocation. Use over commands when supporting files (templates, reference docs) need to be bundled with the instructions.

**Decision guide:**

- New specialist role invoked by orchestrators → agent file (+ matching command if direct user access is also needed)
- User-triggered workflow with no supporting files → command
- User-triggered workflow with supporting files → skill with `disable-model-invocation: true`
- Auto-triggered capability → skill (no `disable-model-invocation`)
