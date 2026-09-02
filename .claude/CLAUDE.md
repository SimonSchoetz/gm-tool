# Project Claude Configuration

Agents and skills for this workflow are supplied by the `devloop` plugin from `~/dev/setup` (`claude/devloop/`), shared across every project on this machine — their definitions, the Automation Registry, and the Automation Forms decision guide live there, not in this repo. Project-specific facts every role needs by default — check commands, build, package manager, source layout, spec format authority — live directly in this repo's own auto-loaded CLAUDE.md files instead of behind an explicit read instruction: see root `CLAUDE.md`'s Tool Use Discipline and App Structure sections. `.claude/spec-writer-gate-extensions.md` holds one exception — `spec-writer`'s project-specific gate rows, too large and too narrowly-consumed to inline into an auto-loaded file. `cut-release` is the other exception — it stays a local skill in this repo (below), not part of the plugin, since its release process is gm-tool-specific.

## Local Skill: cut-release

### cut-release

Intent: Walk through this project's release process end to end — version bump across all sync locations, CHANGELOG generation from commit history, and a local release commit
Input: Release intent (e.g. "cut a release"), optionally a specific version
Output: A local `chore(release):` commit with version bumps and CHANGELOG entries; instructions to run `pnpm run create-release` to push and trigger CI
Constraints: Never runs `pnpm run create-release` itself; always confirms the target version and shows the full diff before committing; a commit message that doesn't parse into a recognized conventional-commit type is never silently classified — the user is asked

## Agent Infrastructure

`.claude/knowledge/` and `.claude/retro-log.md` moved to `~/dev/setup`, project-scoped under this project's `artifact-key` (declared in root `CLAUDE.md`'s Epistemological Discipline → Knowledge base): `~/dev/setup/claude/projects/gm-tool/knowledge/` and `~/dev/setup/claude/projects/gm-tool/retro-log.md`. Format authority for both lives at `~/dev/setup/claude/projects/CLAUDE.md` (knowledge) and `~/dev/setup/claude/devloop/CLAUDE.md` (retro-log). `.claude/reference/` moved to `~/dev/setup/claude/devloop/reference/` too, but shared across every project using the plugin rather than project-scoped — it holds process content, not project facts.

**`.claude/cycles/<YYYY-MM-DD>-<slug>/`** — the one piece of this infrastructure that stays in this repo, gitignored: a transient, same-machine handoff directory between sessions, not tracked in git. One file per producing role, named `NN-<role-slug>-<artifact-slug>.md`, where `<role-slug>` matches the producing agent or skill's own name (e.g. `implement`, `spec-writer`, `refine-claude`) — no agent ever edits another role's file, only creates its own. `<slug>` is a short kebab-case description of the cycle's trigger, chosen by whichever role produces the cycle's first artifact — branch name alone is never a valid key, since one branch can host multiple unrelated cycles in sequence. Creation is idempotent: the first-writing role checks for the directory's existence and creates it only if absent, and must never error when a prior invocation already created it. The directory name and filename together identify which cycle and which producing role a file belongs to when read cold, outside any chat context.

**Retention is checked on a schedule, not left to incidental discovery.** A cycle directory is eligible for deletion once every row it produced in `~/dev/setup/claude/projects/gm-tool/retro-log.md` has a filled Outcome field. `/devloop:refine-claude` sweeps eligible cycle directories against that log at the start of every session — mechanism owned by the `devloop` plugin's `skills/refine-claude/SKILL.md`.
