# Claude Code

## Subagent `tools:` frontmatter accepts whole tool names only — no command-scoped grants

**Verified at:** <https://code.claude.com/docs/en/sub-agents> — 2026-08-04
**Citation:** [C_1: <https://code.claude.com/docs/en/sub-agents> — "Supported frontmatter fields" table, `tools` row, and the "Restrict tools" example]

The `tools` field is documented as "Tools the subagent can use. Inherits every tool available to subagents if omitted." Its documented example is `tools: Read, Grep, Glob, Bash` — a comma-separated list of whole tool names. No command-scoped or parameter-scoped form (e.g. `Bash(wc:*)`) appears anywhere in the field's specification or examples, so granting `Bash` to a subagent grants the entire tool, not a subset of shell commands.

## Command-scoped permission rules live in the permissions layer and apply session-wide, not per-subagent

**Verified at:** <https://code.claude.com/docs/en/sub-agents> — 2026-08-04
**Citation:** [C_2: <https://code.claude.com/docs/en/sub-agents> — plugin-subagent Note under "Choose the subagent scope"]

Scoped rules of the `Bash(git *)` form belong to `permissions.allow` / `permissions.deny` in `settings.json`, a different mechanism from subagent frontmatter. The documentation states these "rules apply to the entire session, not only the plugin subagent." Consequence: a scoped Bash grant cannot be used to give one subagent a narrow shell capability without also affecting the main thread and every other subagent in the session.

## `disallowedTools` is the denylist counterpart to `tools`

**Verified at:** <https://code.claude.com/docs/en/sub-agents> — 2026-08-04
**Citation:** [C_3: <https://code.claude.com/docs/en/sub-agents> — "Supported frontmatter fields" table, `disallowedTools` row]

`disallowedTools` is documented as "Tools to deny, removed from inherited or specified list." It subtracts whole tools from the inherited pool and offers no finer granularity than `tools`, so it cannot narrow a tool's internal surface either.

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
