# Claude Code

## In the desktop app's Code tab, spawned agents are one-shot: no `SendMessage` tool is exposed and `ListAgents` does not list them

**Verified at:** Claude desktop app, Code tab, session tool roster — 2026-09-04
**Citation:** [refine-claude_1: `ToolSearch select:SendMessage` → "No matching deferred tools found", checked before and after spawning an agent; the Agent tool's own result text still says "use SendMessage with `to: '<id>'`"; `ListAgents` returned only peer sessions, not the spawned agent]

The Agent tool result advertises `SendMessage` for continuing a spawned agent, but the tool is absent from both the loaded and the deferred tool lists in this environment, and a completed agent is not addressable afterwards. A protocol that needs resumable teammates must re-spawn with prior output as context. Re-check at session start; the same absence was observed on 2026-09-04 in the preceding cycle's session.

**Verified at:** Claude Code CLI, gm-tool session — 2026-09-11
**Citation:** [refine-claude_1 (CLI): `SendMessage` was present via `ToolSearch select:SendMessage`; an agent spawned with `name: "head-of-instructions"` was pinged twice in separate `SendMessage({to: "head-of-instructions", ...})` calls across two turns, and replied distinctly to each ("Acknowledged — this is head-of-instructions, standing by" to the first, "Confirmed — received second ping, still standing by" to the second) — a `ListAgents` was not needed since the name alone resolved the send]

In the CLI, `SendMessage` is exposed and a spawned agent stays addressable by its retained `name` across turns, tracking message-by-message state rather than just re-echoing. The one-shot limitation above is Code-tab-specific, not general to Claude Code.

## A subagent starts with its agent file, the CLAUDE.md hierarchy, a git-status snapshot, and any skills named in its `skills` field; every other file must be read with a tool

**Verified at:** <https://code.claude.com/docs/en/sub-agents> — 2026-09-04
**Citation:** [refine-claude_7: "Each subagent starts with a fresh, isolated context window. It doesn't see your conversation history, the skills you've already invoked, or the files Claude has already read"; initial context lists system prompt (the agent's own prompt plus environment details), task message, CLAUDE.md files at every level the main conversation loads, git status, and "Preloaded skills: full content of any skill named in the agent's `skills` field"]

Reference helpers under a plugin's `reference/` are not in any of those categories, so a spawned agent holds a helper only after it follows a pointer and reads it.

## Claude Code's documented size targets: a CLAUDE.md under 200 lines, a SKILL.md body under 500 lines

**Verified at:** <https://code.claude.com/docs/en/memory> and <https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices> — 2026-09-04
**Citation:** [refine-claude_8: memory page, "Write effective instructions" — "**Size**: target under 200 lines per CLAUDE.md file. Longer files consume more context and reduce adherence"; "Keep it to facts Claude should hold in every session … If an entry is a multi-step procedure or only matters for one part of the codebase, move it to a skill or a path-scoped rule instead"; "imported files still load and enter the context window at launch"; skill best-practices page, "Token budgets" — "Keep SKILL.md body under 500 lines for optimal performance. If your content exceeds this, split it into separate files"]

Both limits are stated in lines, not characters, and the stated rationale is adherence (attention across competing instructions), not a hard loader limit: Claude Code loads a CLAUDE.md of up to 4 MiB in full. No size guidance is given for a skill's supporting files or for agent files; the skills guidance says reference files "don't consume context tokens until actually read".

## User-level rules in `~/.claude/rules/` load at launch, concatenate with every other instruction file, and are recommended one topic per file

**Verified at:** <https://code.claude.com/docs/en/memory> — 2026-09-04
**Citation:** [refine-claude_10: "Personal rules in `~/.claude/rules/` apply to every project on your machine"; "User-level rules are loaded before project rules, giving project rules higher priority"; "Rules without `paths` frontmatter are loaded at launch with the same priority as `.claude/CLAUDE.md`"; "All `.md` files are discovered recursively"; "Each file should cover one topic, with a descriptive filename"; "All discovered files are concatenated into context rather than overriding each other"; "if two rules contradict each other, Claude may pick one arbitrarily"]

Priority means load order only; nothing overrides anything, and a contradiction between two loaded rules has no deterministic winner. Splitting one file into several unscoped rules files changes nothing about what a session holds at launch; only a `paths` frontmatter makes a rule load on demand. The relative load order between `~/.claude/CLAUDE.md` and `~/.claude/rules/` is not stated.

## A subagent's initial context includes project rules; user-level `~/.claude/rules/` is not named

**Verified at:** <https://code.claude.com/docs/en/sub-agents> — 2026-09-04
**Citation:** [refine-claude_13: "CLAUDE.md files: every level of the CLAUDE.md hierarchy the main conversation loads, including `~/.claude/CLAUDE.md`, project rules, `CLAUDE.local.md`, and managed policy files. The built-in Explore and Plan agents skip this." — where the memory page names `.claude/rules/` as "project rules"]

`.claude/rules/` files reach a spawned agent; whether `~/.claude/rules/` files do is not stated. A plugin citation that must resolve for a spawned agent should therefore not rely on a user-level rules file being in that agent's context; a path the agent can Read does not depend on it.

## `claudeMdExcludes` skips instruction files by absolute-path glob at any settings layer, and matches a symlinked rules file by either path from v2.1.239

**Verified at:** <https://code.claude.com/docs/en/memory> — 2026-09-04
**Citation:** [refine-claude_14: "Exclude specific CLAUDE.md files" — "Patterns are matched against absolute file paths using glob syntax. You can configure `claudeMdExcludes` at any settings layer: user, project, local, or managed policy. Arrays merge across layers"; "To exclude a rules file you reach through a symlink … write the pattern against either path … Before v2.1.239, only a pattern that matched the link target excluded the file"; "Managed policy CLAUDE.md files cannot be excluded"; first observed by head-of-instructions, cited from the same page]

The documented way to switch off one shared rules file for one machine or project without contradicting it; a whole rules directory is excluded with a `/…/.claude/rules/**` pattern.

## Subdirectory `CLAUDE.md` loading is cumulative up the ancestor chain, not nearest-file-only

**Verified at:** <https://code.claude.com/docs/en/memory> — 2026-09-10
**Citation:** [refine-claude_10: WebFetch <https://code.claude.com/docs/en/memory> — "Claude also discovers CLAUDE.md and CLAUDE.local.md files in subdirectories under your current working directory. Instead of loading them at launch, they are included when Claude reads files in those subdirectories."]

The trigger is reading a file in a subdirectory, and every `CLAUDE.md` on that file's ancestor path qualifies — a directory nested two levels below one that holds a `CLAUDE.md` is still "under" it. So reading `app/src/data-access-layer/useNpc.ts` would load both `app/src/CLAUDE.md` and a `CLAUDE.md` placed at `app/src/data-access-layer/`, not the deeper one alone. Splitting a large subdirectory `CLAUDE.md` into a parent and a child file therefore relieves only the reader that never descends into the child's directory; the reader that does descend holds both files and carries the same total, plus whatever framing the second file adds.

## A path-scoped rule lives in the repo-root `.claude/rules/` and loads when Claude works with a matching file, which no `CLAUDE.md` placement can express

**Verified at:** <https://code.claude.com/docs/en/memory> and <https://code.claude.com/docs/en/large-codebases> — 2026-09-10
**Citation:** [refine-claude_17: memory page, Path-specific rules — "Rules can be scoped to specific files using YAML frontmatter with the `paths` field. These conditional rules only apply when Claude is working with files matching the specified patterns"; "Path-scoped rules trigger when Claude reads files matching the pattern, not on every tool use"; pattern table rows `**/*.ts`, `src/**/*`, `*.md`, `src/components/*.tsx`; brace expansion supported under a budget of 1,000 expanded patterns and 4 MiB per rule, patterns exceeding it used unexpanded and matching nothing; large-codebases page, "Choose between per-directory CLAUDE.md and path-scoped rules" table — per-directory `CLAUDE.md` "Inside the directory, alongside its code" loading "At launch when started from that directory, or on demand when Claude reads a file there", path-scoped rule "Central `.claude/` at the repo root" loading "When Claude works with a file matching the rule's `paths:` glob", used when "the same rule applies to many scattered paths"]

The two mechanisms are not interchangeable: a `paths` glob selects by extension, filename pattern, or a directory name at any depth, so it can carve a cross-cutting set (`**/*.css`, `**/__tests__/**`) that no directory boundary expresses, and unlike a subdirectory `CLAUDE.md` it is not cumulative with any ancestor file. The documentation names path-scoped rules as the remedy for an oversized `CLAUDE.md` twice — "If your instructions are growing large, use path-scoped rules so instructions load only when Claude works with matching files", and again under "My CLAUDE.md is too large" — and directs a multi-step procedure or content that "only matters for one part of the codebase" to a skill or a path-scoped rule rather than to `CLAUDE.md`.

**Reverified at:** gm-tool, Claude Code desktop app Code tab — 2026-09-10
**Citation:** [refine-claude_26: in a session launched at the repository root, Read on `app/src/App.css` loaded `app/CLAUDE.md`, `app/src/CLAUDE.md` and `.claude/rules/src-css.md`, and none of the other six rule files in that directory]

Observed rather than inferred, in this repository, with the globs this project ships: the glob selected exactly one rule file for a stylesheet reader, and every ancestor `CLAUDE.md` on the read path loaded alongside it, so the cumulative-ancestor entry above holds for `CLAUDE.md` files while path-scoped rules stay selective.

## Starting Claude in a subdirectory loads that directory's `CLAUDE.md` plus every ancestor's at launch; starting at the repository root loads the root file alone

**Verified at:** <https://code.claude.com/docs/en/large-codebases> — 2026-09-10
**Citation:** [refine-claude_18: large-codebases page, "Choose where to start Claude" table — row "Repository root | Every file | Root only; subdirectory files load on demand when Claude reads there"; row "A subdirectory | That subtree only, until you grant more | That directory's plus every ancestor's"]

The on-demand loading condition of a subdirectory `CLAUDE.md` therefore holds only for sessions launched above it; a session launched at or below that directory holds the file from the first turn. Project settings in `.claude/settings.json` are not inherited from parent directories the way `CLAUDE.md` files are.

## `claudeMd` in a settings file is honored only in managed and policy layers, and `claudeMdExcludes` is a static list rather than a per-task switch

**Verified at:** <https://code.claude.com/docs/en/memory> and <https://code.claude.com/docs/en/large-codebases> — 2026-09-10
**Citation:** [refine-claude_21: memory page, Deploy organization-wide CLAUDE.md — "The `claudeMd` key lets you put managed CLAUDE.md content directly inside `managed-settings.json` instead of deploying a separate file"; "**Where it's honored**: managed and policy settings only. Setting `claudeMd` in user, project, or local settings has no effect"; large-codebases page, "Exclude irrelevant CLAUDE.md files" — "The exclusion list is static, not a per-task switch. To focus on one package today and another tomorrow, start Claude from that package's directory instead of editing exclusions"]

Neither is a mechanism for scoping a project's own conventions: `claudeMd` is unavailable outside managed settings, and `claudeMdExcludes` removes an instruction file wholesale for whoever configures it rather than narrowing its audience.

## A `.claude/rules/` directory created during a session is discovered without a restart

**Verified at:** gm-tool, Claude Code desktop app Code tab — 2026-09-10
**Citation:** [refine-claude_27: `.claude/rules/` did not exist when the session started; seven path-scoped rule files were written to it mid-session; a later Read on `app/src/App.css` in the same session loaded `.claude/rules/src-css.md`]

Rules discovery is not a launch-time snapshot, unlike plugin discovery, where a newly created plugin folder needs a restart and `/reload-plugins` does not find it. A session that writes a new path-scoped rule can therefore exercise it without restarting, which makes a rules partition testable in the session that performs it.

## Agent teams require both `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` and an interactive session

**Verified at:** <https://code.claude.com/docs/en/agent-teams> — 2026-09-10 (page states it describes agent teams as of v2.1.178)
**Citation:** [refine-claude_1: <https://code.claude.com/docs/en/agent-teams> — "Enable agent teams" section]

The env var alone is insufficient. The documentation states: "Spawning teammates also requires an interactive session. In non-interactive mode with the `-p` flag, including Agent SDK sessions, Claude doesn't spawn teammates, and a subagent that Claude named runs as an ordinary subagent even with agent teams enabled." Consequence: in an Agent SDK or non-interactive session, calling the Agent tool with a `name` produces an ordinary subagent rather than a teammate, and no team-scoped tooling is provisioned.

---
**Reverified at:** 2.1.268
**Citation:** [refine-claude_5: ran npm ls -g --depth=0 and claude --version — observed @anthropic-ai/claude-code@2.1.268; behavioral outcome user-reported, not independently observed by this role]

Confirmed at v2.1.268: launching `claude` as an interactive terminal session in this project, with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` already set in `.claude/settings.local.json`, provisions the teammate tooling that a non-interactive Agent SDK session in the same project does not. The distinguishing variable is session interactivity alone — the environment variable, project, and account were identical across both observations, so neither the variable nor the plan tier gates this case.

## `SendMessage` is the documented replacement for the Agent tool's removed `resume` parameter, and is gated behind agent teams

**Verified at:** <https://github.com/anthropics/claude-code/issues/42737> — 2026-09-10
**Citation:** [refine-claude_2: <https://github.com/anthropics/claude-code/issues/42737> — issue body and closure status]

The Agent tool's `resume` parameter was removed in v2.1.77 and `SendMessage({to: agentId})` became the documented way to continue a previously spawned subagent. `SendMessage` is provisioned only when the agent teams feature is active, so in a session without it the Agent tool's own result text instructs the caller to use a tool that is not in the tool list and is not loadable via ToolSearch. Issues #35240, #37051, #42737, and #34750 all report this; #42737 and #25148 are closed as not planned/duplicate with no published Anthropic rationale.

## `TeamCreate` and `TeamDelete` were removed in v2.1.178; team names are now session-derived

**Verified at:** <https://code.claude.com/docs/en/agent-teams> — 2026-09-10
**Citation:** [refine-claude_3: <https://code.claude.com/docs/en/agent-teams> — Note under the page introduction, and "Architecture" section]

Before v2.1.178 the lead called `TeamCreate`/`TeamDelete` to set up and remove a user-named team. Both tools no longer exist. Team name is now `session-` plus the first eight characters of the session ID, config lives at `~/.claude/teams/{team-name}/config.json`, and the `team_name` input on the Agent tool is accepted but ignored. Consequence: a `~/.claude/teams/` directory holding user-chosen names is a leftover from a pre-v2.1.178 session, not evidence of a currently active team.

## Cross-session `SendMessage` and in-session subagent `SendMessage` are separately gated surfaces

**Verified at:** <https://code.claude.com/docs/en/changelog> — 2026-09-10, entries v2.1.248 through v2.1.259
**Citation:** [refine-claude_4: <https://code.claude.com/docs/en/changelog> — v2.1.248 (2026-08-27), v2.1.251 (2026-08-28), v2.1.257 (2026-09-01), v2.1.259 (2026-09-02)]

Cross-session messaging (`SendMessage`/`ListAgents` between separate sessions on one machine) was extended in late August 2026 to Bedrock/Vertex/Foundry and to telemetry-disabled setups, while the in-session subagent/teammate addressing surface of the same name stayed behind the agent teams gate. Consequence: a session can hold a working cross-session send capability and `ListAgents` while having no way to address its own subagents.
