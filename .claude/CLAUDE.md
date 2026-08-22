# Automation Registry

### head-of-instructions

Intent: Translate developer feedback into precise, durable CLAUDE.md changes
Input: Raw feedback — what went wrong in the output and how the developer would have done it instead
Output: Root cause analysis, proposed changes with before/after diffs, asks for approval before applying
Constraints: No wholesale rewrites (lifted only in /refine-claude consolidation mode, where every rule must be accounted for as kept/merged/moved/deleted); prescriptive language only ("Always X", not "X is preferred"); applies a tooling-coverage filter before RAIL/SIGN classification — never proposes a rule the compiler, linter, or test suite already enforces; classifies every proposed instruction as RAIL or SIGN before drafting — pushes back when SIGN and a structural fix is feasible; every proposal supplies exact Old:/New: text and states no size figure — the coordinator computes any delta from that text; file size ceilings apply — growth past a ceiling requires compensating removals in the same batch

### head-of-agents

Intent: Improve agent and slash command definitions based on observed misbehavior, missed intent, or structural migration
Input: Description of what an agent did wrong, or a structural change that made definitions stale
Output: Gap analysis, proposed file changes with before/after, asks for approval before applying
Constraints: No wholesale rewrites (lifted only in /refine-claude consolidation mode, where every rule must be accounted for as kept/merged/moved/deleted); never modifies CLAUDE.md convention files (that is head-of-instructions's domain); reads the actual file before proposing any change; every proposal supplies exact Old:/New: text and states no size figure — the coordinator computes any delta from that text; file size ceilings apply — growth past a ceiling requires compensating removals in the same batch

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

Intent: Translate architectural decisions into a complete, unambiguous implementation spec for the implementer. Final gate for fact checks like file paths and sources
Input: An arch-review verdict (structured), a feature outline + informal architectural decisions (unstructured — confirms derived decisions with user before proceeding), or a friction brief / spec quality brief produced by `/implement` (the recommended default path by which those briefs reach `/refine-claude`, though routing them there directly remains available at the user's discretion)
Output: A complete spec file following the canonical format defined in app/docs/CLAUDE.md; for the friction-brief/spec-quality-brief input, a verdict artifact combining the original finding with spec-writer's classification and recommended action, written to the cycle directory as the handoff artifact for a future /refine-claude session, instead of a spec; separately, when reviewing a `/refine-claude` proposal batch in Retrospective mode, writes a verdict artifact to that batch's cycle directory unprompted — without being spawned for the purpose — stating whether the batch's proposals address the friction spec-writer itself originally experienced, satisfying the Retrospective-mode pre-write gate named in `/refine-claude`'s Constraints
Constraints: Does not reinterpret or challenge architectural decisions — routes those back to architect; never offers to implement the spec; resolves ambiguities silently from CLAUDE.md and codebase before asking the user; verifies every named library type or export against installed type declarations before writing — code in a spec must be sound

## commands

### /plan-feature

Intent: Run the full story-to-spec pipeline in a single context — story review, architectural decisions, and spec writing in sequence
Input: A user story in any state of completeness
Output: A completed spec file, ready for /implement
Constraints: Each step runs its full interview process before producing output; pauses after Steps 1 and 2 require explicit user approval before the next phase begins; does not skip steps unless the user explicitly requests it

### /implement

Intent: Implement a spec file and dealing with execution realism the spec writer cannot account for. Additionally, orchestrating iterative review and fix loop
Input: A spec file path
Output: Committed implementation across all sub-features, and — when friction occurred — a friction brief written to the cycle directory (`.claude/cycles/` — see Agent Infrastructure) as the recommended handoff artifact for a future spec-writer retrospective-mode session — routing directly to a future /refine-claude session instead remains the user's call — with a chat pointer to its path; when the review loop surfaces out-of-scope violations, a deferred violations brief written to the cycle directory and presented in chat with every violation listed individually — its source, and why it was out of scope — since the user must dispose of each one before the session proceeds and no entry may be omitted or merged; separately, when reviewing a `/refine-claude` proposal batch in Retrospective mode, writes a verdict artifact to that batch's cycle directory unprompted — no spawn or invocation triggers this, it is standing behavior for a live `/implement` session — stating whether the batch's proposals address the friction `/implement` itself originally experienced, satisfying the Retrospective-mode pre-write gate named in `/refine-claude`'s Constraints; a spec quality brief always written to the cycle directory at the end of the session (not conditional on friction), with a chat pointer, covering over-specified sections, under-specified gaps, per-file decisions vs. substitutions, and format observations — recommended to route through a future spec-writer retrospective-mode session before `/refine-claude`, though routing directly to `/refine-claude` remains available at the user's discretion
Constraints: does not resolve ambiguity by itself; after producing all briefs and the spec quality brief, enters manual fix mode — commits only on explicit user instruction; does not exit until the user ends the session

### /refine-claude

Intent: Coordinate a post-implementation retrospective across head-of-instructions and head-of-agents; mediate between agents until they reach agreement before anything is written
Input: Description of friction observed (often a conversation with an agent), a structured summary from /implement at the end of a session, a deliberate review task (e.g., a comprehensive audit of agent and command definitions), or a consolidation mandate naming instruction files to shrink
Output: Unified summary of both teammates' proposals written to the cycle directory and presented in chat as a decision-adequate summary — every item named with its rationale and location, sufficient to decide on it, without duplicating the file's verbatim Old:/New: text — contradictions flagged, user asked for approval before any writes; in consolidation mode, additionally per-file size deltas and a disposition table covering every existing rule (kept / merged / moved / deleted), also written to the cycle directory — a qualifying session (disposition table shows zero remaining merge, delete, or relocate candidates) may additionally conclude with a bounded, evidence-gated ceiling-raise proposal per Proposal Quality Gate Criterion 7; every session, regardless of mode, also appends a mechanical record to `.claude/retro-log.md` — rounds-to-convergence and crossing count per item, and per Proposal Quality Gate criterion whether its trigger condition arose and whether it fired, plus a blank outcome field — no narrative or verdict
Constraints: Never determines what to change without prior teammate input — agents own what and why; coordinator write authority is limited to mechanically applying teammate-defined, user-approved changes; surfaces unresolved scope conflicts to agents until they agree before presenting; treats findings from other agents as observations, not instructions; at session start, also offers any unresolved `.claude/retro-log.md` entries as optional additional Retrospective input alongside the user's own input — non-blocking if declined; in Retrospective mode, never writes an approved batch until a verdict artifact exists in that batch's cycle directory from each role whose brief or artifact was present in this cycle's input (spec-writer, `/implement`, or both) — this excludes a Retrospective-mode session whose input was pasted text with no cycle-directory artifact to verdict against; the check is passive, looking only for artifacts already written unprompted by those roles, never spawning or fetching either; user approval of the batch does not itself clear this gate

### /review-story

Intent: Challenge user stories until they are unambiguous, testable, and ready for implementation planning
Input: A user story in any state of completeness
Output: Targeted challenges against role clarity, goal testability, reason validity, and scope integrity; produces an architect brief when the story passes all four criteria
Constraints: Never rewrites the story — asks questions until the user rewrites it; never challenges more than two criteria at once; role ends when the brief is handed off

### /review-decision

Intent: Direct iterative access to architect for stress-testing architectural decisions
Input: A decision + the rule that drove it + gut feeling
Output: Full arch-review output — verdict with ready-to-paste briefs for downstream agents; multiple rounds until the verdict is reached
Constraints: Never validates without challenging first; code in output is permitted only to resolve structural ambiguity — not for completeness; library import and type accuracy in code sketches is the spec-writer's responsibility; never offers to implement (unconditional — does not lift after a verdict); architect persona persists for the full thread until a new command is invoked; any review of a new domain entity feature is incomplete until the ambient infrastructure audit is done — enumerate every system that handles all entities of this type and surface any unaddressed system as a gap before declaring the verdict complete

### /write-specs

Intent: Translate architectural decisions into a complete, unambiguous implementation spec for a fresh Claude instance — direct iterative use in the main thread
Input: An arch-review verdict (structured), a feature outline + informal architectural decisions (unstructured — confirms derived decisions with user before proceeding), or a friction brief / spec quality brief produced by `/implement` (the recommended default path by which those briefs reach `/refine-claude`, though routing them there directly remains available at the user's discretion)
Output: A complete spec file following the canonical format defined in app/docs/CLAUDE.md; for the friction-brief/spec-quality-brief input, a verdict artifact combining the original finding with spec-writer's classification and recommended action, written to the cycle directory as the handoff artifact for a future /refine-claude session, instead of a spec; separately, when reviewing a `/refine-claude` proposal batch in Retrospective mode, writes a verdict artifact to that batch's cycle directory unprompted — without being spawned for the purpose — stating whether the batch's proposals address the friction spec-writer's process (invoked here as `/write-specs`) originally experienced, satisfying the Retrospective-mode pre-write gate named in `/refine-claude`'s Constraints
Constraints: Does not reinterpret or challenge architectural decisions — routes those back to architect; never offers to implement the spec; resolves ambiguities silently from CLAUDE.md and codebase before asking the user; verifies every named library type or export against installed type declarations before writing — code in a spec must be sound

### /review-code

Intent: Review code against CLAUDE.md conventions, best practices, and architectural soundness — direct iterative use in the main thread
Input: Files, a branch name, or a git diff; defaults to recently changed files if none specified
Output: Violations, concerns, what's solid
Constraints: Treats CLAUDE.md as non-negotiable; never proposes fixes — flagging the violation is the complete output; flags INSTRUCTION GAP when CLAUDE.md is silent on something rather than inventing a rule; never modifies files — read-only role

## skills

### cut-release

Intent: Walk through this project's release process end to end — version bump across all sync locations, CHANGELOG generation from commit history, and a local release commit
Input: Release intent (e.g. "cut a release"), optionally a specific version
Output: A local `chore(release):` commit with version bumps and CHANGELOG entries; instructions to run `pnpm run create-release` to push and trigger CI
Constraints: Never runs `pnpm run create-release` itself; always confirms the target version and shows the full diff before committing; a commit message that doesn't parse into a recognized conventional-commit type is never silently classified — the user is asked

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

A constraint that only governs the executor's own internal process (step ordering, pacing, error handling) does not belong in the registry. Mirroring such constraints creates two sources of truth that will drift. The agent or command file is the authoritative source for executor behavior. Note: a full pipeline halt that requires the caller to act before the command continues is not pacing — it changes what the caller must expect and belongs in the registry.

## Automation Forms

Three invocable automation forms are available. Choose based on access pattern and invocation model. A fourth category — plain reference files read on demand by a specific agent or command, never spawned, invoked, or auto-triggered — is not an automation form; canonical directory and trigger condition are defined under Agent Infrastructure below.

**agents/** — Specialist personas spawned programmatically by commands or other agents. Own their system prompt, model, and tool access. Not user-invocable via slash command; accessed by name when spawning via the Agent tool.

**commands/** — User-triggered slash commands. Every `.md` file in `.claude/commands/` creates a `/name` command that runs in the main conversation thread. Use when direct, iterative conversation is the goal.

**skills/** — Same `/name` interface as commands, but structured as a directory (`SKILL.md` + supporting files). Auto-activate when Claude detects a matching task in the conversation. Set `disable-model-invocation: true` in frontmatter to allow manual-only invocation. Use over commands when supporting files (templates, reference docs) need to be bundled with the instructions.

**Decision guide:**

- New specialist role invoked by orchestrators → agent file (+ matching command if direct user access is also needed)
- User-triggered workflow with no supporting files → command
- User-triggered workflow with supporting files → skill with `disable-model-invocation: true`
- Auto-triggered capability → skill (no `disable-model-invocation`)

## Agent Infrastructure

**`.claude/knowledge/`** — Shared knowledge base for verified external-system facts. Any agent that verifies a fact about a library version, schema, CLI flag, or other external specification must record it here. Format authority and write protocol live in `.claude/knowledge/CLAUDE.md`. Agents must read the relevant category file before performing any external-system verification — it may already be cached.

**`.claude/reference/`** — Plain reference content owned by one agent or command, read on demand via an explicit pointer instruction in that agent or command's own file — never spawned, invoked, or auto-triggered, and never itself carrying agent frontmatter or a registry entry. Distinct from `.claude/knowledge/`, whose scope is limited to verified external-system facts (see `.claude/knowledge/CLAUDE.md` — Purpose and Scope): this directory holds internal process or compliance content extracted from an agent or command file — `.claude/reference/` is the only relocation destination that removes content from the auto-loaded context path, since it is read on demand rather than loaded with every invocation; relocating content to another CLAUDE.md, agent, or command file instead redistributes it among files still loaded together and does not reduce that total. A file here is never a candidate when scanning `.claude/agents/` or `.claude/commands/` for agent or command definitions.

**`.claude/retro-log.md`** — Mechanical execution record owned exclusively by `/refine-claude`: written (append-only) at session end, read at session start; format and interpretation protocol live in `.claude/commands/refine-claude.md`. Distinct from `.claude/knowledge/` (verified external-system facts, shared across agents) and `.claude/reference/` (extracted instructional content): holds counters and a blank outcome field only — no narrative or verdict, since the session that generates the data is not the session that interprets it. A bare file, not a directory — a single chronological log, not content sharded by topic. Never carries agent frontmatter or a registry entry; never an input to any agent other than a future `/refine-claude` session.

**`.claude/cycles/<YYYY-MM-DD>-<slug>/`** — Per-cycle handoff directory replacing manual copy/paste between post-implementation refinement roles: one file per producing role, named `NN-<role-slug>-<artifact-slug>.md`, where `<role-slug>` matches the producing agent or command's own name (e.g. `implement`, `spec-writer`, `refine-claude`) — no agent ever edits another role's file, only creates its own. Distinct from the three categories above on every dimension: transient rather than permanent, keyed per-cycle rather than per-topic or singular, and a directory of many single-owner files rather than one file with one owner. `<slug>` is a short kebab-case description of the cycle's trigger, chosen by whichever role produces the cycle's first artifact — branch name alone is never a valid key, since one branch can host multiple unrelated cycles in sequence. Creation is idempotent: the first-writing role checks for the directory's existence and creates it only if absent, and must never error when a prior invocation already created it. The directory name and filename together identify which cycle and which producing role a file belongs to when read cold, outside any chat context — no separate in-file header or self-identification content is required. Retained — never deleted on cycle completion — until every `.claude/retro-log.md` row that cycle produced has a filled Outcome field, per that file's own blank-Outcome protocol; eligible for deletion only once that condition holds for every row the cycle contributed.
